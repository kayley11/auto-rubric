import { useEffect, useState } from "react";
import { request } from "./StudyTools";
import "./workspace-account.css";

export function WorkspaceAccount({ access }) {
  const [data, setData] = useState({connections: [], providers: {}});
  const [members, setMembers] = useState(null);
  const [form, setForm] = useState({label: "", provider: "kcl", api_key: "", remember: false});
  const [invitation, setInvitation] = useState({member_id: "", role: "reviewer"});
  const [link, setLink] = useState("");
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const [models, setModels] = useState([]);
  const [tab,setTab] = useState(access?.can_manage_rubric ? "members" : "connections");
  useEffect(() => {setTab(access?.can_manage_rubric ? "members" : "connections");},[access?.member_id]);
  async function refresh() {
    setData(await request("/api/connections"));
    if (access?.can_manage_rubric) setMembers(await request("/api/members"));
  }
  useEffect(() => {
    if (access?.authenticated) refresh().catch(e => setError(e.message));
  }, [access?.member_id, access?.authenticated]);
  async function operate(action) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault();
    await operate(async () => {
      await request("/api/connections", form);
      setForm(f => ({...f, api_key: "", label: ""}));
      await refresh();
      window.dispatchEvent(new Event("arena-connections-updated"));
      setNotice("Connection saved for your account. Choose it in New evaluation.");
    });
  }
  async function invite(event) {
    event.preventDefault();
    await operate(async () => {
      const result = await request("/api/members/invitations", invitation);
      setLink(window.location.origin + result.invite_path);
      await refresh();
      setNotice(result.message);
    });
  }
  if (!access?.authenticated) return <main className="account-page"><h1>Account & API connections</h1><p>Sign in to manage your own connections. Reviewing saved answers does not require an API key.</p><button className="primary" onClick={() => window.dispatchEvent(new Event("arena-sign-in"))}>Sign in</button></main>;
  return <main className="account-page">
    <div className="page-heading"><span className="eyebrow">WORKSPACE ACCOUNT</span><h1>Account & API connections</h1><p>Signed in as <strong>{access.member_id}</strong> · {access.role}. Your ratings are saved under this account.</p></div>
    <div className="account-shortcuts"><a href="/#review">My reviews</a>{access.can_evaluate && <a href="/#evaluate">New evaluation</a>}</div><nav className="review-progress-filters" aria-label="Account settings"><button className="secondary" aria-pressed={tab==="connections"} onClick={() => setTab("connections")}>API connections</button>{access.can_manage_rubric && <button className="secondary" aria-pressed={tab==="members"} onClick={() => setTab("members")}>Members & invitations</button>}</nav>
    {error && <p className="error-banner" role="alert">{error}</p>}
    {notice && <p className="notice" role="status">{notice}</p>}
    {tab === "connections" && <section className="panel"><h2>Personal API connections</h2><p>Optional. You can review saved answers without configuring a model connection.</p>{!access.can_evaluate && <p className="notice">This account has reviewer access. An administrator must grant evaluator access before you can generate or score new answers.</p>}<p className="field-help">Keys are encrypted on the backend and are never shown again. New evaluations can use separate connections for generating and scoring. Provider usage is charged to, or limited by, that key.</p>
      <form onSubmit={save} className="account-form">
        <label className="field">Connection label<input required maxLength={80} value={form.label} onChange={e => setForm({...form,label:e.target.value})} placeholder="My research connection" autoComplete="off"/></label>
        <label className="field">Provider<select value={form.provider} onChange={e => setForm({...form,provider:e.target.value})}>{Object.entries(data.providers).map(([id,p]) => <option key={id} value={id}>{p.name}</option>)}</select></label>
        <label className="field account-wide">API key<input type="password" required minLength={12} maxLength={1024} autoComplete="off" spellCheck={false} value={form.api_key} onChange={e => setForm({...form,api_key:e.target.value})}/></label>
        <label className="account-wide account-check"><input type="checkbox" checked={form.remember} onChange={e => setForm({...form,remember:e.target.checked})}/>Keep for future sessions. Otherwise this connection expires after eight hours.</label>
        <button className="primary" disabled={busy}>Save connection</button>
      </form>
      <div className="account-connections">{data.connections.map(c => <article key={c.id}><div><strong>{c.label}</strong><small>{data.providers[c.provider]?.name || c.provider} · {c.expires ? "Expires " + new Date(c.expires*1000).toLocaleString() : "Saved for future sessions"}</small></div><button className="secondary" disabled={busy} onClick={() => operate(async () => {const result = await request(`/api/connections/${c.id}/test`, {}); setModels(result.models); setNotice(result.message);})}>Test connection</button><button className="text-button" disabled={busy} onClick={() => operate(async () => {await request(`/api/connections/${c.id}/remove`, {}); await refresh(); window.dispatchEvent(new Event("arena-connections-updated"));})}>Remove</button></article>)}{!data.connections.length && <p>No personal connections saved. The project connection remains available where configured.</p>}</div>
      {!!models.length && <details><summary>Available model IDs · {models.length}</summary><p className="account-models">{models.join("\n")}</p></details>}
    </section>}
    {access.can_manage_rubric && tab === "members" && <section className="panel"><h2>Invite workspace members</h2><p>Each clinician receives an individual login. Reviewer access can score saved answers; evaluator access can also run models. Rubric editing remains restricted to administrators.</p>
      <form onSubmit={invite} className="account-form"><label className="field">New account ID<input required pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,39}" maxLength={40} value={invitation.member_id} onChange={e => setInvitation({...invitation,member_id:e.target.value})} placeholder="reviewer_01"/></label><label className="field">Access<select value={invitation.role} onChange={e => setInvitation({...invitation,role:e.target.value})}><option value="reviewer">Reviewer · score saved answers</option><option value="evaluator">Evaluator · review and run models</option></select></label><button className="primary" disabled={busy}>Create one-use invitation</button></form>
      {link && <div className="account-invite"><label className="field">Private invitation link<input readOnly value={link} onFocus={e => e.target.select()}/></label><button className="secondary" onClick={() => operate(async () => {await navigator.clipboard.writeText(link); setNotice("Invitation copied. Share it privately with this clinician.");})}>Copy link</button><p>Valid for seven days. The clinician sets their own password. Creating a replacement invitation invalidates the earlier unused link.</p></div>}
      {members && <div className="table-scroll"><table><thead><tr><th>Account ID</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{members.members.map(m => <tr key={m.id}><td>{m.id}</td><td>{m.role === "admin" ? "Administrator" : <select aria-label={`Access for ${m.id}`} value={m.role} disabled={busy} onChange={e => operate(async () => {await request(`/api/members/${m.id}/update`,{role:e.target.value});await refresh();})}><option value="reviewer">Reviewer</option><option value="evaluator">Evaluator</option></select>}</td><td>{m.active ? "Active" : "Disabled"}</td><td>{m.role !== "admin" && <><button className="text-button" disabled={busy} onClick={() => operate(async () => {const result=await request(`/api/members/${m.id}/reset-invite`,{});setLink(window.location.origin+result.invite_path);setNotice("One-use password reset link created. Share it privately with this member.");await refresh();})}>Reset sign-in</button><button className="text-button" disabled={busy} onClick={() => operate(async () => {await request(`/api/members/${m.id}/update`,{active:!m.active});await refresh();})}>{m.active ? "Disable" : "Enable"}</button></>}</td></tr>)}</tbody></table></div>}
    </section>}
  </main>;
}

