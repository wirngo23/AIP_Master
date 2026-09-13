import type { FaceGeometry, XY } from './appearance.ts';
import type { Settings } from './domain.ts';
export type BeardStyle=NonNullable<Settings['beard']>;
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function inside(p:XY,outline:XY[]){let yes=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const a=outline[i],b=outline[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
export function beardProfile(style:BeardStyle){
 return ({original:{length:0,base:0,strands:0},stubble:{length:.006,base:.08,strands:.13},boxed:{length:.021,base:.15,strands:.40},goatee:{length:.025,base:.14,strands:.40},mustache:{length:.025,base:.12,strands:.42},chinstrap:{length:.015,base:.10,strands:.36}})[style];
}
export function beardCoverage(face:FaceGeometry,style:BeardStyle,x:number,y:number){
 if(style==='original')return 0;
 const chin=face.chin??{x:face.lips.x,y:face.lips.y-face.height*.25};
 const nx=(x-chin.x)/face.width,ny=(y-chin.y)/face.height,edge=Math.abs(nx);
 const bottom=.34*Math.pow(edge/.5,2);
 const envelope=face.outline?.length?inside({x,y},face.outline):ny>bottom&&edge<.47;
 if(!envelope)return 0;
 const mouth=Math.pow((x-face.lips.x)/(face.lipWidth*.57),2)+Math.pow((y-face.lips.y)/(face.lipHeight*.72),2);
 const keepMouth=smooth(1,1.4,mouth);if(!keepMouth)return 0;
 const nose=face.noseBase?.y??face.lips.y+face.height*.16;
 const upper=face.lipTop?.y??face.lips.y+face.lipHeight*.5;
 const my=upper+(nose-upper)*.43,mh=Math.max(face.height*.018,(nose-upper)*.38);
 const moustache=(1-smooth(.72,1,Math.sqrt(Math.pow((x-face.lips.x)/(face.lipWidth*.61),2)+Math.pow((y-my)/mh,2))))*keepMouth;
 const cheekTop=face.lips.y-face.lipHeight*.32+edge*face.height*.25;
 let coverage=(1-smooth(cheekTop-face.height*.024,cheekTop,y))*smooth(0,.014,ny)*keepMouth;
 if(style==='goatee')coverage*=1-smooth(.19,.245,edge);
 if(style==='mustache')return moustache;
 if(style==='chinstrap')return coverage*(1-smooth(bottom+.06,bottom+.10,ny));
 return Math.max(coverage,moustache);
}
