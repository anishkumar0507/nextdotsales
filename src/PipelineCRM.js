// ─────────────────────────────────────────────────────────────────────────────
// NEXTDOT CRM PIPELINE MODULE
// Replace the Inbox + add to App as "pipeline" view
// Includes: Kanban view, Timeline view, Deal detail panel, Quick add
// Sales Master chatbot is the StrategicAI with pipeline-first mode
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";

// ── TOKENS ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#f0f2f7",
  white: "#ffffff",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  accent: "#3b82f6",
  accentLight: "#eff6ff",
  accentDark: "#2563eb",
  green: "#16a34a",
  greenLight: "#f0fdf4",
  orange: "#d97706",
  orangeLight: "#fffbeb",
  red: "#dc2626",
  redLight: "#fef2f2",
  purple: "#7c3aed",
  purpleLight: "#f5f3ff",
  teal: "#0d9488",
  tealLight: "#f0fdfa",
  slate: "#64748b",
  slateLight: "#f8fafc",
  text: "#0f172a",
  textMid: "#334155",
  textDim: "#64748b",
  textFaint: "#cbd5e1",
  shadow: "0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.04)",
  shadowMd: "0 4px 12px rgba(0,0,0,.08)",
  shadowLg: "0 10px 40px rgba(0,0,0,.12)",
};

// ── STAGE CONFIG ──────────────────────────────────────────────────────────────
const STAGES = [
  { key: "Lead",          label: "Target Account",    color: "#94a3b8", bg: "#f8fafc",   border: "#e2e8f0" },
  { key: "Qualified",     label: "Active Lead",        color: "#3b82f6", bg: "#eff6ff",   border: "#bfdbfe" },
  { key: "Proposal Sent", label: "Proposal Sent",      color: "#f59e0b", bg: "#fffbeb",   border: "#fde68a" },
  { key: "Negotiation",   label: "Negotiation",        color: "#8b5cf6", bg: "#f5f3ff",   border: "#ddd6fe" },
  { key: "Closed Won",    label: "Closed Won",         color: "#16a34a", bg: "#f0fdf4",   border: "#bbf7d0" },
  { key: "Closed Lost",   label: "Closed Lost",        color: "#dc2626", bg: "#fef2f2",   border: "#fecaca" },
];

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]));

// ── SERVICE VERTICALS ─────────────────────────────────────────────────────────
const VERTICALS = [
  "Healthcare", "Pharma", "Manufacturing", "FMCG", "Auto",
  "Tech", "BFSI", "Other"
];

const SERVICE_TYPES = [
  "Agentic AI / Automation",
  "AI Creative & Content",
  "Digital / Social / Media",
  "Voice Agent",
  "NextComply AI",
  "Custom AI Build",
  "Consulting / Advisory",
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function pv(v) { return parseFloat(v) || 0; }
function pb(v) { return v === true || v === "true" || v === 1; }

function urgencyScore(d) {
  let s = 0;
  if (d.priority === "high") s += 4;
  else if (d.priority === "med") s += 2;
  const lt = parseInt(d.lastTouch || 0);
  if (lt > 30) s += 4; else if (lt > 14) s += 2; else if (lt > 7) s += 1;
  if (d.stage === "Negotiation") s += 3;
  if (d.stage === "Proposal Sent") s += 2;
  try { if (d.nextDate && new Date(d.nextDate) <= new Date()) s += 3; } catch {}
  return s;
}

function daysAgo(dateStr) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    return Math.round((now - d) / 86400000);
  } catch { return 0; }
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch { return dateStr; }
}

// ── SMALL COMPONENTS ──────────────────────────────────────────────────────────
function Tag({ label, color, bg, size = 10 }) {
  return (
    <span style={{
      fontSize: size, fontWeight: 600, padding: "2px 8px",
      borderRadius: 20, color, background: bg || `${color}18`,
      whiteSpace: "nowrap", letterSpacing: 0.2, display: "inline-block",
    }}>{label}</span>
  );
}

function Avatar({ name, size = 28, color = C.accent }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${color}20`, color, border: `1.5px solid ${color}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
}

function PriorityDot({ priority }) {
  const col = priority === "high" ? C.red : priority === "med" ? C.orange : C.textFaint;
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, display: "inline-block", flexShrink: 0 }} />;
}

function Btn({ label, onClick, color = C.accent, outline = false, sm = false, disabled = false, icon = "", full = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: outline ? "transparent" : disabled ? "#e2e8f0" : color,
      border: `1.5px solid ${disabled ? "#e2e8f0" : color}`,
      borderRadius: 8, padding: sm ? "5px 12px" : "8px 18px",
      color: outline ? color : disabled ? C.textDim : "#fff",
      fontWeight: 600, fontSize: sm ? 11 : 13,
      cursor: disabled ? "default" : "pointer",
      fontFamily: "inherit", whiteSpace: "nowrap",
      width: full ? "100%" : "auto",
      justifyContent: full ? "center" : "flex-start",
      transition: "all .15s",
    }}>{icon && <span>{icon}</span>}{label}</button>
  );
}

function FInput({ value, onChange, placeholder, type = "text", rows, style = {} }) {
  const base = {
    width: "100%", background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13,
    fontFamily: "inherit", outline: "none", resize: "vertical", ...style,
  };
  return rows
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} style={base} />;
}

