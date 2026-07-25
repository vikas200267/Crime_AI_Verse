# CrimeVerse AI Backend Blueprint

This backend package is built around the uploaded `Police_FIR_ER_Diagram.pdf`.
The official FIR schema is not replaced or simplified: `CaseMaster` is the root
entity, and child workflows attach to `ComplainantDetails`, `Victim`, `Accused`,
`ArrestSurrender`, `ActSectionAssociation`, and `ChargesheetDetails`.

The TypeScript modules in `backend/blueprint` provide an implementation-ready
architecture specification for the production FastAPI backend:

- ER schema analysis and table responsibilities.
- Enterprise folder structure.
- Controller/service/repository/database/event/graph/AI/cache/notification architecture.
- Existing-schema database strategy and additive AI tables.
- REST API catalogue.
- Document pipeline, Kafka events, WebSockets, graph, search, security,
  performance, deployment, error handling, tests, and 48-hour MVP plan.
- AI Intelligence Layer design for OCR, NLP, entity resolution, graph
  intelligence, feature engineering, prediction, anomaly detection,
  recommendations, simulation, explainability, evaluation, security, and roadmap.

Additional AI design documents live in `docs/ai-intelligence`.

Run the demo API with:

```bash
npm run dev
```

Useful endpoints:

- `GET /api/health`
- `GET /api/blueprint`
- `GET /api/blueprint/full`
- `GET /api/blueprint/schema`
- `GET /api/blueprint/architecture`
- `GET /api/blueprint/api`
- `GET /api/blueprint/ai-extension-tables`
- `GET /api/blueprint/mvp`
