import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import type {PortalData,Role} from '../domain/types';
import {repository} from './repository';
import {PortalService} from './PortalService';
import {visibleData} from '../domain/analytics';
const service = new PortalService(repository);
interface Context {data:PortalData;role:Role;setRole:(r:Role)=>void;update:(fn:(d:PortalData)=>PortalData)=>Promise<boolean>;reset:()=>void;notify:(s:string)=>void}
const PortalContext=createContext<Context|null>(null);
export function PortalProvider({children}:{children:ReactNode}) {
 const [data,setData]=useState<PortalData>();
 const [role,setRole]=useState<Role>('client');
 const [message,notify]=useState('');
 const [loadError,setLoadError]=useState(false);
 useEffect(()=>{service.fetchPortfolioData('admin').then(setData).catch(()=>setLoadError(true))},[]);
 useEffect(()=>{if(!message)return;const t=setTimeout(()=>notify(''),4000);return()=>clearTimeout(t)},[message]);
 if(loadError)return <div className="loading" role="alert">Unable to load this browser’s demo data. Check browser storage access and reload.</div>;
 if(!data)return <div className="loading">Preparing your client intelligence portal…</div>;
 async function update(fn:(d:PortalData)=>PortalData):Promise<boolean>{
  try { const next=await service.editWorkspace(role,fn);setData(next);notify('Changes saved to this browser.');return true; }
  catch(error){notify(error instanceof Error?error.message:'Unable to save. Browser storage may be full.');return false;}
 }
 function reset(){
  service.reset(role).then(setData).then(()=>notify('Demo data restored.')).catch(()=>notify('Unable to reset browser storage.'));
 }
 return <PortalContext.Provider value={{data:role==='client'?visibleData(data):data,role,setRole,update,notify,reset}}>{children}{message&&<div role="status" className="toast">{message}</div>}</PortalContext.Provider>;
}
export function usePortal(){const ctx=useContext(PortalContext);if(!ctx)throw Error('PortalProvider required');return ctx}
