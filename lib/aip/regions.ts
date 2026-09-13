import { ARCHETYPES, type Settings } from './domain.ts';
export type EditMode = NonNullable<Settings['editMode']>;
export type FocusedMode = Exclude<EditMode,'full'>;
export type RegionalPreset = {id:string;mode:FocusedMode;name:string;description:string;patch:Partial<Settings>};
export const MODE_LABELS:Record<EditMode,string>={full:'Full face',lips:'Lips',hair:'Hair',beard:'Beards',jawline:'Jawline'};
export const REGIONAL_PRESETS:RegionalPreset[]=[
  {id:'lips-natural',mode:'lips',name:'Natural balance',description:'A small, balanced increase in upper and lower fullness. Width stays familiar.',patch:{lip:22,lipUpper:50,lipLower:50,lipWidth:0,lipCupid:0}},
  {id:'lips-cupid',mode:'lips',name:'Cupid’s bow',description:'Emphasize the two upper-lip peaks with modest overall fullness.',patch:{lip:36,lipUpper:65,lipLower:35,lipWidth:0,lipCupid:65}},
  {id:'lips-plush',mode:'lips',name:'Soft plush',description:'Fuller upper and lower lips with a gently wider silhouette.',patch:{lip:66,lipUpper:60,lipLower:65,lipWidth:16,lipCupid:10}},
  {id:'lips-lower',mode:'lips',name:'Lower-lip emphasis',description:'Add fullness mainly to the lower lip; keep the upper lip restrained.',patch:{lip:48,lipUpper:15,lipLower:85,lipWidth:0,lipCupid:0}},
  {id:'lips-upper',mode:'lips',name:'Upper-lip emphasis',description:'Add fullness mainly to the upper lip without widening the mouth.',patch:{lip:43,lipUpper:85,lipLower:15,lipWidth:0,lipCupid:20}},
  {id:'lips-refined',mode:'lips',name:'Refined silhouette',description:'A slightly narrower lip silhouette with restrained balanced fullness.',patch:{lip:25,lipUpper:40,lipLower:45,lipWidth:-30,lipCupid:15}},
  {id:'hair-original',mode:'hair',name:'Original tone',description:'Keep the original hair color, texture, length and cut.',patch:{hairColor:'original',hairStrength:90}},
  {id:'hair-espresso',mode:'hair',name:'Deep espresso',description:'A deep brown tone following your detected hair and preserving its texture.',patch:{hairColor:'espresso',hairStrength:90}},
  {id:'hair-chestnut',mode:'hair',name:'Warm chestnut',description:'Warm brown with a soft copper undertone; preserve the current hairstyle.',patch:{hairColor:'chestnut',hairStrength:85}},
  {id:'hair-copper',mode:'hair',name:'Burnished copper',description:'A warm copper color study, following existing hair strands and highlights.',patch:{hairColor:'copper',hairStrength:85}},
  {id:'hair-blonde',mode:'hair',name:'Honey blonde',description:'A honey-toned color overlay. This preview cannot predict salon lightening.',patch:{hairColor:'blonde',hairStrength:85}},
  {id:'hair-silver',mode:'hair',name:'Silver studio',description:'A cool silver color study that keeps the existing haircut.',patch:{hairColor:'silver',hairStrength:90}},
  {id:'beard-original',mode:'beard',name:'Original facial hair',description:'Remove the preview overlay and show the original facial hair. Existing hair is not erased.',patch:{beard:'original',beardDensity:0}},
  {id:'beard-stubble',mode:'beard',name:'Light stubble',description:'A fine, low-density texture along the cheeks, chin and upper lip.',patch:{beard:'stubble',beardDensity:30}},
  {id:'beard-boxed',mode:'beard',name:'Short boxed',description:'A denser, neatly bounded cheek-and-chin overlay with a tailored mustache.',patch:{beard:'boxed',beardDensity:72}},
  {id:'beard-goatee',mode:'beard',name:'Classic goatee',description:'Concentrate texture around the mouth and chin, leaving the cheeks unchanged.',patch:{beard:'goatee',beardDensity:66}},
  {id:'beard-mustache',mode:'beard',name:'Tailored mustache',description:'Add texture above the upper lip only; keep cheek and chin appearance unchanged.',patch:{beard:'mustache',beardDensity:68}},
  {id:'beard-chinstrap',mode:'beard',name:'Jawline frame',description:'A narrow band of texture follows the lower jaw and chin.',patch:{beard:'chinstrap',beardDensity:58}},
  {id:'jaw-natural',mode:'jawline',name:'Subtle definition',description:'A modest increase in jaw width, preserving chin length.',patch:{jaw:18,jawDirection:1,chin:0}},
  {id:'jaw-structured',mode:'jawline',name:'Structured angle',description:'Emphasize a wider lower-face contour with a slight chin extension.',patch:{jaw:64,jawDirection:1,chin:16}},
  {id:'jaw-soft-taper',mode:'jawline',name:'Soft taper',description:'Gently narrow the lower-face contour; keep chin length unchanged.',patch:{jaw:40,jawDirection:-1,chin:0}},
  {id:'jaw-long',mode:'jawline',name:'Longer chin',description:'Lengthen the chin silhouette slightly with restrained jaw-width changes.',patch:{jaw:12,jawDirection:1,chin:65}},
  {id:'jaw-compact',mode:'jawline',name:'Compact contour',description:'Shorten the chin silhouette slightly and soften the jaw width.',patch:{jaw:20,jawDirection:-1,chin:-45}},
  {id:'jaw-bold',mode:'jawline',name:'Broad contour',description:'Add stronger jaw width while keeping chin length familiar.',patch:{jaw:78,jawDirection:1,chin:0}},
];
export function applyRegionalPreset(s:Settings,id:string):Settings {
  const preset=REGIONAL_PRESETS.find(p=>p.id===id);
  if(!preset) throw Error('Unknown regional archetype');
  return {...s,...preset.patch,editMode:preset.mode,regionPresets:{...s.regionPresets,[preset.mode]:id},previewOriginal:false};
}
export function activeRegionalPreset(s:Settings){
  const mode=s.editMode??'full'; if(mode==='full') return undefined;
  const p=REGIONAL_PRESETS.find(p=>p.id===s.regionPresets?.[mode]&&p.mode===mode);
  return p&&Object.entries(p.patch).every(([k,v])=>s[k as keyof Settings]===v)?p:undefined;
}
export function activeFullPreset(s:Settings){
  const p=ARCHETYPES.find(a=>a.id===s.archetype)!;
  return p.values.every((v,i)=>[s.cheek,s.jaw,s.lip,s.brow][i]===v)&&[s.jawDirection,s.chin,s.lipUpper,s.lipLower,s.lipWidth,s.lipCupid].every(v=>v===undefined)?p:undefined;
}
export function appearanceIntent(s:Settings){
  return (s.editMode??'full')==='full'?activeFullPreset(s):activeRegionalPreset(s);
}
