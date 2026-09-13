import { ARCHETYPES, progression, type Settings } from './domain.ts';
import type { FaceGeometry } from './appearance.ts';
import { appearanceIntent } from './regions.ts';
export function topOriginMaskIndex(width:number,height:number,x:number,y:number){return (height-1-y)*width+x;}
export function photoStrength(s:Settings){
 if(s.editMode==='beard')return s.beard&&s.beard!=='original'?(s.beardDensity??50)/100:0;
 if(s.editMode==='hair')return s.hairColor&&s.hairColor!=='original'?(s.hairStrength??90)/100:0;
 return s.intensity/100*progression(s.phase);
}

export function photoRenderKey(source:string,s:Settings){
 const {previewOriginal,alignment,viewer,...appearance}=s;
 return JSON.stringify([source,appearance]);
}
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function regionalAlpha(f:FaceGeometry,mode:Settings['editMode'],x:number,y:number){
 if(mode==='beard'){
  const nose=f.noseBase?.y??f.lips.y+f.height*.18,chin=f.chin?.y??f.lips.y-f.height*.25;
  const mouth=Math.hypot((x-f.lips.x)/(f.lipWidth*.58),(y-f.lips.y)/(f.lipHeight*.7));
  return (1-smooth(nose-f.height*.03,nose+f.height*.04,y))*smooth(chin-f.height*.03,chin+f.height*.015,y)*(1-smooth(.43,.55,Math.abs(x-f.lips.x)/f.width))*smooth(1,1.35,mouth);
 }
 if(mode==='lips')return 1-smooth(.7,1.15,Math.hypot((x-f.lips.x)/(f.lipWidth*.75),(y-f.lips.y)/(f.lipHeight*2.2)));
 if(mode==='jawline')return (1-smooth(f.lips.y,f.lips.y+f.height*.08,y))*smooth((f.chin?.y??f.lips.y-f.height*.25)-f.height*.07,(f.chin?.y??f.lips.y-f.height*.25)+f.height*.015,y)*(1-smooth(.45,.65,Math.abs(x-f.lips.x)/f.width));
 if(mode==='hair')return 1; // Replaced by the detected hair mask in the compositor.
 return 1-smooth(.6,1,Math.hypot((x-f.lips.x)/(f.width*.78),(y-(f.lips.y+f.height*.12))/(f.height*.9)));
}
export function framingMatches(a:FaceGeometry,b:FaceGeometry){
 return Math.abs(a.width/b.width-1)<.08&&Math.abs(a.height/b.height-1)<.08&&a.brows.every((p,i)=>Math.hypot(p.x-b.brows[i].x,p.y-b.brows[i].y)<.022);
}
export function photoPrompt(s:Settings){
 const intent=appearanceIntent(s);
 const mode=s.editMode??'full';
 const details=mode==='beard'?`Facial hair style ${s.beard??'original'}, color ${s.beardColor??'espresso'}, visual density ${s.beardDensity??50}/100.`:
 mode==='hair'?`Hair color ${s.hairColor??'original'}, visual strength ${s.hairStrength??90}/100. Preserve haircut, length and individual strands.`:
 mode==='lips'?`Lip fullness ${s.lip}/100, upper emphasis ${s.lipUpper??50}, lower emphasis ${s.lipLower??50}, width adjustment ${s.lipWidth??0}, Cupid bow emphasis ${s.lipCupid??0}.`:
 mode==='jawline'?`Jaw contour strength ${s.jaw}/100, direction ${s.jawDirection??ARCHETYPES.find(a=>a.id===s.archetype)?.motion.jaw??1} (positive broadens, negative narrows), chin extension ${s.chin??0} (negative shortens).`:
 `Cheeks ${s.cheek}/100, jaw ${s.jaw}/100, lips ${s.lip}/100, brows ${s.brow}/100; overall visual strength ${s.intensity}/100.`;
 return `Edit this adult portrait for a cosmetic appearance exploration. Preserve identity, ethnicity, age, expression, gaze, head pose, camera framing, background and lighting exactly. Retain pores, fine lines, real strand texture and natural asymmetry. Do not beautify or smooth unrelated regions. Modify only ${mode}. ${intent?intent.name+': '+intent.description:''} ${details} Effective visual strength is ${Math.round(photoStrength(s)*100)} percent; scale the requested changes by this strength. Zero means keep the original unchanged. This progression is a visual blend, not elapsed treatment time. These are visual preferences, not a dose or treatment prescription. Do not depict injection sites, medical labels, text, collages or before/after panels. Produce exactly one aligned photograph. Changes must be restrained and anatomically plausible; no guarantee of achievable clinical results.`;
}
