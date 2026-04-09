// ─────────────────────────────────────────────────────────────────────────────
// NEXTDOT STRATEGIC AI PARTNER
// Drop-in replacement for the SalesChatbot component in nextdot-sales-v5.jsx
//
// HOW TO INTEGRATE:
// 1. Copy this entire file into your project as src/StrategicAI.js
// 2. In src/App.js, replace:
//      import { SalesChatbot } from './App'  (or wherever it's defined)
//    with:
//      import StrategicAI from './StrategicAI'
// 3. In the Root App return, replace:
//      <SalesChatbot deals={deals} ... />
//    with:
//      <StrategicAI deals={deals} activity={activity} winLoss={winLoss}
//                   setView={setView} setCoachDeal={setCoachDeal} role={role} />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";

// ── NEXTDOT MASTER KNOWLEDGE BASE ─────────────────────────────────────────────
// This is the full encoded intelligence of Nextdot.
// Update this as the company evolves. Every AI response draws from this.

const NEXTDOT_KNOWLEDGE = `
═══════════════════════════════════════════════════════════════
NEXTDOT MASTER BRIEF — CONFIDENTIAL STRATEGIC CONTEXT
Last updated: April 2026
═══════════════════════════════════════════════════════════════

COMPANY IDENTITY
───────────────
Nextdot builds enterprise-grade agentic AI systems — voice agents, compliance tools, and custom AI workflows — for regulated industries like healthcare, pharma, and manufacturing.

Legal entity: Three Legged Voyager Pvt. Ltd. | Brand: Nextdot
DPIIT Recognition: Certificate No. DIPP252870, AI Industry sector, valid until 2033
Offices: Gurgaon HQ (client-facing), Mumbai Ghatkopar (branch), Jamshedpur (AI Capability Center)
Team: ~30 people across AI Engineering, AI Creative, Account Management, Social Media

FOUNDER
───────
Ayush Prashar — CEO & Founder. Started the company in 2018. Currently sole strategic seller.
The last 8 years have been portfolio-building and learning. FY 26-27 is the hard reset year.
Personal goal: Strong brand as India's enterprise AI consultant, structured personal finances.

STRUCTURAL EDGE (the real differentiation)
──────────────────────────────────────────
1. Jamshedpur AI Capability Center: Engineering talent at Tier-2 city cost structure. No Delhi/Mumbai overhead. Can compete on quality with Bangalore firms at margins no Delhi/Mumbai firm can match. This is the moat.
2. Domain depth in regulated industries: Not an AI vendor dropping in generic tools. Builds from scratch for healthcare/pharma/manufacturing contexts.
3. Client roster proves enterprise credibility: Narayana Health, Fortis, Mankind Pharma, Wockhardt, Hero MotoCorp, Radico Khaitan, Clove Dental, Gleneagles.
4. Neither agency nor IT vendor: sits in a category gap that large SIs can't move fast enough to fill in the next 18–36 months.

CURRENT STAGE
────────────
Late transition. Revenue model, team structure, GTM still carry legacy agency DNA.
Past zero-to-one. In the messy one-to-ten phase.
Old model (creative/social retainers) still pays bills but can't take Nextdot to the vision.
Identity is clear. Execution infrastructure isn't fully there yet.

BUSINESS MODEL
──────────────
Hybrid: retainer (legacy social/content) + project (AI builds) + emerging SaaS (NextComply)

Pricing reality:
- Legacy retainers: ₹1–3L/month (creative/social work — declining strategic priority)
- AI project deals: ₹5–25L depending on scope (BEING UNDERPRICED vs. ROI delivered)
- Target AI retainers: ₹3L+/month for ongoing AI support
- Big deal definition: ₹25L–₹1Cr+ multi-phase AI transformation engagements
- Small deal: ₹3–8L one-time or ₹1–2L/month retainer

REVENUE STREAMS (what they actually mean)
─────────────────────────────────────────
1. AI Solutions (core, highest margin):
   Bespoke builds — voice agents, agentic workflows, RAG-based tools, custom compliance systems.
   One-time project + support retainer. This is the strategic center.

2. AI Products (NextComply AI + future vertical tools):
   SaaS-style recurring revenue. Still early-stage/pilot.
   The long-term IP play. Most important to protect and accelerate.

3. Services (legacy creative, content, social, digital marketing):
   Still cash-flowing. Strategically declining share.
   Do NOT kill prematurely — it funds the transition.
   Goal: stabilise, not grow. Let AI Solutions overtake it naturally.

FY 26-27 TARGETS
────────────────
Revenue: ₹4–6 Cr total billing. AI Solutions + Products must be ≥50% of mix (up from <20% today).
Stretch: ₹8 Cr if 2–3 large enterprise AI engagements close in H1.
Headcount: 30 → 40–45. Growth almost entirely in AI Engineering (Jamshedpur) + 1 senior Sales/BD.
Legacy creative headcount: flat or slight reduction through attrition.

KEY FY 26-27 WINS REQUIRED:
- 3–5 active enterprise AI retainers above ₹3L/month
- NextComply AI: 2–3 paying healthcare clients beyond pilot
- 1 senior Sales/BD hire so Ayush isn't sole seller
- Ayush's personal brand: speaking invitations, inbound LinkedIn leads
- Founding team of 4–5 with equity/profit-share locked in
- Ayush's personal finances on structured trajectory, separated from company cash flow

VISION 2030
───────────
Size: ₹25–40 Cr revenue, 80–120 people, majority in Jamshedpur
Positioning: THE enterprise agentic AI firm from India for healthcare and industrial AI.
Not a services body shop. Not a product startup.
A focused solutions company with proprietary IP (NextComply + 2–3 other vertical products).
Markets: India → Southeast Asia → Middle East → Australia/UK

THE BIG BET:
Agentic AI for regulated industries becomes a category.
Nextdot owns that category in Indian mid-market and emerging markets
before large SIs (Wipro, Infosys) move downstream to take it.
The window: 18–36 months.
The Jamshedpur model makes the unit economics work in a way no Bangalore/Delhi firm can replicate at speed.

IDEAL CLIENT PROFILE
─────────────────────
PERFECT clients (tier 1):
- Large hospital chains / healthcare systems (Narayana Health model)
- Mid-large pharma companies with regulatory/compliance complexity (Mankind Pharma model)
- Large manufacturers with operational scale and enterprise IT maturity (Hero MotoCorp — if deepened into AI)

These clients have: budget, patience, internal stakeholders who need convincing, compliance/operational complexity that makes AI ROI real and measurable.

BAD-FIT clients (avoid actively):
- SMEs or startups wanting "AI" at agency pricing with no budget or patience
- Clients who see Nextdot as a vendor to execute specs, not a thinking partner
- Companies in verticals with no regulatory/operational complexity (AI value case is thin)
- Existing creative/social clients wanting AI thrown in as free add-on
- Clients who hired Nextdot for brand work and now want AI "as part of the same budget"

VERTICAL PRIORITIES FY 26-27:
Tier 1: Healthcare & Hospital Systems | Pharma & Life Sciences
Tier 2: Manufacturing & Industrials
Hold only (no new acquisition): FMCG, Retail

TEAM
────
Ayush Prashar: CEO, Founder, currently sole strategic seller. This is a critical weakness.
Snigdha Raj: Business Head (previously Creative Director). Delivery anchor. Strong in pitch/proposal phase (execution credibility). Not a hunter. On path to founding team member in ~12 months. FY 26-27 role: Revenue Maximisation + heading business operations.
Tanvi Nair: AI Engineer
Ravi Kumar: Video & Content Lead (also operates WellAware Media YouTube channels)
Bhawna: Head of Creative & Content — departed March 31, 2026 (positive terms). Invisible load now on Snigdha.

JAMSHEDPUR AI CAPABILITY CENTER
────────────────────────────────
Engineering core. Young, trained AI talent at Tier-2 city cost structures.
This is the structural moat — Delhi/Mumbai overhead-free engineering at Bangalore-competitive quality.
Role: Makes Nextdot's margin structure viable for enterprise pricing.
Most important operational priority of FY 26-27: hiring, retaining, culture-building here.
Gurgaon = the face. Mumbai = the relationship. Jamshedpur = the machine.

NEXTCOMPLY AI (flagship product)
─────────────────────────────────
Problem solved: Healthcare compliance in India is documentation-heavy, manual, error-prone.
NextComply AI helps compliance officers, quality managers, and pharma regulatory teams check documents, SOPs, processes against NABH, CDSCO, and other regulatory frameworks — with AI-flagged gaps.
Target user: Compliance Head / Quality Assurance Lead at mid-to-large hospital chain or pharma company.
Current status: MVP/early pilot. Not yet live commercial SaaS. Functional enough to demonstrate.
Needs: 1–2 real-world pilot clients to harden the product and build the case study.
Right sales motion: Land-and-expand via existing relationships (Narayana Health, Fortis).
DO NOT sell cold. Get one hospital group live → document ROI → use as anchor for outbound.
Sales cycle reality: 6–12 months for institutional healthcare buyers.
Implication: Pilot must start NOW if FY 26-27 revenue is expected.

SALES WEAK POINTS (honest internal assessment)
───────────────────────────────────────────────
1. Pipeline stalls at proposal-to-closure stage:
   - No structured follow-up cadence
   - Proposals may be custom documents vs. replicable templates
   - Enterprise decision-maker needs multiple touchpoints before committing to unfamiliar AI build

2. Hardest part of the sale:
   Helping the client articulate internal ROI to THEIR OWN stakeholders.
   The Nextdot contact (CMO/CTO/Innovation Head) often gets it — but must justify AI spend internally.
   Nextdot doesn't yet have tight case studies and ROI numbers to make that internal justification easy.

3. Most common objections:
   - "We're already working with [large IT vendor] on AI" → positioning problem
   - "Can you show us where you've done this before?" → case study gap
   - "Our IT team needs to approve this" → stakeholder navigation problem
   - "Let's start small and see" → becomes a tiny pilot that never scales

4. No dedicated sales function: Ayush is sole strategic seller. This is unsustainable at scale.

STRATEGIC CONTEXT FOR AI CONVERSATIONS
────────────────────────────────────────
Key tensions to hold:
- Legacy revenue (services) funds the transition but creates identity confusion with clients
- Jamshedpur is the moat but needs investment in culture/retention before it becomes a liability
- Ayush as sole seller creates pipeline dependency — any strategic conversation should probe this
- NextComply needs to move from "interesting demo" to "paying pilot" — urgency here is HIGH
- The 18–36 month window before large SIs crowd the space is real and should shape urgency

What "good" looks like for Nextdot right now:
- Closing 1 large enterprise AI retainer (₹3L+/month) per quarter
- Getting NextComply into one serious pilot by June 2026
- Hiring 1 senior Sales/BD person by Q2 FY 26-27
- Building 3 tight case studies (Narayana, Wockhardt, one other) to unlock sales motion
- Snigdha taking ownership of delivery metrics so Ayush can focus on growth

Current funded priorities: SIDBI startup loan (₹50–75L), IndiaAI compute credits (~₹40L equiv.), IndiaAI Innovation Challenge 2026, GeM portal registration.
═══════════════════════════════════════════════════════════════
`;

