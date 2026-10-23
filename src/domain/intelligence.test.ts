import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../data/seed';
import {analytics,portfolio} from './analytics';
import {aggregateHours,burnAgainstCap,isDelayed,forecastRecord,portfolioHealth} from './metrics';
import {attentionItems,groupedWorkOrders} from './intelligence';
import {applyExternalPatch,applyExternalTimePatch} from './ownership';
test('external merge allowlists reject injected manual fields and preserve allocation',()=>{
 const project=seed.projects[11];const merged=applyExternalPatch(project,{workOrder:'WO1700',managed:{cap:0},narrative:{summary:'bad'}} as never);
 assert.deepEqual(merged.managed,project.managed);assert.deepEqual(merged.narrative,project.narrative);assert.equal('managed' in merged.external,false);
 const entry=seed.entries[0];const time=applyExternalTimePatch(entry,{...entry.external,hours:12,managed:{projectId:null}} as never);
 assert.deepEqual(time.managed,entry.managed);assert.equal(time.external.hours,12);assert.equal('managed' in time.external,false);
});
test('grouped work order views reconcile direct and scoped hours',()=>{
 const groups=groupedWorkOrders(seed);assert.equal(groups[0].children.length,3);assert.equal(groups[0].workOrders.length,4);assert.equal(groups.reduce((s,g)=>s+g.analytics.hours,0),1054);
 assert.equal(groups.find(g=>g.id==='p12')!.workOrders.length,0);
});
test('burn handles zero caps and over-cap work without NaN',()=>{
 assert.deepEqual(burnAgainstCap(10,0),{utilization:0,remainingCap:0,overCap:10});assert.equal(burnAgainstCap(120,100).utilization,120);assert.equal(aggregateHours([]),0);assert.equal(portfolioHealth([]),100);
});
test('delay detection uses explicit status or overdue unfinished work; excludes closed/planned',()=>{
 assert.equal(isDelayed(seed.projects[7],'2026-10-23'),true);assert.equal(isDelayed(seed.projects[0],'2026-10-23'),false);
 assert.equal(isDelayed(seed.projects[0],'2027-02-01'),true);assert.equal(isDelayed(seed.projects[10],'2028-01-01'),false);assert.equal(isDelayed(seed.projects[11],'2028-01-01'),false);
});
test('forecast completion pace, manual override and absent pace are explicit',()=>{
 const p=structuredClone(seed.projects[0]);p.managed.start='2026-10-01';p.managed.progress=50;
 assert.equal(forecastRecord(p,100,'2026-10-11').estimatedCompletion,'2026-10-21');
 p.managed.forecastOverride={hours:300,reason:'Additional scope'};assert.equal(forecastRecord(p,100,'2026-10-11').hours,300);assert.equal(forecastRecord(p,100,'2026-10-11').method,'override');
 assert.equal(forecastRecord(p,0,'2026-10-11').estimatedCompletion,null);assert.equal(forecastRecord(seed.projects[11],0,'2026-10-23').estimatedCompletion,null);
 p.managed.status='Completed';assert.equal(forecastRecord(p,100,'2026-10-11').hours,100);
});
test('attention generation has stable IDs and covers decisions, caps and delays',()=>{
 const items=attentionItems(seed,'2026-10-23');assert.equal(new Set(items.map(x=>x.id)).size,items.length);
 for(const kind of ['decision','cap','delay','risk']) assert.ok(items.some(i=>i.kind===kind));
 assert.ok(items.every(i=>!['p11','p12','p13'].includes(i.projectId)));
});
test('fixed demo monthly trends exclude a matching month in another year',()=>{
 const data=structuredClone(seed);data.entries.push({...structuredClone(seed.entries[0]),id:'next-year',external:{...seed.entries[0].external,date:'2027-05-15',hours:10}});
 assert.deepEqual(analytics(data,'p1').monthly,analytics(seed,'p1').monthly);assert.deepEqual(portfolio(data).monthly,portfolio(seed).monthly);
 assert.equal(portfolio(data).hours,1064);
});
