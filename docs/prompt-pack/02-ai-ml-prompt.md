# CrimeVerse AI Intelligence Layer Technical Design

## 1. Purpose
CrimeVerse AI is an intelligence layer over the official Police FIR operational schema.
The uploaded `Police_FIR_ER_Diagram.pdf` is the primary source of truth.
The AI layer must not replace `CaseMaster`.
The AI layer must not replace `Victim`.
The AI layer must not replace `Accused`.
The AI layer must not replace `ComplainantDetails`.
The AI layer must not replace `ArrestSurrender`.
The AI layer must not replace `ChargesheetDetails`.
The AI layer must not replace `ActSectionAssociation`.
The AI layer must consume these tables.
The AI layer must enrich these tables.
The AI layer must validate proposed changes before official writes.
The AI layer must project relational data into graph/search/feature views.
The operational database remains authoritative.
AI outputs are recommendations, candidates, predictions, explanations, and enrichment proposals.
Human review controls sensitive database updates.

## 2. AI Architecture Diagram
Police Documents
  |
OCR
  |
Layout Understanding
  |
Named Entity Recognition
  |
Relation Extraction
  |
Event and Temporal Extraction
  |
Normalization
  |
Entity Resolution
  |
Data Validation Against FIR Schema
  |
Official Schema Enrichment
  |
Knowledge Graph Projection
  |
Feature Store
  |
Prediction Models
  |
Recommendation Engine
  |
Simulation Engine
  |
Explainable AI
  |
Realtime Intelligence Updates

## 3. Source Tables From AI Perspective
`CaseMaster` is the root FIR intelligence event.
`CaseMaster` contains crime number semantics.
`CaseMaster` contains case number semantics.
`CaseMaster` contains registration date.
`CaseMaster` contains incident time window.
`CaseMaster` contains police station.
`CaseMaster` contains registering officer.
`CaseMaster` contains case category.
`CaseMaster` contains gravity.
`CaseMaster` contains major crime head.
`CaseMaster` contains minor crime head.
`CaseMaster` contains case status.
`CaseMaster` contains court.
`CaseMaster` contains latitude.
`CaseMaster` contains longitude.
`CaseMaster` contains brief facts.
`CaseMaster` feeds hotspot prediction.
`CaseMaster` feeds crime density prediction.
`CaseMaster` feeds district risk scoring.
`CaseMaster` feeds station risk scoring.
`CaseMaster` feeds duplicate FIR detection.
`CaseMaster` feeds temporal trend detection.
`CaseMaster` creates a `Case` graph node.
`CaseMaster` creates `REGISTERED_AT` relationships to `Unit`.
`CaseMaster` creates `REGISTERED_BY` relationships to `Employee`.
`CaseMaster` creates `CLASSIFIED_AS` relationships to `CrimeHead`.
`CaseMaster` creates `SUBCLASSIFIED_AS` relationships to `CrimeSubHead`.
`CaseMaster` creates `HAS_GRAVITY` relationships to `GravityOffence`.
`CaseMaster` creates `HAS_CATEGORY` relationships to `CaseCategory`.
`CaseMaster` creates `HEARD_IN` relationships to `Court`.
`CaseMaster` creates `OCCURRED_NEAR` relationships to location nodes.
`CaseMaster.BriefFacts` is the core NLP narrative field.
`CaseMaster.latitude` and `CaseMaster.longitude` are the core geospatial ML fields.
`CaseMaster.IncidentFromDate` and `CaseMaster.IncidentToDate` are core temporal ML fields.

`Victim` contains victim identity.
`Victim` contains victim age.
`Victim` contains victim gender.
`Victim` contains police-victim status.
`Victim` supports victim vulnerability analytics.
`Victim` supports case severity enrichment.
`Victim` supports victim demographic trend analysis.
`Victim` creates `Person` graph nodes.
`Victim` creates `Victim` role nodes or labels.
`Victim` creates `VICTIM_IN_CASE` edges to `Case`.
`Victim` may create evidence-backed `ASSOCIATED_WITH` edges to accused.
Victim names must be protected by PII controls.
Victim demographic fields must never be inferred when absent.

