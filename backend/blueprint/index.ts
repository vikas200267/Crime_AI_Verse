import { aiExtensionTables } from "./ai-extension-tables";
import { aiIntelligenceLayer } from "./ai-intelligence-layer";
import { apiEndpoints } from "./api-design";
import {
  architectureDiagram,
  architectureLayers,
  chosenFramework,
  eventTopics,
  pipelineStages,
  realtimeSections
} from "./architecture";
import { databaseStrategy } from "./database-strategy";
import { backendFolderStructure } from "./folder-structure";
import { rootEntity, schemaAnalysis, tableClassification } from "./schema-analysis";
import type { BlueprintSection } from "./types";

export const securityArchitecture: BlueprintSection = {
  title: "Security Architecture",
  content: [
    "JWT access tokens plus refresh-token rotation; service-to-service calls use mTLS and short-lived credentials.",
    "RBAC is scoped by Employee, Rank, Designation, Unit, UnitType hierarchy, District, and State.",
    "PII protection masks names, exact addresses, phone numbers, caste, religion, and victim details unless the caller has a case role or approved analytical privilege.",
    "Input validation uses typed DTOs, parameterized repositories, upload allowlists, OCR confidence thresholds, and schema-bound model outputs.",
    "Prompt-injection protection treats document text as untrusted evidence and rejects model outputs that follow hidden instructions in uploads.",
    "Secrets live in Kubernetes secrets or a cloud secret manager; no secrets in repo or logs.",
    "Immutable audit logs are hash-chained and exported to WORM storage."
  ]
};

export const performanceArchitecture: BlueprintSection = {
  title: "Performance",
  content: [
    "Redis cache-aside for lookup tables, unit hierarchy, dashboard snapshots, token revocation, idempotency keys, and WebSocket fanout.",
    "Connection pooling is tuned per API and worker process; long OCR/prediction jobs never hold database connections.",
    "Batch child inserts for case aggregate creation and batch lookup hydration to avoid N+1 joins.",
    "Cursor pagination for cases, alerts, documents, and graph paths; compression for large JSON responses.",
    "Scale stateless API pods horizontally, use Kafka consumer groups for workers, OpenSearch shards for search, and read replicas for analytics.",
    "Hackathon target: hundreds of concurrent dashboard users, dozens of document uploads per minute, and sub-second cached dashboard reads."
  ]
};

export const deploymentArchitecture: BlueprintSection = {
  title: "Deployment",
  content: [
    "Local MVP: Docker Compose with FastAPI, PostgreSQL/PostGIS, Redis, Kafka or Redpanda, OpenSearch, Neo4j/Memgraph, and worker containers.",
    "Production: Kubernetes with Nginx ingress, HPA autoscaling, pod disruption budgets, readiness/liveness probes, and separate worker deployments per queue.",
    "CI/CD runs lint, tests, migration dry-run, container build, vulnerability scan, and progressive deployment.",
    "Prometheus, Grafana, structured JSON logs, trace IDs, and alerts monitor queue lag, OCR failures, DB pool saturation, and WebSocket disconnect spikes.",
    "Environment variables are typed and validated at boot; secrets are mounted from secret manager."
  ]
};

export const errorHandlingArchitecture: BlueprintSection = {
  title: "Error Handling",
  content: [
    "Global exception handler returns stable error codes, correlation IDs, and safe messages.",
    "Retry transient OCR, graph, search, and prediction failures with exponential backoff and jitter.",
    "Kafka dead letter topics capture poison messages with payload hash, error class, retry count, and replay metadata.",
    "Database rollback occurs for any failed official-schema mutation; graph/search/prediction are eventually rebuilt from committed outbox events.",
    "Graceful degradation keeps case CRUD available when graph, search, prediction, or notification services are down."
  ]
};

export const testingStrategy: BlueprintSection = {
  title: "Testing Strategy",
  content: [
    "Unit tests cover services, validators, CrimeNo generation, RBAC policies, legal-section validation, and entity resolution scoring.",
    "Integration tests run against test PostgreSQL/PostGIS using the official schema plus AI migrations.",
    "API contract tests validate every endpoint status, error shape, and permission boundary.",
    "Database tests verify FK integrity, indexes, soft delete behavior, audit/history triggers, rollback, and concurrency locks.",
    "Load tests simulate document bursts, dashboard reads, WebSocket fanout, and graph sync lag.",
    "Security tests cover SQL injection, upload malware handling, prompt injection, IDOR, token expiry, and PII masking.",
    "Synthetic FIR data must include multi-victim, multi-accused, multiple act-sections, arrests in another district, chargesheet status changes, and ambiguous entity names."
  ]
};

export const hackathonMvp: BlueprintSection = {
  title: "48 Hour Hackathon MVP",
  content: [
    "Build for judges: document upload, OCR mock/adapter, extraction review, CaseMaster-centered create/update, dashboard overview, hotspot map API, graph API, alerts, and WebSocket updates.",
    "Mock or simulate: ML training, long-term model governance, full simulation physics, immutable WORM export, and enterprise HR identity sync.",
    "Use sample data for State, District, Unit, Employee, Act, Section, CrimeHead, CrimeSubHead, CaseCategory, GravityOffence, Court, and a compact FIR set.",
    "Highest-priority APIs: auth login, document upload/status, extraction review/apply, case read/search, dashboard overview, hotspot predictions, graph by case, alerts, simulation create/result.",
    "Judge-visible services: live document-to-case pipeline, schema-faithful writes around CaseMaster, graph association detection, hotspot refresh, and explainable alerts."
  ]
};

export const crimeverseBackendBlueprint = {
  product: "CrimeVerse AI",
  sourceSchema: "Police_FIR_ER_Diagram.pdf",
  rootEntity,
  chosenFramework,
  tableClassification,
  schemaAnalysis,
  backendFolderStructure,
  architectureDiagram,
  architectureLayers,
  databaseStrategy,
  aiIntelligenceLayer,
  aiExtensionTables,
  apiEndpoints,
  pipelineStages,
  eventTopics,
  realtimeSections,
  securityArchitecture,
  performanceArchitecture,
  deploymentArchitecture,
  errorHandlingArchitecture,
  testingStrategy,
  hackathonMvp
};

export type CrimeverseBackendBlueprint = typeof crimeverseBackendBlueprint;

export {
  aiExtensionTables,
  aiIntelligenceLayer,
  apiEndpoints,
  architectureDiagram,
  architectureLayers,
  backendFolderStructure,
  chosenFramework,
  databaseStrategy,
  eventTopics,
  pipelineStages,
  realtimeSections,
  rootEntity,
  schemaAnalysis,
  tableClassification
};
