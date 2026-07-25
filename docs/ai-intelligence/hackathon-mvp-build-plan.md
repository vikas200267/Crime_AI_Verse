# CrimeVerse AI 48-Hour MVP Build Plan

## Goal

Show judges a complete intelligence loop:

1. Upload or select a police document.
2. Extract FIR intelligence.
3. Link extracted values to the official schema.
4. Project the case into a knowledge graph.
5. Predict a hotspot or risk score.
6. Generate an explainable recommendation.
7. Show realtime update behavior through existing project surfaces.

## What To Build

| Component | MVP Method | Reason |
| --- | --- | --- |
| OCR | PaddleOCR/EasyOCR or deterministic sample OCR JSON | fast and credible |
| document classifier | rules | reliable for demo |
| NER | pretrained NER plus regex | no training needed |
| legal section extraction | regex plus lookup validation | schema-faithful |
| entity resolution | fuzzy score plus deterministic phone/vehicle/name rules | explainable |
| graph | Neo4j/Memgraph or in-memory graph demo | high judge impact |
| hotspot | HDBSCAN or density grid | visual and practical |
| risk score | LightGBM/XGBoost baseline or weighted scoring | explainable |
| anomaly detection | Isolation Forest plus rules | quick |
| recommendation | ranked templates | controllable |
| explainability | SHAP-style factors and graph paths | judge-friendly |

## What To Simulate

- Graph Neural Networks.
- Online learning.
- Full handwriting recognition.
- Federated learning.
- Reinforcement learning for patrol optimization.
- Production-grade causal simulation.
- Real weather and festival integrations if unavailable.
- Large-scale training data.

## Demo Dataset

Minimum demo data:

- 20 to 50 synthetic `CaseMaster` rows.
- 5 districts.
- 10 police stations.
- 10 employees.
- 5 crime heads.
- 10 crime sub-heads.
- 10 legal sections.
- multi-victim cases.
- multi-accused cases.
- repeated accused with alias variation.
- shared phone across two cases.
- shared vehicle across two cases.
- one cross-district accused movement.
- one chargesheet delay.
- one arrest delay.
- one high-risk hotspot.

## Day 1

Hour 1:

- Freeze official schema assumptions.
- Confirm `CaseMaster` as root.
- Prepare sample lookup data.

Hour 2:

- Prepare sample police documents or OCR text fixtures.
- Create extraction JSON examples.

Hour 3:

- Implement rule extraction for CrimeNo, CaseNo, dates, station, acts, sections.
- Implement name extraction fallback rules.

Hour 4:

- Implement legal lookup validation.
- Implement section-to-crime-head consistency checks.

Hour 5:

- Implement fuzzy entity resolution score.
- Add alias/name variation examples.

Hour 6:

- Build graph projection from cases, accused, victims, unit, district, act, section.

Hour 7:

- Add graph queries for repeat offender and hidden association.

Hour 8:

- Create density/hotspot computation.
- Add hotspot risk explanation.

Day 1 finish:

- End-to-end path from document fixture to structured intelligence should work.

## Day 2

Hour 9:

- Add risk scoring model or weighted baseline.

Hour 10:

- Add anomaly detection rules and Isolation Forest if feasible.

Hour 11:

- Add recommendation templates.

Hour 12:

- Add natural-language explanations.

Hour 13:

- Add simulation templates for patrol and checkpoint interventions.

Hour 14:

- Add confidence thresholds and review queue states.

Hour 15:

- Add evaluation metrics on sample data.

Hour 16:

- Polish demo script and fallback data.

Day 2 finish:

- Judges should see a credible AI intelligence layer even without massive training.

## Demo Story

1. A complaint/FIR document is uploaded.
2. OCR extracts text and layout.
3. NLP extracts complainant, victim, accused, act, section, dates, station, and facts.
4. Validator maps fields to official `CaseMaster` and child tables.
5. Entity resolution finds the accused resembles an accused in another district.
6. Graph shows the shared phone or vehicle relationship.
7. Hotspot engine detects growing theft density near the station.
8. Risk model raises station risk.
9. Recommendation engine suggests night patrol and checkpoint.
10. Explanation cites theft increase, repeat-offender graph activity, and low patrol density.

## Judge Messaging

- "We do not replace the police database."
- "We enrich the official FIR schema."
- "Every prediction is explainable."
- "Every database-changing AI output can be reviewed."
- "The graph finds relationships that relational search misses."
- "The MVP is practical in 48 hours and upgrades cleanly to production."