`Accused` contains accused identity.
`Accused` contains accused age.
`Accused` contains accused gender.
`Accused` contains case-local person order such as A1 and A2.
`Accused` feeds repeat offender detection.
`Accused` feeds alias clustering.
`Accused` feeds hidden association detection.
`Accused` feeds gang candidate detection.
`Accused` feeds arrest likelihood models.
`Accused` creates `Person` graph nodes.
`Accused` creates `Accused` role labels.
`Accused` creates `ACCUSED_IN_CASE` edges.
`Accused` creates candidate `SAME_AS` edges across cases.
`Accused` creates `CO_ACCUSED_WITH` edges through shared cases.
Accused identity must not be merged destructively.
Resolved identities are intelligence overlays.
Official accused rows remain unchanged unless an officer corrects them.

`ComplainantDetails` contains complaint source identity.
`ComplainantDetails` contains age.
`ComplainantDetails` contains occupation.
`ComplainantDetails` contains religion.
`ComplainantDetails` contains caste.
`ComplainantDetails` contains gender.
`ComplainantDetails` feeds duplicate complaint detection.
`ComplainantDetails` feeds complainant-also-accused checks.
`ComplainantDetails` feeds source pattern analytics.
`ComplainantDetails` creates `Complainant` graph roles.
`ComplainantDetails` creates `FILED_CASE` edges.
Occupation can be normalized from explicit text.
Religion must only be accepted when explicit.
Caste must only be accepted when explicit.
AI must not infer sensitive attributes.

`ActSectionAssociation` contains the legal theory of the case.
`ActSectionAssociation` links each case to acts.
`ActSectionAssociation` links each case to sections.
`ActSectionAssociation` contains display order.
`ActSectionAssociation` feeds legal section classification.
`ActSectionAssociation` feeds charge consistency checking.
`ActSectionAssociation` feeds case gravity calibration.
`ActSectionAssociation` creates `INVOKES_ACT` edges.
`ActSectionAssociation` creates `INVOKES_SECTION` edges.
Legal extraction must validate against `Act`.
Legal extraction must validate against `Section`.
Legal extraction must validate against `CrimeHeadActSection`.

`ArrestSurrender` contains custody event intelligence.
`ArrestSurrender` contains arrest or surrender type.
`ArrestSurrender` contains arrest or surrender date.
`ArrestSurrender` contains arrest geography.
`ArrestSurrender` contains police station.
`ArrestSurrender` contains IO.
`ArrestSurrender` contains court.
`ArrestSurrender` contains accused link.
`ArrestSurrender` feeds arrest delay features.
`ArrestSurrender` feeds absconding risk.
`ArrestSurrender` feeds IO workload analytics.
`ArrestSurrender` creates `ArrestEvent` graph nodes.
`ArrestSurrender` creates `ARRESTED_IN_CASE` edges.
`ArrestSurrender` creates `ARRESTED_BY` edges to `Employee`.
`ArrestSurrender` creates `PRODUCED_BEFORE` edges to `Court`.
`ArrestSurrender` creates `OCCURRED_IN` edges to `District`.

`ChargesheetDetails` contains final report intelligence.
`ChargesheetDetails` contains chargesheet date.
`ChargesheetDetails` contains report type.
`ChargesheetDetails` contains police employee attribution.
`ChargesheetDetails` feeds chargesheet delay prediction.
`ChargesheetDetails` feeds case closure prediction.
`ChargesheetDetails` feeds investigation anomaly detection.
`ChargesheetDetails` creates `Chargesheet` graph nodes.
`ChargesheetDetails` creates `FILED_FOR` edges to `Case`.
`ChargesheetDetails` creates `FILED_BY` edges to `Employee`.
Chargesheet type `A` means chargesheet.
Chargesheet type `B` means false case.
Chargesheet type `C` means undetected.