export function JoinWorkspace() {
  const [password,setPassword] = useState(""), [confirm,setConfirm] = useState("");
  const [busy,setBusy] = useState(false), [error,setError] = useState("");
  async function accept(event) {
    event.preventDefault(); setError("");
    if (password !== confirm) {setError("The passwords do not match."); return;}
    setBusy(true);
    try {
      const response = await fetch("/api/access/accept-invite", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:window.location.hash.split("/")[1] || "", password})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "This invitation could not be accepted.");
      setPassword(""); setConfirm(""); window.location.replace("/#review"); window.location.reload();
    } catch(e) {setError(e.message);} finally {setBusy(false);}
  }
  return <main className="account-page"><section className="panel"><h1>Join the review workspace</h1><p>Create your personal password. Your ratings will be recorded under the invited account; no API key is needed to review saved answers.</p><form className="account-form" onSubmit={accept}><label className="field account-wide">New password<input type="password" autoComplete="new-password" required minLength={16} maxLength={256} value={password} onChange={e => setPassword(e.target.value)}/><small>Use at least 16 characters.</small></label><label className="field account-wide">Confirm password<input type="password" autoComplete="new-password" required minLength={16} maxLength={256} value={confirm} onChange={e => setConfirm(e.target.value)}/></label>{error && <p className="error-banner account-wide" role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy ? "Joining…" : "Join and open my reviews"}</button></form></section></main>;
}
