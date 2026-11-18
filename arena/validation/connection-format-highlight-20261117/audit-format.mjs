import fs from 'node:fs';
import path from 'node:path';
import {prepareClinicalText} from '../../src/clinicalTextProjection.mjs';
const output='validation/connection-format-highlight-20261117';
let files=0,strings=0,notationFields=0,transformedNotationFields=0;
const residualClinical=[],technicalRegex=[],primary=[],formatArtifacts=[];
const known=/\\(?:mu|beta|alpha|gamma|delta|Delta|rightarrow|leftarrow|leftrightarrow|ge|geq|le|leq|neq|approx|times|cdot|pm|degree|circ)\b/;
function walk(value,location,file){
 if(typeof value==='string'){
  strings++;
  const reading=prepareClinicalText(value);
  const has=known.test(value)||/\$[^\n$]+\$/.test(value);
  if(has){notationFields++;if(value!==reading.text)transformedNotationFields++;}
  if(reading.positions.length!==reading.text.length)throw Error('Broken UTF-16 map: '+file+location);
  if(known.test(reading.text))throw Error('Unrendered known notation: '+file+location);
  if(reading.notationWarnings.length){const row={file,path:location,warnings:reading.notationWarnings};(location.endsWith('.match')?technicalRegex:residualClinical).push(row);}
  if(/\*\*|(^|\n)\s*#{1,6}\s|\f|\v|\u2028|\u2029/.test(reading.text)&&!location.endsWith('.match'))formatArtifacts.push({file,path:location});
  if(/public\/(?:full-rubric-review|complex-cases)\//.test(file)&&!location.startsWith('.criteria')&&has)primary.push({case:path.basename(file,'.json'),path:location});
 }else if(Array.isArray(value))value.forEach((v,i)=>walk(v,location+'.'+i,file));
 else if(value&&typeof value==='object')Object.entries(value).forEach(([key,v])=>walk(v,location+'.'+key,file));
}
function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())visit(file);else if(file.endsWith('.json')){files++;walk(JSON.parse(fs.readFileSync(file)),'',file);}}}
visit('public');
const summary={public_json_files:files,string_fields_checked:strings,notation_fields:notationFields,notation_fields_formatted:transformedNotationFields,primary_affected_cases:[...new Set(primary.map(p=>p.case))],primary_answers_affected:primary.filter(p=>p.path.endsWith('.answer')).length,unresolved_clinical_notation_fields:residualClinical.length,technical_regex_fields_not_treated_as_math:technicalRegex.length,remaining_markdown_fields:formatArtifacts.length};
fs.writeFileSync(process.argv[2] || output+'/format-audit.json',JSON.stringify({summary,primary,unresolved_clinical:residualClinical,technical_regex:technicalRegex,remaining_markdown:formatArtifacts},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
if(residualClinical.length||formatArtifacts.length)process.exitCode=1;