// ── CONVERSATION MODES ────────────────────────────────────────────────────────
const MODES = {
  strategy: {
    label: "Strategy",
    icon: "◈",
    color: "#4B6BFB",
    desc: "Quarterly planning, growth strategy, big decisions",
    primer: "Let's think strategically. What's the most important thing on your mind for Nextdot right now — pipeline, team, product, or positioning?",
  },
  pipeline: {
    label: "Pipeline",
    icon: "▲",
    color: "#12b76a",
    desc: "Live deal analysis, follow-up priorities, forecast",
    primer: "I've reviewed your live pipeline. Want me to start with the deals that need your attention most urgently, or would you rather talk through a specific deal?",
  },
  coach: {
    label: "Sales Coach",
    icon: "✦",
    color: "#7c60d5",
    desc: "Call prep, objection handling, deal coaching",
    primer: "Sales coaching mode. Tell me about the deal or client situation — I'll help you prepare, strategise, or think through the conversation.",
  },
  nextcomply: {
    label: "NextComply",
    icon: "⬡",
    color: "#0e9384",
    desc: "NextComply AI go-to-market and pilot strategy",
    primer: "NextComply AI is your most time-sensitive product priority. The 6–12 month healthcare sales cycle means the clock is ticking for FY 26-27 revenue. What do you want to work through — pilot strategy, product positioning, or a specific target account?",
  },
  team: {
    label: "Team & Ops",
    icon: "◎",
    color: "#f79009",
    desc: "Hiring, Snigdha, Jamshedpur, org structure",
    primer: "Let's talk team and operations. What's the burning issue — the Jamshedpur buildout, Snigdha's transition, the Sales/BD hire, or something else?",
  },
  open: {
    label: "Open Chat",
    icon: "💬",
    color: "#6b7280",
    desc: "Free conversation — anything on your mind",
    primer: null,
  },
};