function Select({ value, onChange, opts, style = {} }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: "9px 12px", color: C.text, fontSize: 13,
      fontFamily: "inherit", outline: "none", ...style,
    }}>
      {opts.map(o => (
        <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
          {typeof o === "string" ? o : o.label}
        </option>
      ))}
    </select>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, marginBottom: 5, letterSpacing: 0.4, textTransform: "uppercase" }}>{children}</div>;
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
      {[80, 60, 72, 45].map((w, i) => (
        <div key={i} style={{ height: 10, borderRadius: 5, background: C.border, width: `${w}%`, opacity: 0.7 }} />
      ))}
    </div>
  );
}

// ── DEAL FORM (Add / Edit) ────────────────────────────────────────────────────
function DealForm({ deal, onSave, onCancel, title = "Add Deal" }) {
  const empty = {
    client: "", contact: "", value: "", stage: "Lead",
    owner: "", vertical: "Healthcare", priority: "med",
    serviceType: "Agentic AI / Automation",
    nextAction: "", nextDate: "", notes: "",
  };
  const [form, setForm] = useState(deal ? { ...deal } : empty);

  function f(k) { return v => setForm(p => ({ ...p, [k]: v })); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><FieldLabel>Client / Company</FieldLabel><FInput value={form.client} onChange={f("client")} placeholder="e.g. Narayana Health" /></div>
        <div><FieldLabel>Contact Person</FieldLabel><FInput value={form.contact} onChange={f("contact")} placeholder="e.g. Dr. Priya Sharma" /></div>
        <div><FieldLabel>Deal Value (₹L)</FieldLabel><FInput value={form.value} onChange={f("value")} type="number" placeholder="e.g. 18" /></div>
        <div><FieldLabel>Owner</FieldLabel><FInput value={form.owner} onChange={f("owner")} placeholder="e.g. Ayush" /></div>
        <div><FieldLabel>Stage</FieldLabel><Select value={form.stage} onChange={f("stage")} opts={STAGES.map(s => ({ value: s.key, label: s.label }))} /></div>
        <div><FieldLabel>Priority</FieldLabel><Select value={form.priority} onChange={f("priority")} opts={["high", "med", "low"]} /></div>
        <div><FieldLabel>Vertical</FieldLabel><Select value={form.vertical} onChange={f("vertical")} opts={VERTICALS} /></div>
        <div><FieldLabel>Service Type</FieldLabel><Select value={form.serviceType || ""} onChange={f("serviceType")} opts={SERVICE_TYPES} /></div>
        <div><FieldLabel>Next Action Date</FieldLabel><FInput value={form.nextDate} onChange={f("nextDate")} type="date" /></div>
      </div>
      <div><FieldLabel>Next Action</FieldLabel><FInput value={form.nextAction} onChange={f("nextAction")} placeholder="What needs to happen next?" /></div>
      <div><FieldLabel>Notes / Context</FieldLabel><FInput value={form.notes} onChange={f("notes")} placeholder="Deal context, stakeholders, key facts..." rows={3} /></div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <Btn label="Save Deal" onClick={() => onSave(form)} color={C.green} />
        <Btn label="Cancel" onClick={onCancel} outline color={C.slate} />
      </div>
    </div>
  );
}

