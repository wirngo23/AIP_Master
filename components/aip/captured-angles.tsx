"use client";
import { useEffect, useRef, useState } from 'react';
import { normalizePhoto } from '@/lib/aip/client';
const angles=['Left profile','Left 45°','Front','Right 45°','Right profile'];
export default function CapturedAngles({source}:{source:string}){
 const [photos,setPhotos]=useState<Record<string,string>>({}),[selected,setSelected]=useState('Front'),[consent,setConsent]=useState(false),[error,setError]=useState('');
 const input=useRef<HTMLInputElement>(null),urls=useRef<Record<string,string>>({}),version=useRef(0);
 useEffect(()=>{version.current++;setPhotos({});setConsent(false);setError('');return()=>{version.current++;Object.values(urls.current).forEach(URL.revokeObjectURL);urls.current={};};},[source]);
 async function choose(file?:File){if(!file||!consent)return;const seq=version.current,angle=selected;try{const blob=await normalizePhoto(file);if(seq!==version.current)return;const url=URL.createObjectURL(blob);if(urls.current[angle])URL.revokeObjectURL(urls.current[angle]);urls.current[angle]=url;setPhotos({...urls.current});setError('');}catch(e){if(seq===version.current)setError((e as Error).message);}}
 return <section className="captured-angles"><h3>Five angles. The same person.</h3><p>Use the same camera distance, lighting and neutral expression. Keep the camera at eye level and turn your head to match each view.</p><div className="angle-grid">{angles.map(angle=><button key={angle} aria-pressed={selected===angle} onClick={()=>setSelected(angle)}>{photos[angle]?<img src={photos[angle]} alt={`${angle} captured portrait`}/>:<span>＋</span>}<span>{angle}</span></button>)}</div>
 {photos[selected]&&<img className="captured-angle" src={photos[selected]} alt={`Original ${selected.toLowerCase()} photograph`}/>}
 <label className="consent-row"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I have permission to use this adult’s photographs.</span></label>
 <input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload selected face angle" onChange={e=>{void choose(e.target.files?.[0]);e.target.value='';}}/>
 <button className="secondary-button" disabled={!consent} onClick={()=>input.current?.click()}>Add {selected.toLowerCase()} photo</button>
 {photos[selected]&&<button className="text-link" onClick={()=>{URL.revokeObjectURL(urls.current[selected]);delete urls.current[selected];setPhotos({...urls.current});}}>Remove this angle</button>}
 {error&&<p role="alert">{error}</p>}<p className="micro-copy">Captured photos, not a reconstructed 3D model. Edits are not applied to these angles. Photos stay on this device and clear when the portrait changes or you leave this workspace.</p></section>;
}
