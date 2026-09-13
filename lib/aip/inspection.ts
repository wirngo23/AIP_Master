import type { FaceGeometry } from './appearance.ts';
import type { Settings } from './domain.ts';
export function inspectionAlignment(face:FaceGeometry,crop:number[],mode:Settings['editMode']){
 const chin=face.chin??{x:face.lips.x,y:face.lips.y-face.height*.25};
 let center={x:face.lips.x,y:chin.y+face.height*.53},zoom=1.35;
 if(mode==='lips'){center=face.lips;zoom=2.9;}
 if(mode==='beard'||mode==='jawline'){center={x:face.lips.x,y:chin.y+face.height*.22};zoom=1.85;}
 if(mode==='hair'){center={x:face.lips.x,y:(face.brows[0].y+face.brows[1].y)/2+face.height*.10};zoom=1.75;}
 center={x:Math.max(crop[0]/(2*zoom),Math.min(1-crop[0]/(2*zoom),center.x)),y:Math.max(crop[1]/(2*zoom),Math.min(1-crop[1]/(2*zoom),center.y))};
 return {zoom,x:(.5-center.x)/crop[0],y:(.5-center.y)/crop[1]};
}