`Employee` contains officer intelligence.
`Employee` contains district posting.
`Employee` contains unit posting.
`Employee` contains rank.
`Employee` contains designation.
`Employee` contains KGID.
`Employee` feeds workload models.
`Employee` feeds assignment recommendations.
`Employee` feeds audit anomaly detection.
`Employee` creates `PoliceOfficer` graph nodes.
`Employee` creates `ASSIGNED_TO` edges to `Unit`.
`Employee` creates `HOLDS_RANK` edges.
`Employee` creates `HAS_DESIGNATION` edges.

`Unit` contains police unit hierarchy.
`Unit` contains police station identity.
`Unit` contains parent unit.
`Unit` contains district.
`Unit` contains state.
`Unit` feeds station risk scoring.
`Unit` feeds resource allocation.
`Unit` feeds alert routing.
`Unit` creates `PoliceStation` graph nodes.
`Unit` creates `PARENT_UNIT` edges.
`Unit` creates `LOCATED_IN` edges to `District`.

`District` contains geographic jurisdiction.
`District` feeds district risk scoring.
`District` feeds spatial clustering.
`District` feeds regional trend detection.
`District` creates `District` graph nodes.
`District` creates `IN_STATE` edges to `State`.
`District` aggregates cases.
`District` aggregates units.
`District` aggregates courts.
`District` aggregates employees.

`Court` contains judicial venue intelligence.
`Court` feeds court workload analytics.
`Court` feeds case progression prediction.
`Court` creates `Court` graph nodes.
`Court` creates `HEARS` edges from cases.
`Court` creates `PRODUCED_ACCUSED_FROM` edges from arrest events.

`CrimeHead` contains major crime family intelligence.
`CrimeHead` feeds category classification.
`CrimeHead` feeds trend clustering.
`CrimeHead` feeds hotspot slices.
`CrimeHead` creates `CrimeHead` graph nodes.
`CrimeHead` creates `HAS_SUBHEAD` edges to `CrimeSubHead`.

`CrimeSubHead` contains specific offence intelligence.
`CrimeSubHead` feeds fine-grained classification.
`CrimeSubHead` feeds pattern detection.
`CrimeSubHead` feeds sub-category hotspots.
`CrimeSubHead` creates `CrimeSubHead` graph nodes.
`CrimeSubHead` creates `BELONGS_TO` edges to `CrimeHead`.

`CaseCategory` contains FIR/UDR/PAR/Zero FIR semantics.
`CaseCategory` feeds document type classification.
`CaseCategory` feeds category-specific forecasting.
`CaseCategory` creates `CaseCategory` graph nodes.
`CaseCategory` creates `CATEGORIZES` edges.

`GravityOffence` contains offence severity.
`GravityOffence` feeds severity classification.
`GravityOffence` feeds priority ranking.
`GravityOffence` feeds alert severity.
`GravityOffence` creates `Gravity` graph nodes.
`GravityOffence` creates `GRAVITY_OF` edges.

## 4. OCR Intelligence
The OCR system must support typed PDFs.
The OCR system must support scanned PDFs.
The OCR system must support scanned forms.
The OCR system must support police reports.
The OCR system must support chargesheets.
The OCR system must support witness statements.
The OCR system must support complaint letters.
The OCR system should support handwritten notes as a roadmap item.
Tesseract is simple and offline.
Tesseract is weak on noisy scans.
Tesseract is weak on complex layouts.
EasyOCR is easy for hackathons.
EasyOCR supports multiple languages.
EasyOCR is acceptable for screenshots and simple scans.
PaddleOCR is the recommended open-source OCR baseline.
PaddleOCR has strong printed document accuracy.
PaddleOCR has useful layout/table ecosystem support.
PaddleOCR can run offline.
PaddleOCR is practical for 24 to 48 hours.
Google Vision OCR has high accuracy.
Google Vision OCR is cloud dependent.
Google Vision OCR is excellent when credentials exist.
Microsoft OCR and Document Intelligence are strong for forms.
Microsoft OCR is strong for key-value extraction.
AWS Textract is strong for tables and forms.
AWS Textract is cloud dependent.
LayoutLM is useful after OCR for layout-aware understanding.
Donut can parse documents end to end.
Donut requires task-specific tuning for best results.
DocTR is a good deep-learning OCR option.
DocTR may require more engineering than PaddleOCR.
Hackathon recommendation: PaddleOCR plus rule/key-value extraction.
Fallback recommendation: EasyOCR when PaddleOCR setup is slow.
Cloud enhancement: Google Vision or Microsoft Document Intelligence.
Production recommendation: OCR router by document type.

