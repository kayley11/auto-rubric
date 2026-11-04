"""Plain English findings, every item status, and reproducible coverage checks."""
import collections
import csv
import hashlib
import io
import json
import re
from pathlib import Path

from complete import ROOT, IDS, MODELS, MAIN_IDS, digest, now, read, save, rubric_items, visible_record, verify_frozen


def csv_file(name, rows, columns):
    s=io.StringIO(); w=csv.DictWriter(s,fieldnames=columns,extrasaction='ignore');w.writeheader();w.writerows(rows)
    (ROOT/name).write_text(s.getvalue())


def md(s):
    return str(s).replace('|','\\|').replace('\n',' ').strip()


def quote_form(s):
    # Presentation-only normalisation: preserve words, values and signs.
    s=s.replace('\\n',' ').replace('\\"','"')
    s=re.sub(r'(?m)^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)','',s)
    s=re.sub(r'(?<!\w)(?:\*\*|__|\*|_)(?=\S)|(?<=\S)(?:\*\*|__|\*|_)(?!\w)','',s)
    s=s.replace('`','').replace('“','"').replace('”','"').replace('’',"'")
    s=s.translate(str.maketrans({c:'-' for c in '‐‑‒–—−'}))
    return re.sub(r'\s+',' ',s).strip().casefold()


def check_quote(quote, evidence):
    if not quote:return 'no_quote_for_omission_or_indeterminate'
    q=quote_form(quote);h=quote_form(evidence)
    if q in h:return 'matched_excerpt'
    chunks=[x.strip(' \"\'[]') for x in re.split(r'\.{3,}|…',q) if x.strip(' \"\'[]')]
    if len(chunks)>1:
        at=0
        for part in chunks:
            p=h.find(part,at)
            if p<0:break
            at=p+len(part)
        else:return 'matched_abridged_excerpt'
    return 'nonliteral_excerpt_needs_review'


