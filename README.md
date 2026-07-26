# CRIMEVERSE AI

AI-Powered Crime Intelligence Digital Twin for predictive policing, FIR intelligence, hotspot analytics, criminal network discovery, anomaly detection, and explainable intervention recommendations.

CRIMEVERSE AI was built for the KSP Datathon 2026 challenge: **AI-Driven Crime Analytics & Visualization Platform**. The prototype moves beyond static Excel-style reporting by turning fragmented crime records into an interactive intelligence platform for SCRB, district police leadership, and investigation teams.

## Problem

Karnataka State Police maintains large volumes of FIR and crime records covering incidents, offenders, victims, legal sections, locations, courts, and police stations. These records are often fragmented across manual workflows, Excel reports, and isolated systems.

This creates four major gaps:

- Data silos and manual analysis slow down statewide intelligence.
- Hidden associations between suspects, victims, vehicles, phones, and locations remain difficult to detect.
- SCRB receives incomplete or delayed information for strategic analysis.
- Policing stays reactive because emerging trends and hotspots are not surfaced early enough.

## Solution

CRIMEVERSE AI adds an intelligence layer on top of the official FIR data model. It does not replace police records; it enriches them with AI-driven projections, graph links, predictive signals, and explainable recommendations.

The platform provides:

- **EvidenceFlow AI** for FIR and evidence text extraction.
- **Crime Knowledge Graph** for suspect-victim-location-link analysis.
- **Predictive Digital Twin** for hotspot, anomaly, and risk scoring.
- **Intervention Simulator** for comparing proactive policing actions.
- **Command Center Dashboard** for district-level visualization and decision support.

## Key Features

- Interactive crime intelligence dashboard.
- District and police station drill-down.
- Spatiotemporal hotspot detection.
- Emerging trend alerts.
- FIR evidence extraction and schema projection.
- Suspect, victim, location, phone, vehicle, and case relationship graph.
- Repeat offender and recurring modus operandi tracking.
- Hidden association detection.
- Predictive risk scoring.
- Anomaly detection.
- Explainable AI recommendations.
- Intervention simulation APIs.
- Search across incidents, people, places, alerts, and intelligence signals.

## Implemented Prototype

This repository contains a working full-stack TypeScript prototype:

- React command center frontend.
- Express backend API server.
- In-memory AI intelligence engine.
- FIR-style evidence analysis.
- Feature-store generation.
- Crime graph generation.
- Hotspot prediction.
- Anomaly detection.
- Recommendation workflow.
- Intervention simulation.
- Production build support.

## Tech Stack

- **Frontend:** React, Vite, Recharts, lucide-react
- **Backend:** Node.js, Express, TypeScript
- **Build:** Vite, esbuild
- **AI MVP:** deterministic NLP-style extraction, explainable scoring, graph analytics
- **Future AI Path:** OCR, spaCy/GLiNER, LayoutLM, XGBoost/LightGBM, Neo4j/Memgraph, Kafka, PostGIS

## Architecture

```text
Police Records / FIR Text
        |
        v
EvidenceFlow AI
        |
        v
FIR Schema Projection
        |
        v
Crime Knowledge Graph + Feature Store
        |
        v
Prediction, Anomaly, Search, Simulation
        |
        v
Command Center Dashboard + Recommendations
```

The official FIR schema remains the source of truth. The backend blueprint is built around `CaseMaster` and related FIR entities such as complainants, victims, accused persons, arrests, legal sections, courts, police stations, districts, and chargesheet details.

## API Highlights

Useful endpoints implemented in the prototype:

- `GET /api/health`
- `GET /api/metrics`
- `GET /api/incidents`
- `GET /api/graph`
- `GET /api/recommendations`
- `GET /api/alerts`
- `POST /api/evidence/analyze`
- `POST /api/scenarios/run`
- `GET /api/ai/status`
- `GET /api/ai/fir-projection`
- `GET /api/ai/features`
- `GET /api/ai/predictions`
- `GET /api/ai/anomalies`
- `GET /api/ai/graph-insights`
- `GET /api/ai/evaluate`
- `GET /api/ai/pipeline`
- `GET /api/search`
- `GET /api/blueprint`
- `GET /api/blueprint/full`

Example evidence analysis request:

```bash
curl -X POST http://localhost:8180/api/evidence/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"An assault case was reported near Market Road at 22:30. The accused attacked the victim using a sharp weapon and escaped on a two-wheeler.\"}"
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the production app:

```bash
npm run build
```

Run the production server:

```bash
npm start
```

Default local URL:

```text
http://localhost:8180
```

## Catalyst Deployment

This project is prepared for Zoho Catalyst deployment using **Catalyst AppSail managed runtime**.

Recommended Catalyst project:

```text
Project-Rainfall
PID: 44619000000013025
```

The app is a full-stack React + Express command center, so AppSail is the recommended deployment target because it serves both the frontend and `/api/*` AI intelligence endpoints from one Catalyst-managed Node.js runtime.

Catalyst-ready files:

- `app-config.json`
- `docs/catalyst-deployment.md`

The server listens on Catalyst's AppSail port variable:

```text
X_ZOHO_CATALYST_LISTEN_PORT
```

Local development still defaults to:

```text
PORT=8180
```

See [Catalyst Deployment Plan](docs/catalyst-deployment.md) for the service mapping and deploy commands.

## Validation

The prototype has been validated with:

```bash
npm run lint
npm run build
```

Prototype intelligence metrics include:

- 22 graph nodes
- 27 graph relationships
- 8 feature rows
- 6 hotspot predictions
- 6 anomaly signals

## Repository Structure

```text
.
|-- backend/
|   |-- ai/                 # AI intelligence engine, seed data, domain types
|   |-- api/                # Express controllers, routes, services
|   `-- blueprint/          # FIR schema, architecture, API, AI design blueprints
|-- docs/
|   |-- ai-intelligence/    # AI design, feature store, model evaluation, pipeline docs
|   `-- prompt-pack/        # Build prompts and architecture prompt material
|-- src/                    # React frontend
|-- server.ts               # Express + Vite/production server
|-- package.json
`-- README.md
```

## Hackathon Impact

CRIMEVERSE AI helps police teams move from reactive reporting to proactive intelligence:

- SCRB can visualize statewide patterns faster.
- District leadership can detect hotspots and allocate resources better.
- Investigators can discover repeat offenders and hidden networks.
- Analysts can identify anomalies and emerging crime categories.
- Officers get explainable recommendations instead of opaque AI outputs.

## Future Roadmap

- Integrate official FIR database and secure role-based access.
- Add OCR for scanned FIRs and evidence documents.
- Use trained NLP models for entity extraction and legal section mapping.
- Move graph intelligence to Neo4j or Memgraph.
- Add PostGIS for geospatial hotspot analytics.
- Add Kafka-based realtime event processing.
- Add model monitoring, audit logs, and human-in-the-loop review.
- Scale from district pilot to statewide digital twin.

## Project Status

Hackathon prototype implemented and ready for demonstration.
