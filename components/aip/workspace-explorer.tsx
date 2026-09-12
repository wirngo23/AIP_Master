"use client";
import { type Settings } from '@/lib/aip/domain';
import EditingModes from './editing-modes';
import RegionArchetypes from './region-archetypes';
import RealFaceViews from './real-face-views';
import { Portrait } from './portrait';
export default function WorkspaceExplorer({settings,src,onChange,compact=false}:{settings:Settings;src:string;onChange:(s:Partial<Settings>)=>void;compact?:boolean}){
  return <div className={'workspace-explorer '+(compact?'compact-explorer':'')}>
    <div className="panel-heading person-panel-heading"><h2>The person / appearance study</h2></div>
    <EditingModes settings={{...settings,viewer:'photo'}} onChange={onChange} faceControls/>
    {src?<div className="portrait-stage workspace-portrait"><Portrait src={src} settings={settings} split={settings.previewOriginal?100:0} overlay={false}/></div>:<div className="missing-portrait">Upload the original portrait in Discover to continue this study.</div>}
    <RealFaceViews source={src}/>
    <RegionArchetypes settings={settings} onChange={onChange} compact/>
  </div>;
}
