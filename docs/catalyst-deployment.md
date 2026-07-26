# CRIMEVERSE AI Catalyst Deployment Plan

This project is prepared for deployment to **Zoho Catalyst Project-Rainfall**.

Project details:

- Catalyst project name: Project-Rainfall
- Catalyst project ID: 44619000000013025
- Recommended deployment target: Catalyst AppSail managed runtime

Do not commit account passwords, tokens, OAuth secrets, or Catalyst CLI tokens to this repository.

## Mandatory Deployment Choice

CRIMEVERSE AI is a full-stack app:

- React/Vite frontend
- Express TypeScript backend
- AI intelligence APIs served from the same Node server

Because the frontend and backend are tightly connected, the recommended Catalyst service is:

**Catalyst AppSail (managed runtime, Node.js 20)**

This keeps the dashboard and `/api/*` intelligence endpoints in one deployable service.

## Catalyst Services Used / Mapped

| Capability | Catalyst Service | Project Usage |
| --- | --- | --- |
| Full web app in managed runtime | AppSail | Hosts React frontend + Express backend |
| Backend logic | AppSail now, Functions later | Current APIs run in Express; can split ingestion jobs into Functions later |
| Frontend SPA | AppSail now, Slate/Web Client optional | Current SPA is served by Express from `dist/` |
| API routing / throttling | API Gateway | Add in front of AppSail APIs for production |
| User login/signup | Authentication | Enable for officer/SCRB role-based login |
| Relational records | Data Store | Persist FIR projections, alerts, recommendations, AI logs |
| Semi-structured data | NoSQL | Store flexible extracted entities and AI metadata |
| Blob/object storage | Stratus | Store FIR PDFs, OCR output, evidence files, reports |
| Cache | Cache | Cache district metrics, graph summaries, dashboard aggregates |
| OCR/Text analytics | Zia Services | Extract text/entities from FIR PDFs and scanned documents |
| LLM/RAG | QuickML | RAG over FIRs, chargesheets, SOPs, legal references |
| Tabular ML training | Zia AutoML | Train hotspot and risk scoring models on historical FIR data |
| PDF/report generation | SmartBrowz | Generate intelligence PDF reports and dashboard screenshots |
| Scheduled jobs | Cron / Job Scheduling | Refresh features, predictions, daily SCRB summaries |
| Event reactions | Signals + Event Functions | React to FIR insert/file upload/alert creation |
| Workflow orchestration | Circuits | Multi-step FIR ingestion and validation workflow |
| Email | Mail | Send daily intelligence reports and critical notifications |
| Push alerts | Push Notifications | Notify officers on high-risk alerts |
| CI/CD | Pipelines | Build, test, and deploy from GitHub |

## Why Not Split Frontend Immediately?

Catalyst Slate/Web Client Hosting is excellent for static frontend hosting. However, this prototype currently calls relative `/api/*` routes and is meant to run as one integrated full-stack command center.

For the hackathon submission, AppSail is the simplest valid Catalyst deployment because:

- One URL serves both dashboard and API.
- No cross-origin API configuration is needed.
- Evidence analysis, graph, predictions, anomalies, simulation, and recommendations remain connected.
- It keeps spend low for the available credits.

Later, the frontend can be moved to Catalyst Slate/Web Client Hosting and the backend can remain on AppSail/API Gateway.

## Files Added For Catalyst

- `app-config.json`: AppSail managed-runtime configuration.
- `server.ts`: Updated to listen on `X_ZOHO_CATALYST_LISTEN_PORT` when deployed on Catalyst.

## Local Build Verification

```bash
npm install
npm run lint
npm run build
npm start
```

Local URL:

```text
http://localhost:8180
```

## AppSail Deploy Option

After logging into Catalyst CLI and binding the local directory to Project-Rainfall, deploy the AppSail service.

Suggested service name:

```text
crimeverse-ai
```

Recommended AppSail settings:

- Runtime: Node.js 20
- Startup command: `node dist/server.cjs`
- Build path: project root
- Memory: 512 MB
- Port: use `X_ZOHO_CATALYST_LISTEN_PORT`

The app already reads:

```text
process.env.X_ZOHO_CATALYST_LISTEN_PORT
```

## Standalone CLI Deploy Command

If using standalone AppSail deploy from the Catalyst project root:

```bash
catalyst deploy appsail standalone --name crimeverse-ai --build-path "%cd%" --stack node20 --command "node dist/server.cjs"
```

If using PowerShell:

```powershell
catalyst deploy appsail standalone --name crimeverse-ai --build-path (Get-Location).Path --stack node20 --command "node dist/server.cjs"
```

If the CLI asks for project selection, choose:

```text
Project-Rainfall
PID: 44619000000013025
```

## Console Deploy Option

If the CLI is unavailable:

1. Build locally with `npm run build`.
2. Open Catalyst Console.
3. Select Project-Rainfall.
4. Go to AppSail.
5. Create a Node.js 20 managed runtime app.
6. Upload/deploy the project source.
7. Set startup command to `node dist/server.cjs`.
8. Set memory to 512 MB.
9. Confirm the app uses the Catalyst listen port.

## Cost-Safe Hackathon Plan

For ₹1300 credits, deploy only:

1. AppSail managed runtime for the full app.
2. Authentication only if login is needed for judging.
3. Data Store/Stratus only if real persistent FIR uploads are required.

Defer higher-cost services such as QuickML, Zia AutoML, SmartBrowz automation, and large storage until after finalist selection.

## Production Upgrade Roadmap

Phase 1:

- AppSail deployment
- API Gateway
- Authentication
- Data Store for FIR projections and alerts

Phase 2:

- Stratus file storage
- Zia OCR/text analytics
- SmartBrowz report generation
- Cron feature refresh jobs

Phase 3:

- QuickML RAG for case/legal intelligence
- Zia AutoML for risk models
- Signals/Event Functions for real-time ingestion
- Circuits for multi-step evidence workflows
- Pipelines for CI/CD