## 5. Document Understanding
First classify the document type.
Supported type: FIR.
Supported type: chargesheet.
Supported type: witness statement.
Supported type: complaint.
Supported type: PDF.
Supported type: scanned form.
Supported type: police report.
Supported type: handwritten note.
The classifier uses title text.
The classifier uses layout shape.
The classifier uses keywords.
The classifier uses case number patterns.
The classifier uses section/act mentions.
Layout parsing must identify header.
Layout parsing must identify body.
Layout parsing must identify tables.
Layout parsing must identify seals.
Layout parsing must identify signatures.
Layout parsing must identify footers.
Table extraction must capture act-section lists.
Table extraction must capture accused/victim lists.
Table extraction must capture chargesheet fields.
Key-value extraction must capture CrimeNo.
Key-value extraction must capture CaseNo.
Key-value extraction must capture PoliceStationID candidate.
Key-value extraction must capture incident dates.
Key-value extraction must capture court name.
Key-value extraction must capture officer name.
Key-value extraction must capture complainant name.
Key-value extraction must capture accused names.
Key-value extraction must capture victim names.
Section detection must split narrative from legal text.
Multi-page understanding must preserve page order.
Multi-page understanding must carry entities across pages.
Confidence scoring must exist for every extracted field.
Evidence spans must be stored for every extracted field.

## 6. NLP Pipeline
NER extracts persons.
NER extracts roles.
NER extracts victims.
NER extracts accused.
NER extracts complainants.
NER extracts police officers.
NER extracts courts.
NER extracts police stations.
NER extracts districts.
NER extracts states.
NER extracts vehicles.
NER extracts phones.
NER extracts weapons.
NER extracts addresses.
NER extracts acts.
NER extracts sections.
NER extracts dates.
NER extracts times.
NER extracts monetary amounts.
NER extracts crime methods.
Relation extraction links accused to case.
Relation extraction links victim to case.
Relation extraction links complainant to case.
Relation extraction links officer to registration.
Relation extraction links IO to arrest.
Relation extraction links court to case.
Relation extraction links act to section.
Relation extraction links section to case.
Relation extraction links vehicle to accused when evidence exists.
Relation extraction links phone to accused when evidence exists.
Event extraction detects incident event.
Event extraction detects FIR registration event.
Event extraction detects information received event.
Event extraction detects arrest event.
Event extraction detects surrender event.
Event extraction detects court production event.
Event extraction detects chargesheet event.
Temporal extraction normalizes local dates.
Temporal extraction computes incident duration.
Temporal extraction computes reporting delay.
Temporal extraction computes arrest delay.
Temporal extraction computes chargesheet delay.
Address parsing splits house number.
Address parsing splits street.
Address parsing splits village.
Address parsing splits taluk.
Address parsing splits district.
Address parsing splits state.
Location extraction geocodes incident place.
Legal section detection maps text to `Act.ActCode`.
Legal section detection maps text to `Section.SectionCode`.
Crime category classification predicts `CrimeHeadID`.
Crime category classification predicts `CrimeSubHeadID`.
Timeline generation orders incident, reporting, registration, arrest, and chargesheet events.
Summarization creates analyst summaries from `BriefFacts`.
Contradiction detection flags date conflicts.
Contradiction detection flags location conflicts.
Contradiction detection flags impossible sequences.
Duplicate detection flags same document.
Duplicate detection flags same CrimeNo.
Duplicate detection flags same facts with altered identifiers.
Normalization maps names to canonical forms.
Normalization maps legal text to lookup values.
Entity linking maps extracted entities to official table IDs.

