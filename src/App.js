import { useState, useRef, useEffect, useCallback } from "react";
import StrategicAI from './StrategicAI';

// ── GOOGLE SHEETS API ──────────────────────────────────────────────────────────
const API = process.env.REACT_APP_SHEETS_API;

async function sheetRead(sheet) {
  try {
    const res = await fetch(`${API}?action=read&sheet=${sheet}`);
    const data = await res.json();
    return data.ok ? data.data : [];
  } catch { return []; }
}

async function sheetWrite(sheet, row) {
  try {
    const res = await fetch(API, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"write", sheet, row })
    });
    const data = await res.json();
    return data.ok;
  } catch { return false; }
}

async function sheetUpdate(sheet, id, updates) {
  try {
    const res = await fetch(API, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"update", sheet, id, updates })
    });
    const data = await res.json();
    return data.ok;
  } catch { return false; }
}

async function sheetDelete(sheet, id) {
  try {
    const res = await fetch(API, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"delete", sheet, id })
    });
    const data = await res.json();
    return data.ok;
  } catch { return false; }
}

// Log an activity entry to Sheets
async function logActivity(dealId, client, type, note, owner) {
  await sheetWrite("Activity", {
    id: `act_${Date.now()}`,
    dealId, client, type, note, owner,
    timestamp: new Date().toISOString()
  });
}

// ── TOKENS ─────────────────────────────────────────────────────────────────────
const C = {
  bg:"#f5f5f8", white:"#ffffff", cardAlt:"#fafafa",
  border:"#eaeaf0", borderMid:"#d4d4e4",
  accent:"#4B6BFB", accentLight:"#eef1ff",
  green:"#12b76a", greenLight:"#ecfdf3",
  orange:"#f79009", orangeLight:"#fffaeb",
  red:"#f04438", redLight:"#fef2f2",
  purple:"#7c60d5", purpleLight:"#f5f3ff",
  teal:"#0e9384", tealLight:"#f0fdf9",
  text:"#0c0c1d", textMid:"#3d3d5c", textDim:"#8080a8", textFaint:"#c4c4d8",
  shadow:"0 1px 2px rgba(0,0,20,.05),0 3px 10px rgba(0,0,20,.04)",
  shadowMd:"0 4px 20px rgba(0,0,20,.08)",
};

const ROLES = {
  ayush: { label:"Ayush Prashar", role:"CEO & Founder", pw:"nd-ceo-2026", color:C.accent, badge:"CEO",
    views:["inbox","capture","coach","proposal","decks","forecast","weekly","delivery","intelligence"] },
  sales: { label:"Sales Team", role:"Account Executive", pw:"nd-sales-2026", color:C.green, badge:"SALES",
    views:["inbox","capture","coach","proposal","decks"] },
};

const VIEWS = {
  inbox:        { icon:"◈", label:"Deal Inbox" },
  capture:      { icon:"⊕", label:"Capture" },
  coach:        { icon:"✦", label:"AI Coach" },
  proposal:     { icon:"▤", label:"Proposals" },
  decks:        { icon:"⬡", label:"Deck Library" },
  forecast:     { icon:"▲", label:"Forecast" },
  weekly:       { icon:"◎", label:"Weekly Brief" },
  delivery:     { icon:"⟁", label:"Delivery Hub" },
  intelligence: { icon:"◉", label:"Intelligence" },
};

const STAGES = ["Lead","Qualified","Proposal Sent","Negotiation","Closed Won","Closed Lost"];
const STAGE_CFG = {
  "Lead":          { color:"#8080a8", bg:"#f5f5fa" },
  "Qualified":     { color:C.accent,  bg:C.accentLight },
  "Proposal Sent": { color:C.orange,  bg:C.orangeLight },
  "Negotiation":   { color:C.purple,  bg:C.purpleLight },
  "Closed Won":    { color:C.green,   bg:C.greenLight },
  "Closed Lost":   { color:C.red,     bg:C.redLight },
};

const DECK_TAGS = ["Company Overview","Solution Overview","Case Study","Healthcare","Pharma","FMCG","Auto","Tech","NextComply AI","Pricing","ROI","AI Services","Team & Credentials","Process","Partnership","Product Demo"];

// Fallback seed deals (used when Sheets is empty or loading fails)
const SEED_DEALS = [
  { id:"d1",  client:"Aster DM Healthcare",             contact:"Stuti Jain",          value:12, stage:"Lead",          owner:"Stuti Jain",        vertical:"Healthcare", priority:"med",  lastTouch:55, nextAction:"Schedule discovery call — reactivate", nextDate:"2026-04-07", notes:"Healthcare chain. Explore NextComply + AI content.", handoffDone:"false", healthScore:"", createdAt:"2026-02-09", updatedAt:"2026-04-05" },
  { id:"d2",  client:"Fortis Healthcare - Head Office", contact:"Arnab Acharya",        value:20, stage:"Lead",          owner:"Arnab Acharya",     vertical:"Healthcare", priority:"med",  lastTouch:85, nextAction:"Push to Active Lead — strong AI fit",   nextDate:"2026-04-07", notes:"HO account. High potential.", handoffDone:"false", healthScore:"", createdAt:"2026-01-10", updatedAt:"2026-04-05" },
  { id:"d3",  client:"HCG",                             contact:"Suprotik Ghosh",       value:10, stage:"Lead",          owner:"Suprotik Ghosh",    vertical:"Healthcare", priority:"med",  lastTouch:86, nextAction:"Intro call — NextComply strong fit",    nextDate:"2026-04-09", notes:"Cancer care network.", handoffDone:"false", healthScore:"", createdAt:"2026-01-09", updatedAt:"2026-04-05" },
  { id:"d4",  client:"Gleneagles",                      contact:"Richard Roy Mendon",   value:15, stage:"Lead",          owner:"Richard Roy Mendon",vertical:"Healthcare", priority:"med",  lastTouch:86, nextAction:"Share Narayana case study",             nextDate:"2026-04-08", notes:"Hospital chain. Expansion opportunity.", handoffDone:"false", healthScore:"", createdAt:"2026-01-09", updatedAt:"2026-04-05" },
  { id:"d5",  client:"Narayana Health - Head Office",   contact:"Dipanjan Das",         value:20, stage:"Lead",          owner:"Dipanjan Das",      vertical:"Healthcare", priority:"med",  lastTouch:86, nextAction:"Connect HO — branch level only so far", nextDate:"2026-04-09", notes:"HO separate from branch retainer.", handoffDone:"false", healthScore:"", createdAt:"2026-01-09", updatedAt:"2026-04-05" },
  { id:"d6",  client:"Health Lync - Wellyfy",           contact:"Sachin Junakar",       value:12, stage:"Qualified",     owner:"Sachin Junakar",    vertical:"Healthcare", priority:"high", lastTouch:17, nextAction:"Build proposal — HIGH priority",        nextDate:"2026-04-06", notes:"Health tech. AI wellness platform.", handoffDone:"false", healthScore:"", createdAt:"2026-03-19", updatedAt:"2026-04-05" },
  { id:"d7",  client:"Coffee D2C & Cosmetics",          contact:"Deboja Chakraborty",   value:6,  stage:"Qualified",     owner:"Deboja Chakraborty",vertical:"FMCG",       priority:"high", lastTouch:17, nextAction:"Proposal — SMM + website + AI stack",   nextDate:"2026-04-07", notes:"D2C brand. High priority.", handoffDone:"false", healthScore:"", createdAt:"2026-03-19", updatedAt:"2026-04-05" },
  { id:"d8",  client:"Damac Digital",                   contact:"Manmohan Brahma",      value:10, stage:"Qualified",     owner:"Manmohan Brahma",   vertical:"Tech",       priority:"med",  lastTouch:31, nextAction:"Follow up — 31d since Mar 5",           nextDate:"2026-04-06", notes:"Digital/tech.", handoffDone:"false", healthScore:"", createdAt:"2026-03-05", updatedAt:"2026-04-05" },
  { id:"d9",  client:"Wagh Bakri",                      contact:"Sidharth - Anurag",    value:12, stage:"Proposal Sent", owner:"Sidharth",          vertical:"FMCG",       priority:"med",  lastTouch:12, nextAction:"Follow up — proposal Mar 24 no reply",  nextDate:"2026-04-06", notes:"Tea brand. AI content + social.", handoffDone:"false", healthScore:"", createdAt:"2026-03-24", updatedAt:"2026-04-05" },
  { id:"d10", client:"Clove Dental - Toothpaste",       contact:"Priya Taak",           value:10, stage:"Proposal Sent", owner:"Priya Taak",         vertical:"Healthcare", priority:"high", lastTouch:12, nextAction:"HIGH — call Priya, proposal Mar 24",    nextDate:"2026-04-06", notes:"Clove Dental product line.", handoffDone:"false", healthScore:"", createdAt:"2026-03-24", updatedAt:"2026-04-05" },
  { id:"d11", client:"MSTC India Govt. PSU",            contact:"MSTC",                 value:18, stage:"Proposal Sent", owner:"MSTC Team",          vertical:"Other",      priority:"high", lastTouch:17, nextAction:"HIGH — Govt PSU, formal nudge email",   nextDate:"2026-04-07", notes:"Large potential. Digital transformation.", handoffDone:"false", healthScore:"", createdAt:"2026-03-19", updatedAt:"2026-04-05" },
  { id:"d12", client:"BHFO Social Media",               contact:"Faisal Suntek",        value:8,  stage:"Closed Won",    owner:"Faisal Suntek",      vertical:"Other",      priority:"med",  lastTouch:17, nextAction:"Initiate delivery handoff",              nextDate:"2026-04-07", notes:"Closed Mar 19.", handoffDone:"false", healthScore:"", createdAt:"2026-03-19", updatedAt:"2026-04-05" },
  { id:"d13", client:"IMAEC",                           contact:"Ranjeet Mishra",       value:10, stage:"Closed Won",    owner:"Ranjeet Mishra",     vertical:"Other",      priority:"med",  lastTouch:17, nextAction:"Clarify kickoff scope",                  nextDate:"2026-04-07", notes:"Closed Mar 19.", handoffDone:"false", healthScore:"", createdAt:"2026-03-19", updatedAt:"2026-04-05" },
  { id:"d14", client:"Wockhardt",                       contact:"Madhurima",            value:15, stage:"Closed Won",    owner:"Madhurima",          vertical:"Pharma",     priority:"high", lastTouch:33, nextAction:"Confirm handoff complete",               nextDate:"2026-04-06", notes:"Pharma. Existing relationship.", handoffDone:"false", healthScore:"green", createdAt:"2026-03-03", updatedAt:"2026-04-05" },
];

