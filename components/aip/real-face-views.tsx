"use client";
import { useEffect, useRef, useState } from 'react';
import { Rotate3D, Upload, Play, Pause, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
export default function RealFaceViews({source}:{source:string}){
  const [url,setUrl]=useState(''),[duration,setDuration]=useState(0),[position,setPosition]=useState(0),[playing,setPlaying]=useState(false),[error,setError]=useState(''),[consent,setConsent]=useState(false);
  const video=useRef<HTMLVideoElement>(null),file=useRef<HTMLInputElement>(null);
  useEffect(()=>()=>{if(url)URL.revokeObjectURL(url);},[url]);
  useEffect(()=>{setUrl('');setDuration(0);setPosition(0);setPlaying(false);setError('');setConsent(false);},[source]);
  function choose(f?:File){
    if(!f||!consent)return;setError('');
    if(!f.type.startsWith('video/')||f.size>80*1024*1024){setError('Choose a video up to 80 MB. MP4 or WebM is recommended.');return;}
    setDuration(0);setPosition(0);setPlaying(false);setUrl(URL.createObjectURL(f));
  }
  return <details className="real-face-views">
    <summary><Rotate3D size={17}/> Real face · turn & inspect <span>YOUR RECORDED ANGLES</span></summary>
    <div className="turn-content"><p>See the real person from multiple angles. Record a slow left-to-right head turn in even light, keeping the camera still. Include only an adult who has agreed to this use.</p>
      <p className="turn-evidence">Original video only. Photo edits are not applied to this footage. A single front photo cannot reveal unseen sides.</p>
      {!url?<div className="turn-empty"><Rotate3D size={30}/><h3>Bring your own angles.</h3><p>A 5–15 second turn is ideal. Maximum 60 seconds.</p></div>:<>
        <video ref={video} src={url} muted playsInline preload="metadata" className="turn-video" aria-label="Original recorded face angles, without simulated modifications" onLoadedMetadata={e=>{const d=e.currentTarget.duration;if(!Number.isFinite(d)||d<=0||d>60){setError('Use a video with a duration of 60 seconds or less.');setUrl('');return;}setDuration(d);}} onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onError={()=>{setError('This browser cannot decode that video. Try an MP4 or WebM recording.');setUrl('');}}/>
        <div className="turn-scrub"><button className="secondary-button" disabled={!duration} onClick={()=>{if(!video.current)return;if(playing)video.current.pause();else void video.current.play().catch(()=>setError('Playback was interrupted. Select Play to retry.'));}}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Pause':'Play turn'}</button><span>{position.toFixed(1)} / {duration.toFixed(1)} s</span><button className="icon-button" aria-label="Remove local turn video" onClick={()=>{setUrl('');setDuration(0);setPlaying(false);}}><X size={16}/></button></div>
        <Slider min={0} max={duration||1} step={.025} disabled={!duration} value={[position]} onValueChange={v=>{if(video.current){video.current.pause();video.current.currentTime=v[0];setPosition(v[0]);}}} aria-label="Inspect recorded head-turn angle"/>
      </>}
      <label className="consent-row"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I have permission to use this adult’s video.</span></label>
      <input ref={file} type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" aria-label="Choose a local face turn video" onChange={e=>{choose(e.target.files?.[0]);e.target.value='';}}/>
      <button className="secondary-button" disabled={!consent} onClick={()=>file.current?.click()}><Upload size={15}/>{url?'Replace turn video':'Choose turn video'}</button>
      {error&&<p role="alert" className="form-error">{error}</p>}
      <p className="micro-copy">Stays on this device. Not saved with studies. Removed when this workspace closes or the portrait changes.</p>
    </div>
  </details>;
}