## 7. Entity Resolution
Same accused detection starts with exact identifiers.
Phone exact match is high confidence.
Vehicle registration exact match is high confidence.
CrimeNo exact match is deterministic.
KGID exact match is deterministic for employees.
Document checksum exact match is deterministic for documents.
Name matching uses lowercase normalization.
Name matching removes honorifics.
Name matching handles initials.
Name matching handles spelling variants.
Name matching handles transliteration variants.
Name matching uses edit distance.
Name matching uses token set ratio.
Name matching uses phonetic keys.
Alias matching uses explicit alias cues.
Address similarity uses token similarity.
Address similarity uses geospatial proximity.
Address similarity uses district-aware blocking.
Vehicle similarity uses registration normalization.
Vehicle similarity uses partial number matching with low confidence.
Cross-district linking uses name plus phone plus vehicle plus MO pattern.
Confidence scoring combines deterministic signals.
Confidence scoring combines fuzzy signals.
Confidence scoring combines graph context.
Confidence scoring combines temporal plausibility.
Duplicate identities are prevented by candidate edges.
Candidate `SAME_AS` edges require thresholding.
High-risk merges require human approval.
Official rows are not destructively merged.
Resolution metadata remains outside official FIR tables.

## 8. Knowledge Graph Intelligence
Graph node type: Case from `CaseMaster`.
Graph node type: Victim from `Victim`.
Graph node type: Accused from `Accused`.
Graph node type: Complainant from `ComplainantDetails`.
Graph node type: Police Officer from `Employee`.
Graph node type: Police Station from `Unit`.
Graph node type: District from `District`.
Graph node type: Court from `Court`.
Graph node type: Crime Head from `CrimeHead`.
Graph node type: Crime Sub Head from `CrimeSubHead`.
Graph node type: Crime Category from `CaseCategory`.
Graph node type: Gravity from `GravityOffence`.
Graph node type: Act from `Act`.
Graph node type: Section from `Section`.
Graph node type: Location from coordinates and extracted addresses.
Graph node type: Vehicle from NLP extraction.
Graph node type: Phone from NLP extraction.
Graph node type: Weapon from NLP extraction.
Relationship type: `VICTIM_IN_CASE`.
Relationship type: `ACCUSED_IN_CASE`.
Relationship type: `FILED_BY`.
Relationship type: `REGISTERED_BY`.
Relationship type: `REGISTERED_AT`.
Relationship type: `ARRESTED_IN_CASE`.
Relationship type: `ARRESTED_BY`.
Relationship type: `PRODUCED_BEFORE`.
Relationship type: `HEARD_IN`.
Relationship type: `CLASSIFIED_AS`.
Relationship type: `SUBCLASSIFIED_AS`.
Relationship type: `INVOKES_ACT`.
Relationship type: `INVOKES_SECTION`.
Relationship type: `SAME_AS`.
Relationship type: `CO_ACCUSED_WITH`.
Relationship type: `USES_PHONE`.
Relationship type: `USES_VEHICLE`.
Relationship type: `USED_WEAPON`.
Graph query: find repeat accused across districts.
Graph query: find co-accused communities.
Graph query: find shortest path between two accused.
Graph query: find cases sharing phone numbers.
Graph query: find cases sharing vehicles.
Graph query: find station-level offender movement.
Graph query: find court-linked case clusters.
Community detection finds gang candidates.
Shortest path explains hidden associations.
Centrality finds influential offenders.
PageRank finds high-connectivity suspects.
Betweenness centrality finds brokers between groups.
Louvain clustering finds offender communities.
Repeat offender detection combines graph degree and prior FIR count.
Gang detection requires repeated co-offending evidence.
Hidden association detection uses shared phone, vehicle, address, weapon, and co-accused links.
Influence detection uses centrality plus recency plus severity.