const SEED_DECKS = [
  { id:"dk1",  title:"Nextdot Company Overview v4",  link:"https://www.canva.com", tags:"Company Overview,Team & Credentials",          lastUpdated:"Mar 2026", notes:"Default opener for all pitches." },
  { id:"dk2",  title:"NextComply AI Product Deck",   link:"https://www.canva.com", tags:"NextComply AI,Solution Overview,Product Demo",  lastUpdated:"Feb 2026", notes:"Full walkthrough. Use for pharma/healthcare." },
  { id:"dk3",  title:"Healthcare AI Solutions",      link:"https://www.canva.com", tags:"Healthcare,AI Services,Solution Overview",      lastUpdated:"Jan 2026", notes:"Best for hospital chains." },
  { id:"dk4",  title:"Narayana Health Case Study",   link:"https://www.canva.com", tags:"Case Study,Healthcare",                         lastUpdated:"Dec 2025", notes:"Strong social proof." },
  { id:"dk5",  title:"AI Services ROI Framework",    link:"https://www.canva.com", tags:"ROI,Pricing,AI Services",                       lastUpdated:"Nov 2025", notes:"Use in Negotiation." },
  { id:"dk6",  title:"Pharma Compliance AI Pitch",   link:"https://www.canva.com", tags:"Pharma,NextComply AI",                          lastUpdated:"Feb 2026", notes:"For pharma regulatory teams." },
  { id:"dk7",  title:"Nextdot Process & Team",       link:"https://www.canva.com", tags:"Process,Team & Credentials",                    lastUpdated:"Oct 2025", notes:"How we work." },
  { id:"dk8",  title:"FMCG AI Content Automation",   link:"https://www.canva.com", tags:"FMCG,AI Services",                              lastUpdated:"Dec 2025", notes:"Radico / Hero use cases." },
  { id:"dk9",  title:"Discovery Sprint Methodology", link:"https://www.canva.com", tags:"Process,Partnership",                           lastUpdated:"Jan 2026", notes:"Scope entry for complex deals." },
  { id:"dk10", title:"Pricing & Engagement Models",  link:"https://www.canva.com", tags:"Pricing,ROI",                                   lastUpdated:"Mar 2026", notes:"FY 26-27 retainer + project models." },
];

// ── HELPERS ────────────────────────────────────────────────────────────────────
function urgency(d) {
  let s=0;
  if(d.priority==="high") s+=3; else if(d.priority==="med") s+=1;
  const lt=parseInt(d.lastTouch)||0;
  if(lt>30) s+=3; else if(lt>10) s+=2; else if(lt>5) s+=1;
  if(d.stage==="Negotiation") s+=2;
  if(d.stage==="Proposal Sent") s+=1;
  try{ if(new Date(d.nextDate)<=new Date()) s+=2; }catch{}
  return s;
}

function parseBool(v){ return v===true||v==="true"||v===1||v==="1"; }

