import { useEffect, useRef, useState } from "react";
import { BookOpen, ExternalLink, RefreshCw } from "lucide-react";
import { sourceSegments, sourceMatchLabel } from "./articleEvidence.mjs";
import { ClinicalText } from "./ClinicalText";
import { displayText } from "./presentation.mjs";
import "./source-evidence.css";

const visibility = {visible:"Model-visible in extraction",hidden:"Hidden / later result",uncertain:"Needs review",exclude:"Excluded in extraction"};
function scrollWithin(parent, child) {
  if (!parent || !child) return;
  parent.scrollTo({top:Math.max(0, parent.scrollTop + child.getBoundingClientRect().top - parent.getBoundingClientRect().top - 65), behavior:"smooth"});
}

export function SourceEvidence({caseId, caseInfo = {}, access}) {
  const [open,setOpen]=useState(false), [data,setData]=useState(null), [draft,setDraft]=useState("");
  const [busy,setBusy]=useState(false), [error,setError]=useState(""), [needsAccess,setNeedsAccess]=useState(false);
  const [active,setActive]=useState(""), [filter,setFilter]=useState("visible"), [retry,setRetry]=useState(0);
  const sourceRef=useRef(null), cardsRef=useRef(null);
  const signedOut=access?.hosted && !access.authenticated;
  useEffect(()=>{setOpen(false);setData(null);setDraft("");setActive("");setFilter("visible");setError("");},[caseId]);
  useEffect(()=>{
    if(!open || signedOut)return;
    let alive=true;
    const controller=new AbortController();
    setBusy(true);setData(null);setError("");setNeedsAccess(false);setActive("");
    fetch(`/api/literature/cases/${encodeURIComponent(caseId)}/source-evidence${draft ? `?draft_id=${encodeURIComponent(draft)}` : ""}`,{signal:controller.signal,cache:"no-store"})
      .then(async response=>{
        if([401,403].includes(response.status)) {if(alive)setNeedsAccess(true);return null;}
        if(!response.ok)throw new Error(response.status===404 ? "Saved source evidence is not available from this backend. The article link and saved results remain available." : "The saved source could not be loaded. Check that the host computer is online, then retry.");
        return response.json();
      }).then(value=>{if(alive)setData(value);})
      .catch(e=>{if(alive && e.name!=="AbortError")setError(e.message);})
      .finally(()=>{if(alive)setBusy(false);});
    return()=>{alive=false;controller.abort();};
  },[open,caseId,draft,signedOut,retry]);
  useEffect(()=>{
    if(data?.draft?.origin==="archived-passages-v1")setFilter("all");
    const first=data?.items?.find(item=>item.visibility==="visible" && item.position)||data?.items?.find(item=>item.position);
    if(!first)return;
    setActive(first.id);
    const frame=requestAnimationFrame(()=>scrollWithin(sourceRef.current,[...(sourceRef.current?.querySelectorAll("[data-fact-id]")||[])].find(el=>el.dataset.factId===first.id)));
    return()=>cancelAnimationFrame(frame);
  },[data]);
  function choose(id,fromSource=false) {
    setActive(id);
    if(fromSource){
      if(!shown.some(item=>item.id===id))setFilter("all");
      requestAnimationFrame(()=>scrollWithin(cardsRef.current,[...(cardsRef.current?.querySelectorAll("[data-source-card]")||[])].find(el=>el.dataset.sourceCard===id)));
    } else {
      requestAnimationFrame(()=>scrollWithin(sourceRef.current,[...(sourceRef.current?.querySelectorAll("[data-fact-id]")||[])].find(el=>el.dataset.factId===id)));
    }
  }
  const items=data?.items||[];
  const backfilled=data?.draft?.origin==="archived-passages-v1";
  const excerptOnly=data?.source?.source_scope==="saved_excerpt";
  const labels=backfilled ? {visible:"Quoted in saved input",hidden:"Later / interpretative section",uncertain:"Candidate · awaiting confirmation",exclude:"Excluded"} : visibility;
  const shown=items.filter(item=>filter==="all" || (filter==="quoted" ? item.quoted_in_saved_input : item.visibility===filter));
  const location=data?.case?.source_location||caseInfo.source_location;
  const adaptation=displayText(data?.case?.adaptation_note||caseInfo.source_note||"");
  const original=caseInfo.source||data?.case?.source;
  const address=typeof original==="string" ? original.match(/https?:\/\/[^\s<>]+/)?.[0] : null;
  return <details className="source-evidence study-disclosure" open={open} onToggle={e=>{if(e.target===e.currentTarget)setOpen(e.currentTarget.open);}}>
    <summary><BookOpen size={16}/><span>Source evidence<small>Article, passages and adaptation</small></span></summary>
    <div className="se-content">
      <div className="se-meta">
        {address && <a href={address} target="_blank" rel="noreferrer">{caseInfo.source_label||"Read original article"} <ExternalLink size={13}/></a>}
        {!address && <p><strong>Recorded source</strong><br/>{original||"Not recorded for this case."}</p>}
        {(location||adaptation||caseInfo.purpose) && <details><summary>Saved location and adaptation notes</summary>{location && <p>{location}</p>}{adaptation && <ClinicalText as="p" text={adaptation}/>} {caseInfo.purpose && <p><strong>Why selected</strong><br/>{displayText(caseInfo.purpose)}</p>}</details>}
      </div>
      {(signedOut||needsAccess) && <div className="se-empty"><p>Sign in to read saved article text, source passages and hidden results. Published cases and scores remain available without signing in.</p><button type="button" className="secondary" onClick={()=>window.dispatchEvent(new Event("arena-sign-in"))}>Sign in to view source evidence</button></div>}
      {busy && <p role="status">Loading saved source evidence…</p>}
      {error && <div className="se-empty" role="alert"><p>{error}</p><button className="text-button" type="button" onClick={()=>setRetry(n=>n+1)}><RefreshCw size={14}/> Retry</button></div>}
      {data?.status==="no_mapping" && <div className="se-empty"><strong>{data.mapping_record?.status==="missing_full_text" ? "Saved full text not found" : "No verified passage link available"}</strong><p>{data.mapping_record?.reason||"Saved source details are shown above. Exact source passages have not yet been linked to this case in this workspace."}</p>{data.unavailable_source_versions>0 && <p>A saved source version failed its fingerprint check; it has not been substituted with another text.</p>}<p>Restore the original article before confirming passage links. Clinical reference · awaiting confirmation.</p></div>}
      {data?.source && <>
        <div className="se-review-note"><strong>{backfilled ? "Archived source passages · associations awaiting confirmation" : data.binding==="confirmed_case_provenance" ? "Saved case provenance found" : "Same article · adaptation link awaiting review"}</strong><p>{backfilled ? "Passage positions are verified against the saved text. Matching an adapted case to a passage is a separate judgement: wording, patient identity and timing still need review. No source text has been added to answering prompts." : "Colours describe this extraction version, not what the answering model necessarily received. Full article text includes later outcomes and is for source review only."}</p>{excerptOnly && <p><strong>Partial archive.</strong> Only a saved article excerpt is available. The full paper and any omitted tables still need checking.</p>}{data.mapping_record?.status==="cannot_locate" && <p>The source is available, but no sufficiently targeted case-to-passage match was found. Compare it manually before adding a link.</p>}<p>{items.filter(i=>i.position).length} passages with verified positions · clinical reference awaiting confirmation.</p></div>
        <label className="field se-version">Saved source version<select aria-label="Saved source evidence version" value={data.draft.id} onChange={e=>setDraft(e.target.value)}>{data.choices.map(choice=><option key={choice.id} value={choice.id}>{choice.kind==="pdf" ? "PDF" : "Archived text"} · {choice.saved_at?.replace("T"," ").slice(0,16)||"Date not recorded"} · draft {choice.id.slice(0,6)} / revision {choice.revision}</option>)}</select></label>
        <div className="se-grid">
          <div className="se-draft-column">
            <details className="se-input"><summary>Saved case input and task</summary><h4>Supplied case opening</h4><ClinicalText text={data.case.facts}/><h4>Original task</h4><ClinicalText text={data.case.task}/></details>
            <details className="se-boundary"><summary>{backfilled ? "Saved task boundary" : "Extraction decision point"}</summary><p>{data.draft.decision_point}</p><p>These source-review labels do not replace the saved task above or establish what a particular model received.</p></details>
            <label className="field">Source passages<select aria-label="Filter source evidence passages" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All passages · {items.length}</option><option value="quoted">Quoted in saved input · {items.filter(i=>i.quoted_in_saved_input).length}</option><option value="visible">{backfilled ? "Quoted in saved input" : "Model-visible in extraction"} · {items.filter(i=>i.visibility==="visible").length}</option><option value="hidden">Hidden / later results · {items.filter(i=>i.visibility==="hidden").length}</option><option value="uncertain">Needs review · {items.filter(i=>i.visibility==="uncertain").length}</option></select></label>
            <div className="se-fact-scroll" ref={cardsRef}>
              {shown.map(item=><section key={item.id} data-source-card={item.id} className={`se-fact ${item.id===active?"active":""}`}><header><strong>{item.id}</strong><span className={`se-badge ${item.visibility||"uncertain"}`}>{labels[item.visibility]||"Needs review"}</span></header>{item.quoted_in_saved_input && <small className="se-in-input">Quoted in saved input</small>}
                {item.case_excerpt && <details className="se-related"><summary>Related case wording · {item.association_method==="literal_input" ? "literal match" : "candidate link"}</summary><ClinicalText text={item.case_excerpt}/></details>}
                <blockquote>{item.source_quote||item.text}</blockquote>
                {item.text!==item.source_quote && <details><summary>Extraction wording</summary><ClinicalText text={item.text}/></details>}
                {item.position ? <button type="button" className="text-button" onClick={()=>choose(item.id)}>Read original passage →</button> : <p className="se-unmatched">No verified position for this passage. Check the article manually.</p>}
                <small>{item.patient_group ? `${item.patient_group} · ` : ""}{item.position?.page ? `PDF page ${item.position.page} · ` : item.position?.section ? `${item.position.section} · ` : ""}{sourceMatchLabel(item)} · awaiting review</small>
              </section>)}
              {!shown.length && <p>{filter==="quoted" ? "No verbatim source passage occurs in this saved input. It may use adapted wording; compare the case and paper." : "No saved passages in this group."}</p>}
            </div>
          </div>
          <aside className="se-source" aria-label="Saved original article alongside the case">
            <header><strong>{excerptOnly ? "Saved article excerpt" : "Original article text"}</strong><p>{data.source.title}</p>{data.source.kind==="pdf" && <a href={`/api/literature/sources/${data.source.id}/pdf`} download>Download original PDF</a>}<div className="se-legend"><span className="se-badge visible">{backfilled ? "Quoted in saved input" : "Visible in extraction"}</span><span className="se-badge hidden">Hidden / later result</span><span className="se-badge uncertain">Needs review</span></div><small>Click a highlighted passage to inspect its source record.</small></header>
            <div className="se-source-scroll" ref={sourceRef}>{(data.source.blocks||[]).map((block,index)=><section key={block.id||index} className="se-source-block"><small>{block.page?`PDF page ${block.page}`:block.section||"Saved source"} · paragraph {index+1}</small><p>{sourceSegments(block,items).map(segment=>segment.ids.length ? <button key={segment.start} data-fact-id={segment.ids.includes(active)?active:segment.ids[0]} className={`se-highlight ${items.find(i=>i.id===segment.ids[0])?.visibility||"uncertain"} ${segment.ids.includes(active)?"active":""}`} title="Inspect this source passage" onClick={()=>choose(segment.ids.includes(active)?active:segment.ids[0],true)}>{segment.text}</button> : <span key={segment.start}>{segment.text}</span>)}</p></section>)}</div>
            <footer>Saved text: <code>{data.source.text_sha256.slice(0,16)}…</code><details><summary>Source quality notes</summary>{(data.source.quality_notes||[]).map((note,i)=><p key={i}>{note}</p>)}</details></footer>
          </aside>
        </div>
        <p className="se-footnote">Read-only source review. Saved answers, scores and extraction records are unchanged. Clinical reference · awaiting confirmation.</p>
      </>}
    </div>
  </details>;
}
