# CrimeVerse Realtime AI Pipeline

## Principle

Realtime AI is event-driven, but official relational commits remain the truth.
Graph, search, feature, prediction, alert, and dashboard projections are rebuilt
from committed state and transactional outbox events.

## Pipeline Diagram

DocumentUploaded
  |
VirusScanRequested
  |
OCRRequested
  |
OCRCompleted
  |
DocumentClassified
  |
EntitiesExtracted
  |
RelationsExtracted
  |
EntityResolutionCompleted
  |
ValidationCompleted
  |
OfficerReviewRequested
  |
OfficialSchemaUpdated
  |
FeatureStoreUpdated
  |
GraphProjectionUpdated
  |
PredictionCompleted
  |
RecommendationGenerated
  |
AlertGenerated

## Event Contracts

### DocumentUploaded

Required fields:

- `eventId`
- `documentId`
- `uploadedByEmployeeId`
- `policeStationId`
- `documentTypeHint`
- `checksumSha256`
- `createdAt`

Consumers:

- virus scan worker
- OCR worker
- audit worker

### OCRCompleted

Required fields:

- `eventId`
- `documentId`
- `ocrResultId`
- `status`
- `meanConfidence`
- `language`
- `pageCount`
- `textUri`

Consumers:

- document classifier
- NLP worker
- search indexer

### EntitiesExtracted

Required fields:

- `eventId`
- `documentId`
- `extractionId`
- `candidateCaseMasterId`
- `entities`
- `fieldConfidence`
- `evidenceSpans`

Consumers:

- relation extraction
- entity resolution
- validation

### EntityResolutionCompleted

Required fields:

- `eventId`
- `extractionId`
- `caseCandidates`
- `personCandidates`
- `vehicleCandidates`
- `phoneCandidates`
- `confidence`

Consumers:

- validation worker
- graph candidate writer
- officer review queue

### OfficialSchemaUpdated

Required fields:

- `eventId`
- `caseMasterId`
- `changedTables`
- `version`
- `actorEmployeeId`
- `sourceExtractionId`
- `committedAt`

Consumers:

- feature store projector
- graph projector
- search indexer
- prediction worker
- audit exporter

### PredictionCompleted

Required fields:

- `eventId`
- `predictionId`
- `scopeType`
- `scopeId`
- `predictionType`
- `score`
- `confidence`
- `modelVersion`
- `topDrivers`

Consumers:

- recommendation engine
- alert generator
- dashboard projector

## Latency Targets

| Stage | MVP Target | Production Target |
| --- | --- | --- |
| upload acknowledgement | less than 2 seconds | less than 1 second |
| OCR | async, less than 2 minutes for demo docs | less than 30 seconds per small document |
| NLP extraction | less than 30 seconds | less than 5 seconds |
| entity resolution | less than 10 seconds | less than 2 seconds |
| prediction refresh | less than 30 seconds | less than 5 seconds for scoped updates |
| dashboard cache update | less than 5 seconds | less than 1 second |

## Validation Rules

- `CaseMaster.PoliceStationID` must reference active `Unit`.
- `CaseMaster.CaseCategoryID` must reference `CaseCategory`.
- `CaseMaster.GravityOffenceID` must reference `GravityOffence`.
- `CrimeMajorHeadID` must reference active `CrimeHead`.
- `CrimeMinorHeadID` must belong to selected `CrimeHead`.
- `ActSectionAssociation.ActID` must reference `Act.ActCode`.
- `ActSectionAssociation.SectionID` must reference `Section.SectionCode`.
- Act-section pair should validate against `CrimeHeadActSection`.
- Arrest district and state must reference official geography tables.
- Court must reference official `Court`.
- Employee and IO references must reference official `Employee`.
- Sensitive demographic fields must only be populated from explicit document evidence.

## Failure Handling

- OCR failure creates failed `OCRResult` and retry event.
- NLP failure creates failed `AIExtractionLog`.
- Entity resolution timeout routes to manual review.
- Validation failure does not update official FIR tables.
- Prediction failure does not block case CRUD.
- Graph failure is replayed from `OfficialSchemaUpdated`.
- Search failure is replayed from committed state.
- Dead-letter events retain payload hash, error class, retry count, and replay metadata.

## Security Controls

- Uploaded document text is untrusted.
- Prompt instructions are never read from uploaded text.
- OCR output is scanned for prompt injection markers.
- Model outputs are constrained to schema fields.
- Legal outputs are constrained to official act/section lookups.
- PII is masked before broad analytics.
- Model artifacts are signed and versioned.
- Every AI decision is traceable to source evidence.