// ── DEAL DETAIL PANEL ─────────────────────────────────────────────────────────
function DealPanel({ deal, onClose, onUpdate, onDelete, activity, role }) {
  const [editing, setEditing] = useState(false);
  const [activityNote, setActivityNote] = useState("");
  const [actType, setActType] = useState("call");
  const [logging, setLogging] = useState(false);
  const [logSaved, setLogSaved] = useState(false);
  const [aiResp, setAiResp] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState("");

  const cfg = STAGE_MAP[deal.stage] || STAGES[0];
  const dealActivity = (activity || []).filter(a => a.dealId === deal.id);
  const isOverdue = deal.nextDate && new Date(deal.nextDate) <= new Date();

  async function logAct() {
    if (!activityNote.trim()) return;
    setLogging(true);
    const entry = {
      id: `act_${Date.now()}`,
      dealId: deal.id,
      client: deal.client,
      type: actType,
      note: activityNote,
      owner: role,
      timestamp: new Date().toISOString(),
    };
    // Write to sheets via parent
    if (window._sheetWrite) await window._sheetWrite("Activity", entry);
    setActivityNote(""); setLogging(false); setLogSaved(true);
    setTimeout(() => setLogSaved(false), 2000);
    onUpdate(deal.id, { updatedAt: new Date().toISOString() }, entry);
  }

  const COACH_ACTIONS = [
    { key: "prep", label: "Call Prep", p: `Give me a sharp call prep brief for ${deal.client} (${deal.vertical}). Deal: ₹${deal.value}L at ${deal.stage}. Contact: ${deal.contact}. Notes: ${deal.notes}. 3 smart questions, 1 likely objection + Nextdot-specific response.` },
    { key: "email", label: "Draft Email", p: `Write a sharp follow-up email to ${deal.contact} at ${deal.client}. Stage: ${deal.stage}. Context: ${deal.notes}. Service: ${deal.serviceType}. Include subject line. Max 120 words.` },
    { key: "nudge", label: "Ghost Recovery", p: `${deal.contact} at ${deal.client} has gone silent for ${deal.lastTouch} days. Stage: ${deal.stage}. Write a re-engagement message — sharp, creates curiosity, not needy. Max 60 words.` },
    { key: "roi", label: "ROI Case", p: `Build a brief internal ROI justification that ${deal.contact} at ${deal.client} can use with their leadership to approve the Nextdot engagement. Service: ${deal.serviceType}. Value: ₹${deal.value}L. Vertical: ${deal.vertical}.` },
    { key: "close", label: "Closing Plan", p: `Best closing strategy for ${deal.client} (₹${deal.value}L, ${deal.stage}). 3 concrete steps in the next 7 days to move to Closed Won.` },
  ];

  async function runCoach(prompt, key) {
    setAiMode(key); setAiLoading(true); setAiResp("");
    const SYS = `You are a senior enterprise sales coach for Nextdot Digital Solutions — an AI engineering company building agentic AI, voice agents, and compliance tools for healthcare, pharma, and manufacturing. CEO: Ayush Prashar. Jamshedpur AI Capability Center is the structural edge. Be specific, sharp, no generic advice.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 700, system: SYS, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setAiResp(data.content?.find(b => b.type === "text")?.text || "Error.");
    } catch { setAiResp("Connection error."); }
    setAiLoading(false);
  }

  if (editing) {
    return (
      <div style={{ padding: "20px", overflowY: "auto", height: "100%" }}>
        <DealForm deal={deal} title="Edit Deal"
          onSave={async (updated) => {
            await onUpdate(deal.id, { ...updated, updatedAt: new Date().toISOString() });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.white }}>
      {/* Panel header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{deal.client}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ padding: "3px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 11, fontWeight: 600 }}>{deal.stage}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>₹{deal.value}L</span>
              {deal.serviceType && <Tag label={deal.serviceType} color={C.accent} size={10} />}
              {deal.priority === "high" && <Tag label="HIGH" color={C.red} size={10} />}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => setEditing(true)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "6px 12px", fontSize: 11, color: C.textMid, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>✎ Edit</button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: C.textDim, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {/* Key info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            ["Contact", deal.contact || "—"],
            ["Owner", deal.owner || "—"],
            ["Vertical", deal.vertical || "—"],
            ["Last Touch", `${deal.lastTouch || 0} days ago`],
          ].map(([l, v]) => (
            <div key={l} style={{ background: C.bg, borderRadius: 8, padding: "9px 12px" }}>
              <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, marginBottom: 2, letterSpacing: 0.4 }}>{l.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Next action */}
        <div style={{ background: isOverdue ? C.redLight : C.accentLight, borderRadius: 8, padding: "10px 14px", marginBottom: 16, border: `1px solid ${isOverdue ? "#fecaca" : "#bfdbfe"}` }}>
          <div style={{ fontSize: 10, color: isOverdue ? C.red : C.accent, fontWeight: 700, marginBottom: 3, letterSpacing: 0.4 }}>NEXT ACTION {isOverdue ? "— OVERDUE" : ""}</div>
          <div style={{ fontSize: 13, color: C.text }}>{deal.nextAction || "No action set"}</div>
          {deal.nextDate && <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>{formatDate(deal.nextDate)}</div>}
        </div>

        {/* Notes */}
        {deal.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, marginBottom: 6, letterSpacing: 0.4 }}>NOTES</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, background: C.bg, borderRadius: 8, padding: "10px 12px" }}>{deal.notes}</div>
          </div>
        )}

        {/* Stage mover */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, marginBottom: 8, letterSpacing: 0.4 }}>MOVE STAGE</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {STAGES.map(s => (
              <button key={s.key} onClick={() => onUpdate(deal.id, { stage: s.key, updatedAt: new Date().toISOString() })}
                style={{ padding: "5px 10px", background: deal.stage === s.key ? s.bg : C.white, border: `1.5px solid ${deal.stage === s.key ? s.color : C.border}`, borderRadius: 6, color: deal.stage === s.key ? s.color : C.textDim, fontSize: 11, fontWeight: deal.stage === s.key ? 700 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all .12s" }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Coach actions */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, marginBottom: 8, letterSpacing: 0.4 }}>AI COACH</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {COACH_ACTIONS.map(a => (
              <button key={a.key} onClick={() => runCoach(a.p, a.key)}
                style={{ padding: "5px 12px", background: aiMode === a.key ? C.accent : C.accentLight, border: `1px solid ${aiMode === a.key ? C.accent : "#bfdbfe"}`, borderRadius: 20, color: aiMode === a.key ? "#fff" : C.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {a.label}
              </button>
            ))}
          </div>
          {(aiLoading || aiResp) && (
            <div style={{ background: C.accentLight, border: `1px solid #bfdbfe`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {aiLoading ? <Skeleton /> : aiResp}
            </div>
          )}
          {aiResp && <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}><Btn label="Copy" onClick={() => navigator.clipboard.writeText(aiResp)} sm outline color={C.accent} /></div>}
        </div>

        {/* Log activity */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, marginBottom: 8, letterSpacing: 0.4 }}>LOG ACTIVITY</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {["call", "email", "meeting", "note", "demo"].map(t => (
              <button key={t} onClick={() => setActType(t)}
                style={{ padding: "4px 10px", background: actType === t ? C.text : C.white, border: `1px solid ${actType === t ? C.text : C.border}`, borderRadius: 20, color: actType === t ? "#fff" : C.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
                {t}
              </button>
            ))}
          </div>
          <FInput value={activityNote} onChange={setActivityNote} placeholder={`What happened on this ${actType}?`} rows={2} />
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <Btn label={logging ? "Saving..." : "Log Activity"} onClick={logAct} disabled={!activityNote.trim() || logging} color={C.green} sm />
            {logSaved && <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>✓ Logged</span>}
          </div>
        </div>

        {/* Activity history */}
        {dealActivity.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, marginBottom: 8, letterSpacing: 0.4 }}>ACTIVITY HISTORY ({dealActivity.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dealActivity.slice(-8).reverse().map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", background: C.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textDim, width: 48, flexShrink: 0, textTransform: "capitalize" }}>{a.type}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: C.text }}>{a.note}</div>
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{a.owner} · {formatDate(a.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete button */}
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={() => { if (window.confirm(`Delete ${deal.client}?`)) onDelete(deal.id); }}
          style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          Delete this deal
        </button>
      </div>
    </div>
  );
}

// ── KANBAN VIEW ───────────────────────────────────────────────────────────────
function KanbanView({ deals, onDealClick, onStageChange, selectedId }) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  function onDrop(stageKey) {
    if (dragging) {
      onStageChange(dragging, stageKey);
      setDragging(null); setDragOver(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", height: "100%", alignItems: "flex-start", paddingBottom: 16 }}>
      {STAGES.map(stage => {
        const stageDeals = deals.filter(d => d.stage === stage.key);
        const stageValue = stageDeals.reduce((s, d) => s + pv(d.value), 0);
        const isOver = dragOver === stage.key;

        return (
          <div key={stage.key}
            onDragOver={e => { e.preventDefault(); setDragOver(stage.key); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => onDrop(stage.key)}
            style={{
              width: 240, flexShrink: 0,
              background: isOver ? stage.bg : "#f8fafc",
              border: `1.5px solid ${isOver ? stage.color : C.border}`,
              borderRadius: 12, overflow: "hidden",
              transition: "all .15s",
              maxHeight: "calc(100vh - 220px)",
              display: "flex", flexDirection: "column",
            }}>

            {/* Column header */}
            <div style={{ padding: "12px 14px 10px", background: C.white, borderBottom: `2px solid ${stage.color}`, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: stage.color, letterSpacing: 0.3 }}>{stage.label.toUpperCase()}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.white, background: stage.color, borderRadius: 12, padding: "1px 8px" }}>{stageDeals.length}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 3 }}>₹{stageValue.toFixed(1)}L</div>
            </div>

            {/* Cards */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {stageDeals
                .sort((a, b) => urgencyScore(b) - urgencyScore(a))
                .map(deal => {
                  const isSelected = selectedId === deal.id;
                  const isOverdue = deal.nextDate && new Date(deal.nextDate) <= new Date();

                  return (
                    <div key={deal.id}
                      draggable
                      onDragStart={() => setDragging(deal.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      onClick={() => onDealClick(deal)}
                      style={{
                        background: isSelected ? `${stage.color}08` : C.white,
                        border: `1.5px solid ${isSelected ? stage.color : C.border}`,
                        borderRadius: 10, padding: "11px 12px", marginBottom: 8,
                        cursor: "pointer", boxShadow: C.shadow,
                        transition: "all .12s",
                        borderLeft: `3px solid ${isOverdue ? C.red : stage.color}`,
                      }}>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3, flex: 1, marginRight: 8 }}>{deal.client}</div>
                        <PriorityDot priority={deal.priority} />
                      </div>

                      <div style={{ fontSize: 15, fontWeight: 800, color: stage.color, marginBottom: 6 }}>₹{deal.value}L</div>

                      {deal.serviceType && (
                        <div style={{ fontSize: 10, color: C.accent, marginBottom: 5, fontWeight: 500 }}>{deal.serviceType}</div>
                      )}

                      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 5 }}>
                        {deal.contact && <span>{deal.contact}</span>}
                        {deal.owner && <span style={{ marginLeft: 6, color: C.textFaint }}>· {deal.owner}</span>}
                      </div>

                      {deal.nextAction && (
                        <div style={{
                          fontSize: 11, color: isOverdue ? C.red : C.textMid,
                          background: isOverdue ? C.redLight : C.slateLight,
                          borderRadius: 6, padding: "4px 8px", lineHeight: 1.4,
                        }}>
                          → {deal.nextAction.length > 50 ? deal.nextAction.slice(0, 50) + "..." : deal.nextAction}
                        </div>
                      )}

                      {parseInt(deal.lastTouch) > 14 && (
                        <div style={{ fontSize: 10, color: C.orange, marginTop: 5, fontWeight: 600 }}>⚠ {deal.lastTouch}d no touch</div>
                      )}
                    </div>
                  );
                })}

              {stageDeals.length === 0 && (
                <div style={{ textAlign: "center", color: C.textFaint, fontSize: 12, padding: "24px 0" }}>
                  Drop deals here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TIMELINE VIEW ─────────────────────────────────────────────────────────────
function TimelineView({ deals, onDealClick, selectedId }) {
  // Group by next action date, sorted
  const withDates = deals
    .filter(d => d.nextDate && !["Closed Lost"].includes(d.stage))
    .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate));

  const overdue = withDates.filter(d => new Date(d.nextDate) < new Date() && !["Closed Won"].includes(d.stage));
  const today = withDates.filter(d => formatDate(d.nextDate) === formatDate(new Date().toISOString()) && !["Closed Won"].includes(d.stage));
  const upcoming = withDates.filter(d => new Date(d.nextDate) > new Date() && !["Closed Won"].includes(d.stage));
  const won = deals.filter(d => d.stage === "Closed Won");

  function DealRow({ deal, accent }) {
    const cfg = STAGE_MAP[deal.stage] || STAGES[0];
    const isSelected = selectedId === deal.id;
    return (
      <div onClick={() => onDealClick(deal)}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "11px 16px",
          background: isSelected ? `${accent}06` : C.white,
          border: `1px solid ${isSelected ? accent : C.border}`,
          borderLeft: `4px solid ${accent}`,
          borderRadius: 10, marginBottom: 8,
          cursor: "pointer", boxShadow: C.shadow, transition: "all .12s",
        }}>
        <div style={{ width: 80, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>{formatDate(deal.nextDate)}</div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{deal.owner || "—"}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{deal.client}</span>
            <span style={{ padding: "2px 8px", borderRadius: 5, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 10, fontWeight: 600 }}>{deal.stage}</span>
            {deal.serviceType && <Tag label={deal.serviceType} color={C.accent} size={10} />}
          </div>
          <div style={{ fontSize: 12, color: C.textMid }}>→ {deal.nextAction || "No action set"}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: cfg.color }}>₹{deal.value}L</div>
          <PriorityDot priority={deal.priority} />
        </div>
      </div>
    );
  }

  function Section({ title, deals, accent, emptyText }) {
    if (deals.length === 0) return null;
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: 0.5, textTransform: "uppercase" }}>{title}</div>
          <div style={{ fontSize: 11, color: C.textDim }}>· {deals.length} deals · ₹{deals.reduce((s, d) => s + pv(d.value), 0).toFixed(1)}L</div>
        </div>
        {deals.map(d => <DealRow key={d.id} deal={d} accent={accent} />)}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, paddingBottom: 40 }}>
      <Section title="Overdue" deals={overdue} accent={C.red} />
      <Section title="Today" deals={today} accent={C.orange} />
      <Section title="Upcoming" deals={upcoming} accent={C.accent} />
      <Section title="Closed Won" deals={won} accent={C.green} />
      {withDates.length === 0 && won.length === 0 && (
        <div style={{ textAlign: "center", color: C.textDim, padding: "60px 0", fontSize: 13 }}>
          No deals with dates set. Add next action dates to see the timeline.
        </div>
      )}
    </div>
  );
}

