> Updated applicability check: [12 November audit](/na-audit/FINDINGS.md). This earlier summary is retained as historical context; use the current item table for applicability labels.

# New complex BMJ cases

57 additional cases; 279/342 primary model/service answers saved. Original 78 cases retained.
Clinical references and candidate information requirements: **awaiting confirmation**.

The first saved answer is the primary comparison answer. The earlier three-call GLM/Qwen experiments remain available as separate saved answers. Each service receives the same case facts, decision point and written task for a case. GLM-5.3 is the common judge; it reviews 21 items together and D5c separately against two candidate information requirements. D5c evaluates proposed requests in this written task, not an executed interview.

Groq is a free-compatible non-reasoning service condition. Its original cap is 1,000 tokens; cases recovered with a larger cap are explicitly labelled with the actual limit in their model header and evidence. It shares the declared Qwen3.8-27B family with arc:lite but does not share its complete generation settings. Original attempts remain saved. Gemma endpoint failures have no clinical score.

| Answer configuration | Complete answers /57 | All 22 item statuses returned |
| --- | ---: | ---: |
| arc:lite | 57/57 | 57 |
| arc:chat | 57/57 | 57 |
| arc:apex | 57/57 | 57 |
| Gemma 4 31B | 0/57 | 0 |
| Nemotron 3 Ultra | 51/57 | 51 |
| Qwen3.8 27B · Groq | 57/57 | 57 |

## Examples for review

- BN48: distinguish requesting vascular imaging from claiming it can definitively exclude a disease.
- BN49: a drug-class wording error was identified by the judge; its clinical severity remains to be assessed.
- BN50 and BN53: some recommendations are incorrectly described as existing recorded plans.
- BN52: unsupplied results and unperformed tests are not the same; the culture/drainage order also needs careful reading.
- BN05 and BN39: some D5c grades conflict with their own partial-essential-requirement labels. Original grades are retained for review.

Open the case and its model score to read the exact answer and original explanation. Calls 2 and 3 from the earlier GLM/Qwen tests are selectable within the evidence dialog. The clinician needs to confirm requirement necessity, acceptable alternatives, timing and item-specific grade boundaries. This batch does not estimate clinical accuracy or the improvement caused by using a rubric.

## Case index