def export():
    verify_frozen(); criteria=rubric_items(); cases=read(ROOT/'cases.json');subjects=read(ROOT/'subjects.json')
    case_map={c['case_key']:c for c in cases};rows=[];citation_issues=[];all_reviews={};unused_ratings=[];quote_counts=collections.Counter();output_issues=[]
    for m in subjects:
        sub=read(ROOT/'inputs'/(m['subject_key']+'.json'));c=case_map[m['case_key']]['case']
        plan=read(ROOT/'applicability'/(m['case_key']+'.json'),{})
        app={x['item']:x for x in plan.get('items',[])}
        review=read(ROOT/'reviews'/(m['subject_key']+'.json'),{})
        values={x['item']:x for x in review.get('parts',{}).get('main',{}).get('items',[])}
        if review.get('parts',{}).get('d5c'):values['D5c']=review['parts']['d5c']
        d5c=values.get('D5c',{});reqs={x['id']:x for x in plan.get('candidate_requirements',[])}
        for check in d5c.get('requirement_checks',[]):
            ident=check.get('id');issue=None
            if ident not in reqs:
                issue=('requirement_id_mismatch',f'Judge returned {ident}, which is not an identifier in this case\'s frozen checklist.')
            elif check.get('status')=='not_requested' and reqs[ident].get('level')=='essential' and (d5c.get('score') or 0)>2:
                issue=('essential_rule_conflict',f'Judge marked essential requirement {ident} not requested but returned D5c={d5c["score"]}, above the specified maximum of 2.')
            if issue:output_issues.append({'subject_key':m['subject_key'],'case_id':m['case_id'],'answer_model':m['answer_model'],'item':'D5c','issue':issue[0],'detail':issue[1]})
        all_reviews[m['subject_key']]=review
        quote_haystack=json.dumps(visible_record(c,sub['state']),ensure_ascii=False) if m['has_complete_answer'] else ''
        quote_haystack=re.sub(r'\s+',' ',quote_haystack.replace('\\n',' ').replace('\\"','"'))
        for i in IDS:
            row={k:m[k] for k in ['subject_key','case_id','cohort','answer_model','answer_model_label','source_answer','source_answer_sha256']}
            old=sub['previous_scores'][i]
            row.update(item=i,item_name=criteria[i]['name'],domain=i[:2],score=None,old_score=old['score'],old_status=old['status'],
                       old_grade_source=old['path'],evidence_quote='',reason='',rules_version=read(ROOT/'rubric.json')['version'],
                       allowed_scores='/'.join(map(str,criteria[i]['allowed_scores'])),clinical_status='awaiting confirmation',
                       quote_check='',
                       review_flags='',
                       d5c_mode=plan.get('d5c_mode','not_established') if i=='D5c' else '',applicability_reason=app.get(i,{}).get('reason',''),
                       review_source='reviews/'+m['subject_key']+'.json')
            if not m['has_complete_answer']:
                row.update(status='no_complete_answer',reason='No complete saved final answer in this historical configuration. Source status: '+m['source_status']+'. No answer was regenerated.')
            elif plan.get('status')!='complete':
                row.update(status='applicability_not_established',reason=plan.get('reason','Case-only applicability review is not yet complete.'))
            elif app[i]['applicability']=='not_applicable':
                row.update(status='not_applicable',reason=app[i]['reason'])
                if i in values:unused_ratings.append({'case_id':m['case_id'],'answer_model':m['answer_model'],'item':i,'returned_score':values[i].get('score'),'reason':app[i]['reason']})
            elif i in values:
                v=values[i];row.update({k:v.get(k,'') for k in ['status','score','evidence_quote','reason']})
                quote_status=check_quote(v.get('evidence_quote',''),quote_haystack);quote_counts[quote_status]+=1
                row['quote_check']=quote_status
                if quote_status=='nonliteral_excerpt_needs_review':
                    citation_issues.append({'case_id':m['case_id'],'answer_model':m['answer_model'],'item':i,'quote':v['evidence_quote'],'issue':'Excerpt does not match source wording after presentation-only normalisation and explicit ellipsis handling; it may be paraphrased or unsupported. Inspect unchanged source and judgement.'})
            else:
                err=review.get('d5c_error' if i=='D5c' else 'main_error')
                row.update(status='request_failed' if err else 'not_yet_scored',reason=err or 'This applicable item has not yet returned a saved review.')
            rows.append(row)
    for r in rows:
        flags=[x['issue'] for x in output_issues if x['subject_key']==r['subject_key'] and x['item']==r['item']]
        if r['quote_check']=='nonliteral_excerpt_needs_review':
            flags.append('quote_not_literal')
            output_issues.append({'subject_key':r['subject_key'],'case_id':r['case_id'],'answer_model':r['answer_model'],'item':r['item'],
                                 'issue':'quote_not_literal','detail':r['evidence_quote']})
        r['review_flags']='; '.join(sorted(set(flags)))
    assert len(rows)==78*6*22
    csv_file('ALL_ITEM_RESULTS.csv',rows,list(rows[0]))
    csv_file('OUTPUT_ISSUES.csv',output_issues,['subject_key','case_id','answer_model','item','issue','detail'])
    unscored=[r for r in rows if r['status']!='scored'];csv_file('UNSCORED_ITEMS.csv',unscored,list(rows[0]))
    summaries=[]
    for m in subjects:
        selected=[r for r in rows if r['subject_key']==m['subject_key']]
        for d in ['D1','D2','D3','D4','D5','D6','D7']:
            rr=[r for r in selected if r['domain']==d];sc=[r for r in rr if r['status']=='scored']
            pending=[r for r in rr if r['status'] not in {'scored','not_applicable'}]
            state='complete' if sc and not pending else ('not_applicable' if all(r['status']=='not_applicable' for r in rr) else 'incomplete')
            summaries.append({'case_id':m['case_id'],'cohort':m['cohort'],'answer_model':m['answer_model'],'domain':d,
                              'status':state,'mean':round(sum(r['score'] for r in sc)/len(sc),4) if state=='complete' else None,
                              'scored_items':' '.join(r['item'] for r in sc),'not_applicable_items':' '.join(r['item'] for r in rr if r['status']=='not_applicable'),
                              'unscored_applicable_items':' '.join(r['item'] for r in pending),'category_schemes':' ; '.join(r['item']+':'+r['allowed_scores'] for r in sc)})
    csv_file('DOMAIN_SUMMARIES.csv',summaries,list(summaries[0]))
    wide=[]
    for m in subjects:
        w={k:m[k] for k in ['case_id','cohort','answer_model','answer_model_label']}
        for d in ['D1','D2','D3','D4','D5','D6','D7']:
            q=next(x for x in summaries if x['case_id']==m['case_id'] and x['answer_model']==m['answer_model'] and x['domain']==d)
            if q['status']=='complete':w[d]=q['mean']
            elif not m['has_complete_answer']:w[d]='Missing complete answer'
            elif q['status']=='not_applicable':w[d]='N/A'
            else:
                domain_rows=[x for x in rows if x['subject_key']==m['subject_key'] and x['domain']==d]
                w[d]='Indeterminate' if any(x['status']=='indeterminate' for x in domain_rows) else ('Request failed' if any(x['status']=='request_failed' for x in domain_rows) else 'Pending')
            w[d+'_items']=q['scored_items']
        wide.append(w)
    csv_file('SEVEN_DOMAIN_PROFILES.csv',wide,list(wide[0]))
    full_seven=sum(all(isinstance(w[d],(int,float)) for d in ['D1','D2','D3','D4','D5','D6','D7']) for w in wide)
    status=collections.Counter(r['status'] for r in rows)
    grade_status=collections.Counter(r['status'] for r in rows if next(s for s in subjects if s['subject_key']==r['subject_key'])['has_complete_answer'])
    complete_answers=sum(s['has_complete_answer'] for s in subjects)
    completed_reviews=sum(x.get('status')=='complete' for x in all_reviews.values())
    item_counts={i:dict(collections.Counter(r['status'] for r in rows if r['item']==i)) for i in IDS}
    unchanged=[];changed=[]
    for p,h in read(ROOT/'HISTORICAL_FILES_SHA256.json').items():
        (unchanged if Path(p).exists() and digest(p)==h else changed).append(p)
    calls=list((ROOT/'calls').glob('**/*.json'));attempts=[a for p in calls for a in read(p).get('attempts',[])]
    usage=collections.Counter()
    for a in attempts:
        u=a.get('response',{}).get('usage',{})
        for k in ['prompt_tokens','completion_tokens','total_tokens']:
            if isinstance(u.get(k),(int,float)):usage[k]+=u[k]
    finished=not any(status.get(k,0) for k in ['not_yet_scored','applicability_not_established'])
    checks={'updated_at':now(),'case_count':78,'subjects':len(subjects),'complete_saved_answers':complete_answers,
            'completed_review_records':completed_reviews,
            'expected_item_rows':78*6*22,'actual_item_rows':len(rows),'item_statuses':dict(status),
            'complete_answer_item_statuses':dict(grade_status),'item_counts':item_counts,
            'all_rows_have_a_score_or_reason':all((r['status']=='scored' and type(r['score']) is int) or (r['score'] is None and bool(r['reason'])) for r in rows),
            'score_categories_valid':all(r['status']!='scored' or r['score'] in criteria[r['item']]['allowed_scores'] for r in rows),
            'source_answers_and_tasks_unchanged':not changed,'historical_files_checked':len(unchanged)+len(changed),'changed_historical_files':changed,
            'citation_issues':citation_issues,'out_of_scope_returned_ratings_not_used':unused_ratings,'all_available_answers_processed':finished,'new_answer_calls':0,
            'judge_output_issues':output_issues,
            'quote_verification':dict(quote_counts),
            'seven_domains_all_numerical_profiles':full_seven,
            'reported_usage':dict(usage),'total_saved_attempts':len(attempts),
            'attempt_statuses':dict(collections.Counter(a.get('status','unknown') for a in attempts)),
            'scope':'Original historical conditions only; six service configurations, five with saved final answers. Not the separate 156 zero-shot answers.'}
    save('CHECKS.json',checks)
    lines=['# Full rubric review of the 78 saved tasks','',
           '**Status: '+('all available answers processed.' if finished else 'in progress; the counts below are live.')+'**','',
           'The original tasks and answers are fixed. This review fills the missing rubric coverage and records a reason wherever no score is available. Clinical references and candidate information requirements are **awaiting confirmation**.','',
           '| Scope | Result |','|---|---|',f'| Original cases / tasks | 78 |',f'| Complete saved answers in scope | {complete_answers} |',f'| Completed full-profile reviews | {completed_reviews} |',
           f'| Numerical item ratings | {status.get("scored",0)} |',f'| Not applicable | {status.get("not_applicable",0)} |',
           f'| Indeterminate | {status.get("indeterminate",0)} |',f'| Requests failed | {status.get("request_failed",0)} |',
           f'| Missing or incomplete answers | {len(subjects)-complete_answers} case × service positions; no scores invented |','',
           '## What changed','',
           '- All 22 main rubric items were checked, including reasoning quality (D2) and communication/instruction following (D7). A missing answer component is not automatically N/A.',
           '- The full Overleaf revision dated 24 October, downloaded on 4 November, is frozen with this run. This is a new scoring condition; old answers, scores and raw outputs remain unchanged.',
           '- Main scoring uses only the information actually supplied, the original task, public dialogue/notes and the saved final answer. D5c is separate so its reviewer-only inventory cannot enter problem-representation scoring.',
           '- Main scoring does not receive the provisional full-case answer references used by some historical item reviews. Differences from those scores can reflect the evidence condition, full rubric revision and review format; they are not an isolated effect of adding an item.',
           '- D5c distinguishes actual acquisition from written request planning. Plans are not described as completed interviews. Candidate requirements were fixed before these new grades, without reading the answers for the applicability decisions.',
           '- Where the manuscript only defines 1, 3 and 5, only those three categories are used. Intermediate anchors were not invented.','',
           '## Saved answers by service configuration','', '| Answering configuration | Complete answers | Numerical ratings | Unscored applicable items |','|---|---:|---:|---:|']
    for m,label in MODELS.items():
        rr=[r for r in rows if r['answer_model']==m]
        lines.append(f'| {label} | {sum(s["has_complete_answer"] for s in subjects if s["answer_model"]==m)}/78 | {sum(r["status"]=="scored" for r in rr)} | {sum(r["status"] not in {"scored","not_applicable","no_complete_answer"} for r in rr)} |')
    lines+=['','KCL arc:lite and Groq Qwen are separate service configurations of the same declared model family. Missing Gemma results are operational missingness, not low clinical scores.','',
            '## Coverage by rubric item','','| Item | Numerical ratings | N/A | Indeterminate | Other unavailable |','|---|---:|---:|---:|---:|']
    for i in IDS:
        ct=item_counts[i]
        lines.append(f'| {i} · {criteria[i]["name"]} | {ct.get("scored",0)} | {ct.get("not_applicable",0)} | {ct.get("indeterminate",0)} | {sum(v for k,v in ct.items() if k not in {"scored","not_applicable","indeterminate"})} |')
    lines+=['','## Findings to inspect','']
    for domain in ['D2','D7']:
        rr=[r for r in rows if r['domain']==domain and r['status']=='scored']
        newly=sum(r['old_score'] is None for r in rr)
        lines.append(f'- **{domain}:** {len(rr)} numerical ratings, including {newly} without a previous numerical rating.')
    lows=[r for r in rows if r['status']=='scored' and r['score']<=2]
    lines.append(f'- **Low ratings for review:** {len(lows)} item ratings are 1–2. These are review candidates, not independently confirmed clinical errors.')
    for r in sorted(lows,key=lambda r:(r['score'],r['case_id'],r['item']))[:10]:
        lines.append(f'  - {r["case_id"]} · {MODELS[r["answer_model"]]} · {r["item"]}={r["score"]}: {r["reason"]}')
    conflicts=[x for x in output_issues if x['issue']=='essential_rule_conflict']
    mismatches=[x for x in output_issues if x['issue']=='requirement_id_mismatch']
    if output_issues:
        lines+=['','## Output issues retained for review','',
                'The original scores and explanations below have not been corrected by hand. A flag identifies an output inconsistency; it does not establish the clinically correct grade.','',
                '| Case | Configuration | Issue |','|---|---|---|']
        for x in conflicts:
            lines.append(f'| {x["case_id"]} | {MODELS[x["answer_model"]]} | {md(x["detail"])} |')
        lines += ['',f'- {len(mismatches)} checklist-identifier mismatches occur in {len(set(x["subject_key"] for x in mismatches))} D5c reviews. The returned identifiers are retained rather than silently reassigned.',
                  f'- {len(citation_issues)} excerpts could not be matched literally after presentation-only normalisation. Some contain paraphrases or a judge observation instead of a source quotation; this count is not a count of clinical hallucinations.',
                  '- [All flagged outputs](OUTPUT_ISSUES.csv) identify the exact case, model and item. Affected item rows carry `review_flags`; the numerical scores remain in the descriptive profiles until reviewed.']
    lines+=['','## What still needs clinical or author confirmation','',
            '- Which case-specific information and safety requirements are essential, which alternatives are acceptable, and when a request is needed.',
            '- The applicability choices for task-specific causal reasoning, retrospective updating and patient/family synthesis; the full case-only reasons are saved.',
            '- Concrete grade disagreements and low-score examples, using the unchanged answer and quoted evidence. No automatic safety-failure conclusion is made from a low number alone.',
            '- Descriptive domain means are provided only when every applicable item is numerical. Different task modes, applicability patterns and three-/five-category implementations are not treated as interchangeable.','',
            '## Results and evidence','',
            '- [Every case and service: item results](RESULTS_BY_CASE.md)',
            '- [Every item without a score: reasons](UNSCORED.md)',
            '- [All item results](ALL_ITEM_RESULTS.csv)',
            '- [Flagged judge outputs](OUTPUT_ISSUES.csv)',
            '- [Seven-domain summaries and participating items](DOMAIN_SUMMARIES.csv)',
            '- [One row per saved configuration: seven-domain profile](SEVEN_DOMAIN_PROFILES.csv)',
            '- [Full inputs, answers and judge outputs as plain text](RAW_OUTPUT.txt)',
            '- [Rubric source](rubric_source/rubric.pdf) · [Frozen protocol](protocol.json) · [Checks](CHECKS.json)','',
            f'Historical source files checked unchanged: {len(unchanged)}/{len(unchanged)+len(changed)}. New clinical answers generated: 0.']
    ind=[r for r in rows if r['status']=='indeterminate']
    if ind:
        pos=lines.index('## What still needs clinical or author confirmation')
        examples=['## Why some applicable items have no score','', '| Case | Configuration | Item | Saved reason |','|---|---|---|---|']
        seen=set()
        for r in ind:
            group=(r['case_id'],r['item'])
            if group in seen:continue
            seen.add(group);examples.append(f'| {r["case_id"]} | {MODELS[r["answer_model"]]} | {r["item"]} | {md(r["reason"])} |')
            if len(seen)>=6:break
        examples+=['','Every remaining unscored item, including task-level N/A decisions and missing answers, is listed in [UNSCORED.md](UNSCORED.md).','']
        lines[pos:pos]=examples
    if unused_ratings:lines.append('Additional returned ratings for items excluded by the original task scope are kept in raw output and omitted from the profiles. The scope corrections and excluded ratings are listed in CHECKS.json.')
    (ROOT/'FINDINGS.md').write_text('\n'.join(lines)+'\n')
    un=['# Items without a numerical score','',
        'N/A means the task does not provide the relevant assessment opportunity. Indeterminate means an applicable judgement lacks a necessary basis. Missing answers and failed requests are operational gaps. None is converted to a clinical score.','',
        '## Case-level applicability reasons','', '| Case | Item | Reason |','|---|---|---|']
    for c in cases:
        plan=read(ROOT/'applicability'/(c['case_key']+'.json'),{})
        for x in plan.get('items',[]):
            if x['applicability']=='not_applicable':un.append(f'| [{c["case"]["id"]} — {md(c["case"]["title"])}](RESULTS_BY_CASE.md#case-{c["case"]["id"].lower()}) | {x["item"]} · {criteria[x["item"]]["name"]} | {md(x["reason"])} |')
    un+=['','## Applicable items that could not be scored','', '| Case | Answering configuration | Item | Status | Reason |','|---|---|---|---|---|']
    rest=[r for r in unscored if r['status'] not in {'not_applicable','no_complete_answer'}]
    if not rest:un.append('| — | — | — | — | None. |')
    for r in rest:un.append(f'| [{r["case_id"]} — {md(case_map[r["cohort"]+"__"+r["case_id"]]["case"]["title"])}](RESULTS_BY_CASE.md#case-{r["case_id"].lower()}) | {MODELS[r["answer_model"]]} | {r["item"]} · {criteria[r["item"]]["name"]} | {r["status"]} | {md(r["reason"])} |')
    un+=['','## Missing or incomplete final answers','',
         'Each position below has no numerical score for any of the 22 rubric items. Original partial records are retained; no replacement answer was generated.','',
         '| Configuration | Cases | Reason |','|---|---|---|']
    for model,label in MODELS.items():
        missing=[s for s in subjects if s['answer_model']==model and not s['has_complete_answer']]
        if missing:un.append(f'| {label} | {", ".join(s["case_id"] for s in missing)} | No complete saved final answer; individual source statuses are in ALL_ITEM_RESULTS.csv. |')
    un+=['','The [CSV](UNSCORED_ITEMS.csv) contains every unscored case × configuration × item separately.']
    un+=['','## Optional auxiliary records','',
         '| Record | Treatment in this run |','|---|---|',
         '| Hallucination count | Not a 1–5 criterion. No separate claim-counting audit was run; unsupported patient-specific claims can affect D1 and remain in its explanations. |',
         '| Numeric fidelity | No additional ordinal score is invented because the source does not give separate 1–5 anchors. Numerical errors can affect the relevant scored items. |']
    (ROOT/'UNSCORED.md').write_text('\n'.join(un)+'\n')
    out=['# Saved answers: complete rubric profiles','',
         'Scores refer to the original saved answers. N/A = outside task scope; IND = indeterminate; MISSING = no complete saved answer; WAIT = review pending; ERROR = request failed. A dagger (†) marks an output requiring review; the original score is retained. Clinical references and requirements are awaiting confirmation.',
         'Flag details: [case, model, item and issue](OUTPUT_ISSUES.csv).','']
    out+=['| Table label | Answering configuration |','|---|---|']+[f'| {k} | {v} |' for k,v in MODELS.items()]+['']
    for cc in cases:
        cid=cc['case']['id'];out += [f'<a id="case-{cid.lower()}"></a>',f'## {cid} — {cc["case"]["title"]}','', '| Rubric item | '+ ' | '.join(MODELS)+' |','|---|'+'---|'*len(MODELS)]
        for i in IDS:
            vals=[]
            for m in MODELS:
                r=next(x for x in rows if x['case_id']==cid and x['answer_model']==m and x['item']==i)
                value=str(r['score']) if r['status']=='scored' else {'not_applicable':'N/A','indeterminate':'IND','no_complete_answer':'MISSING','request_failed':'ERROR'}.get(r['status'],'WAIT')
                if r['review_flags']:value+='†'
                vals.append(value)
            out.append('| '+i+' · '+criteria[i]['name']+' | '+' | '.join(vals)+' |')
        out+=['','Full saved outputs: '+ ' · '.join(f'[{m}](reviews/{cc["case_key"]}__{m}.json)' for m in MODELS if (ROOT/'reviews'/(cc['case_key']+'__'+m+'.json')).exists()),'']
    (ROOT/'RESULTS_BY_CASE.md').write_text('\n'.join(out)+'\n')
    with (ROOT/'RAW_OUTPUT.txt').open('w') as f:
        f.write('FULL RUBRIC REVIEW — ORIGINAL SAVED TASKS AND ANSWERS\n\n'+json.dumps(read(ROOT/'protocol.json'),ensure_ascii=False,indent=2)+'\n\nRUBRIC\n'+json.dumps(read(ROOT/'rubric.json'),ensure_ascii=False,indent=2)+'\n')
        for cc in cases:
            c=cc['case'];f.write('\n'+'='*90+'\nCASE '+c['id']+'\n'+c['title']+'\n')
            f.write('ORIGINAL SOURCE: '+str(c.get('source',''))+'\nSOURCE LOCATION: '+str(c.get('source_location',c.get('source_locations','')))+'\n')
            f.write('SAVED PROVISIONAL CLINICAL REFERENCE — AWAITING CONFIRMATION; HUMAN REVIEW ONLY, NOT SUPPLIED TO THE MAIN JUDGE\n'+str(c.get('reference',''))+'\n')
            f.write('CASE-ONLY APPLICABILITY\n'+json.dumps(read(ROOT/'applicability'/(cc['case_key']+'.json'),{}),ensure_ascii=False,indent=2)+'\n')
            for m in subjects:
                if m['case_key']!=cc['case_key']:continue
                f.write('\nANSWERING CONFIGURATION: '+MODELS[m['answer_model']]+'\n')
                if not m['has_complete_answer']:f.write('NO COMPLETE SAVED FINAL ANSWER. Source status: '+m['source_status']+'\n');continue
                sub=read(ROOT/'inputs'/(m['subject_key']+'.json'))
                f.write('ACTUAL INPUT, DIALOGUE AND UNCHANGED ANSWER\n'+json.dumps(visible_record(c,sub['state']),ensure_ascii=False,indent=2)+'\n')
                f.write('NEW REVIEW OUTPUT\n'+json.dumps(all_reviews[m['subject_key']],ensure_ascii=False,indent=2)+'\n')
                f.write('HISTORICAL ITEM SCORES (NOT SUPPLIED TO THE NEW JUDGE)\n'+json.dumps(sub['previous_scores'],ensure_ascii=False,indent=2)+'\n')
        f.write('\nFULL API REQUESTS AND VISIBLE RESPONSES\n')
        for p in sorted(calls):f.write('\n'+str(p.relative_to(ROOT))+'\n'+p.read_text())
    print(json.dumps({k:checks[k] for k in ['case_count','complete_saved_answers','item_statuses','all_rows_have_a_score_or_reason','source_answers_and_tasks_unchanged','all_available_answers_processed']},ensure_ascii=False))


if __name__=='__main__':export()
