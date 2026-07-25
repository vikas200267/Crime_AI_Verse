import type { BlueprintSection } from "./types";

export const databaseStrategy: BlueprintSection[] = [
  {
    title: "Schema Integration",
    content: [
      "Do not redesign the uploaded Police FIR schema. CaseMaster remains the official root aggregate.",
      "Repositories map directly to official tables; AI services propose changes, but approved service transactions write official rows.",
      "AI extension tables are additive and reference official primary keys where possible."
    ]
  },
  {
    title: "Insert Flow",
    content: [
      "Begin transaction and acquire a station/category/year counter lock for CrimeNo and CaseNo.",
      "Insert CaseMaster first, then insert ComplainantDetails, Victim, Accused, ActSectionAssociation, ArrestSurrender, and ChargesheetDetails rows after FK validation.",
      "Write audit/history rows and a transactional outbox event before commit."
    ]
  },
  {
    title: "Update Flow",
    content: [
      "Read the aggregate with row version and caller jurisdiction scope.",
      "Validate RBAC, active lookups, legal mappings, coordinates, and cross-table consistency.",
      "Apply patches with optimistic concurrency; sensitive fields require correction reason.",
      "Commit official rows and outbox atomically; graph/search/cache update asynchronously."
    ]
  },
  {
    title: "Delete Policy",
    content: [
      "Physical deletion is blocked for FIR evidence records.",
      "Use soft states: inactive lookup values, duplicate marking, sealed/expunged visibility, and erroneous-entry tombstones.",
      "No cascade delete from CaseMaster through normal APIs."
    ]
  },
  {
    title: "Audit History Transactions",
    content: [
      "Every mutation stores actor, EmployeeID, unit scope, timestamp, correlationId, table, primary key, operation, before JSON, after JSON, reason, source document, and AI confidence.",
      "History tables use effective_from, effective_to, version, and changed_by.",
      "Rollback official DB writes on validation failure; external graph/search effects are rebuilt from committed outbox events."
    ]
  },
  {
    title: "Concurrency And Locking",
    content: [
      "Use optimistic locking on CaseMaster aggregate version.",
      "Use pessimistic locks only for CrimeNo/CaseNo counters and rare lifecycle transitions.",
      "Use idempotency keys on document apply and case create APIs."
    ]
  },
  {
    title: "Indexes And FK Optimization",
    content: [
      "Unique indexes: CaseMaster.CrimeNo and PoliceStationID + CaseCategoryID + CaseNo where applicable.",
      "Composite indexes: PoliceStationID + CrimeRegisteredDate, CaseStatusID + CrimeRegisteredDate, CrimeMajorHeadID + CrimeMinorHeadID + CrimeRegisteredDate, CourtID + CaseStatusID.",
      "Every FK gets an index, especially CaseMasterID on Victim, Accused, ComplainantDetails, ArrestSurrender, ActSectionAssociation, and ChargesheetDetails.",
      "Lookup indexes include Act.Active + ActCode, Section.ActCode + SectionCode, CrimeHeadActSection.CrimeHeadID + ActCode + SectionCode."
    ]
  },
  {
    title: "PostGIS And Partitioning",
    content: [
      "If PostgreSQL is used, add a generated geometry/geography point from CaseMaster latitude and longitude without replacing those columns.",
      "Use GiST indexes, ST_DWithin, and materialized aggregates by district, unit, crime head, and day.",
      "Partition AI logs, OCR results, model histories, alerts, and outbox rows monthly.",
      "For very large deployments, evaluate CaseMaster partitioning by CrimeRegisteredDate year or district after measuring workload."
    ]
  }
];