function Tag({ label, color, size=10 }) {
  return <span style={{fontSize:size,fontWeight:600,padding:"2px 8px",borderRadius:20,color,background:`${color}15`,whiteSpace:"nowrap",letterSpacing:.3}}>{label}</span>;
}
function Card({ children, style={} }) {
  return <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",boxShadow:C.shadow,...style}}>{children}</div>;
}
function SL({ children, color=C.textDim }) {
  return <div style={{fontSize:10,color,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{children}</div>;
}
function FInput({ value, onChange, placeholder, type="text", rows, style={} }) {
  const base={width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px",color:C.text,fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",...style};
  return rows?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base}/>:<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type} style={base}/>;
}
function Btn({ label, onClick, color=C.accent, outline=false, small=false, disabled=false, icon="" }) {
  return <button onClick={onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",gap:6,background:outline?"transparent":disabled?"#e8e8f0":color,border:`1.5px solid ${disabled?"#e8e8f0":color}`,borderRadius:9,padding:small?"5px 13px":"9px 20px",color:outline?color:disabled?C.textDim:"#fff",fontWeight:600,fontSize:small?11:13,cursor:disabled?"default":"pointer",fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}>{icon&&<span>{icon}</span>}{label}</button>;
}
function Skeleton() {
  return <div style={{display:"flex",flexDirection:"column",gap:9,padding:"6px 0"}}>{[85,65,78,45,70].map((w,i)=><div key={i} style={{height:10,borderRadius:5,background:C.border,width:`${w}%`,opacity:.6}}/>)}</div>;
}
function AIBox({ text, loading }) {
  if(loading) return <div style={{background:C.accentLight,borderRadius:"0 14px 14px 14px",padding:"14px 16px",border:`1px solid ${C.border}`}}><Skeleton/></div>;
  return <div style={{background:C.accentLight,borderRadius:"0 14px 14px 14px",padding:"14px 16px",fontSize:13,color:C.text,lineHeight:1.75,border:`1px solid ${C.border}`,whiteSpace:"pre-wrap"}}>{text}</div>;
}

function SyncBadge({ syncing, synced, error }) {
  if(error) return <span style={{fontSize:10,color:C.red,background:C.redLight,padding:"2px 8px",borderRadius:20,fontWeight:600}}>⚠ Sync error</span>;
  if(syncing) return <span style={{fontSize:10,color:C.orange,background:C.orangeLight,padding:"2px 8px",borderRadius:20,fontWeight:600}}>↑ Saving...</span>;
  if(synced) return <span style={{fontSize:10,color:C.green,background:C.greenLight,padding:"2px 8px",borderRadius:20,fontWeight:600}}>✓ Saved to Sheets</span>;
  return null;
}

// ── LOGO ────────────────────────────────────────────────────────────────────────
function Logo({ size=20 }) {
  return (
    <div style={{display:"flex",alignItems:"center",userSelect:"none"}}>
      <span style={{fontFamily:"'Instrument Sans','DM Sans',sans-serif",fontSize:size,fontWeight:700,color:C.text,letterSpacing:"-.5px"}}>Nextdot</span>
      <svg width={size*.4} height={size*.4} viewBox="0 0 24 24" style={{marginLeft:2,marginBottom:-size*.04}}>
        <defs><radialGradient id="lg" cx="35%" cy="35%"><stop offset="0%" stopColor="#7B96FF"/><stop offset="100%" stopColor="#3A5BFF"/></radialGradient></defs>
        <circle cx="12" cy="12" r="11" fill="url(#lg)"/>
        {[5,7,9,11,13,15,17].map((r,i)=><circle key={i} cx="12" cy="12" r={r*.5} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth=".7"/>)}
      </svg>
    </div>
  );
}

// ── LOGIN ───────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [sel,setSel]=useState(null); const [pw,setPw]=useState(""); const [err,setErr]=useState(""); const [show,setShow]=useState(false);
  function go(){if(pw===ROLES[sel].pw)onLogin(sel);else{setErr("Wrong password");setPw("");}}
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Sans:wght@600;700&family=DM+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes blink{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      <div style={{width:440,background:C.white,borderRadius:20,padding:"44px 40px",boxShadow:C.shadowMd,border:`1px solid ${C.border}`}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <Logo size={26}/>
          <div style={{fontSize:10,color:C.textDim,letterSpacing:3,marginTop:8,fontFamily:"'DM Mono',monospace",textTransform:"uppercase"}}>Sales Engine · Live</div>
          <div style={{fontSize:11,color:C.green,marginTop:6,fontWeight:600}}>● Connected to Google Sheets</div>
        </div>
        <SL>Select Role</SL>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:22}}>
          {Object.entries(ROLES).map(([k,r])=>(
            <button key={k} onClick={()=>{setSel(k);setErr("");setPw("");}} style={{padding:"13px 18px",background:sel===k?`${r.color}08`:C.white,border:`1.5px solid ${sel===k?r.color:C.border}`,borderRadius:12,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
              <div><div style={{fontSize:13,fontWeight:600,color:sel===k?r.color:C.text}}>{r.label}</div><div style={{fontSize:11,color:C.textDim,marginTop:1}}>{r.role}</div></div>
              {sel===k&&<div style={{width:8,height:8,borderRadius:"50%",background:r.color}}/>}
            </button>
          ))}
        </div>
        {sel&&<>
          <SL>Password</SL>
          <div style={{position:"relative",marginBottom:err?8:16}}>
            <input value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} type={show?"text":"password"} placeholder="Enter password" style={{width:"100%",background:C.bg,border:`1.5px solid ${err?C.red:C.border}`,borderRadius:9,padding:"11px 48px 11px 13px",color:C.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
            <button onClick={()=>setShow(o=>!o)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>{show?"Hide":"Show"}</button>
          </div>
          {err&&<div style={{fontSize:11,color:C.red,marginBottom:10}}>{err}</div>}
          <Btn label="Enter Sales Engine →" onClick={go} color={ROLES[sel].color}/>
        </>}
        <div style={{textAlign:"center",marginTop:20,fontSize:10,color:C.textFaint}}>Nextdot Digital Solutions · Internal</div>
      </div>
    </div>
  );
}

// ── INBOX ───────────────────────────────────────────────────────────────────────
function Inbox({ deals, setDeals, role, setView, setCoachDeal, activity }) {
  const [filter,setFilter]=useState("All");
  const [syncId,setSyncId]=useState(null);

  const active=deals.filter(d=>!["Closed Won","Closed Lost"].includes(d.stage));
  const sorted=[...active].sort((a,b)=>urgency(b)-urgency(a));
  const shown=filter==="All"?sorted:filter==="Mine"?sorted.filter(d=>d.owner==="Ayush"||d.owner==="Ravi K"):sorted.filter(d=>d.priority===filter.toLowerCase());

  async function moveStage(id,dir){
    const deal=deals.find(d=>d.id===id); if(!deal) return;
    const i=STAGES.indexOf(deal.stage),ni=Math.min(Math.max(i+dir,0),STAGES.length-1);
    const newStage=STAGES[ni];
    setDeals(prev=>prev.map(d=>d.id===id?{...d,stage:newStage}:d));
    setSyncId(id);
    await sheetUpdate("Deals",id,{stage:newStage,updatedAt:new Date().toISOString()});
    await logActivity(id,deal.client,"stage_move",`Stage moved to ${newStage}`,role);
    setSyncId(null);
  }

  async function markHandoff(id){
    setDeals(prev=>prev.map(d=>d.id===id?{...d,handoffDone:"true"}:d));
    await sheetUpdate("Deals",id,{handoffDone:"true",updatedAt:new Date().toISOString()});
    const deal=deals.find(d=>d.id===id);
    await logActivity(id,deal?.client||"","handoff","Marked as handed off to delivery",role);
  }

  const today=new Date().toDateString();
  const todayActivity=activity.filter(a=>new Date(a.timestamp).toDateString()===today);

  return (
    <div>
      <div style={{marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Deal Inbox</h2>
          <div style={{fontSize:12,color:C.textDim,marginTop:3}}>
            Sorted by urgency · {active.length} active · ₹{active.reduce((s,d)=>s+parseFloat(d.value||0),0)}L pipeline
            {todayActivity.length>0&&<span style={{marginLeft:8,color:C.green}}>· {todayActivity.length} activities today</span>}
          </div>
        </div>
        <Btn label="+ Capture Deal" onClick={()=>setView("capture")} icon="⊕"/>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["All","Mine","high","med","low"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 13px",background:filter===f?C.accent:C.white,border:`1px solid ${filter===f?C.accent:C.border}`,borderRadius:20,color:filter===f?"#fff":C.textMid,fontSize:11,fontWeight:filter===f?600:400,cursor:"pointer",fontFamily:"inherit"}}>{f==="high"?"🔴 High":f==="med"?"🟡 Med":f==="low"?"⚪ Low":f}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {shown.map((deal,idx)=>{
          const cfg=STAGE_CFG[deal.stage];
          const overdue=deal.nextDate&&new Date(deal.nextDate)<=new Date();
          const isSyncing=syncId===deal.id;
          return (
            <Card key={deal.id} style={{borderLeft:`4px solid ${cfg.color}`,padding:"15px 18px"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{fontSize:12,fontWeight:800,color:C.textFaint,width:20,paddingTop:2,flexShrink:0}}>#{idx+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:C.text}}>{deal.client}</div>
                      <div style={{fontSize:11,color:C.textDim,marginTop:2}}>{deal.contact} · {deal.owner} · {deal.vertical}</div>
                    </div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                      <Tag label={deal.stage} color={cfg.color}/>
                      <Tag label={`₹${deal.value}L`} color={C.text}/>
                      {deal.priority==="high"&&<Tag label="HIGH" color={C.red}/>}
                      {isSyncing&&<Tag label="Saving..." color={C.orange}/>}
                    </div>
                  </div>
                  <div style={{marginTop:9,padding:"9px 12px",background:overdue?C.redLight:C.accentLight,borderRadius:8,fontSize:12,color:overdue?C.red:C.textMid,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>→ {deal.nextAction}</span>
                    <span style={{fontSize:10,color:C.textDim,flexShrink:0,marginLeft:8}}>{deal.nextDate}</span>
                  </div>
                  <div style={{display:"flex",gap:7,marginTop:9,flexWrap:"wrap",alignItems:"center"}}>
                    <Btn label="AI Coach" onClick={()=>{setCoachDeal(deal);setView("coach");}} color={C.accent} small outline icon="✦"/>
                    <Btn label={STAGES[STAGES.indexOf(deal.stage)+1]||"Done"} onClick={()=>moveStage(deal.id,1)} color={cfg.color} small icon="→"/>
                    {parseInt(deal.lastTouch)>5&&<Tag label={`${deal.lastTouch}d no touch`} color={C.red}/>}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {shown.length===0&&<div style={{padding:"48px",textAlign:"center",color:C.textDim,fontSize:13}}>No deals match this filter.</div>}
      </div>
      {deals.filter(d=>d.stage==="Closed Won"&&!parseBool(d.handoffDone)).length>0&&(
        <div style={{marginTop:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.green,letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>🎉 Pending Handoff</div>
          {deals.filter(d=>d.stage==="Closed Won"&&!parseBool(d.handoffDone)).map(d=>(
            <Card key={d.id} style={{borderLeft:`4px solid ${C.green}`,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 18px",marginBottom:8}}>
              <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{d.client} — ₹{d.value}L</div><div style={{fontSize:11,color:C.textDim,marginTop:2}}>{d.nextAction}</div></div>
              <Btn label="Mark Handed Off" onClick={()=>markHandoff(d.id)} color={C.green} small/>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CAPTURE ──────────────────────────────────────────────────────────────────────
function Capture({ deals, setDeals, role }) {
  const [input,setInput]=useState(""); const [file,setFile]=useState(null);
  const [parsing,setParsing]=useState(false); const [parsed,setParsed]=useState(null);
  const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false);
  const fileRef=useRef();

  const SYS=`You are a sales deal parser for Nextdot Digital Solutions. Parse any rough input into a structured deal. Respond ONLY with raw JSON (no markdown, no backticks):
{"client":"","contact":"","value":0,"vertical":"Healthcare|Pharma|Tech|Auto|FMCG|Other","stage":"Lead|Qualified|Proposal Sent|Negotiation","owner":"","priority":"high|med|low","nextAction":"","nextDate":"YYYY-MM-DD","notes":""}
Value in ₹Lakhs. Estimate if not stated. nextDate: 3-5 days from today. Infer stage from context.`;

  async function parse(){
    if(!input.trim()&&!file) return;
    setParsing(true); setParsed(null); setSaved(false);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.REACT_APP_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,system:SYS,messages:[{role:"user",content:file?`[File: ${file.name}]\n${input}`:input}]})});
      const data=await res.json();
      const txt=data.content?.find(b=>b.type==="text")?.text||"{}";
      setParsed(JSON.parse(txt.replace(/```json|```/g,"").trim()));
    }catch{setParsed({error:"Parse failed. Try again."});}
    setParsing(false);
  }

  async function save(){
    if(!parsed||parsed.error) return;
    setSaving(true);
    const newDeal={
      ...parsed,
      id:`d_${Date.now()}`,
      value:parseFloat(parsed.value)||0,
      lastTouch:0,
      handoffDone:"false",
      healthScore:"",
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    };
    setDeals(prev=>[newDeal,...prev]);
    await sheetWrite("Deals",newDeal);
    await logActivity(newDeal.id,newDeal.client,"note","Deal captured via AI parser",role);
    setSaving(false); setSaved(true);
    setInput(""); setFile(null); setParsed(null);
    setTimeout(()=>setSaved(false),3000);
  }

  return (
    <div style={{maxWidth:680}}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Capture a Deal</h2>
        <div style={{fontSize:12,color:C.textDim,marginTop:3}}>Paste a rough note, voice transcript, email snippet — AI structures it and saves directly to Google Sheets.</div>
      </div>
      <Card style={{marginBottom:14}}>
        <SL>Your Input</SL>
        <FInput value={input} onChange={setInput} placeholder={"E.g. \"Met Sachin from Health Lync. Wants AI for wellness app. Budget ₹10–15L. Follow up Monday with demo.\"\n\nOr paste an email, WhatsApp message, meeting note..."} rows={6}/>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:12}}>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" style={{display:"none"}} onChange={e=>setFile(e.target.files[0])}/>
          <button onClick={()=>fileRef.current.click()} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 13px",color:C.textMid,fontSize:11,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>📎 {file?file.name:"Attach file / screenshot"}</button>
          {file&&<button onClick={()=>setFile(null)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:12}}>✕ Remove</button>}
        </div>
        <div style={{marginTop:14,display:"flex",gap:8,alignItems:"center"}}>
          <Btn label={parsing?"Parsing...":"Parse with AI"} onClick={parse} disabled={parsing||(!input.trim()&&!file)} icon="✦"/>
          {saved&&<span style={{fontSize:12,color:C.green,fontWeight:600}}>✓ Saved to Google Sheets</span>}
        </div>
      </Card>
      {parsing&&<Card><Skeleton/></Card>}
      {parsed&&!parsed.error&&(
        <Card style={{borderLeft:`4px solid ${C.green}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <SL color={C.green}>Parsed Deal — Review & Save</SL>
            <Tag label="AI Parsed" color={C.green}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
            {[["Client",parsed.client],["Contact",parsed.contact||"—"],["Value",`₹${parsed.value}L`],["Vertical",parsed.vertical],["Stage",parsed.stage],["Owner",parsed.owner||"—"],["Priority",parsed.priority],["Next Date",parsed.nextDate]].map(([l,v])=>(
              <div key={l} style={{background:C.bg,borderRadius:8,padding:"9px 12px"}}>
                <div style={{fontSize:9,color:C.textDim,fontWeight:700,letterSpacing:1,marginBottom:3}}>{l.toUpperCase()}</div>
                <div style={{fontSize:13,color:C.text,fontWeight:500}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{background:C.bg,borderRadius:8,padding:"9px 12px",marginBottom:9}}><div style={{fontSize:9,color:C.textDim,fontWeight:700,letterSpacing:1,marginBottom:3}}>NEXT ACTION</div><div style={{fontSize:13,color:C.text}}>{parsed.nextAction}</div></div>
          <div style={{background:C.bg,borderRadius:8,padding:"9px 12px",marginBottom:14}}><div style={{fontSize:9,color:C.textDim,fontWeight:700,letterSpacing:1,marginBottom:3}}>NOTES</div><div style={{fontSize:13,color:C.text}}>{parsed.notes}</div></div>
          <Btn label={saving?"Saving to Sheets...":"✓ Save to Google Sheets"} onClick={save} color={C.green} disabled={saving}/>
        </Card>
      )}
      {parsed?.error&&<Card><div style={{color:C.red,fontSize:13}}>{parsed.error}</div></Card>}
    </div>
  );
}

// ── AI COACH ──────────────────────────────────────────────────────────────────
function Coach({ deals, initDeal, role, activity }) {
  const [sel,setSel]=useState(initDeal?.id||deals[0]?.id||null);
  const [mode,setMode]=useState(""); const [resp,setResp]=useState("");
  const [loading,setLoading]=useState(false); const [q,setQ]=useState(""); const [msgs,setMsgs]=useState([]);
  const [saving,setSaving]=useState(false);
  const bottomRef=useRef();
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const deal=deals.find(d=>d.id===sel);
  const dealActivity=activity.filter(a=>a.dealId===sel).slice(-5);

  const SYS=`You are a world-class B2B sales coach for Nextdot Digital Solutions — AI engineering company, India. Products: NextComply AI (healthcare compliance). Clients: Healthcare, Pharma, FMCG, Auto, Tech enterprises. CEO: Ayush Prashar. Be sharp, specific, direct. No generic advice.`;

  const MODES=[
    {key:"prep",  label:"Call Prep",     p:`Sharp 5-min call prep for ${deal?.client}. 3 smart questions, 1 likely objection + rebuttal. Specific to Nextdot's AI solutions.`},
    {key:"email", label:"Follow-Up",     p:`Sharp follow-up email to ${deal?.contact} at ${deal?.client}. Stage: ${deal?.stage}. Context: ${deal?.notes}. Include subject line. Max 120 words.`},
    {key:"nudge", label:"Ghost Recovery",p:`Re-engagement for ${deal?.contact} at ${deal?.client} — ${deal?.lastTouch} days silent. Sharp, creates curiosity. Max 60 words.`},
    {key:"obj",   label:"Objections",    p:`Top 3 objections from ${deal?.client} (${deal?.vertical}, ₹${deal?.value}L at ${deal?.stage}). Sharp Nextdot-specific responses.`},
    {key:"close", label:"Close Plan",    p:`Best 3-step closing plan for ${deal?.client} (₹${deal?.value}L, ${deal?.stage}). Next 7 days to Closed Won.`},
  ];

  async function ask(prompt){
    if(!deal) return; setLoading(true); setResp(""); setMsgs([]);
    const ctx=`Deal: ${deal.client} | Contact: ${deal.contact} | ₹${deal.value}L | Stage: ${deal.stage} | Vertical: ${deal.vertical} | Last touch: ${deal.lastTouch}d | Notes: ${deal.notes}${dealActivity.length?`\n\nRecent activity:\n${dealActivity.map(a=>`- ${a.type}: ${a.note} (${a.timestamp})`).join("\n")}` : ""}`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.REACT_APP_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:SYS,messages:[{role:"user",content:`${ctx}\n\n${prompt}`}]})});
      const data=await res.json();
      setResp(data.content?.find(b=>b.type==="text")?.text||"Error.");
    }catch{setResp("Error.");}
    setLoading(false);
  }

  async function chat(){
    if(!q.trim()||!deal) return;
    const msg=q.trim(); setQ(""); setLoading(true); setResp("");
    setMsgs(p=>[...p,{role:"user",text:msg}]);
    const ctx=`Deal: ${deal.client} | ₹${deal.value}L | ${deal.stage} | ${deal.vertical} | ${deal.notes}`;
    const history=[...msgs,{role:"user",text:msg}].map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.REACT_APP_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:700,system:`${SYS}\n\nDeal context: ${ctx}`,messages:history})});
      const data=await res.json();
      setMsgs(p=>[...p,{role:"assistant",text:data.content?.find(b=>b.type==="text")?.text||"Error."}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",text:"Error."}]);}
    setLoading(false);
  }

  async function logNote(){
    if(!resp||!deal) return;
    setSaving(true);
    await logActivity(deal.id,deal.client,"note",`AI Coach used: ${mode}`,role);
    setSaving(false);
  }

  return (
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:14,height:"calc(100vh - 110px)",maxHeight:800}}>
      <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:7}}>
        <SL>Select Deal</SL>
        {deals.filter(d=>d.stage!=="Closed Lost").map(d=>{
          const cfg=STAGE_CFG[d.stage];
          const acts=activity.filter(a=>a.dealId===d.id).length;
          return (
            <button key={d.id} onClick={()=>{setSel(d.id);setResp("");setMsgs([]);setMode("");}} style={{padding:"10px 12px",background:sel===d.id?C.accentLight:C.white,border:`1.5px solid ${sel===d.id?C.accent:C.border}`,borderRadius:10,textAlign:"left",cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}>
              <div style={{fontSize:12,fontWeight:600,color:sel===d.id?C.accent:C.text}}>{d.client}</div>
              <div style={{display:"flex",gap:5,marginTop:4,alignItems:"center"}}>
                <Tag label={d.stage} color={cfg.color} size={9}/>
                <span style={{fontSize:10,color:C.textDim}}>₹{d.value}L</span>
                {acts>0&&<span style={{fontSize:9,color:C.green}}>· {acts} logs</span>}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,overflow:"hidden"}}>
        {deal&&<>
          <Card style={{padding:"12px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.text}}>{deal.client}</div>
                <div style={{fontSize:11,color:C.textDim,marginTop:2}}>₹{deal.value}L · {deal.stage} · {deal.lastTouch}d since touch · {deal.contact}</div>
                {dealActivity.length>0&&<div style={{fontSize:10,color:C.green,marginTop:3}}>{dealActivity.length} recent activities logged</div>}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Tag label={deal.priority.toUpperCase()} color={deal.priority==="high"?C.red:deal.priority==="med"?C.orange:C.textDim}/>
                {resp&&<Btn label={saving?"Logging...":"Log to Sheets"} onClick={logNote} color={C.green} small icon="↑" disabled={saving}/>}
              </div>
            </div>
          </Card>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {MODES.map(m=>(
              <button key={m.key} onClick={()=>{setMode(m.key);ask(m.p);}} style={{padding:"6px 13px",background:mode===m.key?C.accent:C.white,border:`1px solid ${mode===m.key?C.accent:C.border}`,borderRadius:20,color:mode===m.key?"#fff":C.textMid,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{m.label}</button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10}}>
            {resp&&<AIBox text={resp} loading={loading}/>}
            {!resp&&loading&&<AIBox text="" loading={true}/>}
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"86%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"0 14px 14px 14px",background:m.role==="user"?C.accent:C.accentLight,color:m.role==="user"?"#fff":C.text,fontSize:13,lineHeight:1.65,border:m.role==="assistant"?`1px solid ${C.border}`:"none"}}>{m.text}</div>
              </div>
            ))}
            {loading&&msgs.length>0&&<div style={{display:"flex",gap:4,paddingLeft:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.accent,animation:`blink 1.2s ${i*.2}s infinite`}}/>)}</div>}
            <div ref={bottomRef}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(setMode(""),chat())} placeholder="Ask anything about this deal..." style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px",color:C.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
            <Btn label="→" onClick={()=>{setMode("");chat();}} disabled={!q.trim()||loading}/>
          </div>
        </>}
      </div>
    </div>
  );
}

// ── PROPOSAL ─────────────────────────────────────────────────────────────────
function Proposal({ deals }) {
  const [sel,setSel]=useState(deals[0]?.id||null); const [extra,setExtra]=useState("");
  const [loading,setLoading]=useState(false); const [outline,setOutline]=useState(""); const [copied,setCopied]=useState(false);
  const deal=deals.find(d=>d.id===sel)||deals[0];
  const SYS=`You are a proposal strategist for Nextdot Digital Solutions. Build a structured Canva/Google Slides outline. Format: SLIDE N: [Title] | Headline: [line] | Body: [3 bullets] | Visual: [Canva note]. 10-12 slides. Premium enterprise feel. Specific to Nextdot AI solutions.`;

  async function build(){
    if(!deal) return; setLoading(true); setOutline("");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.REACT_APP_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system:SYS,messages:[{role:"user",content:`Client: ${deal.client} | Vertical: ${deal.vertical} | ₹${deal.value}L | Stage: ${deal.stage} | Context: ${deal.notes} | Extra: ${extra||"None"}`}]})});
      const data=await res.json();
      setOutline(data.content?.find(b=>b.type==="text")?.text||"Error.");
    }catch{setOutline("Error.");}
    setLoading(false);
  }

  function copy(){navigator.clipboard.writeText(outline);setCopied(true);setTimeout(()=>setCopied(false),2500);}

  return (
    <div style={{maxWidth:760}}>
      <div style={{marginBottom:18}}><h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Proposal Builder</h2><div style={{fontSize:12,color:C.textDim,marginTop:3}}>Generates a structured slide outline — copy directly into Canva or Google Slides.</div></div>
      <Card style={{marginBottom:14}}>
        <SL>Select Deal</SL>
        <select value={sel||""} onChange={e=>setSel(e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 13px",color:C.text,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:12}}>
          {deals.map(d=><option key={d.id} value={d.id}>{d.client} — ₹{d.value}L ({d.stage})</option>)}
        </select>
        {deal&&<div style={{background:C.accentLight,borderRadius:9,padding:"10px 13px",marginBottom:12,fontSize:12,color:C.textMid}}><strong>{deal.contact}</strong> · {deal.vertical} · {deal.notes}</div>}
        <SL>Additional Requirements</SL>
        <FInput value={extra} onChange={setExtra} placeholder="E.g. Emphasise 90-day ROI, include NextComply screenshots, lead with Narayana Health case study" rows={2}/>
        <div style={{marginTop:12}}><Btn label={loading?"Building...":"Build Proposal Outline"} onClick={build} disabled={loading||!deal} icon="▤"/></div>
      </Card>
      {(loading||outline)&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <SL color={C.accent}>Deck Outline — {deal?.client}</SL>
            {outline&&!loading&&<Btn label={copied?"✓ Copied!":"Copy All"} onClick={copy} outline color={C.accent} small/>}
          </div>
          {loading?<Skeleton/>:<pre style={{fontSize:12,color:C.text,lineHeight:1.85,whiteSpace:"pre-wrap",fontFamily:"'DM Mono',monospace"}}>{outline}</pre>}
        </Card>
      )}
    </div>
  );
}

// ── DECK LIBRARY ──────────────────────────────────────────────────────────────
function DeckLibrary({ deals, decks, setDecks }) {
  const [tagFilter,setTagFilter]=useState("All");
  const [showAdd,setShowAdd]=useState(false);
  const [nd,setNd]=useState({title:"",link:"",notes:"",tags:[]});
  const [selDeal,setSelDeal]=useState(deals[0]?.id||null);
  const [reco,setReco]=useState(""); const [recLoading,setRecLoading]=useState(false);
  const [copied,setCopied]=useState(false); const [saving,setSaving]=useState(false);

  const deal=deals.find(d=>d.id===selDeal)||deals[0];
  const shown=tagFilter==="All"?decks:decks.filter(d=>(d.tags||"").split(",").map(t=>t.trim()).includes(tagFilter));

  function toggleTag(t){setNd(p=>({...p,tags:p.tags.includes(t)?p.tags.filter(x=>x!==t):[...p.tags,t]}));}

  async function addDeck(){
    if(!nd.title||!nd.link) return;
    setSaving(true);
    const newDeck={...nd,id:`dk_${Date.now()}`,tags:nd.tags.join(","),lastUpdated:"Apr 2026"};
    setDecks(p=>[...p,newDeck]);
    await sheetWrite("Decks",newDeck);
    setNd({title:"",link:"",notes:"",tags:[]}); setShowAdd(false); setSaving(false);
  }

  async function deleteDeck(id){
    setDecks(p=>p.filter(d=>d.id!==id));
    await sheetDelete("Decks",id);
  }

  const SYS=`You are a presentation strategist for Nextdot Digital Solutions. Given a deal and deck library, output:\n## USE THESE DECKS\nFor each: which deck, specific slides, why.\n## FRESH SLIDES NEEDED\nFor each gap (2-4): Slide Title | Headline | Body (3 bullets) | Visual Direction | Data to include. Zero guesswork needed.`;

  async function recommend(){
    if(!deal) return; setRecLoading(true); setReco("");
    const lib=decks.map(d=>`"${d.title}" [${d.tags}] — ${d.notes}`).join("\n");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.REACT_APP_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1100,system:SYS,messages:[{role:"user",content:`Deal: ${deal.client} | ${deal.vertical} | ₹${deal.value}L | ${deal.notes}\n\nDecks:\n${lib}`}]})});
      const data=await res.json();
      setReco(data.content?.find(b=>b.type==="text")?.text||"Error.");
    }catch{setReco("Error.");}
    setRecLoading(false);
  }

  return (
    <div>
      <div style={{marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Deck Library</h2><div style={{fontSize:12,color:C.textDim,marginTop:3}}>{decks.length} decks indexed · Saved to Google Sheets</div></div>
        <Btn label="+ Register Deck" onClick={()=>setShowAdd(o=>!o)} icon="⊕"/>
      </div>
      {showAdd&&(
        <Card style={{marginBottom:14,borderLeft:`4px solid ${C.accent}`}}>
          <SL color={C.accent}>Register Deck</SL>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><SL>Title</SL><FInput value={nd.title} onChange={v=>setNd(p=>({...p,title:v}))} placeholder="Deck name"/></div>
            <div><SL>Canva Link</SL><FInput value={nd.link} onChange={v=>setNd(p=>({...p,link:v}))} placeholder="https://canva.com/..."/></div>
          </div>
          <div style={{marginBottom:10}}><SL>When to use</SL><FInput value={nd.notes} onChange={v=>setNd(p=>({...p,notes:v}))} placeholder="E.g. Best for pharma pitches in negotiation stage" rows={2}/></div>
          <SL>Tags</SL>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:14}}>
            {DECK_TAGS.map(t=><button key={t} onClick={()=>toggleTag(t)} style={{padding:"3px 10px",background:nd.tags.includes(t)?C.accent:C.bg,border:`1px solid ${nd.tags.includes(t)?C.accent:C.border}`,borderRadius:20,color:nd.tags.includes(t)?"#fff":C.textMid,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{t}</button>)}
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn label={saving?"Saving...":"Save to Sheets"} onClick={addDeck} color={C.green} disabled={saving}/>
            <Btn label="Cancel" onClick={()=>setShowAdd(false)} outline color={C.textDim}/>
          </div>
        </Card>
      )}
      <Card style={{marginBottom:14,borderTop:`3px solid ${C.accent}`}}>
        <div style={{marginBottom:12}}><SL color={C.accent}>AI Deck Recommender + Fresh Slide Briefs</SL><div style={{fontSize:12,color:C.textDim}}>Select a deal — AI picks existing decks and writes Canva briefs for missing slides.</div></div>
        <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
          <select value={selDeal||""} onChange={e=>setSelDeal(e.target.value)} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 13px",color:C.text,fontSize:13,fontFamily:"inherit",outline:"none",minWidth:200}}>
            {deals.map(d=><option key={d.id} value={d.id}>{d.client} — ₹{d.value}L ({d.stage})</option>)}
          </select>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Btn label={recLoading?"Analysing...":"Recommend + Write Briefs"} onClick={recommend} disabled={recLoading||!deal} icon="✦"/>
            {reco&&<Btn label={copied?"✓ Copied":"Copy"} onClick={()=>{navigator.clipboard.writeText(reco);setCopied(true);setTimeout(()=>setCopied(false),2500);}} outline color={C.accent} small/>}
          </div>
        </div>
        {recLoading&&<Skeleton/>}
        {reco&&!recLoading&&<pre style={{fontSize:12,color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'DM Mono',monospace",background:C.bg,borderRadius:10,padding:"14px 16px",maxHeight:400,overflowY:"auto"}}>{reco}</pre>}
      </Card>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
        {["All",...DECK_TAGS].map(t=><button key={t} onClick={()=>setTagFilter(t)} style={{padding:"3px 11px",background:tagFilter===t?C.text:C.white,border:`1px solid ${tagFilter===t?C.text:C.border}`,borderRadius:20,color:tagFilter===t?"#fff":C.textMid,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{t}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:10}}>
        {shown.map(d=>(
          <Card key={d.id} style={{position:"relative"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
              <div style={{fontSize:13,fontWeight:700,color:C.text,lineHeight:1.3,flex:1}}>{d.title}</div>
              <button onClick={()=>deleteDeck(d.id)} style={{background:"none",border:"none",color:C.textFaint,cursor:"pointer",fontSize:13,marginLeft:8,flexShrink:0}}>✕</button>
            </div>
            <div style={{fontSize:11,color:C.textDim,marginBottom:9,lineHeight:1.4}}>{d.notes}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:9}}>
              {(d.tags||"").split(",").map(t=>t.trim()).filter(Boolean).map(t=><Tag key={t} label={t} color={C.accent} size={9}/>)}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:10,color:C.textFaint}}>Updated {d.lastUpdated}</span>
              <a href={d.link} target="_blank" rel="noreferrer" style={{fontSize:11,fontWeight:600,color:C.accent,textDecoration:"none",padding:"4px 10px",border:`1px solid ${C.accentLight}`,borderRadius:7,background:C.accentLight}}>Open in Canva ↗</a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── FORECAST ──────────────────────────────────────────────────────────────────
function Forecast({ deals, winLoss }) {
  const [loading,setLoading]=useState(false); const [analysis,setAnalysis]=useState("");
  const inPlay=deals.filter(d=>["Qualified","Proposal Sent","Negotiation"].includes(d.stage));
  const won=deals.filter(d=>d.stage==="Closed Won");
  const wMap={"Qualified":.25,"Proposal Sent":.45,"Negotiation":.72,"Closed Won":1};
  const weighted=inPlay.reduce((s,d)=>s+parseFloat(d.value||0)*(wMap[d.stage]||0),0);

  // Intelligence from WinLoss log
  const winLossContext = winLoss.length>0
    ? `\n\nHISTORICAL WIN/LOSS DATA (${winLoss.length} records):\n${winLoss.slice(-20).map(w=>`${w.result}: ${w.client} (₹${w.value}L, ${w.vertical}, ${w.daysInPipeline}d in pipeline, reason: ${w.reason})`).join("\n")}`
    : "";

  const SYS=`You are a revenue forecasting analyst for Nextdot Digital Solutions. Analyse pipeline and give: 1) Most Likely revenue this month, 2) Best Case, 3) Conservative, 4) Top 3 deals to focus on NOW, 5) Risk flag. Use exact numbers. ${winLoss.length>0?"Use the historical win/loss patterns to make your forecast more accurate.":""}`;

  async function analyse(){
    setLoading(true); setAnalysis("");
    const pipeline=inPlay.map(d=>`${d.client}: ₹${d.value}L at ${d.stage}, ${d.priority} priority, ${d.lastTouch}d since touch`).join("\n");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.REACT_APP_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:700,system:SYS,messages:[{role:"user",content:`Pipeline:\n${pipeline}\n\nClosed Won: ₹${won.reduce((s,d)=>s+parseFloat(d.value||0),0)}L${winLossContext}`}]})});
      const data=await res.json();
      setAnalysis(data.content?.find(b=>b.type==="text")?.text||"Error.");
    }catch{setAnalysis("Error.");}
    setLoading(false);
  }

  return (
    <div style={{maxWidth:720}}>
      <div style={{marginBottom:18}}><h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Revenue Forecast</h2><div style={{fontSize:12,color:C.textDim,marginTop:3}}>Weighted pipeline · {winLoss.length>0?<span style={{color:C.green}}>✓ Using {winLoss.length} historical records for accuracy</span>:"Building intelligence from closed deals over time"}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
        {[{l:"Weighted Forecast",v:`₹${weighted.toFixed(1)}L`,s:"Probability-adjusted",c:C.accent},{l:"Best Case",v:`₹${(weighted*1.4).toFixed(1)}L`,s:"If top deals close",c:C.green},{l:"Already Won",v:`₹${won.reduce((s,d)=>s+parseFloat(d.value||0),0)}L`,s:"Closed this period",c:C.teal}].map((x,i)=>(
          <Card key={i}><div style={{fontSize:10,color:C.textDim,fontWeight:600,letterSpacing:1.2,marginBottom:6,textTransform:"uppercase"}}>{x.l}</div><div style={{fontSize:26,fontWeight:800,color:x.c,letterSpacing:-1}}>{x.v}</div><div style={{fontSize:11,color:C.textDim,marginTop:4}}>{x.s}</div></Card>
        ))}
      </div>
      <Card style={{marginBottom:14}}>
        <SL>Pipeline by Stage</SL>
        {STAGES.filter(s=>s!=="Closed Lost").map(stage=>{
          const cfg=STAGE_CFG[stage]; const d=deals.filter(x=>x.stage===stage); const total=d.reduce((s,x)=>s+parseFloat(x.value||0),0);
          const allVal=deals.filter(x=>x.stage!=="Closed Lost").reduce((s,x)=>s+parseFloat(x.value||0),0);
          return (
            <div key={stage} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:110,fontSize:11,color:C.textMid}}>{stage}</div>
              <div style={{flex:1,height:7,background:C.border,borderRadius:4}}><div style={{width:allVal?`${(total/allVal*100)}%`:"0%",height:"100%",background:cfg.color,borderRadius:4,transition:"width .8s"}}/></div>
              <div style={{width:55,fontSize:12,fontWeight:700,color:cfg.color,textAlign:"right"}}>₹{total}L</div>
              <div style={{width:18,fontSize:10,color:C.textDim}}>{d.length}</div>
            </div>
          );
        })}
      </Card>
      <div style={{marginBottom:12}}><Btn label={loading?"Analysing...":"AI Forecast Analysis"} onClick={analyse} disabled={loading} icon="▲"/></div>
      {loading&&<Card><Skeleton/></Card>}
      {analysis&&!loading&&<Card><pre style={{fontSize:13,color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif"}}>{analysis}</pre></Card>}
    </div>
  );
}

// ── WEEKLY BRIEF ──────────────────────────────────────────────────────────────
function Weekly({ deals, activity, winLoss }) {
  const [brief,setBrief]=useState(""); const [loading,setLoading]=useState(false); const [copied,setCopied]=useState(false);
  const recentActivity=activity.slice(-30);
  const SYS=`You are Ayush Prashar's chief of staff at Nextdot Digital Solutions. Generate a Monday Weekly Sales Brief.\n🏆 CLOSED LAST WEEK\n📌 DUE THIS WEEK (top 5 actions, specific)\n⚡ PIPELINE HEALTH\n🎯 THIS WEEK'S FOCUS (1 recommendation)\n⚠️ RISK FLAG\nSharp. Read in 90 seconds.`;

  async function generate(){
    setLoading(true); setBrief("");
    const summary=deals.map(d=>`${d.client}: ₹${d.value}L, ${d.stage}, ${d.lastTouch}d since touch, next: ${d.nextAction}`).join("\n");
    const actSummary=recentActivity.length>0?`\n\nRecent Activity:\n${recentActivity.map(a=>`${a.client}: ${a.type} — ${a.note}`).join("\n")}`:"";
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.REACT_APP_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:SYS,messages:[{role:"user",content:`Pipeline:\n${summary}${actSummary}`}]})});
      const data=await res.json();
      setBrief(data.content?.find(b=>b.type==="text")?.text||"Error.");
    }catch{setBrief("Error.");}
    setLoading(false);
  }

  return (
    <div style={{maxWidth:680}}>
      <div style={{marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Weekly Brief</h2><div style={{fontSize:12,color:C.textDim,marginTop:3}}>Auto-generated from live pipeline + {activity.length} activity logs</div></div>
        {brief&&<Btn label={copied?"✓ Copied":"Copy"} onClick={()=>{navigator.clipboard.writeText(brief);setCopied(true);setTimeout(()=>setCopied(false),2500);}} outline color={C.accent} small/>}
      </div>
      <div style={{marginBottom:12}}><Btn label={loading?"Generating...":"Generate This Week's Brief"} onClick={generate} disabled={loading} icon="◎"/></div>
      {loading&&<Card><Skeleton/></Card>}
      {brief&&!loading&&<Card><pre style={{fontSize:13,color:C.text,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif"}}>{brief}</pre></Card>}
    </div>
  );
}

// ── DELIVERY HUB ──────────────────────────────────────────────────────────────
function Delivery({ deals, setDeals, winLoss, setWinLoss, role }) {
  const [selId,setSelId]=useState(null); const [brief,setBrief]=useState(""); const [loading,setLoading]=useState(false);
  const [tab,setTab]=useState("handoff"); const [copied,setCopied]=useState(false);
  const [debriefDeal,setDebriefDeal]=useState(null); const [debrief,setDebrief]=useState({result:"won",reason:"",notes:""}); const [saving,setSaving]=useState(false);

  const wonDeals=deals.filter(d=>d.stage==="Closed Won");
  const deal=wonDeals.find(d=>d.id===selId)||wonDeals[0];
  const hCfg={green:{color:C.green,label:"On Track"},orange:{color:C.orange,label:"At Risk"},red:{color:C.red,label:"Needs Attention"}};

  const SYS=`You are the delivery assistant at Nextdot Digital Solutions. Generate a complete Deal Handoff Brief for the Business Head:\n📋 DEAL SUMMARY\n🎯 SCOPE (what exactly will be delivered)\n📅 TIMELINE (milestones)\n⚡ KICKOFF CHECKLIST (10 items)\n👥 TEAM TO ASSIGN\n🚨 DELIVERY RISKS\n💡 FIRST 7 DAYS PLAN\nSpecific to Nextdot's AI Engineering + AI Creative teams, Jamshedpur capability center.`;

  async function genBrief(){
    if(!deal) return; setLoading(true); setBrief("");
    const type=["Healthcare","Pharma"].includes(deal.vertical)?"NextComply AI Product":"AI Services Engagement";
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.REACT_APP_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYS,messages:[{role:"user",content:`Client: ${deal.client} | Contact: ${deal.contact} | ₹${deal.value}L | Vertical: ${deal.vertical} | Type: ${type} | Notes: ${deal.notes} | Closed by: ${deal.owner}`}]})});
      const data=await res.json();
      setBrief(data.content?.find(b=>b.type==="text")?.text||"Error.");
    }catch{setBrief("Error.");}
    setLoading(false);
  }

  async function setHealth(id,h){
    setDeals(p=>p.map(d=>d.id===id?{...d,healthScore:h}:d));
    await sheetUpdate("Deals",id,{healthScore:h,updatedAt:new Date().toISOString()});
  }

  async function saveDebrief(){
    if(!debriefDeal||!debrief.reason) return;
    setSaving(true);
    const d=deals.find(x=>x.id===debriefDeal);
    const entry={
      id:`wl_${Date.now()}`,
      client:d?.client||"",
      value:d?.value||0,
      vertical:d?.vertical||"",
      result:debrief.result,
      reason:debrief.reason,
      daysInPipeline:parseInt(d?.lastTouch||0),
      stage:d?.stage||"",
      owner:d?.owner||"",
      closedAt:new Date().toISOString(),
    };
    setWinLoss(p=>[...p,entry]);
    await sheetWrite("WinLoss",entry);
    await logActivity(debriefDeal,d?.client||"","note",`Win/Loss debrief: ${debrief.result} — ${debrief.reason}`,role);
    setDebriefDeal(null); setDebrief({result:"won",reason:"",notes:""});
    setSaving(false);
  }

  return (
    <div>
      <div style={{marginBottom:18}}><h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Delivery Hub</h2><div style={{fontSize:12,color:C.textDim,marginTop:3}}>Won deals, kickoff briefs, client health · {winLoss.length} win/loss records logged</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
        {["green","orange","red"].map(h=>{const cfg=hCfg[h];const count=wonDeals.filter(d=>d.healthScore===h).length;return(
          <Card key={h} style={{borderTop:`3px solid ${cfg.color}`,textAlign:"center",padding:"14px"}}>
            <div style={{fontSize:28,fontWeight:800,color:cfg.color}}>{count}</div>
            <div style={{fontSize:11,color:C.textDim,marginTop:3}}>{cfg.label}</div>
          </Card>
        );})}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[{k:"handoff",l:"Handoff Briefs"},{k:"health",l:"Client Health"},{k:"debrief",l:"Win/Loss Log"},{k:"renewals",l:"Renewals"}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"7px 16px",background:tab===t.k?C.purple:C.white,border:`1px solid ${tab===t.k?C.purple:C.border}`,borderRadius:20,color:tab===t.k?"#fff":C.textMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{t.l}</button>
        ))}
      </div>

      {tab==="handoff"&&(
        <div style={{display:"grid",gridTemplateColumns:"210px 1fr",gap:14}}>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            <SL>Won Deals</SL>
            {wonDeals.length===0&&<div style={{fontSize:12,color:C.textDim,padding:10}}>No closed deals yet.</div>}
            {wonDeals.map(d=>(
              <button key={d.id} onClick={()=>{setSelId(d.id);setBrief("");}} style={{padding:"10px 12px",background:selId===d.id||(selId===null&&d===deal)?C.purpleLight:C.white,border:`1.5px solid ${selId===d.id||(selId===null&&d===deal)?C.purple:C.border}`,borderRadius:10,textAlign:"left",cursor:"pointer",fontFamily:"inherit"}}>
                <div style={{fontSize:12,fontWeight:700,color:C.text}}>{d.client}</div>
                <div style={{fontSize:10,color:C.textDim,marginTop:2}}>₹{d.value}L · {d.owner}</div>
                <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
                  {parseBool(d.handoffDone)?<Tag label="Handed Off" color={C.green} size={9}/>:<Tag label="Pending" color={C.orange} size={9}/>}
                  {d.healthScore&&hCfg[d.healthScore]&&<Tag label={hCfg[d.healthScore].label} color={hCfg[d.healthScore].color} size={9}/>}
                </div>
              </button>
            ))}
          </div>
          <div>
            {deal?<>
              <Card style={{marginBottom:10,borderLeft:`4px solid ${C.purple}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                  <div><div style={{fontSize:14,fontWeight:700,color:C.text}}>{deal.client}</div><div style={{fontSize:11,color:C.textDim,marginTop:2}}>₹{deal.value}L · {deal.contact} · Closed by {deal.owner}</div></div>
                  <div style={{display:"flex",gap:8}}>
                    {!parseBool(deal.handoffDone)&&<Btn label="Mark Handed Off" onClick={async()=>{setDeals(p=>p.map(x=>x.id===deal.id?{...x,handoffDone:"true"}:x));await sheetUpdate("Deals",deal.id,{handoffDone:"true",updatedAt:new Date().toISOString()});}} color={C.green} small/>}
                    <Btn label={loading?"Generating...":"Generate Handoff Brief"} onClick={genBrief} disabled={loading} color={C.purple} small icon="⟁"/>
                    {brief&&<Btn label={copied?"✓":"Copy"} onClick={()=>{navigator.clipboard.writeText(brief);setCopied(true);setTimeout(()=>setCopied(false),2000);}} outline color={C.purple} small/>}
                  </div>
                </div>
              </Card>
              {loading&&<Card><Skeleton/></Card>}
              {brief&&!loading&&<Card><pre style={{fontSize:12,color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif",maxHeight:460,overflowY:"auto"}}>{brief}</pre></Card>}
            </>:<div style={{padding:40,textAlign:"center",color:C.textDim,fontSize:13}}>Select a won deal to generate a handoff brief.</div>}
          </div>
        </div>
      )}

      {tab==="health"&&(
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {wonDeals.map(d=>(
            <Card key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{d.client}</div><div style={{fontSize:11,color:C.textDim,marginTop:2}}>₹{d.value}L · {d.vertical} · {d.contact}</div><div style={{fontSize:12,color:C.textMid,marginTop:4}}>→ {d.nextAction}</div></div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:11,color:C.textDim}}>Health:</span>
                {["green","orange","red"].map(h=>(
                  <button key={h} onClick={()=>setHealth(d.id,h)} style={{padding:"5px 12px",background:d.healthScore===h?hCfg[h].color:C.white,border:`1.5px solid ${hCfg[h].color}`,borderRadius:20,color:d.healthScore===h?"#fff":hCfg[h].color,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{hCfg[h].label}</button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab==="debrief"&&(
        <div>
          <div style={{fontSize:12,color:C.textDim,marginBottom:14}}>Log win/loss reasons — this data makes the AI Forecast and Coach smarter over time. <strong style={{color:C.green}}>{winLoss.length} records logged so far.</strong></div>
          <Card style={{marginBottom:14}}>
            <SL>Log New Win/Loss</SL>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <SL>Deal</SL>
                <select value={debriefDeal||""} onChange={e=>setDebriefDeal(e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 13px",color:C.text,fontSize:12,fontFamily:"inherit",outline:"none"}}>
                  <option value="">Select deal...</option>
                  {deals.map(d=><option key={d.id} value={d.id}>{d.client} (₹{d.value}L)</option>)}
                </select>
              </div>
              <div>
                <SL>Result</SL>
                <select value={debrief.result} onChange={e=>setDebrief(p=>({...p,result:e.target.value}))} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 13px",color:C.text,fontSize:12,fontFamily:"inherit",outline:"none"}}>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="dormant">Dormant/Stalled</option>
                </select>
              </div>
            </div>
            <SL>Primary Reason</SL>
            <FInput value={debrief.reason} onChange={v=>setDebrief(p=>({...p,reason:v}))} placeholder="E.g. Budget constraints, competitor chosen, timing not right, strong product fit..." rows={2}/>
            <div style={{marginTop:10}}><Btn label={saving?"Saving...":"Save to Win/Loss Log"} onClick={saveDebrief} color={C.green} disabled={saving||!debriefDeal||!debrief.reason}/></div>
          </Card>
          {winLoss.length>0&&(
            <div>
              <SL>Recent Win/Loss Records</SL>
              {winLoss.slice(-10).reverse().map((w,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:C.white,border:`1px solid ${C.border}`,borderRadius:10,marginBottom:7}}>
                  <div><div style={{fontSize:12,fontWeight:600,color:C.text}}>{w.client}</div><div style={{fontSize:11,color:C.textDim,marginTop:2}}>{w.reason}</div></div>
                  <div style={{textAlign:"right"}}>
                    <Tag label={w.result.toUpperCase()} color={w.result==="won"?C.green:w.result==="lost"?C.red:C.orange}/>
                    <div style={{fontSize:10,color:C.textDim,marginTop:4}}>₹{w.value}L · {w.vertical}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==="renewals"&&(
        <div>
          <div style={{fontSize:12,color:C.textDim,marginBottom:14}}>Clients approaching renewal or showing upsell signals.</div>
          {wonDeals.filter(d=>d.healthScore==="green").map(d=>(
            <Card key={d.id} style={{marginBottom:9,borderLeft:`4px solid ${C.teal}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{d.client}</div><div style={{fontSize:11,color:C.textDim,marginTop:2}}>₹{d.value}L · {d.vertical} · On Track</div></div>
                <div style={{display:"flex",gap:6}}><Tag label="Renewal Check" color={C.teal}/><Tag label="Upsell Signal" color={C.accent}/></div>
              </div>
              <div style={{marginTop:8,fontSize:12,color:C.textMid}}>💡 Initiate renewal conversation 60 days before contract end. Explore expansion into adjacent AI solutions.</div>
            </Card>
          ))}
          {wonDeals.filter(d=>d.healthScore==="green").length===0&&<div style={{padding:32,textAlign:"center",color:C.textDim,fontSize:13}}>Mark clients as "On Track" in Client Health to surface renewal opportunities here.</div>}
        </div>
      )}
    </div>
  );
}

