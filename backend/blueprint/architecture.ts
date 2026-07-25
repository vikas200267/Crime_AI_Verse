import type { ArchitectureLayer, BlueprintSection, EventTopic } from "./types";

export const chosenFramework = {
  framework: "FastAPI",
  reason:
    "FastAPI is the best production choice because CrimeVerse AI is OCR/NLP/model-heavy, Python-native workers can share Pydantic contracts with APIs, async IO is strong, and a hackathon team can ship quickly without giving up enterprise layering."
};

export const architectureDiagram = `
Client / Dashboard / Admin Tools
        |
FastAPI Controllers + WebSocket Gateway
        |
Services: FIR ingestion, Case, Graph, Prediction, Simulation, Alerts
        |
Repositories + Unit-of-Work Transactions
        |
Existing Police FIR DB (CaseMaster root) + AI Extension Tables
        |
Transactional Outbox -> Kafka Topics -> Workers
        |
OCR/NLP/Entity Resolution -> Graph Sync -> Prediction Refresh
        |
Redis Cache + OpenSearch + Neo4j/Memgraph + Notifications
`;

export const architectureLayers: ArchitectureLayer[] = [
  { name: "Controller Layer", responsibility: "HTTP/WebSocket boundary, authentication context, DTO validation, and response shaping.", keyComponents: ["CaseController", "DocumentController", "PredictionController", "GraphController", "SimulationController", "AdminController"] },
  { name: "Service Layer", responsibility: "Use-case orchestration and transaction boundaries.", keyComponents: ["CaseService", "FIRIngestionService", "EntityResolutionService", "HotspotService", "AlertService"] },
  { name: "Repository Layer", responsibility: "Schema-faithful persistence against official FIR tables and AI extension tables.", keyComponents: ["CaseRepository", "VictimRepository", "AccusedRepository", "LookupRepository", "AiRepository"] },
  { name: "Database Layer", responsibility: "Operational persistence, AI migrations, pooling, locks, audit, and history.", keyComponents: ["Official FIR schema", "AI extension schema", "Audit tables", "History tables"] },
  { name: "Streaming Layer", responsibility: "Durable backpressure, replay, and async processing.", keyComponents: ["Kafka", "Outbox publisher", "Consumer groups", "Dead letter topics"] },
  { name: "Graph Layer", responsibility: "Cross-case intelligence graph and association detection.", keyComponents: ["Neo4j or Memgraph", "GraphNode", "GraphEdge", "Sync cursors"] },
  { name: "AI Layer", responsibility: "OCR, extraction, classification, normalization, prediction, simulation, and explainability.", keyComponents: ["OCR adapter", "NER adapter", "Legal classifier", "Hotspot adapter", "Simulation engine"] },
  { name: "Cache Layer", responsibility: "Lookup cache, dashboard aggregates, WebSocket fanout, rate limits, and idempotency.", keyComponents: ["Redis", "cache-aside lookups", "pub/sub fanout"] },
  { name: "Notification Layer", responsibility: "Alert generation and officer/unit-scoped delivery.", keyComponents: ["AlertService", "WebSocket manager", "email/SMS adapters"] }
];

export const pipelineStages: BlueprintSection = {
  title: "Document Processing Pipeline",
  content: [
    "Upload: authenticated officer uploads FIR, complaint, arrest memo, chargesheet, or supporting file with station and case hints.",
    "Storage: immutable object storage records checksum, MIME type, virus scan status, retention class, and DocumentMetadata.",
    "OCR Queue: DocumentUploaded event creates a durable OCR job partitioned by document id or station.",
    "Text Extraction: OCRResult stores text, layout JSON, page confidence, language, status, and errors.",
    "NER: NLP extracts complainants, victims, accused, dates, locations, acts, sections, courts, officers, vehicles, phones, weapons, and MO patterns.",
    "Normalization: dates, names, locations, legal sections, courts, units, and employees are canonicalized against official lookup/master tables.",
    "Validation: rules verify required CaseMaster fields, active lookups, section-act compatibility, crime head mappings, and confidence thresholds.",
    "Entity Matching: resolution compares CrimeNo, CaseNo, PoliceStationID, dates, names, coordinates, and document hashes.",
    "Case Linking: officer review approves creating CaseMaster or updating official child tables.",
    "Database Update: repositories write official schema rows, audit/history, and outbox events in one transaction.",
    "Knowledge Graph Update: graph worker projects committed relational state to Neo4j/Memgraph.",
    "Prediction Refresh: hotspot and risk jobs recompute affected district, station, crime head, and time buckets.",
    "Realtime Notification: Kafka events update Redis, WebSocket channels, alerts, maps, dashboards, and simulations."
  ]
};

