"use client";
import { useState } from 'react';
import { type Settings } from '@/lib/aip/domain';
import { MODE_LABELS } from '@/lib/aip/regions';
const FDA='https://www.fda.gov/medical-devices/aesthetic-cosmetic-devices/dermal-fillers-soft-tissue-fillers';
const BOTOX='https://www.rxabbvie.com/pdf/botox-cosmetic_pi.pdf';
const VOLUX='https://www.fda.gov/medical-devices/recently-approved-devices/juvederm-volux-xc-p110033s065';
export default function TreatmentExplainer({mode='full'}:{mode?:Settings['editMode']}){
  const [type,setType]=useState<'filler'|'toxin'|'collagen'>('filler');
  const [demonstrate,setDemonstrate]=useState(false);
  const cosmetic=mode==='hair'||mode==='beard';
  if(cosmetic)return <section className="treatment-explainer"><span className="tiny-label">{MODE_LABELS[mode].toUpperCase()} / APPEARANCE ONLY</span><h3>Style is a separate conversation.</h3><p>These hair and beard previews show cosmetic color or texture. Botox and dermal fillers are not modeled as changing hair color, creating a haircut, or growing a beard. Hair loss needs its own assessment; no injectable hair-growth recommendation is generated here.</p></section>;
  return <section className="treatment-explainer">
    <span className="tiny-label">{MODE_LABELS[mode??'full'].toUpperCase()} / HOW TREATMENTS DIFFER</span>
    <h3>Structure, volume & movement.</h3>
    <div className="mechanism-tabs" role="group" aria-label="Treatment mechanism">
      <button aria-pressed={type==='filler'} onClick={()=>{setType('filler');setDemonstrate(false);}}>HA filler</button><button aria-pressed={type==='toxin'} onClick={()=>{setType('toxin');setDemonstrate(false);}}>Botulinum toxin</button><button aria-pressed={type==='collagen'} onClick={()=>{setType('collagen');setDemonstrate(false);}}>Collagen stimulators</button>
    </div>
    <div className="tissue-diagram">
      <svg viewBox="0 0 420 190" role="img" aria-label={`Conceptual tissue cross-section: ${type==='toxin'?'muscle activity':type==='filler'?'soft tissue volume':'collagen response'}. Not patient anatomy.`}>
        <path d={demonstrate&&type!=='toxin'?'M20 70 Q130 70 180 44 Q230 27 280 55 Q330 70 400 70 L400 115 L20 115Z':'M20 70 Q210 65 400 70 L400 115 L20 115Z'} fill="#6b8c7a" stroke="#b8e7c9" strokeWidth="2"/>
        <path d="M20 118 L400 118 L400 148 L20 148Z" fill="#2e5144"/>
        {type==='filler'&&demonstrate&&<ellipse cx="220" cy="86" rx="60" ry="18" fill="#97e1d1" opacity=".8"/>}
        {type==='collagen'&&demonstrate&&[0,1,2,3,4,5].map(i=><path key={i} d={`M${135+i*20} 105 q15 -30 35 0`} stroke="#d5c28b" strokeWidth="3" fill="none"/>)}
        {[0,1,2,3].map(i=><path key={i} d={`M35 ${123+i*6} Q210 ${type==='toxin'&&!demonstrate?108+i*6:123+i*6} 385 ${123+i*6}`} stroke={type==='toxin'?'#dfac9f':'#927c72'} strokeWidth="2" fill="none"/>)}
        <text x="22" y="35" fill="#c9ddd0" fontSize="12">SKIN & SOFT TISSUE</text><text x="22" y="178" fill="#c9ddd0" fontSize="12">MUSCLE LAYER · CONCEPTUAL</text>
      </svg>
      <button className="secondary-button" aria-pressed={demonstrate} onClick={()=>setDemonstrate(!demonstrate)}>{demonstrate?'Reset explanation':'Illustrate mechanism'}</button>
    </div>
    {type==='filler'?<div><h4>HA filler / tissue volume</h4><p>Hyaluronic acid gel adds soft-tissue volume. It does not paralyze muscles. Product, tissue characteristics, placement and swelling affect the visible result; mL cannot be converted into a fixed number of pixels.</p>{mode==='lips'?<p>Selected fillers have lip indications. Upper/lower balance and movement require examination. The archetype is a preference to discuss, not a prescribed lip shape.</p>:mode==='jawline'?<p>JUVÉDERM VOLUX XC is FDA approved for adults over 21 with moderate to severe loss of jawline definition. Added contour is different from narrowing the jaw or shortening bone.</p>:<p>Filler indications vary by exact product and region. A product used for one area is not automatically appropriate for another.</p>}<a href={mode==='jawline'?VOLUX:FDA} target="_blank" rel="noreferrer">Read FDA product information ↗</a></div>:type==='toxin'?<div><h4>Botulinum toxin / muscle activity</h4><p>Botulinum toxin reduces acetylcholine release at neuromuscular junctions. Its effect develops over time; it does not add filler-like volume. Units are specific to each product and cannot be converted between brands.</p>{mode==='lips'?<p>A lip flip is outside the cited U.S. BOTOX Cosmetic indications. Altering orbicularis oris activity can affect mouth function. No lip injection dose or treatment map is supplied.</p>:mode==='jawline'?<p>Platysma-band treatment is in the cited BOTOX Cosmetic label. Masseter contouring is a different use and is not included in that label. Chewing, swallowing, and nearby muscle function matter.</p>:<p>The cited label covers glabellar, lateral canthal and forehead lines, and platysma bands. The muscle animation is a manually controlled explanation, not a predicted response.</p>}<a href={BOTOX} target="_blank" rel="noreferrer">Read full prescribing information ↗</a></div>:<div><h4>Collagen-stimulating fillers / gradual tissue response</h4><p>Some fillers use calcium hydroxylapatite or poly-L-lactic acid. Material, indication and time course differ from HA gels. They are not interchangeable with HA products and are not represented by a generic dose slider.</p>{mode==='lips'&&<p>No collagen-stimulator lip treatment is offered in this editor. Review exact product labeling; a face indication does not establish a lip indication.</p>}<a href={FDA} target="_blank" rel="noreferrer">Review filler materials and indications ↗</a></div>}
    <details className="evidence-disclosure"><summary>What must be assessed in person</summary><p>Skin, fat compartments, bone support, muscle balance, prior treatment, vascular anatomy and functional goals. Neither the photo nor the schematic identifies vessels or safe injection sites. Filler complications can include vascular occlusion and tissue injury; toxin effects can affect nearby or distant muscles. Review complete product information and clinical history.</p><p>Illustrations are qualitative. No optimal dose, candidacy decision or clinical outcome is calculated. Sources reviewed 12 September 2026.</p></details>
  </section>;
}
