"""Independent checks against exported rows, frozen source files and raw calls."""
import csv
import hashlib
import json
import re
import sqlite3
from pathlib import Path

from dotenv import dotenv_values

ROOT=Path(__file__).resolve().parent


def load(p):return json.loads(p.read_text())


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    rows=list(csv.DictReader((ROOT/'ALL_ITEM_RESULTS.csv').open()))
    domains=list(csv.DictReader((ROOT/'DOMAIN_SUMMARIES.csv').open()))
    rb={x['id']:x for x in load(ROOT/'rubric.json')['criteria']}
    subjects=load(ROOT/'subjects.json')
    cases={x['case_key']:x['case'] for x in load(ROOT/'cases.json')}
    assert len(rows)==10296 and len(domains)==3276
    keys={(r['subject_key'],r['item']) for r in rows}
    assert len(keys)==len(rows)
    assert {r['item'] for r in rows}==set(rb) and len(rb)==22
    assert {r['case_id'] for r in rows}=={c['id'] for c in cases.values()}
    assert not any(r['status'] in {'not_yet_scored','applicability_not_established'} for r in rows)
    for r in rows:
        if r['status']=='scored':assert int(r['score']) in rb[r['item']]['allowed_scores']
        else:assert r['score']=='' and r['reason'].strip()
    db=sqlite3.connect(':memory:')
    db.execute('CREATE TABLE items(subject_key TEXT, case_id TEXT, model TEXT, domain TEXT, status TEXT, score REAL)')
    db.executemany('INSERT INTO items VALUES(?,?,?,?,?,?)',[(r['subject_key'],r['case_id'],r['answer_model'],r['domain'],r['status'],float(r['score']) if r['score'] else None) for r in rows])
    computed={}
    for cid,model,dom,n,missing,avg in db.execute("SELECT case_id,model,domain,SUM(status='scored'),SUM(status NOT IN ('scored','not_applicable')),AVG(CASE WHEN status='scored' THEN score END) FROM items GROUP BY case_id,model,domain"):
        computed[(cid,model,dom)]=(int(n),int(missing),avg)
    for r in domains:
        n,missing,avg=computed[(r['case_id'],r['answer_model'],r['domain'])]
        if n and not missing:
            assert r['status']=='complete' and abs(float(r['mean'])-round(avg,4))<.000001
        elif not n and not missing:assert r['status']=='not_applicable' and r['mean']==''
        else:assert r['status']=='incomplete' and r['mean']==''
    old=load(ROOT/'HISTORICAL_FILES_SHA256.json')
    assert all(Path(p).exists() and sha(Path(p))==h for p,h in old.items())
    apphash=load(ROOT/'APPLICABILITY_SHA256.json')
    assert len(apphash)==78 and all(sha(ROOT/p)==h for p,h in apphash.items())
    for p,h in load(ROOT/'FROZEN.json').items():assert sha(ROOT/p)==h
    caps=[];unknown_requirement_ids=[];unknown_statuses=[];bad_excerpt=[]
    for p in (ROOT/'reviews').glob('*.json'):
        rr=load(p);assert rr['status']=='complete'
        casekey=rr['subject_key'].rsplit('__',1)[0]
        plan=load(ROOT/'applicability'/(casekey+'.json'))
        q=rr['parts'].get('d5c',{})
        reqs={x['id']:x for x in plan['candidate_requirements']}
        for check in q.get('requirement_checks',[]):
            ident=check.get('id');status=check.get('status')
            if ident not in reqs:unknown_requirement_ids.append([rr['subject_key'],ident])
            if status not in {'requested_satisfied','requested_unavailable','requested_not_returned','already_supplied','not_requested','equivalence_uncertain'}:
                unknown_statuses.append([rr['subject_key'],ident,status])
            if status=='not_requested' and reqs.get(ident,{}).get('level')=='essential' and q.get('score',0)>2:
                caps.append([rr['subject_key'],ident,q['score']])
    source_identity=[];extra_patient_numbers=[];word_count_matches=0
    for s in subjects:
        if not s['has_complete_answer']:continue
        x=load(ROOT/'inputs'/(s['subject_key']+'.json'));a=x['state']['final_answer']
        if re.search(r'arc:(?:lite|chat|apex)|GLM[- ]?5|Qwen|Nemotron|Gemma',a,re.I):source_identity.append(s['subject_key'])
        original=load(Path(s['source_answer']))
        assert a==original['final_answer']
        for t in x['state'].get('turns',[]):
            for f in t.get('returned',[]):
                if f.get('patient_text'):
                    new=set(re.findall(r'\d+(?:\.\d+)?',f['patient_text']))-set(re.findall(r'\d+(?:\.\d+)?',f.get('text','')))
                    if new:extra_patient_numbers.append([s['subject_key'],f.get('id'),sorted(new)])
    hashes=0;main_boundary=0
    for p in (ROOT/'calls').glob('**/*.json'):
        call=load(p)
        for a in call.get('attempts',[]):
            request=a.get('request')
            if not request:continue
            assert 'Authorization' not in request and 'api_key' not in request
            if a.get('status')=='success':
                h=hashlib.sha256(json.dumps(request['messages'],ensure_ascii=False).encode()).hexdigest()
                assert h==call['input_sha256'];hashes+=1
            if p.parent.name=='main':
                u=json.loads(request['messages'][1]['content'])
                assert set(u)=={'visible_record','applicable_rubric_items'}
                assert not any(x['id']=='D5c' for x in u['applicable_rubric_items'])
                assert not re.search(r'arc:(?:lite|apex|chat)|previous_scores|answer_model',request['messages'][1]['content'])
                main_boundary+=1
            for ch in a.get('response',{}).get('choices',[]):assert set(ch['message'])<={'role','content'}
    paths=[p for p in ROOT.rglob('*') if p.is_file() and p.suffix in {'.json','.txt','.md','.csv','.py','.tex','.bib'}]
    secrets=[str(v) for k,v in dotenv_values(ROOT.parents[1].parent/'auto rubric/.env').items() if v and any(z in k for z in ['API_KEY','TOKEN','PASSWORD','SECRET']) and len(str(v))>10]
    exposed=[]
    for p in paths:
        text=p.read_text(errors='replace')
        if any(v in text for v in secrets):exposed.append(str(p.relative_to(ROOT)))
    assert not exposed
    links=[]
    for name in ['FINDINGS.md','UNSCORED.md','RESULTS_BY_CASE.md']:
        for target in re.findall(r'\]\(([^)]+)\)',(ROOT/name).read_text()):
            if target.startswith(('http:','https:')):continue
            file,_,anchor=target.partition('#');p=ROOT/file
            assert p.exists(),(name,target)
            if anchor:assert f'id="{anchor}"' in p.read_text(),(name,target)
            links.append([name,target])
    result={'checked_at':load(ROOT/'CHECKS.json')['updated_at'],'rows':len(rows),'unique_case_model_item_keys':len(keys),
            'domain_summaries_independently_recomputed_with_sql':len(domains),'historical_files_unchanged':len(old),
            'frozen_case_applicability_records_unchanged':len(apphash),'successful_raw_call_input_hashes_verified':hashes,
            'main_review_requests_with_separated_evidence_boundary':main_boundary,'markdown_links_verified':len(links),
            'secret_values_found':exposed,'source_answer_identity_mentions':source_identity,'extra_numeric_tokens_in_patient_wording':extra_patient_numbers,
            'explicit_essential_omission_cap_contradictions':caps,'unmapped_requirement_ids':unknown_requirement_ids,
            'unexpected_requirement_statuses':unknown_statuses,
            'scope':'Structural and reproducibility checks; not clinical validation of scores, references or essential requirements.'}
    (ROOT/'VALIDATION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False))


if __name__=='__main__':main()