export const eventTopics: EventTopic[] = [
  { topic: "DocumentUploaded", producer: "DocumentController", subscribers: ["OCRWorker", "VirusScanWorker", "AuditWorker"], payload: "documentId, uploaderEmployeeId, unitId, checksum, documentType, caseHints" },
  { topic: "OCRCompleted", producer: "OCRWorker", subscribers: ["NLPWorker", "SearchIndexer"], payload: "documentId, ocrResultId, textUri, confidence, language, pageCount" },
  { topic: "EntityExtracted", producer: "NLPWorker", subscribers: ["EntityResolutionWorker", "ValidationWorker"], payload: "documentId, extractedEntities, legalCandidates, confidenceByField" },
  { topic: "CaseUpdated", producer: "CaseServiceOutbox", subscribers: ["GraphSyncWorker", "PredictionWorker", "SearchIndexer", "DashboardProjector"], payload: "caseMasterId, changedTables, version, unitId, districtId" },
  { topic: "VictimUpdated", producer: "CaseServiceOutbox", subscribers: ["GraphSyncWorker", "AuditWorker"], payload: "caseMasterId, victimMasterId, operation, version" },
  { topic: "AccusedUpdated", producer: "CaseServiceOutbox", subscribers: ["GraphSyncWorker", "RepeatOffenderWorker", "AuditWorker"], payload: "caseMasterId, accusedMasterId, operation, version" },
  { topic: "PredictionCompleted", producer: "PredictionWorker", subscribers: ["AlertWorker", "DashboardProjector", "WebSocketGateway"], payload: "predictionId, districtId, riskScore, modelVersion, explanation" },
  { topic: "GraphUpdated", producer: "GraphSyncWorker", subscribers: ["DashboardProjector", "AlertWorker"], payload: "caseMasterId, affectedNodeIds, affectedEdgeIds, syncVersion" },
  { topic: "AlertGenerated", producer: "AlertWorker", subscribers: ["NotificationWorker", "WebSocketGateway"], payload: "alertId, severity, districtId, unitId, recipients" },
  { topic: "SimulationCompleted", producer: "SimulationWorker", subscribers: ["WebSocketGateway", "AuditWorker"], payload: "scenarioId, resultId, projectedImpact, confidence" }
];

export const realtimeSections: BlueprintSection[] = [
  {
    title: "Event Driven Architecture",
    content: [
      "Choose Kafka for production because OCR, graph sync, prediction, search indexing, and dashboard projections need durable ordered partitions, replay, consumer groups, and DLQs.",
      "Use a transactional outbox written with official FIR commits so async projections never outrun the database.",
      "Partition case events by CaseMasterID, document events by DocumentMetadataID, and dashboard updates by district/unit scope."
    ]
  },
  {
    title: "WebSocket Architecture",
    content: [
      "The gateway authenticates JWTs, maps users to Unit, District, Rank, and permissions, then joins dashboard, map, graph, alert, notification, prediction, and simulation rooms.",
      "Redis pub/sub fans out Kafka-projected updates to all API replicas.",
      "Messages carry versions and cache keys so clients ignore stale deltas and request full snapshots after reconnect."
    ]
  },
  {
    title: "Knowledge Graph Backend",
    content: [
      "Use Neo4j or Memgraph as a projection; the relational FIR schema remains authoritative.",
      "Node types: Case, Person, Victim, Accused, Complainant, PoliceEmployee, Unit, District, State, Court, CrimeHead, CrimeSubHead, Act, Section, Document, Phone, Vehicle, Weapon, Address, MO Pattern.",
      "Edge types: FILED_BY, VICTIM_IN_CASE, ACCUSED_IN_CASE, ARRESTED_IN, ARRESTED_BY, REGISTERED_BY, HEARD_IN, OCCURRED_IN, BELONGS_TO_UNIT, CLASSIFIED_AS, INVOKES_SECTION, MENTIONS, ASSOCIATED_WITH, SAME_AS, REPEAT_OFFENDER_CANDIDATE.",
      "Duplicate prevention uses source table primary keys, canonical keys, document checksums, fuzzy person keys, and reviewer-approved SAME_AS edges.",
      "Incremental updates consume CaseUpdated and table-specific events and rebuild only affected subgraphs."
    ]
  },
  {
    title: "Search Engine",
    content: [
      "Use OpenSearch for FIR narrative and entity search while preserving relational authorization.",
      "Index CaseMaster fields, BriefFacts, VictimName, AccusedName, CrimeNo, CaseNo, Act, Section, Court, District, Unit, vehicle, phone, weapon, address, and MO pattern.",
      "Use exact keyword fields for CrimeNo/CaseNo/KGID, language analyzers for narrative, edge ngrams for names, geo_point for coordinates, and nested act-section arrays.",
      "Route every search through the API so RBAC and unit-scope filters are always applied."
    ]
  }
];