## 9. Feature Engineering
Feature: crime frequency by district.
Feature: crime frequency by station.
Feature: crime frequency by crime head.
Feature: rolling 1 day count.
Feature: rolling 7 day count.
Feature: rolling 30 day count.
Feature: incident hour.
Feature: incident day of week.
Feature: incident month.
Feature: incident duration.
Feature: reporting delay.
Feature: registration delay.
Feature: latitude.
Feature: longitude.
Feature: geohash.
Feature: district ID.
Feature: police station ID.
Feature: crime major head ID.
Feature: crime minor head ID.
Feature: case category ID.
Feature: gravity offence ID.
Feature: case status ID.
Feature: victim count.
Feature: accused count.
Feature: complainant count.
Feature: victim age average.
Feature: accused age average.
Feature: victim police flag count.
Feature: arrest delay.
Feature: arrest count.
Feature: chargesheet delay.
Feature: chargesheet type.
Feature: previous FIR count for accused candidate.
Feature: repeat offender count.
Feature: co-accused graph degree.
Feature: shared phone count.
Feature: shared vehicle count.
Feature: historical crime density.
Feature: distance to nearest hotspot.
Feature: festival indicator.
Feature: holiday indicator.
Feature: weather rainfall.
Feature: weather temperature.
Feature: road density.
Feature: population density.
Feature: socioeconomic indicator.
Feature: patrol density when available.
Feature: CCTV coverage when available.
Feature store must support offline training.
Feature store must support online inference.
Feature definitions must be versioned.
Feature lineage must reference official table columns.

## 10. Model Selection
LightGBM is the primary tabular model.
LightGBM is fast.
LightGBM is accurate on structured FIR data.
LightGBM supports SHAP explanations.
LightGBM fits district risk.
LightGBM fits station risk.
LightGBM fits case risk.
XGBoost is a strong baseline.
XGBoost is robust for small datasets.
XGBoost supports SHAP explanations.
CatBoost is strong for categorical features.
CatBoost handles `CrimeHeadID`, `UnitID`, and `DistrictID` well.
Random Forest is useful as an interpretable baseline.
Random Forest is less accurate than boosted trees for many tabular tasks.
Prophet is useful for quick seasonal trend baselines.
Prophet is hackathon friendly.
Temporal Fusion Transformer is a production roadmap model.
Temporal Fusion Transformer needs more history.
LSTM is less preferred for MVP.
LSTM can be used for sequence baselines later.
Isolation Forest is the MVP anomaly detector.
Autoencoder is a roadmap anomaly model.
DBSCAN can cluster hotspots.
HDBSCAN is preferred over DBSCAN for irregular geospatial clusters.
Node2Vec is practical for graph similarity.
Graph Neural Networks are roadmap models.
GNNs are not a 48-hour MVP dependency.

## 11. Crime Prediction Engine
Hotspot prediction input includes coordinates.
Hotspot prediction input includes crime head.
Hotspot prediction input includes time bucket.
Hotspot prediction input includes district.
Hotspot prediction input includes station.
Hotspot prediction output is center point.
Hotspot prediction output is radius.
Hotspot prediction output is risk score.
Hotspot prediction output is confidence.
Crime category prediction input includes BriefFacts.
Crime category prediction input includes act-section candidates.
Crime category prediction output is CrimeHeadID.
Crime category prediction output is CrimeSubHeadID.
Crime density prediction forecasts counts by district.
Crime density prediction forecasts counts by station.
District risk score combines density, gravity, recency, repeat offenders, and hotspots.
Station risk score combines local trend, workload, and severity.
Emerging pattern prediction compares current windows to seasonal baseline.
Seasonal trend detection uses weekly/monthly effects.
Repeat offender prediction uses graph and identity-resolution features.
Evaluation uses precision for alert quality.
Evaluation uses recall for missed risk.
Evaluation uses RMSE for count forecasts.
Evaluation uses MAE for risk calibration.
Evaluation uses AUC for binary risk.