// ── SYSTEM PROMPT BUILDER ─────────────────────────────────────────────────────
function buildSystemPrompt(mode, deals, activity, winLoss) {
  const active = deals.filter(d => !["Closed Won", "Closed Lost"].includes(d.stage));
  const won = deals.filter(d => d.stage === "Closed Won");
  const stale = active.filter(d => parseInt(d.lastTouch || 0) > 14);
  const overdue = active.filter(d => d.nextDate && new Date(d.nextDate) <= new Date());
  const highPriority = active.filter(d => d.priority === "high");

  const pipelineSummary = `
LIVE PIPELINE SNAPSHOT (as of today):
Total active: ${active.length} deals worth ₹${active.reduce((s, d) => s + parseFloat(d.value || 0), 0)}L
High priority: ${highPriority.length} deals (${highPriority.map(d => `${d.client} ₹${d.value}L`).join(", ")})
Overdue actions: ${overdue.length} deals (${overdue.map(d => d.client).join(", ") || "none"})
Stale >14 days: ${stale.length} deals (${stale.map(d => `${d.client} (${d.lastTouch}d)`).join(", ") || "none"})
Closed Won: ${won.length} deals worth ₹${won.reduce((s, d) => s + parseFloat(d.value || 0), 0)}L
Pending handoffs: ${won.filter(d => d.handoffDone !== "true" && d.handoffDone !== true).length}

Active deals detail:
${active.map(d => `- ${d.client} | ₹${d.value}L | ${d.stage} | ${d.priority} priority | Owner: ${d.owner} | ${d.lastTouch}d since last touch | Next: ${d.nextAction} (${d.nextDate})`).join("\n")}
${winLoss.length > 0 ? `\nWin/Loss patterns (${winLoss.length} records):\n${winLoss.slice(-10).map(w => `${w.result.toUpperCase()}: ${w.client} — ${w.reason}`).join("\n")}` : ""}
${activity.length > 0 ? `\nRecent activity (last 10):\n${activity.slice(-10).map(a => `${a.client}: ${a.type} — ${a.note}`).join("\n")}` : ""}`;

  const modeInstructions = {
    strategy: `You are in STRATEGY MODE. Focus on big-picture thinking: quarterly goals, market positioning, team structure, the transition from agency to AI firm, Vision 2030 progress. Ask probing questions. Challenge assumptions. Don't just validate — push back when the thinking isn't sharp enough. Use the Nextdot knowledge base to anchor every strategic conversation in specific Nextdot realities.`,
    pipeline: `You are in PIPELINE MODE. You have full visibility of the live pipeline. Analyse it like a seasoned sales director — not just listing facts but interpreting them. Flag what's at risk. Identify the highest-leverage actions. Call out stalling patterns. Be specific with client names and numbers.`,
    coach: `You are in SALES COACH MODE. Act like a senior B2B enterprise sales coach who knows Nextdot deeply. When someone describes a deal situation, give specific, tactical advice — not generic sales theory. Help with call prep, objection responses, stakeholder navigation, pricing conversations. Always tie advice back to Nextdot's specific positioning and the client's industry context.`,
    nextcomply: `You are in NEXTCOMPLY MODE. NextComply AI is the most time-sensitive strategic priority. It needs to move from demo to paying pilot before June 2026 given the 6–12 month healthcare sales cycle. Think like a product GTM strategist. Help plan pilot conversations, navigate hospital procurement, build the ROI case, and think through the land-and-expand motion via existing relationships.`,
    team: `You are in TEAM & OPS MODE. Focus on org design, hiring decisions, Snigdha's transition to Business Head, the Jamshedpur capability center buildout, and the critical need for a dedicated Sales/BD hire. Be direct about the risks of Ayush remaining the sole strategic seller.`,
    open: `You are in free conversation mode. Engage with whatever Ayush brings — strategic, tactical, personal about the business. Be a sharp, honest thinking partner.`,
  };

  return `You are Nextdot's Strategic AI Partner — a deeply briefed, senior-level advisor to Ayush Prashar, CEO and Founder of Nextdot Digital Solutions.

You are NOT a generic AI assistant. You know Nextdot's full context intimately. You think like a combination of:
- A senior enterprise sales director who has built AI practices in India
- A startup strategy advisor who understands the one-to-ten growth phase
- A chief of staff who knows the internal priorities, tensions, and goals

${modeInstructions[mode]}

CORE PRINCIPLES:
1. Always be specific — use real client names, ₹ numbers, timelines from context
2. Be honest, not just supportive — challenge weak thinking, flag real risks
3. Ask one sharp follow-up question to go deeper, don't just answer and stop
4. Keep responses focused — no walls of generic text. Dense, specific, useful.
5. Address Ayush as Ayush. Treat him as a peer, not a user.
6. When you spot a pattern or risk in the data, name it clearly.
7. Prioritise time-sensitive issues (NextComply pilot urgency, 18-36 month window)

NEXTDOT MASTER KNOWLEDGE BASE:
${NEXTDOT_KNOWLEDGE}

${pipelineSummary}`;
}

