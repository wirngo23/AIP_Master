import { analyzeFace } from './face-analysis';
import { analyzeHair } from './hair-analysis';
import { framingMatches, regionalAlpha, topOriginMaskIndex } from './photographic';
import { beardCoverage } from './beard';
import type { Settings } from './domain';
export function loadPhoto(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Photo could not be loaded.'));image.src=src;});}
export async function compositePhoto(source:string,edited:string,s:Settings,sample=false){
 const [original,result]=await Promise.all([loadPhoto(source),loadPhoto(edited)]);
 const [face,changed]=await Promise.all([analyzeFace(original),analyzeFace(result)]);
 if(Math.abs(original.width/original.height-result.width/result.height)>.035||!framingMatches(face,changed))throw Error('The render changed the framing too much. It was not applied; the original is preserved.');
 const c=document.createElement('canvas');c.width=Math.min(1400,original.width);c.height=Math.round(c.width*original.height/original.width);const ctx=c.getContext('2d')!;
 ctx.drawImage(original,0,0,c.width,c.height);const base=ctx.getImageData(0,0,c.width,c.height);
 ctx.drawImage(result,0,0,c.width,c.height);const output=ctx.getImageData(0,0,c.width,c.height);
 const hair=s.editMode==='hair'?await analyzeHair(original):null;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
  const i=(y*c.width+x)*4;
  let a=regionalAlpha(face,s.editMode,x/c.width,1-y/c.height);
  if(hair){const hx=Math.min(hair.width-1,Math.floor(x/c.width*hair.width)),hy=Math.min(hair.height-1,Math.floor(y/c.height*hair.height));a=hair.bytes[topOriginMaskIndex(hair.width,hair.height,hx,hy)]/255;}
  if(sample&&s.editMode==='beard'){
   const nx=Math.abs(x/c.width-face.lips.x)/face.width;
   if(s.beard==='goatee')a*=Math.max(0,Math.min(1,(.27-nx)/.06));
   if(s.beard==='mustache'||s.beard==='chinstrap')a=beardCoverage(face,s.beard,x/c.width,1-y/c.height);
   a*=Math.sqrt((s.beardDensity??72)/100);
  }
  for(let k=0;k<3;k++)output.data[i+k]=Math.round(base.data[i+k]*(1-a)+output.data[i+k]*a);
 }
 ctx.putImageData(output,0,0);return c;
}