## 12. Anomaly Detection
Detect fake patterns by repeated template text.
Detect fake patterns by duplicated facts with changed identifiers.
Detect abnormal incidents by outlier feature combinations.
Detect suspicious reports by inconsistent timeline.
Detect unusual crime spikes by rolling z-score.
Detect unusual crime spikes by Isolation Forest.
Detect data inconsistencies by schema validation rules.
Detect missing evidence by required field matrix.
Detect timeline conflicts by event ordering.
Detect unexpected crime movement by district transition anomaly.
Detect impossible coordinates by district boundary check.
Detect unusual section combinations by CrimeHeadActSection mismatch.
Detect officer workload anomalies by Employee assignment patterns.
Detect court mismatch by Court district/state validation.

## 13. Recommendation Engine
Recommendation: increase patrol.
Recommendation: temporary checkpoint.
Recommendation: deploy special unit.
Recommendation: increase night patrol.
Recommendation: conduct awareness campaign.
Recommendation: monitor repeat offender.
Recommendation: assign senior officer.
Recommendation: increase CCTV coverage.
Recommendations are generated from risk models.
Recommendations are generated from graph signals.
Recommendations are generated from anomaly alerts.
Recommendations are generated from resource constraints.
Recommendations are ranked by expected risk reduction.
Recommendations are ranked by urgency.
Recommendations are ranked by confidence.
Recommendations are ranked by feasibility.
Recommendations are ranked by cost.
Recommendations require natural-language explanations.
Recommendations must cite source tables.
Recommendations must cite model confidence.
Recommendations must cite evidence spans when document-derived.

## 14. Simulation AI
Simulation supports what-if patrol increase.
Simulation supports what-if checkpoint addition.
Simulation supports what-if festival crowd event.
Simulation supports what-if weather change.
Simulation supports what-if special unit deployment.
Simulation input includes district.
Simulation input includes station.
Simulation input includes intervention type.
Simulation input includes crime head.
Simulation input includes time window.
Simulation input includes resource level.
Simulation output includes baseline risk.
Simulation output includes projected risk.
Simulation output includes confidence interval.
Simulation output includes affected hotspots.
Simulation output includes explanation.
MVP simulation uses calibrated templates.
Production simulation uses causal inference.
Future simulation can use reinforcement learning.

## 15. Explainable AI
SHAP explains boosted tree predictions.
SHAP explains district risk.
SHAP explains station risk.
SHAP explains repeat offender score.
LIME is a quick local fallback.
Attention maps explain document extraction focus.
Attention maps do not prove causality.
Graph explanation shows paths.
Graph explanation shows shared phones.
Graph explanation shows shared vehicles.
Graph explanation shows shared addresses.
Graph explanation shows co-accused links.
Reasoning chains must cite data fields.
Natural language explanations must be concise.
Natural language explanations must be auditable.
Example explanation: risk increased because theft cases rose 35 percent.
Example explanation: risk increased because repeat offender graph activity increased.
Example explanation: risk increased because festival indicator is active.
Example explanation: risk increased because patrol density is low.

## 16. Realtime AI Pipeline
Realtime inference starts after `DocumentUploaded`.
OCR completion triggers NLP.
NLP completion triggers entity resolution.
Entity resolution triggers validation.
Approved enrichment triggers feature updates.
Feature updates trigger predictions.
Predictions trigger alerts.
Alerts trigger WebSocket dashboard updates.
Streaming features use rolling windows.
Online inference uses current feature values.
Batch inference refreshes nightly baselines.
Online learning is roadmap.
Prediction cache stores latest district risk.
Prediction cache stores latest station risk.
Prediction cache stores latest hotspot list.
Model cache stores loaded model artifacts.
GPU is optional for OCR and transformer inference.
CPU is enough for LightGBM.
CPU is enough for XGBoost.
CPU is enough for HDBSCAN at MVP scale.
Latency target for cached dashboard risk is sub-second.
Latency target for document extraction can be asynchronous.

