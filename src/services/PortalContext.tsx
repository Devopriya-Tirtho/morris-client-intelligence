import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import type {PortalData,Role} from '../domain/types';
import {repository} from './repository';
import {visibleData} from '../domain/analytics';
interface Context {data:PortalData;role:Role;setRole:(r:Role)=>void;update:(fn:(d:PortalData)=>PortalData)=>void;reset:()=>void;notify:(s:string)=>void}
const PortalContext=createContext<Context|null>(null);
export function PortalProvider({children}:{children:ReactNode}) {
 const [data,setData]=useState<PortalData>();
 const [role,setRole]=useState<Role>('client');
 const [message,notify]=useState('');
 useEffect(()=>{repository.load().then(setData)},[]);
 useEffect(()=>{if(!message)return;const t=setTimeout(()=>notify(''),4000);return()=>clearTimeout(t)},[message]);
 if(!data)return <div className="loading">Preparing your client intelligence portal…</div>;
 function update(fn:(d:PortalData)=>PortalData){
  if(role!=='admin'){notify('Switch to Morris Internal to edit this demo.');return}
  const next=fn(data!);
  repository.save(next).then(()=>{setData(next);notify('Changes saved to this browser.')}).catch(()=>notify('Unable to save. Browser storage may be full.'));
 }
 function reset(){
  if(role!=='admin')return;
  repository.reset().then(setData).then(()=>notify('Demo data restored.')).catch(()=>notify('Unable to reset browser storage.'));
 }
 return <PortalContext.Provider value={{data:role==='client'?visibleData(data):data,role,setRole,update,notify,reset}}>{children}{message&&<div role="status" className="toast">{message}</div>}</PortalContext.Provider>;
}
export function usePortal(){const ctx=useContext(PortalContext);if(!ctx)throw Error('PortalProvider required');return ctx}
