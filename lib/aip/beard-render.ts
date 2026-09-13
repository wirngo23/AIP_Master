import { beardCoverage, beardProfile } from './beard';
import type { FaceGeometry } from './appearance';
import type { Settings } from './domain';
// Deterministic strands rendered into one cached texture. Never sent off-device.
export function renderBeard(face:FaceGeometry,settings:Settings,imageWidth:number,imageHeight:number){
 const canvas=document.createElement('canvas');canvas.width=Math.min(1400,imageWidth);canvas.height=Math.round(canvas.width*imageHeight/imageWidth);
 const ctx=canvas.getContext('2d')!;const {width:w,height:h}=canvas,style=settings.beard??'original';const profile=beardProfile(style),density=(settings.beardDensity??50)/100;
 if(style==='original'||density===0)return canvas;
 const tones={espresso:[30,23,20],chestnut:[73,44,29],copper:[117,61,33],silver:[155,158,160]};const rgb=tones[settings.beardColor??'espresso'];
 const maskCanvas=document.createElement('canvas');maskCanvas.width=w;maskCanvas.height=h;const maskCtx=maskCanvas.getContext('2d')!;
 const mask=maskCtx.createImageData(w,h),base=ctx.createImageData(w,h);let area=0;
 const chin=face.chin??{x:face.lips.x,y:face.lips.y-face.height*.25};
 const x0=Math.max(0,Math.floor((chin.x-face.width*.52)*w)),x1=Math.min(w,Math.ceil((chin.x+face.width*.52)*w));
 const y0=Math.max(0,Math.floor((1-(face.noseBase?.y??face.lips.y+face.height*.18))*h)),y1=Math.min(h,Math.ceil((1-chin.y+face.height*.02)*h));
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  const coverage=beardCoverage(face,style,x/w,1-y/h),i=(y*w+x)*4;area+=coverage;
  mask.data[i+3]=Math.round(coverage*255);
  base.data[i]=rgb[0];base.data[i+1]=rgb[1];base.data[i+2]=rgb[2];base.data[i+3]=Math.round(coverage*profile.base*density*255);
 }
 ctx.putImageData(base,0,0);maskCtx.putImageData(mask,0,0);
 let seed=91821;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const count=Math.min(45000,Math.round(area*profile.strands*density));let drawn=0,attempts=0;
 ctx.lineCap='round';
 while(drawn<count&&attempts<count*14){attempts++;const x=x0+random()*(x1-x0),y=y0+random()*(y1-y0),coverage=mask.data[(Math.floor(y)*w+Math.floor(x))*4+3]/255;if(random()>coverage)continue;drawn++;
  const above=1-y/h>face.lips.y;const side=Math.sign(x/w-face.lips.x);const angle=above?side*(.6+random()*.5):-side*.22+(random()-.5)*.45;
  const length=face.width*w*profile.length*(.6+random()*.9);const dx=Math.sin(angle)*length,dy=Math.cos(angle)*length;
  const light=(random()-.5)*24;ctx.strokeStyle=`rgba(${Math.max(0,rgb[0]+light)},${Math.max(0,rgb[1]+light)},${Math.max(0,rgb[2]+light)},${.55+random()*.4})`;
  ctx.lineWidth=Math.max(.65,face.width*w*(.0012+random()*.001));
  ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+dx*.25+(.5-random())*1.5,y+dy*.5,x+dx,y+dy);ctx.stroke();
 }
 // Clip strands to the same lip- and face-aware coverage, with a soft edge.
 ctx.globalCompositeOperation='destination-in';ctx.filter=`blur(${Math.max(.6,w*.0008)}px)`;ctx.drawImage(maskCanvas,0,0);ctx.filter='none';ctx.globalCompositeOperation='source-over';
 return canvas;
}
