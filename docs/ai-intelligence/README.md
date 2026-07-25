# CrimeVerse AI Intelligence Layer

This folder contains the implementation-ready AI design pack for CrimeVerse AI.
It is intentionally focused on AI architecture, ML, NLP, OCR, graph intelligence,
prediction, recommendations, explainability, realtime inference, evaluation,
security, and the hackathon MVP.

The official operational schema from `Police_FIR_ER_Diagram.pdf` remains the
source of truth. The AI layer consumes and enriches `CaseMaster`, `Victim`,
`Accused`, `ComplainantDetails`, `ArrestSurrender`, `ChargesheetDetails`,
`ActSectionAssociation`, `CrimeHead`, `CrimeSubHead`, `Employee`, `Unit`,
`District`, `Court`, `CaseCategory`, `GravityOffence`, and lookup/master tables.

## Artifacts

- [AI Technical Design](../prompt-pack/02-ai-ml-prompt.md)
- [Feature Store Catalog](./feature-store-catalog.md)
- [Model Cards And Evaluation](./model-cards-and-evaluation.md)
- [Realtime AI Pipeline](./realtime-ai-pipeline.md)
- [Hackathon MVP Build Plan](./hackathon-mvp-build-plan.md)

## Coverage Matrix

| Prompt Part | Covered In |
| --- | --- |
| FIR data model from AI perspective | `02-ai-ml-prompt.md`, `backend/blueprint/ai-intelligence-layer.ts` |
| Complete AI architecture | `02-ai-ml-prompt.md`, `realtime-ai-pipeline.md` |
| OCR intelligence | `02-ai-ml-prompt.md`, `hackathon-mvp-build-plan.md` |
| Document understanding | `02-ai-ml-prompt.md`, `realtime-ai-pipeline.md` |
| NLP pipeline | `02-ai-ml-prompt.md`, `realtime-ai-pipeline.md` |
| Entity resolution | `02-ai-ml-prompt.md`, `realtime-ai-pipeline.md` |
| Knowledge graph intelligence | `02-ai-ml-prompt.md`, `model-cards-and-evaluation.md` |
| Feature engineering | `feature-store-catalog.md` |
| Machine learning models | `model-cards-and-evaluation.md` |
| Crime prediction engine | `model-cards-and-evaluation.md`, `feature-store-catalog.md` |
| Anomaly detection | `model-cards-and-evaluation.md` |
| Recommendation engine | `model-cards-and-evaluation.md`, `hackathon-mvp-build-plan.md` |
| Simulation AI | `model-cards-and-evaluation.md`, `hackathon-mvp-build-plan.md` |
| Explainable AI | `model-cards-and-evaluation.md` |
| Realtime AI pipeline | `realtime-ai-pipeline.md` |
| AI evaluation | `model-cards-and-evaluation.md` |
| AI security | `model-cards-and-evaluation.md`, `realtime-ai-pipeline.md` |
| Hackathon AI MVP | `hackathon-mvp-build-plan.md` |
| Future AI roadmap | `02-ai-ml-prompt.md` |

## Non-Goals

- No frontend implementation.
- No production ML training code.
- No alternative database model.
- No replacement of official FIR tables.
- No automatic destructive merge of people or cases.
- No sensitive demographic inference when fields are not explicitly present.