// ── PIPELINE STATS BAR ────────────────────────────────────────────────────────
function PipelineStats({ deals }) {
  const active = deals.filter(d => !["Closed Won", "Closed Lost"].includes(d.stage));
  const won = deals.filter(d => d.stage === "Closed Won");
  const negotiation = deals.filter(d => d.stage === "Negotiation");
  const overdue = active.filter(d => d.nextDate && new Date(d.nextDate) <= new Date());
  const stale = active.filter(d => parseInt(d.lastTouch || 0) > 14);
  const winRate = (() => {
    const closed = deals.filter(d => ["Closed Won", "Closed Lost"].includes(d.stage));
    return closed.length ? Math.round(won.length / closed.length * 100) : 0;
  })();

  const stats = [
    { label: "Total Pipeline", value: `₹${active.reduce((s, d) => s + pv(d.value), 0).toFixed(1)}L`, sub: `${active.length} active deals`, color: C.accent },
    { label: "In Negotiation", value: `₹${negotiation.reduce((s, d) => s + pv(d.value), 0).toFixed(1)}L`, sub: `${negotiation.length} deals`, color: C.purple },
    { label: "Closed Won", value: `₹${won.reduce((s, d) => s + pv(d.value), 0).toFixed(1)}L`, sub: `Win rate: ${winRate}%`, color: C.green },
    { label: "Overdue Actions", value: overdue.length, sub: "Need immediate action", color: C.red },
    { label: "Stale (14d+)", value: stale.length, sub: "No recent touch", color: C.orange },
  ];

  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 18px", flexShrink: 0, boxShadow: C.shadow }}>
          <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, letterSpacing: 0.6, marginBottom: 4, textTransform: "uppercase" }}>{s.label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN PIPELINE COMPONENT ───────────────────────────────────────────────────
export function PipelineDashboard({ deals: rawDeals, setDeals, activity, role, sheetUpdate, sheetWrite, sheetDelete }) {
  const [view, setView] = useState("kanban"); // kanban | timeline | list
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState({ stage: "All", vertical: "All", owner: "All", priority: "All", search: "" });

  // Expose sheet functions globally for DealPanel
  useEffect(() => {
    window._sheetWrite = sheetWrite;
  }, [sheetWrite]);

  // Filter deals
  const deals = rawDeals.filter(d => {
    if (filter.stage !== "All" && d.stage !== filter.stage) return false;
    if (filter.vertical !== "All" && d.vertical !== filter.vertical) return false;
    if (filter.priority !== "All" && d.priority !== filter.priority) return false;
    if (filter.search && !(d.client + d.contact + d.owner + d.notes).toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const owners = ["All", ...new Set(rawDeals.map(d => d.owner).filter(Boolean))];

  async function handleAddDeal(formData) {
    const newDeal = {
      ...formData,
      id: `d_${Date.now()}`,
      value: parseFloat(formData.value) || 0,
      lastTouch: 0,
      handoffDone: "false",
      healthScore: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDeals(prev => [newDeal, ...prev]);
    await sheetWrite("Deals", newDeal);
    setShowAddForm(false);
    setSelectedDeal(newDeal);
  }

  async function handleUpdate(id, updates, activityEntry) {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    if (selectedDeal?.id === id) setSelectedDeal(prev => ({ ...prev, ...updates }));
    await sheetUpdate("Deals", id, updates);
    if (activityEntry) {
      // activity is managed by parent — just trigger a reload signal
    }
  }

  async function handleDelete(id) {
    setDeals(prev => prev.filter(d => d.id !== id));
    setSelectedDeal(null);
    await sheetDelete("Deals", id);
  }

  async function handleStageChange(id, newStage) {
    await handleUpdate(id, { stage: newStage, updatedAt: new Date().toISOString() });
  }

  const viewBtnStyle = (v) => ({
    padding: "6px 14px", background: view === v ? C.text : C.white,
    border: `1px solid ${view === v ? C.text : C.border}`,
    borderRadius: 7, color: view === v ? "#fff" : C.textDim,
    fontSize: 12, fontWeight: view === v ? 600 : 400,
    cursor: "pointer", fontFamily: "inherit", transition: "all .12s",
  });

  return (
    <div style={{ display: "flex", height: "calc(100vh - 54px)", overflow: "hidden", background: C.bg }}>
      {/* Main pipeline area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "20px 24px 0" }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Sales Pipeline</h2>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{rawDeals.filter(d => !["Closed Won", "Closed Lost"].includes(d.stage)).length} active opportunities · ₹{rawDeals.filter(d => !["Closed Won", "Closed Lost"].includes(d.stage)).reduce((s, d) => s + pv(d.value), 0).toFixed(1)}L</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* View switcher */}
            <div style={{ display: "flex", gap: 0, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
              <button onClick={() => setView("kanban")} style={{ ...viewBtnStyle("kanban"), borderRadius: 0, borderRight: `1px solid ${C.border}` }}>⬛ Kanban</button>
              <button onClick={() => setView("timeline")} style={{ ...viewBtnStyle("timeline"), borderRadius: 0, borderRight: `1px solid ${C.border}` }}>📅 Timeline</button>
              <button onClick={() => setView("list")} style={{ ...viewBtnStyle("list"), borderRadius: 0 }}>≡ List</button>
            </div>
            <Btn label="+ Add Deal" onClick={() => setShowAddForm(true)} icon="⊕" />
          </div>
        </div>

        {/* Stats */}
        <PipelineStats deals={rawDeals} />

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input value={filter.search} onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
            placeholder="Search deals..." style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, fontFamily: "inherit", outline: "none", color: C.text, width: 200 }} />
          {[
            { key: "stage", opts: ["All", ...STAGES.map(s => s.key)], labels: { All: "All Stages", ...Object.fromEntries(STAGES.map(s => [s.key, s.label])) } },
            { key: "vertical", opts: ["All", ...VERTICALS] },
            { key: "priority", opts: ["All", "high", "med", "low"] },
          ].map(({ key, opts, labels }) => (
            <select key={key} value={filter[key]} onChange={e => setFilter(p => ({ ...p, [key]: e.target.value }))}
              style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, fontFamily: "inherit", outline: "none", color: filter[key] !== "All" ? C.accent : C.textDim, fontWeight: filter[key] !== "All" ? 600 : 400 }}>
              {opts.map(o => <option key={o} value={o}>{labels ? (labels[o] || o) : o === "All" ? `All ${key}s` : o}</option>)}
            </select>
          ))}
          {(filter.stage !== "All" || filter.vertical !== "All" || filter.priority !== "All" || filter.search) && (
            <button onClick={() => setFilter({ stage: "All", vertical: "All", owner: "All", priority: "All", search: "" })}
              style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>✕ Clear filters</button>
          )}
        </div>

        {/* Add deal form inline */}
        {showAddForm && (
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", marginBottom: 16, boxShadow: C.shadowMd }}>
            <DealForm onSave={handleAddDeal} onCancel={() => setShowAddForm(false)} />
          </div>
        )}

        {/* Views */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {view === "kanban" && (
            <KanbanView deals={deals} onDealClick={setSelectedDeal} onStageChange={handleStageChange} selectedId={selectedDeal?.id} />
          )}
          {view === "timeline" && (
            <TimelineView deals={deals} onDealClick={setSelectedDeal} selectedId={selectedDeal?.id} />
          )}
          {view === "list" && (
            <ListView deals={deals} onDealClick={setSelectedDeal} selectedId={selectedDeal?.id} />
          )}
        </div>
      </div>

      {/* Deal detail panel */}
      {selectedDeal && (
        <div style={{ width: 400, borderLeft: `1px solid ${C.border}`, background: C.white, boxShadow: "-4px 0 16px rgba(0,0,0,.06)", flexShrink: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <DealPanel
            deal={selectedDeal}
            onClose={() => setSelectedDeal(null)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            activity={activity}
            role={role}
          />
        </div>
      )}
    </div>
  );
}

// ── LIST VIEW ─────────────────────────────────────────────────────────────────
function ListView({ deals, onDealClick, selectedId }) {
  const sorted = [...deals].sort((a, b) => urgencyScore(b) - urgencyScore(a));

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1fr", gap: 0, padding: "8px 14px", background: C.bg, borderRadius: 8, marginBottom: 8 }}>
        {["Client", "Value", "Stage", "Priority", "Next Action", "Owner"].map(h => (
          <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: 0.6, textTransform: "uppercase" }}>{h}</div>
        ))}
      </div>
      {sorted.map(deal => {
        const cfg = STAGE_MAP[deal.stage] || STAGES[0];
        const isOverdue = deal.nextDate && new Date(deal.nextDate) <= new Date();
        const isSelected = selectedId === deal.id;
        return (
          <div key={deal.id} onClick={() => onDealClick(deal)}
            style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr 1fr",
              gap: 0, padding: "12px 14px",
              background: isSelected ? `${cfg.color}06` : C.white,
              border: `1px solid ${isSelected ? cfg.color : C.border}`,
              borderLeft: `4px solid ${isOverdue && !["Closed Won", "Closed Lost"].includes(deal.stage) ? C.red : cfg.color}`,
              borderRadius: 10, marginBottom: 6,
              cursor: "pointer", boxShadow: C.shadow, transition: "all .12s",
              alignItems: "center",
            }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{deal.client}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 1 }}>{deal.contact}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: cfg.color }}>₹{deal.value}L</div>
            <div><span style={{ padding: "3px 8px", borderRadius: 6, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 10, fontWeight: 600 }}>{deal.stage}</span></div>
            <div><PriorityDot priority={deal.priority} /></div>
            <div>
              <div style={{ fontSize: 11, color: isOverdue ? C.red : C.textMid, lineHeight: 1.3 }}>
                {deal.nextAction ? (deal.nextAction.length > 40 ? deal.nextAction.slice(0, 40) + "..." : deal.nextAction) : "—"}
              </div>
              {deal.nextDate && <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{formatDate(deal.nextDate)}</div>}
            </div>
            <div style={{ fontSize: 12, color: C.textDim }}>{deal.owner || "—"}</div>
          </div>
        );
      })}
      {sorted.length === 0 && <div style={{ textAlign: "center", color: C.textDim, padding: "60px 0", fontSize: 13 }}>No deals match this filter.</div>}
    </div>
  );
}

