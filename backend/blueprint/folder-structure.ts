import type { FolderNode } from "./types";

export const backendFolderStructure: FolderNode[] = [
  { path: "backend/api/controllers", purpose: "Thin HTTP adapters that parse context, call services, and return DTOs." },
  { path: "backend/api/routes", purpose: "Versioned REST and WebSocket route registration." },
  { path: "backend/api/services", purpose: "Business workflows for FIRs, documents, graph sync, predictions, simulations, and alerts." },
  { path: "backend/repositories", purpose: "Schema-faithful data access for official FIR tables and additive AI tables." },
  { path: "backend/models", purpose: "ORM mappings for the uploaded Police FIR schema without replacing official tables." },
  { path: "backend/schemas", purpose: "Runtime validators for requests, extracted entities, and database write commands." },
  { path: "backend/dto", purpose: "Stable API contracts separate from persistence column names." },
  { path: "backend/middleware", purpose: "Correlation IDs, request logs, rate limits, validation, and error handling." },
  { path: "backend/auth", purpose: "JWT, RBAC, police-unit scope, rank/designation permissions, and token lifecycle." },
  { path: "backend/graph", purpose: "Neo4j/Memgraph projection, graph queries, sync cursors, and duplicate prevention." },
  { path: "backend/simulation", purpose: "Intervention scenario orchestration and result persistence." },
  { path: "backend/prediction", purpose: "Hotspot, case-risk, recommendation, and model-history adapters." },
  { path: "backend/ocr", purpose: "Document ingestion, OCR job dispatch, text extraction, and OCR result persistence." },
  { path: "backend/nlp", purpose: "NER, legal section extraction, normalization, prompt-injection screening, and confidence scoring." },
  { path: "backend/entity_resolution", purpose: "Case/person/place matching against CaseMaster, Victim, Accused, Unit, Court, and Employee." },
  { path: "backend/hotspot", purpose: "PostGIS queries, spatial aggregation, heatmaps, and hotspot prediction publishing." },
  { path: "backend/scheduler", purpose: "Recurring reindexing, prediction refresh, retention cleanup, and graph consistency checks." },
  { path: "backend/events", purpose: "Kafka topics, producers, consumers, DLQs, outbox publisher, and idempotency metadata." },
  { path: "backend/workers", purpose: "Async workers for OCR, extraction, search indexing, graph updates, predictions, and alerts." },
  { path: "backend/database/migrations", purpose: "Migrations for AI extension tables only; the official FIR schema is integrated as existing schema." },
  { path: "backend/database/seeds", purpose: "Hackathon lookup fixtures, synthetic FIRs, and demo graph/prediction samples." },
  { path: "backend/tests", purpose: "Unit, integration, API, database, performance, security, and end-to-end tests." },
  { path: "backend/config", purpose: "Typed settings for database, Kafka, Redis, graph, search, storage, and model providers." },
  { path: "backend/logs", purpose: "Local development log sink; production uses centralized logging." },
  { path: "backend/blueprint", purpose: "Implementation-ready backend architecture exported as TypeScript data." }
];
