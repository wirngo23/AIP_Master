"use client";
import { Check, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ARCHETYPES, applyArchetype, selectSample, type Settings } from '@/lib/aip/domain';
import { REGIONAL_PRESETS, MODE_LABELS, applyRegionalPreset, activeRegionalPreset, activeFullPreset } from '@/lib/aip/regions';
export default function RegionArchetypes({settings,onChange,compact=false}:{settings:Settings;onChange:(s:Partial<Settings>)=>void;compact?:boolean}){
  const mode=settings.editMode??'full';
  const full=ARCHETYPES.find(a=>a.id===settings.archetype)!;
  const [collection,setCollection]=useState(full.family);
  useEffect(()=>setCollection(full.family),[full.family]);
  const family=settings.sample==='man'?'masculine':settings.sample==='woman'?'feminine':collection;
  const active=mode==='full'?activeFullPreset(settings):activeRegionalPreset(settings);
  const options=mode==='full'?ARCHETYPES.filter(a=>a.family===family):REGIONAL_PRESETS.filter(p=>p.mode===mode);
  return <section className={`region-archetypes ${compact?'compact-archetypes':''}`}>
    <div className="panel-heading"><span className="section-index">01</span><h2>Choose your archetype</h2><Sparkles size={16}/></div>
    <p className="region-context">{MODE_LABELS[mode]} <span>/ {mode==='full'?'Whole-face preferences':'Focused collection'}</span></p>
    <div className="portal-switch" aria-label="Sample collection">
      {(['woman','man'] as const).map(sample=><button key={sample} aria-pressed={settings.sample===sample} onClick={()=>onChange(selectSample(settings,sample))}>{sample==='woman'?'Female':'Male'} sample</button>)}
      {settings.sample==='upload'&&<span>Your photo · all styles available</span>}
    </div>
    {mode==='full'&&settings.sample==='upload'&&<div className="portal-switch"><button aria-pressed={collection==='feminine'} onClick={()=>setCollection('feminine')}>Feminine styles</button><button aria-pressed={collection==='masculine'} onClick={()=>setCollection('masculine')}>Masculine styles</button></div>}
    <div className="archetype-grid">{options.map((a,i)=><button key={a.id} className={`archetype ${active?.id===a.id?'selected':''}`} aria-pressed={active?.id===a.id} onClick={()=>onChange(mode==='full'?applyArchetype(settings,a.id):applyRegionalPreset(settings,a.id))}>
      <span className="shape-icon" aria-hidden>{['◌','◇','⌒','∿','✧','◒'][i%6]}</span><span>{a.name}</span>{active?.id===a.id&&<Check className="selection-check" size={12}/>}
    </button>)}</div>
    <div className="direction-note" aria-live="polite"><span className="tiny-label">{MODE_LABELS[mode].toUpperCase()} / {settings.previewOriginal?'ORIGINAL VISIBLE':'YOUR PREVIEW'}</span><h3>{active?.name??'Your own mix'}</h3><p>{active?.description??`Choose a ${MODE_LABELS[mode].toLowerCase()} archetype or fine-tune the controls. Your other edits stay in place.`}</p></div>
    <p className="micro-copy">Every collection is open to everyone. These are appearance preferences, not treatment recommendations.</p>
  </section>;
}
