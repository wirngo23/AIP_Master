"use client";
import { useEffect, useRef, useState } from 'react';
import type { Settings } from '@/lib/aip/domain';
import { photoRenderKey, photoStrength } from '@/lib/aip/photographic';
import { compositePhoto, loadPhoto } from '@/lib/aip/photo-composite';
import { api } from '@/lib/aip/client';
export type PhotoResult={canvas:HTMLCanvasElement;key:string;label:string;sample:boolean;region:Settings['editMode']};
export default function PhotographicControls({src,settings,onResult}:{src:string;settings:Settings;onResult:(result:PhotoResult|null)=>void}){
 const [open,setOpen]=useState(false),[enabled,setEnabled]=useState(false),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[instant,setInstant]=useState(false);
 const key=photoRenderKey(src,settings),current=useRef(key),request=useRef(0);current.current=key;
 const sampleBeard=src==='/images/man-portrait.png'&&settings.beard&&settings.beard!=='original'&&(settings.beardColor??'espresso')==='espresso';
 const sampleLips=src==='/images/woman-portrait.png'&&settings.editMode==='lips'&&settings.regionPresets?.lips==='lips-natural'&&settings.lip===22&&settings.lipUpper===50&&settings.lipLower===50&&settings.lipWidth===0&&settings.lipCupid===0&&settings.intensity===45&&settings.phase===50;
 const sample=sampleBeard?'/images/man-beard-photographic.png':sampleLips?'/images/woman-lips-photographic.png':'';
 useEffect(()=>{let alive=true;api<{enabled:boolean}>('/api/photo-render').then(d=>{if(alive)setEnabled(d.enabled);}).catch(()=>{});return()=>{alive=false;};},[]);
 useEffect(()=>{setConsent(false);setOpen(false);},[src]);
 useEffect(()=>{
  let alive=true;request.current++;setBusy(false);setMessage('');onResult(null);
  if(sample&&!instant){setMessage('Preparing photographic sample…');void compositePhoto(src,sample,sampleBeard?{...settings,editMode:'beard'}:settings,true).then(canvas=>{if(!alive)return;onResult({canvas,key,label:sampleBeard?'BEARD PHOTOGRAPHIC SAMPLE':'LIP PHOTOGRAPHIC SAMPLE',sample:true,region:sampleBeard?'beard':'lips'});setMessage('Fictional AI sample · texture study');}).catch(e=>{if(alive)setMessage((e as Error).message);});}
  return()=>{alive=false;};
 },[key,sample,instant,onResult]);
 async function render(){
  if(!enabled||!consent||busy||photoStrength(settings)===0)return;const serial=++request.current;const captured=key;setBusy(true);setMessage('Rendering your selected region. This may take a few minutes…');
  try{
   const image=await loadPhoto(src),c=document.createElement('canvas');c.width=Math.min(1400,image.width);c.height=Math.round(c.width*image.height/image.width);c.getContext('2d')!.drawImage(image,0,0,c.width,c.height);
   const blob=await new Promise<Blob|null>(resolve=>c.toBlob(resolve,'image/jpeg',.92));if(!blob)throw Error('The photo could not be prepared.');
   const form=new FormData();form.set('photo',blob,'portrait.jpg');form.set('consent','true');form.set('requestId',crypto.randomUUID());form.set('settings',JSON.stringify(settings));
   const data=await api<{image:string}>('/api/photo-render',{method:'POST',body:form});
   if(current.current!==captured||request.current!==serial)return;
   const canvas=await compositePhoto(src,data.image,settings);
   if(current.current!==captured||request.current!==serial)return;
   onResult({canvas,key:captured,label:'AI PHOTOGRAPHIC EXPLORATION',sample:false,region:settings.editMode??'full'});setMessage('Render applied. Check identity, expression and proportions against the original.');
  }catch(e){if(current.current===captured&&request.current===serial)setMessage((e as Error).message);}
  finally{if(request.current===serial)setBusy(false);}
 }
 useEffect(()=>()=>{request.current++;},[]);
 return <div className="photographic-tools">
  <button className="photo-tool-trigger" aria-expanded={open} onClick={()=>setOpen(!open)}>✧ Photographic detail</button>
  {open&&<div className="photo-tool-panel">
   <strong>Keep the person. Refine the detail.</strong>
   <p>Instant controls explore proportions. A photographic render refines the selected region while retaining the original outside it.</p>
   {sample&&<button className="secondary-button" onClick={()=>setInstant(!instant)}>{instant?'Use photographic sample':'Use instant preview'}</button>}
   <p>{enabled?'Send this portrait to OpenAI to create an illustrative image. Up to 10 attempts per account daily.':'Personal photo rendering needs a connected image service. Fictional photographic samples are available for male beards and Natural balance lips on the female sample.'}</p>
   {enabled&&<><label className="consent-row"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I have this adult’s permission to send their photo to OpenAI for appearance exploration.</span></label><button className="primary-button" disabled={!consent||busy||photoStrength(settings)===0} onClick={render}>{busy?'Rendering…':'Render selected region'}</button></>}
   {message&&<p role="status">{message}</p>}
   <p className="micro-copy">Images can change identity or details. Review every result. Appearance concepts do not predict an injectable outcome. New renders are not saved with studies.</p>
  </div>}
 </div>;
}
