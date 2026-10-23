export type Role = 'client' | 'admin';
export type Status = 'On track' | 'Attention' | 'Delayed' | 'Completed' | 'Upcoming';
export interface Project {
 id:string;
 external:{workOrder:string|null;qboProjectId:string|null;lastSyncedAt:string|null};
 managed:{name:string;parentId:string|null;categoryId:string;status:Status;start:string;end:string;cap:number;monthlyCap:number;progress:number;managerId:string;teamIds:string[];visible:boolean;description:string;internalNotes:string;milestones:{id:string;name:string;done:boolean}[]};
 narrative:{summary:string;value:string;risk:string;decision:string;nextStep:string;updatedAt:string;published:boolean};
}
export interface Person {id:string;name:string;role:string;email:string;phone:string;initials:string;color:string;qboIds:string[]}
export interface Category {id:string;name:string;color:string}
export interface TimeEntry {id:string;external:{personId:string;date:string;hours:number;approved:boolean;description:string};managed:{projectId:string|null;categoryId:string|null}}
export interface PortalData {version:1;projects:Project[];people:Person[];categories:Category[];entries:TimeEntry[]}
export interface ProjectAnalytics {hours:number;remaining:number;forecast:number;utilization:number;monthly:number[];contributors:{person:Person;hours:number}[]}
export interface PortalRepository {load():Promise<PortalData>;save(data:PortalData):Promise<void>;reset():Promise<PortalData>}
export interface ExternalSyncAdapter {readProjects():Promise<Project['external'][]>;readTimeEntries():Promise<TimeEntry['external'][]>}