## 17. AI Evaluation
Precision measures how many AI alerts are correct.
Recall measures how many true risks are caught.
F1 balances precision and recall.
ROC measures threshold behavior.
AUC measures ranking quality.
MAPE measures forecast percentage error.
RMSE penalizes large forecast errors.
MAE gives interpretable average forecast error.
Confusion matrix explains classification mistakes.
Prediction drift monitors changing feature distributions.
Bias detection checks disparate false positives.
Bias detection checks sensitive demographic misuse.
False positives waste police resources.
False negatives miss risk.
Model monitoring tracks latency.
Model monitoring tracks error rates.
Model monitoring tracks confidence distribution.
Model monitoring tracks feature drift.
Model monitoring tracks analyst override rate.

## 18. AI Security
Model security requires signed artifacts.
Model security requires version registry.
Model security requires access control.
Adversarial inputs include manipulated scans.
Adversarial inputs include hidden prompt text.
Adversarial inputs include poisoned historical rows.
OCR attacks include invisible text overlays.
OCR attacks include adversarial fonts.
Prompt injection must be filtered.
Prompt injection must not modify model instructions.
Hallucination prevention constrains outputs to schema fields.
Hallucination prevention constrains legal outputs to `Act` and `Section`.
Human verification is mandatory for low-confidence writes.
Confidence thresholds gate automatic suggestions.
Auditability records model name.
Auditability records model version.
Auditability records feature hash.
Auditability records source document.
Auditability records reviewer.
Auditability records final decision.

## 19. Hackathon AI MVP
Build OCR adapter or OCR mock.
Build document type classifier using rules.
Build CrimeNo parser.
Build act-section extractor.
Build legal lookup validator.
Build NER using pretrained model plus rules.
Build entity resolution scoring with fuzzy matching.
Build HDBSCAN hotspot clustering.
Build LightGBM or XGBoost risk baseline.
Build Isolation Forest anomaly baseline.
Build Neo4j/Memgraph graph projection demo.
Build recommendation templates.
Build SHAP-style explanations.
Use pretrained OCR.
Use pretrained sentence embeddings.
Use rule-based validation.
Use simulated weather/festival features.
Simulate GNNs.
Simulate online learning.
Simulate full patrol optimization.
Simulate handwriting recognition.
Judges should see document ingestion.
Judges should see structured extraction.
Judges should see CaseMaster-centered enrichment.
Judges should see hidden graph links.
Judges should see hotspot prediction.
Judges should see explainable recommendations.
Judges should see realtime update behavior.

## 20. Future Roadmap
Add Graph Neural Networks after graph labels exist.
Add federated learning for multi-jurisdiction learning.
Add privacy-preserving multi-state entity matching.
Add voice-based FIR understanding.
Add multilingual Kannada and English NLP.
Add handwriting recognition for notes.
Add CCTV metadata fusion where legally permitted.
Add agentic investigator assistant.
Add reinforcement learning for patrol optimization.
Add causal inference for intervention impact.
Add active learning from officer feedback.
Add model governance dashboards.
Add bias and fairness review boards.
Add continuous evaluation pipelines.
Add secure model registry.
Add red-team testing for document AI.

## 21. Final Implementation Principle
AI is an intelligence accelerator.
AI is not the legal source of truth.
The official FIR database remains authoritative.
Every prediction must be explainable.
Every enrichment must be traceable.
Every high-impact action must be reviewable.
Every schema decision must respect the ER diagram.
CrimeVerse AI wins by making the existing police data smarter, faster, safer, and more actionable.