| Case | Case type | Source | Prepared packet | Saved primary answers |
| --- | --- | --- | --- | --- |
| [BN01](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN01) | Worsening renal function after first-cycle cancer treatment | [Article](https://casereports.bmj.com/content/19/11/e277487) | prepared | 5/6 |
| [BN02](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN02) | Multiorgan injury with biomarkers peaking at different times | [Article](https://casereports.bmj.com/content/19/11/e274647) | prepared | 5/6 |
| [BN03](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN03) | Progressive bilateral visual loss with immunodeficiency and discordant tests | [Article](https://casereports.bmj.com/content/19/11/e266562) | prepared | 5/6 |
| [BN04](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN04) | Fever, anaemia and graft dysfunction despite a rejection-directed treatment | [Article](https://casereports.bmj.com/content/19/11/e270491) | prepared | 5/6 |
| [BN05](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN05) | A preterm infant with major perioperative blood-pressure changes and new brain abnormalities | [Article](https://casereports.bmj.com/content/19/11/e273772) | prepared | 5/6 |
| [BN06](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN06) | A new central neurological pattern during recovery from an areflexic weakness syndrome | [Article](https://casereports.bmj.com/content/19/11/e277320) | prepared | 5/6 |
| [BN07](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN07) | Severe food restriction with altered responsiveness and neurological signs | [Article](https://casereports.bmj.com/content/19/11/e271668) | prepared | 5/6 |
| [BN08](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN08) | Cardiac dysfunction with retroperitoneal and skeletal abnormalities | [Article](https://casereports.bmj.com/content/19/11/e271973) | prepared | 5/6 |
| [BN09](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN09) | Persistent shock after resuscitated ventricular fibrillation | [Article](https://casereports.bmj.com/content/19/11/e274215) | prepared | 5/6 |
| [BN10](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN10) | Active renal disease and uncertain drug exposure at early pregnancy confirmation | [Article](https://casereports.bmj.com/content/19/11/e276007) | prepared | 5/6 |
| [BN11](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN11) | New abdominal fluid after shunting for a brainstem tumour | [Article](https://casereports.bmj.com/content/19/11/e273260) | prepared | 5/6 |
| [BN12](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN12) | Recurrent dizziness with several partially supported explanations | [Article](https://casereports.bmj.com/content/19/11/e271131) | prepared | 5/6 |
| [BN13](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN13) | Severe apathy despite biochemical improvement in thyroid function | [Article](https://casereports.bmj.com/content/19/11/e276071) | prepared | 5/6 |
| [BN14](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN14) | Recurrent impaired consciousness with documented hypoglycaemia | [Article](https://casereports.bmj.com/content/19/11/e276608) | prepared | 5/6 |
| [BN15](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN15) | New neurological decline after prolonged control of a spinal tumour | [Article](https://casereports.bmj.com/content/19/11/e276693) | prepared | 5/6 |
| [BN16](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN16) | Proteinuric renal disease with inconsistent autoimmune and clonal clues | [Article](https://casereports.bmj.com/content/19/11/e273214) | prepared | 5/6 |
| [BN17](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN17) | Mixed prostate histology despite widespread tracer-avid disease | [Article](https://casereports.bmj.com/content/19/11/e271877) | prepared | 5/6 |
| [BN18](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN18) | Acute postoperative abdominal deterioration after Roux-en-Y reconstruction | [Article](https://casereports.bmj.com/content/19/11/e274507) | prepared | 5/6 |
| [BN19](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN19) | An apparent duodenal mass with progressive anaemia after surgery | [Article](https://casereports.bmj.com/content/19/11/e277071) | prepared | 5/6 |
| [BN20](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN20) | Prolonged asystolic episodes in a very young patient | [Article](https://casereports.bmj.com/content/19/11/e272731) | prepared | 5/6 |
| [BN21](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN21) | Unequal bilateral ocular deterioration after systemic febrile illness | [Article](https://casereports.bmj.com/content/19/11/e272495) | prepared | 5/6 |
| [BN22](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN22) | Recurrent transient deficits with an incompletely characterised intracranial stenosis | [Article](https://casereports.bmj.com/content/19/11/e275346) | prepared | 5/6 |
| [BN23](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN23) | Highly suspicious breast imaging with an indeterminate core biopsy | [Article](https://casereports.bmj.com/content/19/11/e275112) | prepared | 5/6 |
| [BN24](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN24) | Persistent pruritic rash with monocytosis but no blood eosinophilia | [Article](https://casereports.bmj.com/content/19/11/e273143) | prepared | 5/6 |
| [BN25](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN25) | Discordant germ-cell tumour pathology with a new renal mass and venous thrombus | [Article](https://casereports.bmj.com/content/19/11/e275071) | prepared | 5/6 |
| [BN26](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN26) | Anorectal mucosal melanoma before definitive surgery | [Article](https://casereports.bmj.com/content/19/11/e277644) | prepared | 5/6 |
| [BN27](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN27) | Early recurrent bone tumour after a joint-preserving operation | [Article](https://casereports.bmj.com/content/19/11/e274882) | prepared | 5/6 |
| [BN28](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN28) | New facial destruction after advanced skin cancer treatment | [Article](https://casereports.bmj.com/content/19/11/e274747) | prepared | 5/6 |
| [BN29](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN29) | Progressive urinary tract disease despite repeated empirical diagnoses | [Article](https://casereports.bmj.com/content/19/11/e270732) | prepared | 5/6 |
| [BN30](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN30) | Acute abdominal signs with massive proteinuria but no overt oedema | [Article](https://casereports.bmj.com/content/19/11/e277285) | prepared | 5/6 |
| [BN31](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN31) | Persistent chylous mediastinal drainage when embolisation cannot be completed | [Article](https://casereports.bmj.com/content/19/11/e275882) | prepared | 5/6 |
| [BN32](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN32) | Discharge planning with differing accounts of home support | [Article](https://casereports.bmj.com/content/19/11/e273597) | prepared | 5/6 |
| [BN33](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN33) | Acute respiratory failure during several cancer treatments | [Article](https://casereports.bmj.com/content/19/11/e275638) | prepared | 5/6 |
| [BN34](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN34) | Respiratory arrest with evolving autonomic and neurological findings | [Article](https://casereports.bmj.com/content/19/11/e274572) | prepared | 5/6 |
| [BN35](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN35) | Progressive food intolerance and weight loss after an initially normal-looking endoscopy | [Article](https://casereports.bmj.com/content/19/11/e274958) | prepared | 5/6 |
| [BN36](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN36) | Plaques and sensory abnormalities during treatment for CLL | [Article](https://casereports.bmj.com/content/19/11/e271988) | prepared | 5/6 |
| [BN37](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN37) | Progressive sleep disorder with incomplete antibody evidence | [Article](https://casereports.bmj.com/content/19/11/e276263) | prepared | 5/6 |
| [BN38](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN38) | Confirmed periampullary cancer with biliary obstruction during pregnancy | [Article](https://casereports.bmj.com/content/19/11/e272831) | prepared | 5/6 |
| [BN39](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN39) | Persistent large-volume pneumoperitoneum with a stable clinical course | [Article](https://casereports.bmj.com/content/19/11/e274598) | prepared | 5/6 |
| [BN40](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN40) | Progressive weakness despite treatment for meningitis | [Article](https://casereports.bmj.com/content/19/11/e273118) | prepared | 5/6 |
| [BN41](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN41) | Congenital eye disease with infection-like systemic findings | [Article](https://casereports.bmj.com/content/19/11/e275844) | prepared | 5/6 |
| [BN42](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN42) | Painful swollen thigh with marked inflammation but no collection | [Article](https://casereports.bmj.com/content/19/11/e272719) | prepared | 5/6 |
| [BN43](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN43) | A growing conjunctival lesion after an initially inflammatory biopsy | [Article](https://casereports.bmj.com/content/19/11/e276033) | prepared | 5/6 |
| [BN44](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN44) | Major reconstruction with inherited thrombophilia | [Article](https://casereports.bmj.com/content/19/11/e272059) | prepared | 5/6 |
| [BN45](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN45) | Haemorrhagic brain lesion years after pregnancy | [Article](https://casereports.bmj.com/content/19/11/e276099) | prepared | 5/6 |
| [BN46](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN46) | Recurrent delayed postpartum bleeding after reassuring intervals | [Article](https://casereports.bmj.com/content/19/11/e276262) | prepared | 4/6 |
| [BN47](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN47) | Fetal haemorrhage and neonatal purpura after a sibling death | [Article](https://casereports.bmj.com/content/19/11/e273866) | prepared | 4/6 |
| [BN48](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN48) | Multifocal brain lesions and immune abnormalities during B-cell depletion | [Article](https://casereports.bmj.com/content/19/11/e277221) | prepared | 5/6 |
| [BN49](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN49) | Recurrent optic symptoms with low-titre antibodies and untreated viral infection | [Article](https://casereports.bmj.com/content/19/11/e278019) | prepared | 5/6 |
| [BN50](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN50) | Destructive skeletal lesions with discordant tissue and systemic evidence | [Article](https://casereports.bmj.com/content/19/11/e275244) | prepared | 5/6 |
| [BN51](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN51) | Several hypervascular neck lesions and a thyroid nodule with benign cytology | [Article](https://casereports.bmj.com/content/19/11/e276762) | prepared | 5/6 |
| [BN52](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN52) | Hip and flank pain with a large retroperitoneal collection and chronic renal dysfunction | [Article](https://casereports.bmj.com/content/19/11/e276222) | prepared | 5/6 |
| [BN53](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN53) | Large abdominal cystic mass with inconclusive localisation and sampling | [Article](https://casereports.bmj.com/content/19/11/e266257) | prepared | 5/6 |
| [BN54](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN54) | Syncope with captured VT and major outflow-tract compression | [Article](https://casereports.bmj.com/content/19/11/e273850) | prepared | 4/6 |
| [BN55](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN55) | Persistent facial palsy and hearing loss after a normal CT report | [Article](https://casereports.bmj.com/content/19/11/e273676) | prepared | 4/6 |
| [BN56](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN56) | Biliary obstruction years after pancreatic drainage | [Article](https://casereports.bmj.com/content/19/11/e277428) | prepared | 4/6 |
| [BN57](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/BN57) | Margin-negative sarcoma with uncertain confirmation and adjuvant benefit | [Article](https://casereports.bmj.com/content/19/11/e275196) | prepared | 4/6 |
