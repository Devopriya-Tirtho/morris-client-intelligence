import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../data/seed';
import type { UpcomingProject, Project } from '../domain/types';
import { PortalService } from './PortalService';
import { MemoryPortalRepository } from '../adapters/mock/MemoryPortalRepository';
import { LocalPortalRepository, STORAGE_KEY } from '../adapters/mock/LocalPortalRepository';
import { QuickBooksOnlinePlaceholder, QuickBooksTimePlaceholder, FirebaseRepositoryPlaceholder } from '../adapters/future/DisabledAdapters';
const setup = () => new PortalService(new MemoryPortalRepository());
test('service reads one snapshot across navigation and isolates returned objects', async () => {
 const repository = new MemoryPortalRepository(); let reads=0;
 const original=repository.load.bind(repository);repository.load=async()=>{reads++;return original()};
 const service=new PortalService(repository);
 const [portfolio,groups,detail]=await Promise.all([service.fetchPortfolio(),service.fetchGroupedWorkOrders(),service.fetchProjectDetail('p1')]);
 assert.equal(reads,1);assert.equal(portfolio.analytics.hours,1054);assert.equal(groups.reduce((s,g)=>s+g.analytics.hours,0),1054);assert.equal(detail.analytics.hours,520);
 detail.project.managed.name='mutation';assert.notEqual((await service.fetchProjectDetail('p1')).project.managed.name,'mutation');
});
test('internal and narrative edits preserve source fields; queued edits both survive', async () => {
 const service=setup();
 await Promise.all([service.saveInternalEdits('admin','p1',{internalNotes:'New note'}), service.saveNarrativeUpdate('admin',{projectId:'p1',content:{...seed.projects[0].narrative,summary:'New summary'}})]);
 const p=(await service.fetchProjectDetail('p1','admin')).project;
 assert.equal(p.managed.internalNotes,'New note');assert.equal(p.narrative.summary,'New summary');assert.deepEqual(p.external,seed.projects[0].external);
});
test('client commands fail without changing state', async () => {
 const service=setup();const before=await service.fetchPortfolioData('admin');
 await assert.rejects(service.saveInternalEdits('client','p1',{cap:0}));
 await assert.rejects(service.saveNarrativeUpdate('client',{projectId:'p1',content:seed.projects[0].narrative}));
 await assert.rejects(service.toggleClientVisibility('client','p1',false));
 await assert.rejects(service.attachWorkOrder('client','p12',{workOrder:'WO1500',qboProjectId:null,lastSyncedAt:null}));
 await assert.rejects(service.reset('client'));
 await assert.rejects(service.fetchTeamMappings('client'));
 assert.deepEqual(await service.fetchPortfolioData('admin'),before);
});
test('visibility applies before all service projections and draft attention items', async () => {
 const service=setup();await service.toggleClientVisibility('admin','p1',false);
 assert.equal((await service.fetchPortfolio()).analytics.hours,534);
 assert.equal((await service.fetchGroupedWorkOrders()).some(g=>g.id==='p1'),false);
 await assert.rejects(service.fetchProjectDetail('p2'));
 await service.saveNarrativeUpdate('admin',{projectId:'p8',content:{...seed.projects[7].narrative,published:false}});
 const p=await service.fetchPortfolio();assert.ok(!p.insights.some(i=>i.projectId==='p8'&&['risk','decision'].includes(i.kind)));
 assert.equal((await service.fetchProjectDetail('p8')).project.managed.internalNotes,'');
});
test('attach WO preserves stable upcoming record, forecast overrides and every manual field', async () => {
 const service=setup();await service.saveInternalEdits('admin','p12',{forecastOverride:{hours:280,reason:'Scope review'}});
 const before=(await service.fetchProjectDetail('p12','admin')).project;
 await service.attachWorkOrder('admin','p12',{workOrder:' WO1500 ',qboProjectId:'future-id',lastSyncedAt:null});
 const after=(await service.fetchProjectDetail('p12','admin')).project;
 assert.equal(after.id,before.id);assert.equal(after.external.workOrder,'WO1500');assert.deepEqual(after.managed,before.managed);assert.deepEqual(after.narrative,before.narrative);
 await assert.rejects(service.attachWorkOrder('admin','p12',{workOrder:'WO1501',qboProjectId:null,lastSyncedAt:null}));
});
test('duplicate WO attachment and invalid edits are atomic; later valid command succeeds', async () => {
 const service=setup();const before=await service.fetchPortfolioData('admin');
 await assert.rejects(service.attachWorkOrder('admin','p12',{workOrder:'wo1267',qboProjectId:null,lastSyncedAt:null}),/Duplicate work order/);
 for(const patch of [{parentId:'p2'},{cap:-1},{progress:101},{categoryId:'missing'},{managerId:'missing'},{start:'2026-02-30'},{forecastOverride:{hours:200,reason:''}}]) await assert.rejects(service.saveInternalEdits('admin','p1',patch));
 assert.deepEqual(await service.fetchPortfolioData('admin'),before);
 await service.saveInternalEdits('admin','p1',{cap:900});assert.equal((await service.fetchProjectDetail('p1')).project.managed.cap,900);
});
test('create upcoming record and attach later without losing authored content', async () => {
 const service=setup();const upcoming=structuredClone(seed.projects[11]) as UpcomingProject;upcoming.id='new';upcoming.narrative.summary='Authored before import';
 await service.createUpcomingProject('admin',upcoming);
 await service.attachWorkOrder('admin','new',{workOrder:'WO1555',qboProjectId:null,lastSyncedAt:null});
 assert.equal((await service.fetchProjectDetail('new')).project.narrative.summary,'Authored before import');
});
test('legacy editor command protects source fields while allowing allocation and contact edits', async () => {
 const service=setup();
 await assert.rejects(service.editWorkspace('admin',d=>{d.entries[0].external.hours=999;return d}),/read-only/);
 await assert.rejects(service.editWorkspace('admin',d=>{d.projects[0].external.qboProjectId='changed';return d}),/read-only/);
 await assert.rejects(service.editWorkspace('admin',d=>{d.people[1].qboIds.push(d.people[0].qboIds[0]);return d}),/Duplicate/);
 await service.editWorkspace('admin',d=>{d.entries.find(t=>t.id==='t-review-1')!.managed={projectId:'p1',categoryId:'c1'};d.people[0].email='updated@example.com';return d});
 assert.equal((await service.fetchPortfolio()).analytics.hours,1060);
 assert.equal((await service.fetchTeamMappings('admin'))[0].externalPersonIds.length,2);
 assert.equal((await service.fetchPortfolioData('admin')).people[0].email,'updated@example.com');
});
test('failed persistence does not publish optimistic state and queue recovers', async () => {
 const repository=new MemoryPortalRepository();const service=new PortalService(repository);const original=repository.save.bind(repository);
 repository.save=async()=>{throw Error('Storage full')};
 await assert.rejects(service.saveInternalEdits('admin','p1',{cap:900}),/Storage full/);
 assert.equal((await service.fetchProjectDetail('p1')).project.managed.cap,800);
 repository.save=original;await service.saveInternalEdits('admin','p1',{cap:900});assert.equal((await service.fetchProjectDetail('p1')).project.managed.cap,900);
});
test('v1 browser saves survive additive schema changes and persist across services', async () => {
 const old=structuredClone(seed);delete old.client;old.projects[0].managed.internalNotes='Saved v1 edit';
 const values=new Map([[STORAGE_KEY,JSON.stringify(old)]]);
 const repository=new LocalPortalRepository(()=>({getItem:key=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value)}}));
 const service=new PortalService(repository);assert.equal((await service.fetchPortfolioData('admin')).projects[0].managed.internalNotes,'Saved v1 edit');
 await service.saveInternalEdits('admin','p1',{cap:950});
 assert.equal((await new PortalService(repository).fetchProjectDetail('p1')).project.managed.cap,950);
 await service.reset('admin');assert.equal((await service.fetchProjectDetail('p1')).project.managed.cap,800);
 values.set(STORAGE_KEY,'not json');assert.equal((await repository.load()).projects.length,13);
});
test('future adapter placeholders fail closed', async () => {
 for(const adapter of [new QuickBooksOnlinePlaceholder(),new QuickBooksTimePlaceholder()]) {await assert.rejects(adapter.readProjects(),/disabled/);await assert.rejects(adapter.readTimeEntries(),/disabled/)}
 const firebase=new FirebaseRepositoryPlaceholder();await assert.rejects(firebase.load(),/disabled/);await assert.rejects(firebase.save(),/disabled/);await assert.rejects(firebase.reset(),/disabled/);
});