// ── SALES MASTER CHATBOT ──────────────────────────────────────────────────────
// Full strategic partner with pipeline awareness + sales coaching
// Replaces or complements the StrategicAI component

const NEXTDOT_MASTER_CONTEXT = `
NEXTDOT DIGITAL SOLUTIONS — SALES MASTER BRIEF

COMPANY: Enterprise agentic AI systems — voice agents, compliance tools, custom AI workflows for healthcare, pharma, manufacturing. Structural edge: Jamshedpur AI Capability Center (Tier-2 cost, Tier-1 quality).

THREE SERVICE VERTICALS:
1. Agentic AI / Automation: Bespoke voice agents, RAG workflows, process automation. Highest margin. ₹5–25L projects + retainer.
2. AI Creative & Content: AI-powered content engines, video automation, brand content at scale. Legacy strength.  
3. Digital / Social / Media: Traditional SMM, performance digital, website. Cash-flowing but declining priority.

FLAGSHIP PRODUCT: NextComply AI — checks hospital/pharma documents against NABH/CDSCO compliance frameworks. MVP stage. Needs pilot by June 2026.

KEY CLIENTS: Narayana Health, Fortis Healthcare, Mankind Pharma, Wockhardt, Hero MotoCorp, Radico Khaitan, Clove Dental, Gleneagles.

TARGET VERTICALS (FY 26-27): Healthcare (Tier 1), Pharma (Tier 1), Manufacturing (Tier 2).

PRICING: AI projects ₹5–25L. Retainers ₹1–3L/month legacy, ₹3L+/month target for AI. Big deals ₹25L–₹1Cr.

SALES WEAK POINTS:
- Pipeline stalls at proposal-to-closure (no follow-up cadence)
- No internal ROI case studies yet  
- No dedicated sales person (Ayush is sole strategic seller)
- Common objections: "already working with Infosys/TCS", "show me where you've done this", "IT team needs to approve", "let's start small"

WINNING SALES MOTION:
- Lead with domain understanding (healthcare/pharma compliance complexity), not technology
- Use Narayana Health as reference for every healthcare pitch
- Propose Discovery Sprint as low-risk entry point for hesitant enterprise clients
- Build ROI case for client's internal stakeholder justification
- For NextComply: land via existing relationships, don't go cold

AS SALES MASTER:
- You know every deal in the pipeline by name
- You ask smart qualifying questions when a new opportunity is mentioned
- You help prioritise, strategise, draft, and close
- You flag risks, patterns, and blind spots
- You're a senior sales consultant who has closed enterprise AI deals in India
`;

