import type { AiExtensionTable } from "./types";

export const aiExtensionTables: AiExtensionTable[] = [
  {
    table: "DocumentMetadata",
    purpose: "Immutable metadata for uploaded FIR documents, complaints, arrest memos, chargesheets, and supporting files.",
    columns: [
      { name: "DocumentID", type: "UUID PK", description: "Document identifier." },
      { name: "CaseMasterID", type: "INT NULL FK CaseMaster", description: "Linked case after resolution." },
      { name: "UploadedByEmployeeID", type: "INT FK Employee", description: "Uploader." },
      { name: "PoliceStationID", type: "INT FK Unit", description: "Station scope." },
      { name: "DocumentType", type: "VARCHAR", description: "FIR, complaint, arrest memo, chargesheet, evidence, other." },
      { name: "StorageUri", type: "VARCHAR", description: "Object storage pointer." },
      { name: "ChecksumSha256", type: "CHAR(64)", description: "Duplicate and tamper detection." },
      { name: "VirusScanStatus", type: "VARCHAR", description: "pending, clean, infected, failed." },
      { name: "CreatedAt", type: "TIMESTAMP", description: "Upload timestamp." }
    ],
    relationships: ["References CaseMaster, Employee, and Unit when known."],
    indexes: ["unique(ChecksumSha256)", "idx_document_case(CaseMasterID)", "idx_document_station_created(PoliceStationID, CreatedAt)"],
    retention: "Retain according to police records policy; never purge while linked to retained case evidence."
  },
  {
    table: "OCRResult",
    purpose: "OCR text, layout, confidence, and processing status for each document.",
    columns: [
      { name: "OCRResultID", type: "UUID PK", description: "OCR result identifier." },
      { name: "DocumentID", type: "UUID FK DocumentMetadata", description: "Source document." },
      { name: "Engine", type: "VARCHAR", description: "OCR engine/provider." },
      { name: "Language", type: "VARCHAR", description: "Detected language." },
      { name: "ExtractedText", type: "TEXT", description: "Extracted text or pointer." },
      { name: "LayoutJson", type: "JSONB", description: "Pages, blocks, tables, coordinates." },
      { name: "MeanConfidence", type: "DECIMAL", description: "0-1 OCR confidence." },
      { name: "Status", type: "VARCHAR", description: "pending, completed, failed." },
      { name: "ErrorMessage", type: "TEXT NULL", description: "Failure detail." }
    ],
    relationships: ["Many OCR attempts can belong to one DocumentMetadata row."],
    indexes: ["idx_ocr_document_created(DocumentID, CreatedAt)", "idx_ocr_status(Status)"],
    retention: "Keep latest successful OCR for case life; expire failed attempts after 180 days unless audited."
  },
  {
    table: "AIExtractionLog",
    purpose: "Auditable structured extraction output, confidence, validation, and officer review state.",
    columns: [
      { name: "ExtractionID", type: "UUID PK", description: "Extraction run." },
      { name: "DocumentID", type: "UUID FK DocumentMetadata", description: "Source document." },
      { name: "CaseMasterID", type: "INT NULL FK CaseMaster", description: "Matched case." },
      { name: "ModelName", type: "VARCHAR", description: "Model name." },
      { name: "ModelVersion", type: "VARCHAR", description: "Model/prompt version." },
      { name: "ExtractedJson", type: "JSONB", description: "Structured entities and fields." },
      { name: "ConfidenceJson", type: "JSONB", description: "Confidence by field." },
      { name: "ValidationStatus", type: "VARCHAR", description: "pending, valid, needs_review, rejected, applied." },
      { name: "ReviewedByEmployeeID", type: "INT NULL FK Employee", description: "Officer reviewer." }
    ],
    relationships: ["Links to DocumentMetadata, optional CaseMaster, and reviewer Employee."],
    indexes: ["idx_extract_case(CaseMasterID)", "idx_extract_document(DocumentID)", "idx_extract_status(ValidationStatus)", "gin(ExtractedJson)"],
    retention: "Retain applied extractions for audit; purge rejected raw payloads after policy window if not evidentiary."
  },
  {
    table: "PredictionResult",
    purpose: "Generic model output for case risk, hotspot risk, repeat offender signals, and recommendations.",
    columns: [
      { name: "PredictionID", type: "UUID PK", description: "Prediction ID." },
      { name: "CaseMasterID", type: "INT NULL FK CaseMaster", description: "Case scope." },
      { name: "DistrictID", type: "INT NULL FK District", description: "District scope." },
      { name: "UnitID", type: "INT NULL FK Unit", description: "Unit scope." },
      { name: "PredictionType", type: "VARCHAR", description: "case_risk, hotspot, repeat_offender, recommendation." },
      { name: "Score", type: "DECIMAL", description: "0-100 normalized score." },
      { name: "ExplanationJson", type: "JSONB", description: "Factors and evidence." },
      { name: "ModelVersion", type: "VARCHAR", description: "Model version." },
      { name: "ValidFrom", type: "TIMESTAMP", description: "Validity start." },
      { name: "ValidTo", type: "TIMESTAMP NULL", description: "Validity end." }
    ],
    relationships: ["Optionally references CaseMaster, District, and Unit."],
    indexes: ["idx_prediction_scope(PredictionType, DistrictID, UnitID, ValidFrom)", "idx_prediction_case(CaseMasterID, PredictionType)"],
    retention: "Keep detailed predictions for two years; archive older monthly summaries."
  },
  {
    table: "HotspotPrediction",
    purpose: "Spatial-temporal crime hotspot forecasts.",
    columns: [
      { name: "HotspotID", type: "UUID PK", description: "Hotspot ID." },
      { name: "DistrictID", type: "INT FK District", description: "District scope." },
      { name: "UnitID", type: "INT NULL FK Unit", description: "Unit scope." },
      { name: "CrimeHeadID", type: "INT NULL FK CrimeHead", description: "Crime class." },
      { name: "Latitude", type: "DECIMAL", description: "Center latitude." },
      { name: "Longitude", type: "DECIMAL", description: "Center longitude." },
      { name: "RadiusMeters", type: "INT", description: "Hotspot radius." },
      { name: "RiskScore", type: "DECIMAL", description: "0-100 score." },
      { name: "WindowStart", type: "TIMESTAMP", description: "Forecast start." },
      { name: "WindowEnd", type: "TIMESTAMP", description: "Forecast end." }
    ],
    relationships: ["References District, Unit, and CrimeHead."],
    indexes: ["gist(geography point)", "idx_hotspot_window(DistrictID, WindowStart, WindowEnd)", "idx_hotspot_crime(CrimeHeadID, RiskScore)"],
    retention: "Retain details for 18 months; keep aggregate accuracy metrics longer."
  },
  {
    table: "CrimeTwinSnapshot",
    purpose: "Versioned digital twin snapshot by state, district, unit, or case scope.",
    columns: [
      { name: "SnapshotID", type: "UUID PK", description: "Snapshot ID." },
      { name: "ScopeType", type: "VARCHAR", description: "state, district, unit, case." },
      { name: "ScopeID", type: "VARCHAR", description: "Scope identifier." },
      { name: "SnapshotJson", type: "JSONB", description: "Aggregates, graph metrics, risks, and alerts." },
      { name: "SourceEventOffset", type: "VARCHAR", description: "Kafka watermark." },
      { name: "CreatedAt", type: "TIMESTAMP", description: "Snapshot timestamp." }
    ],
    relationships: ["References official table IDs by scope convention."],
    indexes: ["idx_twin_scope_created(ScopeType, ScopeID, CreatedAt)", "gin(SnapshotJson)"],
    retention: "Hourly for 90 days, daily for two years."
  },
  {
    table: "GraphNode",
    purpose: "Relational mirror of graph projection nodes for audit, sync, and fallback APIs.",
    columns: [
      { name: "GraphNodeID", type: "UUID PK", description: "Node ID." },
      { name: "NodeType", type: "VARCHAR", description: "Case, Person, Unit, Court, Location, Act, Section, etc." },
      { name: "SourceTable", type: "VARCHAR", description: "Official source table." },
      { name: "SourcePK", type: "VARCHAR", description: "Source primary key." },
      { name: "CanonicalKey", type: "VARCHAR", description: "Deduplication key." },
      { name: "PropertiesJson", type: "JSONB", description: "Projected properties." },
      { name: "UpdatedAt", type: "TIMESTAMP", description: "Last sync." }
    ],
    relationships: ["SourceTable/SourcePK points back to CaseMaster, Accused, Victim, Employee, Unit, Court, and lookups."],
    indexes: ["unique(NodeType, SourceTable, SourcePK)", "idx_graph_node_canonical(NodeType, CanonicalKey)", "gin(PropertiesJson)"],
    retention: "Maintain while source record exists; tombstone on official seal/soft delete."
  },
  {
    table: "GraphEdge",
    purpose: "Relational mirror of graph relationships.",
    columns: [
      { name: "GraphEdgeID", type: "UUID PK", description: "Edge ID." },
      { name: "FromNodeID", type: "UUID FK GraphNode", description: "Source node." },
      { name: "ToNodeID", type: "UUID FK GraphNode", description: "Target node." },
      { name: "EdgeType", type: "VARCHAR", description: "Relationship type." },
      { name: "Confidence", type: "DECIMAL", description: "0-1 confidence." },
      { name: "EvidenceJson", type: "JSONB", description: "Source documents and fields." },
      { name: "UpdatedAt", type: "TIMESTAMP", description: "Last sync." }
    ],
    relationships: ["Connects GraphNode rows and maps to Neo4j/Memgraph relationships."],
    indexes: ["idx_graph_edge_from(FromNodeID, EdgeType)", "idx_graph_edge_to(ToNodeID, EdgeType)", "idx_graph_edge_type(EdgeType, Confidence)"],
    retention: "Preserve evidence-linked edges while source case is retained; expire rejected candidates after 180 days."
  },
  {
    table: "Alert",
    purpose: "Operational alerts from predictions, graph patterns, validations, and simulations.",
    columns: [
      { name: "AlertID", type: "UUID PK", description: "Alert ID." },
      { name: "CaseMasterID", type: "INT NULL FK CaseMaster", description: "Related case." },
      { name: "DistrictID", type: "INT NULL FK District", description: "District scope." },
      { name: "UnitID", type: "INT NULL FK Unit", description: "Unit scope." },
      { name: "Severity", type: "VARCHAR", description: "info, warning, critical." },
      { name: "AlertType", type: "VARCHAR", description: "hotspot, validation, graph, repeat_offender, simulation." },
      { name: "Message", type: "TEXT", description: "Human-readable alert." },
      { name: "EvidenceJson", type: "JSONB", description: "Why generated." },
      { name: "Status", type: "VARCHAR", description: "open, acknowledged, dismissed, resolved." }
    ],
    relationships: ["Optionally references CaseMaster, District, and Unit."],
    indexes: ["idx_alert_scope_status(DistrictID, UnitID, Status, CreatedAt)", "idx_alert_case(CaseMasterID)", "idx_alert_type_severity(AlertType, Severity)"],
    retention: "Retain operational alerts for two years; archive resolved low-severity rows after 180 days."
  },
  {
    table: "SimulationScenario",
    purpose: "Proposed policing interventions and assumptions.",
    columns: [
      { name: "ScenarioID", type: "UUID PK", description: "Scenario ID." },
      { name: "CreatedByEmployeeID", type: "INT FK Employee", description: "Creator." },
      { name: "DistrictID", type: "INT FK District", description: "Target district." },
      { name: "UnitID", type: "INT NULL FK Unit", description: "Target unit." },
      { name: "InterventionType", type: "VARCHAR", description: "patrol_reallocation, checkpoints, lighting, drone, outreach." },
      { name: "InputsJson", type: "JSONB", description: "Assumptions and resources." },
      { name: "Status", type: "VARCHAR", description: "draft, running, completed, failed." }
    ],
    relationships: ["References Employee, District, and Unit."],
    indexes: ["idx_scenario_scope(DistrictID, UnitID, CreatedAt)", "idx_scenario_status(Status)"],
    retention: "Keep scenarios for one year; preserve demo scenarios as seed records."
  },
  {
    table: "SimulationResult",
    purpose: "Simulation outputs and explanations.",
    columns: [
      { name: "SimulationResultID", type: "UUID PK", description: "Result ID." },
      { name: "ScenarioID", type: "UUID FK SimulationScenario", description: "Scenario." },
      { name: "BaselineRisk", type: "DECIMAL", description: "Risk before intervention." },
      { name: "ProjectedRisk", type: "DECIMAL", description: "Projected risk after intervention." },
      { name: "Confidence", type: "DECIMAL", description: "0-1 confidence." },
      { name: "ResultJson", type: "JSONB", description: "Detailed projections and affected hotspots." }
    ],
    relationships: ["Belongs to SimulationScenario."],
    indexes: ["idx_simulation_result_scenario(ScenarioID, CreatedAt)"],
    retention: "Retain with scenarios for one year."
  },
  {
    table: "ModelPredictionHistory",
    purpose: "Model governance history for inputs, outputs, versions, and observed outcomes.",
    columns: [
      { name: "HistoryID", type: "UUID PK", description: "History ID." },
      { name: "PredictionID", type: "UUID NULL FK PredictionResult", description: "Prediction result." },
      { name: "ModelName", type: "VARCHAR", description: "Model name." },
      { name: "ModelVersion", type: "VARCHAR", description: "Version." },
      { name: "InputHash", type: "CHAR(64)", description: "Hashed feature payload." },
      { name: "OutputJson", type: "JSONB", description: "Prediction output." },
      { name: "ObservedOutcomeJson", type: "JSONB NULL", description: "Outcome captured later." }
    ],
    relationships: ["Optionally references PredictionResult."],
    indexes: ["idx_model_history_model(ModelName, ModelVersion, CreatedAt)", "idx_model_history_prediction(PredictionID)"],
    retention: "Keep for at least three years with hashed/redacted inputs."
  }
];