// ── INTELLIGENCE ──────────────────────────────────────────────────────────────
function Intelligence({ deals, activity, winLoss }) {
  const [analysis,setAnalysis]=useState(""); const [loading,setLoading]=useState(false);

  const totalDeals=deals.length;
  const wonDeals=deals.filter(d=>d.stage==="Closed Won");
  const lostDeals=deals.filter(d=>d.stage==="Closed Lost");
  const activeDeals=deals.filter(d=>!["Closed Won","Closed Lost"].includes(d.stage));
  const staleDeals=activeDeals.filter(d=>parseInt(d.lastTouch||0)>14);
  const overdueDeals=activeDeals.filter(d=>d.nextDate&&new Date(d.nextDate)<=new Date());

  // Win rate by vertical
  const verticals=[...new Set(deals.map(d=>d.vertical))];
  const verticalStats=verticals.map(v=>{
    const vDeals=deals.filter(d=>d.vertical===v&&["Closed Won","Closed Lost"].includes(d.stage));
    const vWon=vDeals.filter(d=>d.stage==="Closed Won");
    return{v,total:vDeals.length,won:vWon.length,rate:vDeals.length?Math.round(vWon.length/vDeals.length*100):0};
  }).filter(x=>x.total>0).sort((a,b)=>b.rate-a.rate);

  const SYS=`You are a sales intelligence analyst for Nextdot Digital Solutions. Analyse the full pipeline + activity log + win/loss history and provide:
1. PATTERN INSIGHTS (3 specific patterns you see — e.g. "Healthcare deals over ₹15L take 45+ days")
2. ICP ANALYSIS (who is the ideal customer profile based on won deals)
3. BOTTLENECK (where deals are stalling and why)
4. TOP 3 RECOMMENDATIONS (specific, actionable, this week)
5. RISK ALERT (biggest single risk in the pipeline right now)
Use real data. Be specific. No generic advice.`;

  async function analyse(){
    setLoading(true); setAnalysis("");
    const pipelineStr=deals.map(d=>`${d.client}: ₹${d.value}L | ${d.stage} | ${d.vertical} | ${d.priority} | ${d.lastTouch}d since touch`).join("\n");
    const actStr=activity.slice(-50).map(a=>`${a.client}: ${a.type} — ${a.note}`).join("\n");
    const wlStr=winLoss.map(w=>`${w.result.toUpperCase()}: ${w.client} (₹${w.value}L, ${w.vertical}, ${w.daysInPipeline}d) — ${w.reason}`).join("\n");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.REACT_APP_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYS,messages:[{role:"user",content:`PIPELINE:\n${pipelineStr}\n\nACTIVITY LOG (last 50):\n${actStr||"No activity logged yet."}\n\nWIN/LOSS LOG:\n${wlStr||"No win/loss records yet."}`}]})});
      const data=await res.json();
      setAnalysis(data.content?.find(b=>b.type==="text")?.text||"Error.");
    }catch{setAnalysis("Error.");}
    setLoading(false);
  }

  return (
    <div style={{maxWidth:760}}>
      <div style={{marginBottom:18}}>
        <h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Intelligence</h2>
        <div style={{fontSize:12,color:C.textDim,marginTop:3}}>
          Patterns and insights from your live pipeline · {activity.length} activity logs · {winLoss.length} win/loss records
          {winLoss.length<5&&<span style={{color:C.orange}}> · Log 5+ win/loss records for meaningful patterns</span>}
        </div>
      </div>

      {/* Quick stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[
          {l:"Active Deals",v:activeDeals.length,c:C.accent},
          {l:"Stale (14d+)",v:staleDeals.length,c:C.orange},
          {l:"Overdue",v:overdueDeals.length,c:C.red},
          {l:"Win/Loss Logged",v:winLoss.length,c:C.green},
        ].map((s,i)=>(
          <Card key={i} style={{padding:"14px 16px"}}>
            <div style={{fontSize:10,color:C.textDim,fontWeight:600,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>{s.l}</div>
            <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div>
          </Card>
        ))}
      </div>

      {/* Win rate by vertical */}
      {verticalStats.length>0&&(
        <Card style={{marginBottom:14}}>
          <SL>Win Rate by Vertical (from closed deals)</SL>
          {verticalStats.map((v,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:100,fontSize:11,color:C.textMid}}>{v.v}</div>
              <div style={{flex:1,height:7,background:C.border,borderRadius:4}}><div style={{width:`${v.rate}%`,height:"100%",background:v.rate>50?C.green:v.rate>25?C.orange:C.red,borderRadius:4,transition:"width .8s"}}/></div>
              <div style={{width:60,fontSize:12,fontWeight:700,color:v.rate>50?C.green:v.rate>25?C.orange:C.red,textAlign:"right"}}>{v.rate}%</div>
              <div style={{width:50,fontSize:10,color:C.textDim}}>{v.won}/{v.total} deals</div>
            </div>
          ))}
        </Card>
      )}

      {/* Stale deals alert */}
      {staleDeals.length>0&&(
        <Card style={{marginBottom:14,borderLeft:`4px solid ${C.orange}`}}>
          <SL color={C.orange}>Stale Deals — No Touch in 14+ Days</SL>
          {staleDeals.map(d=>(
            <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"8px 10px",background:C.orangeLight,borderRadius:8}}>
              <div style={{fontSize:12,color:C.text,fontWeight:600}}>{d.client}</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Tag label={`${d.lastTouch}d`} color={C.orange}/>
                <Tag label={d.stage} color={STAGE_CFG[d.stage]?.color||C.textDim}/>
              </div>
            </div>
          ))}
        </Card>
      )}

      <div style={{marginBottom:12}}>
        <Btn label={loading?"Analysing...":"Run Full Intelligence Analysis"} onClick={analyse} disabled={loading} icon="◉"/>
        {winLoss.length===0&&<span style={{fontSize:11,color:C.textDim,marginLeft:12}}>Log win/loss records first for best results</span>}
      </div>
      {loading&&<Card><Skeleton/></Card>}
      {analysis&&!loading&&<Card><pre style={{fontSize:13,color:C.text,lineHeight:1.85,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif"}}>{analysis}</pre></Card>}
    </div>
  );
}

// ── SALES CHATBOT ─────────────────────────────────────────────────────────────
function SalesChatbot({ deals, setDeals, setView, setCoachDeal, role, activity, winLoss }) {
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([{role:"assistant",text:"Hi! I'm your Nextdot Sales Assistant 💬\n\nI know your full live pipeline from Google Sheets — every deal, activity log, and win/loss record.\n\nTry: \"What should I focus on today?\" or \"How's the Clove Dental deal?\" or \"Who's gone stale?\""}]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false); const [recording,setRecording]=useState(false);
  const bottomRef=useRef(); const recRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  function buildContext(){
    const active=deals.filter(d=>!["Closed Won","Closed Lost"].includes(d.stage));
    const won=deals.filter(d=>d.stage==="Closed Won");
    const stale=active.filter(d=>parseInt(d.lastTouch||0)>14);
    const overdue=active.filter(d=>d.nextDate&&new Date(d.nextDate)<=new Date());
    const wlPatterns=winLoss.length>0?`\n\nWIN/LOSS PATTERNS (${winLoss.length} records):\n${winLoss.slice(-10).map(w=>`${w.result}: ${w.client} — ${w.reason}`).join("\n")}`:"";
    const recentAct=activity.slice(-10).length>0?`\n\nRECENT ACTIVITY:\n${activity.slice(-10).map(a=>`${a.client}: ${a.type} — ${a.note}`).join("\n")}`:"";
    return `LIVE PIPELINE (${active.length} active, ₹${active.reduce((s,d)=>s+parseFloat(d.value||0),0)}L):\n`
      +active.map(d=>`- ${d.client} | ₹${d.value}L | ${d.stage} | ${d.priority} | Owner: ${d.owner} | ${d.lastTouch}d since touch | Next: ${d.nextAction} (${d.nextDate}) | ${d.notes}`).join("\n")
      +`\n\nCLOSED WON (${won.length}): ${won.map(d=>`${d.client} ₹${d.value}L`).join(", ")}`
      +`\nSTALE >14d (${stale.length}): ${stale.map(d=>d.client).join(", ")}`
      +`\nOVERDUE (${overdue.length}): ${overdue.map(d=>d.client).join(", ")}`
      +wlPatterns+recentAct;
  }

  const SYS=`You are the Nextdot Sales Assistant — conversational AI for the Nextdot Sales Engine. Nextdot is an AI engineering company, India, founded by Ayush Prashar. Role: ${role}. You have full live pipeline data from Google Sheets.

Rules:
- Be specific — use real client names and numbers
- "What to focus today" → prioritise: overdue > high priority stale > stage urgency  
- Navigation: end reply with [ACTION:navigate:MODULE] (inbox/capture/coach/proposal/decks/forecast/weekly/delivery/intelligence)
- Coach a deal: [ACTION:coach:CLIENT_NAME]
- Keep answers sharp. Address Ayush as Ayush.`;

  async function send(override){
    const msg=(override||input).trim(); if(!msg||loading) return;
    setInput(""); setMsgs(p=>[...p,{role:"user",text:msg}]); setLoading(true);
    const ctx=buildContext();
    const history=[...msgs,{role:"user",text:msg}].map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.REACT_APP_ANTHROPIC_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:`${SYS}\n\nLIVE DATA:\n${ctx}`,messages:history})});
      const data=await res.json();
      let reply=data.content?.find(b=>b.type==="text")?.text||"Error.";
      const navMatch=reply.match(/\[ACTION:navigate:(\w+)\]/);
      const coachMatch=reply.match(/\[ACTION:coach:([^\]]+)\]/);
      if(navMatch){setTimeout(()=>setView(navMatch[1]),300);reply=reply.replace(/\[ACTION:navigate:\w+\]/,"").trim();}
      if(coachMatch){const n=coachMatch[1];const d=deals.find(x=>x.client.toLowerCase().includes(n.toLowerCase()));if(d){setTimeout(()=>{setCoachDeal(d);setView("coach");},300);}reply=reply.replace(/\[ACTION:coach:[^\]]+\]/,"").trim();}
      setMsgs(p=>[...p,{role:"assistant",text:reply}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",text:"Connection error."}]);}
    setLoading(false);
  }

  function startVoice(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Voice requires Chrome.");return;}
    const rec=new SR(); rec.lang="en-IN"; rec.continuous=false; rec.interimResults=false;
    rec.onstart=()=>setRecording(true);
    rec.onresult=e=>{const t=e.results[0][0].transcript;setRecording(false);setInput(t);setTimeout(()=>send(t),150);};
    rec.onerror=()=>setRecording(false); rec.onend=()=>setRecording(false);
    rec.start(); recRef.current=rec;
  }
  function stopVoice(){recRef.current?.stop();setRecording(false);}

  const CHIPS=["What to focus on today?","Any overdue deals?","Pipeline health","Who's gone stale?","Pending handoffs","Take me to Forecast","Show high priority deals"];

  if(!open) return(
    <button onClick={()=>setOpen(true)} title="Sales Assistant" style={{position:"fixed",bottom:24,right:24,zIndex:500,width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#7c3aed)`,border:"none",cursor:"pointer",boxShadow:"0 4px 20px rgba(75,107,251,.45)",fontSize:20,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>💬</button>
  );

  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:500,width:400,height:580,background:C.white,borderRadius:18,boxShadow:"0 12px 48px rgba(0,0,0,.18)",border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"13px 16px",background:`linear-gradient(135deg,${C.accent},#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>💬</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>Sales Assistant</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.75)"}}>Live · Google Sheets · {deals.length} deals</div>
          </div>
        </div>
        <button onClick={()=>setOpen(false)} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:7,width:26,height:26,color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px 6px",display:"flex",flexDirection:"column",gap:10}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:7}}>
            {m.role==="assistant"&&<div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#7c3aed)`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",marginBottom:2}}>✦</div>}
            <div style={{maxWidth:"82%",padding:"9px 13px",borderRadius:m.role==="user"?"14px 14px 3px 14px":"3px 14px 14px 14px",background:m.role==="user"?C.accent:C.bg,color:m.role==="user"?"#fff":C.text,fontSize:12.5,lineHeight:1.65,border:m.role==="assistant"?`1px solid ${C.border}`:"none",whiteSpace:"pre-wrap"}}>{m.text}</div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",alignItems:"flex-end",gap:7}}><div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>✦</div><div style={{display:"flex",gap:4,padding:"9px 13px",background:C.bg,borderRadius:"3px 14px 14px 14px",border:`1px solid ${C.border}`}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.accent,animation:`blink 1.2s ${i*.2}s infinite`}}/>)}</div></div>}
        <div ref={bottomRef}/>
      </div>
      {msgs.length<=1&&<div style={{padding:"0 12px 8px",display:"flex",flexWrap:"wrap",gap:5}}>{CHIPS.map(c=><button key={c} onClick={()=>send(c)} style={{padding:"4px 10px",background:C.accentLight,border:`1px solid ${C.accent}30`,borderRadius:20,color:C.accent,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>)}</div>}
      <div style={{padding:"8px 12px 12px",borderTop:`1px solid ${C.border}`,flexShrink:0}}>
        {recording&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:C.redLight,borderRadius:7,marginBottom:7,fontSize:11,color:C.red}}><div style={{width:7,height:7,borderRadius:"50%",background:C.red,animation:"blink .8s infinite"}}/>Listening... tap to stop</div>}
        <div style={{display:"flex",gap:7,alignItems:"flex-end"}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Ask anything... (Enter to send)" rows={2} style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 11px",fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",color:C.text,lineHeight:1.5}}/>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <button onClick={recording?stopVoice:startVoice} style={{width:34,height:34,borderRadius:"50%",background:recording?C.redLight:C.accentLight,border:`1.5px solid ${recording?C.red:C.accent}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:recording?C.red:C.accent,boxShadow:recording?`0 0 0 3px ${C.red}25`:"none"}}>{recording?"⏹":"🎙"}</button>
            <button onClick={()=>send()} disabled={!input.trim()||loading} style={{width:34,height:34,borderRadius:"50%",background:C.accent,border:"none",cursor:input.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",opacity:input.trim()&&!loading?1:.35}}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [role,setRole]=useState(null);
  const [view,setView]=useState(null);
  const [deals,setDeals]=useState([]);
  const [decks,setDecks]=useState([]);
  const [activity,setActivity]=useState([]);
  const [winLoss,setWinLoss]=useState([]);
  const [coachDeal,setCoachDeal]=useState(null);
  const [loading,setLoading]=useState(false);
  const [syncStatus,setSyncStatus]=useState("idle"); // idle | loading | ready | error

  async function loadAllData(){
    setLoading(true); setSyncStatus("loading");
    try{
      const [dealsData,decksData,actData,wlData]=await Promise.all([
        sheetRead("Deals"),
        sheetRead("Decks"),
        sheetRead("Activity"),
        sheetRead("WinLoss"),
      ]);
      // Use sheet data if available, else fall back to seed
      setDeals(dealsData.length>0 ? dealsData : SEED_DEALS);
      setDecks(decksData.length>0 ? decksData : SEED_DECKS);
      setActivity(actData);
      setWinLoss(wlData);
      setSyncStatus("ready");
    }catch{
      setDeals(SEED_DEALS); setDecks(SEED_DECKS);
      setSyncStatus("error");
    }
    setLoading(false);
  }

  async function seedToSheets(){
    // Write seed deals and decks to sheets if sheets are empty
    setSyncStatus("loading");
    for(const d of SEED_DEALS){ await sheetWrite("Deals",d); }
    for(const d of SEED_DECKS){ await sheetWrite("Decks",d); }
    setSyncStatus("ready");
  }

  function onLogin(r){
    setRole(r);
    setView(ROLES[r].views[0]);
    loadAllData();
  }

  if(!role) return <Login onLogin={onLogin}/>;

  const rd=ROLES[role];
  const overdue=deals.filter(d=>!["Closed Won","Closed Lost"].includes(d.stage)&&d.nextDate&&new Date(d.nextDate)<=new Date()).length;
  const pendingHandoff=deals.filter(d=>d.stage==="Closed Won"&&!parseBool(d.handoffDone)).length;

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans','Segoe UI',sans-serif",color:C.text}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Sans:wght@600;700&family=DM+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}select option{background:#fff;}@keyframes blink{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>

      {/* Header */}
      <div style={{height:54,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:"rgba(255,255,255,.97)",backdropFilter:"blur(12px)",zIndex:50,boxShadow:"0 1px 0 #eaeaf0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Logo size={19}/>
          <div style={{width:1,height:14,background:C.border}}/>
          <div style={{fontSize:9,color:C.textDim,letterSpacing:2.5,fontFamily:"'DM Mono',monospace",textTransform:"uppercase"}}>Sales Engine</div>
          {/* Sync indicator */}
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10}}>
            {syncStatus==="loading"&&<span style={{color:C.orange}}>↻ Syncing...</span>}
            {syncStatus==="ready"&&<span style={{color:C.green}}>● Live · {deals.length} deals</span>}
            {syncStatus==="error"&&<span style={{color:C.red}}>⚠ Offline mode</span>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          {overdue>0&&<div style={{fontSize:11,fontWeight:600,padding:"3px 10px",background:C.redLight,border:`1px solid ${C.red}28`,borderRadius:20,color:C.red}}>{overdue} overdue</div>}
          {pendingHandoff>0&&<div style={{fontSize:11,fontWeight:600,padding:"3px 10px",background:C.orangeLight,border:`1px solid ${C.orange}28`,borderRadius:20,color:C.orange}}>{pendingHandoff} pending handoff</div>}
          <button onClick={loadAllData} title="Refresh from Sheets" style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 10px",color:C.textDim,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>↻</button>
          {role==="ayush"&&deals.length===0&&<button onClick={seedToSheets} style={{background:C.accent,border:"none",borderRadius:8,padding:"4px 12px",color:"#fff",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Seed Sheets</button>}
          <div style={{fontSize:11,fontWeight:500,padding:"3px 12px",background:`${rd.color}10`,border:`1px solid ${rd.color}28`,borderRadius:20,color:rd.color}}>{rd.badge} · {rd.label}</div>
          <button onClick={()=>setRole(null)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px",color:C.textDim,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Sign out</button>
        </div>
      </div>

      <div style={{display:"flex"}}>
        {/* Sidebar */}
        <div style={{width:186,padding:"16px 0",borderRight:`1px solid ${C.border}`,minHeight:"calc(100vh - 54px)",flexShrink:0,background:C.white}}>
          {rd.views.map(v=>{
            const meta=VIEWS[v]; const isA=view===v;
            const badge=v==="delivery"&&pendingHandoff>0?pendingHandoff:null;
            return(
              <button key={v} onClick={()=>setView(v)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 18px",background:isA?`${rd.color}08`:"none",border:"none",borderLeft:`3px solid ${isA?rd.color:"transparent"}`,color:isA?rd.color:C.textMid,fontSize:12,fontWeight:isA?600:400,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .12s"}}>
                <span style={{fontSize:13}}>{meta.icon}</span>
                {meta.label}
                {badge&&<span style={{marginLeft:"auto",fontSize:9,fontWeight:700,background:C.orange,color:"#fff",borderRadius:20,padding:"1px 6px"}}>{badge}</span>}
              </button>
            );
          })}
          <div style={{margin:"16px 14px 0",paddingTop:14,borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:9,color:C.textFaint,letterSpacing:2,fontWeight:600,textTransform:"uppercase",marginBottom:9}}>Pipeline</div>
            {[["Active",deals.filter(d=>!["Closed Won","Closed Lost"].includes(d.stage)).length,C.accent],["Won",deals.filter(d=>d.stage==="Closed Won").length,C.green],["Lost",deals.filter(d=>d.stage==="Closed Lost").length,C.red]].map(([l,n,c])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:11,color:C.textDim}}>{l}</span><span style={{fontSize:11,fontWeight:700,color:c}}>{n}</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:6}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:C.textDim}}>₹ Pipeline</span>
                <span style={{fontSize:11,fontWeight:700,color:C.text}}>₹{deals.filter(d=>!["Closed Won","Closed Lost"].includes(d.stage)).reduce((s,d)=>s+parseFloat(d.value||0),0)}L</span>
              </div>
            </div>
            {activity.length>0&&(
              <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                <div style={{fontSize:9,color:C.textFaint,letterSpacing:2,fontWeight:600,textTransform:"uppercase",marginBottom:5}}>Intelligence</div>
                <div style={{fontSize:11,color:C.green}}>{activity.length} activities</div>
                <div style={{fontSize:11,color:winLoss.length>0?C.green:C.textDim}}>{winLoss.length} win/loss logs</div>
              </div>
            )}
          </div>
        </div>

        {/* Main */}
        <div style={{flex:1,padding:"22px 26px",overflowY:"auto",minHeight:"calc(100vh - 54px)"}}>
          {loading&&!deals.length&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:12}}>
              <div style={{fontSize:13,color:C.textDim}}>Loading from Google Sheets...</div>
              <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.accent,animation:`blink 1.2s ${i*.2}s infinite`}}/>)}</div>
            </div>
          )}
          {(!loading||deals.length>0)&&<>
            {view==="inbox"       &&<Inbox       deals={deals} setDeals={setDeals} role={role} setView={setView} setCoachDeal={setCoachDeal} activity={activity}/>}
            {view==="capture"     &&<Capture     deals={deals} setDeals={setDeals} role={role}/>}
            {view==="coach"       &&<Coach       deals={deals} initDeal={coachDeal} role={role} activity={activity}/>}
            {view==="proposal"    &&<Proposal    deals={deals}/>}
            {view==="decks"       &&<DeckLibrary deals={deals} decks={decks} setDecks={setDecks}/>}
            {view==="forecast"    &&<Forecast    deals={deals} winLoss={winLoss}/>}
            {view==="weekly"      &&<Weekly      deals={deals} activity={activity} winLoss={winLoss}/>}
            {view==="delivery"    &&<Delivery    deals={deals} setDeals={setDeals} winLoss={winLoss} setWinLoss={setWinLoss} role={role}/>}
            {view==="intelligence"&&<Intelligence deals={deals} activity={activity} winLoss={winLoss}/>}
          </>}
        </div>
      </div>

      <StrategicAI
        deals={deals}
        activity={activity}
        winLoss={winLoss}
        setView={setView}
        setCoachDeal={setCoachDeal}
        role={role}
      />
    </div>
  );
}