export function SalesMasterChat({ deals, activity, winLoss, setView, role }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const bottomRef = useRef();
  const recRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  useEffect(() => {
    if (open && msgs.length === 0) {
      setShowWelcome(true);
    }
  }, [open]);

  function buildPipelineContext() {
    const active = deals.filter(d => !["Closed Won", "Closed Lost"].includes(d.stage));
    const won = deals.filter(d => d.stage === "Closed Won");
    const stale = active.filter(d => parseInt(d.lastTouch || 0) > 14);
    const overdue = active.filter(d => d.nextDate && new Date(d.nextDate) <= new Date());
    const wlStr = winLoss?.length > 0 ? `\n\nWIN/LOSS PATTERNS:\n${winLoss.slice(-8).map(w => `${w.result}: ${w.client} — ${w.reason}`).join("\n")}` : "";
    const actStr = activity?.length > 0 ? `\n\nRECENT ACTIVITY:\n${activity.slice(-8).map(a => `${a.client}: ${a.type} — ${a.note}`).join("\n")}` : "";

    return `LIVE PIPELINE (${active.length} active, ₹${active.reduce((s, d) => s + pv(d.value), 0).toFixed(1)}L):
${active.sort((a, b) => urgencyScore(b) - urgencyScore(a)).map(d =>
  `- ${d.client} | ₹${d.value}L | ${d.stage} | ${d.priority} priority | ${d.serviceType || d.vertical} | ${d.lastTouch}d since touch | Next: ${d.nextAction} (${d.nextDate})`
).join("\n")}

CLOSED WON (${won.length}): ${won.map(d => `${d.client} ₹${d.value}L`).join(", ") || "None yet"}
STALE >14d (${stale.length}): ${stale.map(d => d.client).join(", ") || "None"}
OVERDUE (${overdue.length}): ${overdue.map(d => d.client).join(", ") || "None"}${wlStr}${actStr}`;
  }

  const SYSTEM = `You are the Nextdot Sales Master — a deeply experienced senior enterprise sales consultant embedded inside Nextdot's sales operation. You know Nextdot's full context and live pipeline intimately.

${NEXTDOT_MASTER_CONTEXT}

YOUR BEHAVIOUR:
- When someone mentions a new lead or opportunity (even casually), ask 2-3 sharp qualifying questions: Who is the decision-maker? What's the trigger/pain? What's the realistic timeline and budget?
- When asked to summarise the pipeline, give a crisp MD-style summary — stage by stage, flag risks, name the deals that need action today
- When someone asks for help on a specific deal, give specific, tactical advice — not generic sales theory
- Proactively flag: stale deals, overdue follow-ups, deals at risk of going cold
- Help draft: emails, follow-up messages, proposals outlines, objection responses, ROI case builders
- Keep responses focused — dense and specific, not long and generic
- Ask one sharp follow-up question at the end of substantive responses
- Navigation: if you want to direct to a module, append [ACTION:navigate:MODULE]
- Address Ayush as Ayush, others naturally

CURRENT PIPELINE DATA:
${buildPipelineContext()}`;

  async function send(override) {
    const msg = (override || input).trim();
    if (!msg || loading) return;
    setInput(""); setShowWelcome(false);
    const userMsg = { role: "user", text: msg };
    const updated = [...msgs, userMsg];
    setMsgs(updated); setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 900,
          system: SYSTEM,
          messages: updated.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
        }),
      });
      const data = await res.json();
      let reply = data.content?.find(b => b.type === "text")?.text || "Error.";
      const navMatch = reply.match(/\[ACTION:navigate:(\w+)\]/);
      if (navMatch) { setTimeout(() => setView(navMatch[1]), 300); reply = reply.replace(/\[ACTION:navigate:\w+\]/, "").trim(); }
      setMsgs([...updated, { role: "assistant", text: reply }]);
    } catch { setMsgs([...updated, { role: "assistant", text: "Connection error. Try again." }]); }
    setLoading(false);
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice requires Chrome."); return; }
    const rec = new SR(); rec.lang = "en-IN"; rec.continuous = false; rec.interimResults = false;
    rec.onstart = () => setRecording(true);
    rec.onresult = e => { const t = e.results[0][0].transcript; setRecording(false); setInput(t); setTimeout(() => send(t), 150); };
    rec.onerror = () => setRecording(false); rec.onend = () => setRecording(false);
    rec.start(); recRef.current = rec;
  }

  const QUICK = [
    "Summarise my pipeline",
    "What should I focus on today?",
    "Which deals are at risk?",
    "I just spoke with a new lead — help me qualify it",
    "Draft a follow-up for a stale deal",
    "What's my realistic forecast this month?",
  ];

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{
      position: "fixed", bottom: 20, right: 20,
      width: 56, height: 56, borderRadius: "50%",
      background: C.accent, border: "none",
      color: "#fff", fontSize: 22, cursor: "pointer",
      boxShadow: C.shadowLg, zIndex: 999,
    }}>💬</button>
  );

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20,
      width: 420, maxHeight: "80vh",
      borderRadius: 16, background: C.white,
      boxShadow: C.shadowLg, zIndex: 999,
      display: "flex", flexDirection: "column",
      overflow: "hidden", border: `1px solid ${C.border}`,
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", background: C.accent, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Sales Master</span>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {showWelcome && msgs.length === 0 && (
          <div style={{ textAlign: "center", color: C.textDim, fontSize: 12, padding: "16px 0" }}>
            <div style={{ marginBottom: 12 }}>Hi! What can I help with today?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)} style={{
                  background: C.accentLight, border: `1px solid #bfdbfe`,
                  borderRadius: 8, padding: "8px 10px", fontSize: 11,
                  color: C.accent, fontWeight: 500, cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left",
                }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            alignItems: "flex-end", gap: 8,
          }}>
            <div style={{
              maxWidth: "75%",
              background: m.role === "user" ? C.accent : C.accentLight,
              color: m.role === "user" ? "#fff" : C.text,
              borderRadius: 12, padding: "10px 14px",
              fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", wordWrap: "break-word",
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 4, padding: "8px 0" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: C.textDim, opacity: 0.3 + i * 0.2,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Message..."
            style={{
              flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: "8px 10px", fontSize: 12, fontFamily: "inherit", outline: "none", color: C.text,
            }} disabled={loading} />
          <button onClick={() => send()} style={{ background: C.accent, border: "none", borderRadius: 6, padding: "8px 12px", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600 }} disabled={loading}>Send</button>
          <button onClick={startVoice} style={{ background: recording ? C.red : C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", color: recording ? "#fff" : C.accent, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }} disabled={loading}>🎤</button>
        </div>
      </div>
    </div>
  );
}
