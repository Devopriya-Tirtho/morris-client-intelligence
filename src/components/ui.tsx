import type {ReactNode} from 'react';
import {ArrowUpRight,ArrowRight,Check,ChevronRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {Project,Person,Status} from '../domain/types';
import {usePortal} from '../services/PortalContext';
import {analytics} from '../domain/analytics';
export const number=(n:number)=>n.toLocaleString('en-CA',{maximumFractionDigits:1});
export const date=(s:string)=>new Date(s+'T12:00:00').toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'});
export function Badge({status}:{status:Status}){return <span className={`badge ${status.toLowerCase().replace(' ','-')}`}><i/>{status}</span>}
export function Progress({value,color}:{value:number;color?:string}){return <div className="progress"><span style={{width:`${Math.min(100,Math.max(0,value))}%`,background:color}}/></div>}
export function Avatar({person,small=false}:{person:Person;small?:boolean}){return <span title={person.name} className={`avatar ${small?'small':''}`} style={{background:person.color+'20',color:person.color}}>{person.initials}</span>}
export function Card({title,eyebrow,action,children,className=''}:{title?:string;eyebrow?:string;action?:ReactNode;children:ReactNode;className?:string}){return <section className={`card ${className}`}>{title&&<div className="card-heading"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h3>{title}</h3></div>{action}</div>}{children}</section>}
export function PageTitle({eyebrow='ZAGIMĒ ANISHINABĒK',title,description,action}:{eyebrow?:string;title:string;description:string;action?:ReactNode}){return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>}
export function Metric({label,value,unit,detail,icon,accent=false}:{label:string;value:string|number;unit?:string;detail:string;icon:ReactNode;accent?:boolean}){return <div className={`metric ${accent?'accent':''}`}><div className="metric-label">{label}<span>{icon}</span></div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-detail">{detail}</div></div>}
export function ProjectCard({project:p}:{project:Project}){const {data}=usePortal();const a=analytics(data,p.id);const category=data.categories.find(c=>c.id===p.managed.categoryId);const pm=data.people.find(x=>x.id===p.managed.managerId);return <Link className="project-card" to={`/projects/${p.id}`}><div className="row between"><span className="work-order">{p.external.workOrder||'UPCOMING · NOT INITIALIZED'}</span><ArrowUpRight size={17}/></div><h3>{p.managed.name}</h3><div className="category-label"><i style={{background:category?.color}}/>{category?.name.replace('LINK - ','')}</div><p>{p.narrative.summary}</p><div className="row between"><Badge status={p.managed.status}/><span className="muted small-text">{p.managed.progress}% complete</span></div><Progress value={p.managed.progress}/><div className="row between project-card-bottom"><span><b>{number(a.hours)}</b> <span className="muted">/ {number(p.managed.cap)} hrs</span></span>{pm&&<Avatar person={pm} small/>}</div></Link>}
export function TextLink({to,children}:{to:string;children:ReactNode}){return <Link className="text-link" to={to}>{children}<ArrowRight size={15}/></Link>}
export function Empty({children}:{children:ReactNode}){return <div className="empty"><Check size={24}/><p>{children}</p></div>}
export function Breadcrumb({children}:{children:ReactNode}){return <div className="breadcrumb"><Link to="/projects">Projects</Link><ChevronRight size={14}/>{children}</div>}