// ── SUGGESTED PROMPTS per mode ────────────────────────────────────────────────
const SUGGESTIONS = {
  strategy: [
    "Am I spending my time on the right things this week?",
    "What's our biggest strategic risk right now?",
    "How should I think about the agency-to-AI transition this quarter?",
    "What would make FY 26-27 a clear win by March?",
    "Help me think through the founding team structure",
  ],
  pipeline: [
    "What should I focus on today?",
    "Which deals are at risk of going cold?",
    "Where is the pipeline stalling?",
    "Give me an honest forecast for this month",
    "Who needs a follow-up right now?",
  ],
  coach: [
    "Help me prep for a call with a hospital CTO",
    "They said they're already working with Infosys on AI",
    "How do I respond to 'let's start small'?",
    "Help me build the ROI case for a pharma client",
    "How do I navigate IT team approval blockers?",
  ],
  nextcomply: [
    "How do I get the Narayana Health pilot started?",
    "What's the right pricing for a pilot vs full contract?",
    "Help me position NextComply against manual compliance processes",
    "What does a winning pilot scope look like?",
    "How do I handle 'our compliance team is skeptical'?",
  ],
  team: [
    "What kind of Sales/BD person do I hire first?",
    "How do I structure Snigdha's transition to Business Head?",
    "What's the right hiring plan for Jamshedpur this year?",
    "How do I retain AI engineers in a Tier-2 city?",
    "When should I start building the founding team?",
  ],
  open: [
    "What's the most important thing I'm not thinking about?",
    "Am I underpricing our AI work?",
    "How do I get more inbound leads from my personal brand?",
    "What should Nextdot stop doing this year?",
    "Help me think through my personal finances and the company",
  ],
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function StrategicAI({ deals = [], activity = [], winLoss = [], setView, setCoachDeal, role }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("open");
  const [conversations, setConversations] = useState({
    strategy: [], pipeline: [], coach: [], nextcomply: [], team: [], open: [],
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const bottomRef = useRef();
  const recRef = useRef(null);
  const textareaRef = useRef(null);
  const [hasGreeted, setHasGreeted] = useState({});

  const msgs = conversations[mode] || [];
  const currentMode = MODES[mode];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, loading, mode]);

  // Auto-greet when switching to a mode for the first time
  useEffect(() => {
    if (open && !hasGreeted[mode] && currentMode.primer) {
      const greeting = { role: "assistant", text: currentMode.primer, ts: Date.now() };
      setConversations(prev => ({ ...prev, [mode]: [greeting] }));
      setHasGreeted(prev => ({ ...prev, [mode]: true }));
    }
  }, [mode, open]);

  async function send(override) {
    const msg = (override || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", text: msg, ts: Date.now() };
    const currentHistory = [...msgs, userMsg];
    setConversations(prev => ({ ...prev, [mode]: currentHistory }));
    setLoading(true);

    const systemPrompt = buildSystemPrompt(mode, deals, activity, winLoss);
    const apiHistory = currentHistory.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.text,
    }));

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
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiHistory,
        }),
      });

      const data = await res.json();
      let reply = data.content?.find(b => b.type === "text")?.text || "Something went wrong.";

      // Parse navigation actions
      const navMatch = reply.match(/\[ACTION:navigate:(\w+)\]/);
      const coachMatch = reply.match(/\[ACTION:coach:([^\]]+)\]/);
      if (navMatch) { setTimeout(() => setView(navMatch[1]), 400); reply = reply.replace(/\[ACTION:navigate:\w+\]/, "").trim(); }
      if (coachMatch) {
        const n = coachMatch[1];
        const d = deals.find(x => x.client.toLowerCase().includes(n.toLowerCase()));
        if (d) { setTimeout(() => { setCoachDeal(d); setView("coach"); }, 400); }
        reply = reply.replace(/\[ACTION:coach:[^\]]+\]/, "").trim();
      }

      const assistantMsg = { role: "assistant", text: reply, ts: Date.now() };
      setConversations(prev => ({
        ...prev,
        [mode]: [...currentHistory, assistantMsg],
      }));
    } catch {
      setConversations(prev => ({
        ...prev,
        [mode]: [...currentHistory, { role: "assistant", text: "Connection error. Try again.", ts: Date.now() }],
      }));
    }
    setLoading(false);
  }

  function clearMode() {
    setConversations(prev => ({ ...prev, [mode]: [] }));
    setHasGreeted(prev => ({ ...prev, [mode]: false }));
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome browser."); return; }
    const rec = new SR();
    rec.lang = "en-IN"; rec.continuous = false; rec.interimResults = false;
    rec.onstart = () => setRecording(true);
    rec.onresult = e => {
      const t = e.results[0][0].transcript;
      setRecording(false);
      setInput(t);
      setTimeout(() => send(t), 150);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start(); recRef.current = rec;
  }
  function stopVoice() { recRef.current?.stop(); setRecording(false); }

  // Count unread / active conversations
  const activeModes = Object.entries(conversations).filter(([, msgs]) => msgs.length > 1).length;

  // ── CLOSED STATE ──────────────────────────────────────────────────────────
  if (!open) {
    return (
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 500, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        {/* Mode quick-access pills when closed */}
        <button
          onClick={() => setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "linear-gradient(135deg,#4B6BFB,#7c3aed)",
            border: "none", borderRadius: 28, cursor: "pointer",
            padding: "12px 20px", color: "#fff",
            boxShadow: "0 4px 24px rgba(75,107,251,.45)",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          <span style={{ fontSize: 18 }}>🧠</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Strategic AI</div>
            <div style={{ fontSize: 10, opacity: .8 }}>
              {activeModes > 0 ? `${activeModes} active conversation${activeModes > 1 ? "s" : ""}` : "Nextdot Intelligence"}
            </div>
          </div>
          {activeModes > 0 && (
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#f79009", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{activeModes}</div>
          )}
        </button>
      </div>
    );
  }

  // ── OPEN STATE ────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 500,
      width: 480, height: 680,
      background: "#fff",
      borderRadius: 20,
      boxShadow: "0 16px 64px rgba(0,0,0,.2), 0 4px 16px rgba(0,0,0,.1)",
      border: "1px solid #eaeaf0",
      display: "flex", flexDirection: "column", overflow: "hidden",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "0 0 0 0",
        background: "linear-gradient(135deg,#4B6BFB,#7c3aed)",
        flexShrink: 0,
      }}>
        <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧠</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Strategic AI Partner</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.75)", marginTop: 1 }}>
                Nextdot Intelligence · {deals.length} deals live
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {msgs.length > 1 && (
              <button onClick={clearMode} title="Clear this conversation" style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 7, padding: "4px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
            )}
            <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, width: 28, height: 28, color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", overflowX: "auto", padding: "0 12px 0" }}>
          {Object.entries(MODES).map(([key, m]) => {
            const isActive = mode === key;
            const hasConvo = (conversations[key] || []).length > 1;
            return (
              <button key={key} onClick={() => setMode(key)} style={{
                padding: "8px 12px", background: "none", border: "none",
                borderBottom: isActive ? "2px solid #fff" : "2px solid transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,.6)",
                fontWeight: isActive ? 600 : 400, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 5,
                transition: "all .15s",
              }}>
                <span>{m.icon}</span>
                {m.label}
                {hasConvo && !isActive && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f79009", display: "inline-block" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode description bar */}
      <div style={{ padding: "8px 16px", background: "#f8f8fc", borderBottom: "1px solid #eaeaf0", fontSize: 11, color: "#8080a8", flexShrink: 0 }}>
        {currentMode.icon} <strong style={{ color: "#4B6BFB" }}>{currentMode.label}</strong> — {currentMode.desc}
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Empty state with suggestions */}
        {msgs.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: "#8080a8", marginBottom: 4 }}>Suggested questions:</div>
            {(SUGGESTIONS[mode] || []).map((s, i) => (
              <button key={i} onClick={() => send(s)} style={{
                padding: "9px 14px", background: "#f5f5f8",
                border: "1px solid #eaeaf0", borderRadius: 10,
                color: "#374151", fontSize: 12, textAlign: "left",
                cursor: "pointer", fontFamily: "inherit", lineHeight: 1.4,
                transition: "all .12s",
              }}>{s}</button>
            ))}
          </div>
        )}

        {/* Messages */}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
            {m.role === "assistant" && (
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: `linear-gradient(135deg,${currentMode.color},#7c3aed)`,
                flexShrink: 0, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 12, color: "#fff", marginBottom: 2,
              }}>{currentMode.icon}</div>
            )}
            <div style={{
              maxWidth: "78%",
              padding: "11px 14px",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
              background: m.role === "user" ? "#4B6BFB" : "#f5f5f8",
              color: m.role === "user" ? "#fff" : "#0c0c1d",
              fontSize: 13, lineHeight: 1.7,
              border: m.role === "assistant" ? "1px solid #eaeaf0" : "none",
              whiteSpace: "pre-wrap",
            }}>{m.text}</div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${currentMode.color},#7c3aed)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>{currentMode.icon}</div>
            <div style={{ padding: "12px 16px", background: "#f5f5f8", borderRadius: "4px 16px 16px 16px", border: "1px solid #eaeaf0", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: currentMode.color, animation: `blink 1.2s ${i * .2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #eaeaf0", flexShrink: 0, background: "#fff" }}>
        {recording && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#fef2f2", borderRadius: 8, marginBottom: 8, fontSize: 11, color: "#f04438" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f04438", animation: "blink .8s infinite" }} />
            Listening... tap to stop
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask ${currentMode.label.toLowerCase()}... (Enter to send, Shift+Enter for newline)`}
            rows={2}
            style={{
              flex: 1, background: "#f5f5f8", border: "1px solid #eaeaf0",
              borderRadius: 12, padding: "10px 13px", fontSize: 13,
              fontFamily: "inherit", outline: "none", resize: "none",
              color: "#0c0c1d", lineHeight: 1.5,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              onClick={recording ? stopVoice : startVoice}
              title={recording ? "Stop recording" : "Voice input (Chrome)"}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: recording ? "#fef2f2" : "#eef1ff",
                border: `1.5px solid ${recording ? "#f04438" : "#4B6BFB"}`,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: recording ? "#f04438" : "#4B6BFB",
                boxShadow: recording ? "0 0 0 3px rgba(240,68,56,.2)" : "none",
                transition: "all .2s",
              }}
            >{recording ? "⏹" : "🎙"}</button>
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: input.trim() && !loading ? currentMode.color : "#e8e8f0",
                border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: input.trim() && !loading ? "#fff" : "#c0c0d8",
                transition: "all .15s",
              }}
            >→</button>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#c0c0d8", marginTop: 6, textAlign: "center" }}>
          Conversations persist across modes this session · Voice requires Chrome
        </div>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
