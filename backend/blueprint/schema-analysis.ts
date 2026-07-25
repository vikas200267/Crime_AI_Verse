import type { TableAnalysis } from "./types";

export const rootEntity = "CaseMaster";

export const tableClassification = {
  root: ["CaseMaster"],
  transactional: [
    "CaseMaster",
    "ComplainantDetails",
    "Victim",
    "Accused",
    "ArrestSurrender",
    "ActSectionAssociation",
    "ChargesheetDetails"
  ],
  lookup: [
    "Act",
    "Section",
    "CrimeHeadActSection",
    "CrimeHead",
    "CrimeSubHead",
    "CasteMaster",
    "ReligionMaster",
    "OccupationMaster",
    "CaseStatusMaster",
    "CaseCategory",
    "GravityOffence",
    "UnitType",
    "Rank",
    "Designation"
  ],
  master: [
    "State",
    "District",
    "Unit",
    "Court",
    "Employee",
    "Act",
    "Section",
    "CrimeHead",
    "CrimeSubHead",
    "UnitType",
    "Rank",
    "Designation"
  ],
  analyticalDimensions: [
    "State",
    "District",
    "Unit",
    "CrimeHead",
    "CrimeSubHead",
    "CaseCategory",
    "GravityOffence",
    "Court",
    "Employee"
  ]
};

export const schemaAnalysis: TableAnalysis[] = [
  {
    table: "CaseMaster",
    kind: ["root", "transactional", "analytical-dimension"],
    purpose: "Authoritative FIR/case record and root aggregate for CrimeVerse AI.",
    responsibilities: [
      "Store CrimeNo, CaseNo, registration date, registering officer, police station, category, gravity, crime heads, status, court, incident window, coordinates, and BriefFacts.",
      "Provide the transaction boundary for FIR creation and official case updates.",
      "Anchor graph, search, prediction, dashboard, alert, and document-linking workflows."
    ],
    relationships: [
      "One CaseMaster has many Victim, Accused, ArrestSurrender, ComplainantDetails, ActSectionAssociation, and ChargesheetDetails rows.",
      "Many CaseMaster rows reference CaseCategory, GravityOffence, CrimeHead, CrimeSubHead, CaseStatusMaster, Court, Employee, and Unit.",
      "The ER matrix references a one-to-one Inv_OccuranceTime table; use it if present, while keeping the documented CaseMaster incident dates and coordinates authoritative for this build."
    ],
    crud: [
      "Create after validating station-scoped CrimeNo/CaseNo generation and all FK lookups.",
      "Read by CaseMasterID, CrimeNo, CaseNo, police station, district, date range, status, crime head, court, and geospatial filters.",
      "Update through optimistic concurrency with mandatory audit/history.",
      "Do not physically delete; seal, expunge, close, or mark duplicate according to policy."
    ],
    aiInteractions: [
      "Document extraction proposes CaseMaster fields from OCR text.",
      "Entity resolution links documents to existing cases using CrimeNo, CaseNo, station, dates, names, and location.",
      "Hotspot, graph, and recommendation services consume case time, place, category, gravity, and BriefFacts."
    ],
    columns: [
      { name: "CaseMasterID", type: "INT", key: "PK", description: "Unique FIR/case identifier." },
      { name: "CrimeNo", type: "VARCHAR", description: "Structured category, district, station, year, and serial number." },
      { name: "CaseNo", type: "VARCHAR", description: "Year plus running serial for the station/category." },
      { name: "PolicePersonID", type: "INT", key: "FK", references: "Employee.EmployeeID", description: "Officer who registered the FIR." },
      { name: "PoliceStationID", type: "INT", key: "FK", references: "Unit.UnitID", description: "Registering police station." },
      { name: "CaseCategoryID", type: "INT", key: "FK", references: "CaseCategory.CaseCategoryID", description: "FIR, UDR, Zero FIR, PAR, etc." },
      { name: "GravityOffenceID", type: "INT", key: "FK", references: "GravityOffence.GravityOffenceID", description: "Offence gravity." },
      { name: "CrimeMajorHeadID", type: "INT", key: "FK", references: "CrimeHead.CrimeHeadID", description: "Major crime head." },
      { name: "CrimeMinorHeadID", type: "INT", key: "FK", references: "CrimeSubHead.CrimeSubHeadID", description: "Crime sub-head." },
      { name: "CaseStatusID", type: "INT", key: "FK", references: "CaseStatusMaster.CaseStatusID", description: "Current case status." },
      { name: "CourtID", type: "INT", key: "FK", references: "Court.CourtID", description: "Hearing court." },
      { name: "IncidentFromDate", type: "DATETIME", description: "Incident start." },
      { name: "IncidentToDate", type: "DATETIME", description: "Incident end." },
      { name: "InfoReceivedPSDate", type: "DATETIME", description: "Information received timestamp." },
      { name: "latitude", type: "DECIMAL", description: "Incident latitude." },
      { name: "longitude", type: "DECIMAL", description: "Incident longitude." },
      { name: "BriefFacts", type: "NVARCHAR(MAX)", description: "Narrative summary." }
    ]
  },
  {
    table: "ComplainantDetails",
    kind: ["transactional"],
    purpose: "People or parties who filed the complaint for a case.",
    responsibilities: ["Capture identity and demographics.", "Link complainant to occupation, religion, caste, gender, and case."],
    relationships: ["Many complainants belong to one CaseMaster.", "Many complainants share OccupationMaster, ReligionMaster, and CasteMaster rows."],
    crud: ["Create after CaseMaster insert.", "Read by case and demographic filters.", "Update through correction workflow.", "Soft delete only duplicates or wrong links."],
    aiInteractions: ["NER extracts complainant mentions.", "Entity resolution checks if complainant also appears as accused."],
    columns: [
      { name: "ComplainantID", type: "INT", key: "PK", description: "Unique complainant ID." },
      { name: "CaseMasterID", type: "INT", key: "FK", references: "CaseMaster.CaseMasterID", description: "Filed case." },
      { name: "ComplainantName", type: "VARCHAR", description: "Full name." },
      { name: "AgeYear", type: "INT", description: "Age." },
      { name: "OccupationID", type: "INT", key: "FK", references: "OccupationMaster.OccupationID", description: "Occupation." },
      { name: "ReligionID", type: "INT", key: "FK", references: "ReligionMaster.ReligionID", description: "Religion." },
      { name: "CasteID", type: "INT", key: "FK", references: "CasteMaster.caste_master_id", description: "Caste." },
      { name: "GenderID", type: "INT", description: "Gender lookup." }
    ]
  },
  {
    table: "Victim",
    kind: ["transactional"],
    purpose: "Victims attached to FIRs.",
    responsibilities: ["Capture victim identity, age, gender, and police-victim flag.", "Support victim analytics and protected views."],
    relationships: ["One CaseMaster can have multiple Victim rows."],
    crud: ["Create from FIR extraction or manual statement.", "Read by case/name/demographics.", "Update with audit reason.", "Soft delete duplicate entries."],
    aiInteractions: ["NER extracts victims.", "Graph creates victim person nodes and VICTIM_IN_CASE edges.", "PII policies mask victim names for broad analytics."],
    columns: [
      { name: "VictimMasterID", type: "INT", key: "PK", description: "Victim ID." },
      { name: "CaseMasterID", type: "INT", key: "FK", references: "CaseMaster.CaseMasterID", description: "Linked case." },
      { name: "VictimName", type: "VARCHAR", description: "Victim name." },
      { name: "AgeYear", type: "INT", description: "Age." },
      { name: "GenderID", type: "INT", description: "Gender." },
      { name: "VictimPolice", type: "VARCHAR", description: "1 if victim is police, else 0." }
    ]
  },
  {
    table: "Accused",
    kind: ["transactional"],
    purpose: "Accused people linked to cases.",
    responsibilities: ["Capture accused identity, demographics, and A1/A2 ordering.", "Feed arrest, graph, repeat-offender, and association workflows."],
    relationships: ["One CaseMaster can have multiple Accused rows.", "ArrestSurrender references AccusedMasterID."],
    crud: ["Create per accused entity.", "Read by case, PersonID, name, and repeat-offender search.", "Update identity corrections under audit.", "Soft delete duplicates."],
    aiInteractions: ["Entity resolution links spelling variants across cases.", "Graph creates ACCUSED_IN_CASE and ARRESTED_IN edges."],
    columns: [
      { name: "AccusedMasterID", type: "INT", key: "PK", description: "Accused ID." },
      { name: "CaseMasterID", type: "INT", key: "FK", references: "CaseMaster.CaseMasterID", description: "Linked case." },
      { name: "AccusedName", type: "VARCHAR", description: "Accused name." },
      { name: "AgeYear", type: "INT", description: "Age." },
      { name: "GenderID", type: "INT", description: "Gender." },
      { name: "PersonID", type: "VARCHAR", description: "Case-local label such as A1, A2." }
    ]
  },
  {
    table: "ArrestSurrender",
    kind: ["transactional"],
    purpose: "Arrest or voluntary surrender events.",
    responsibilities: ["Capture event type, date, state, district, station, IO, court, accused link, and role flags.", "Represent custody movement facts."],
    relationships: ["Many rows belong to one CaseMaster.", "Rows reference State, District, Unit, Employee, Court, and Accused."],
    crud: ["Create after accused validation.", "Read by case, accused, IO, court, geography, and date.", "Update with correction reason.", "Soft delete only erroneous entries."],
    aiInteractions: ["OCR extracts arrest dates, courts, and IO names.", "Graph adds ARRESTED_BY, PRODUCED_BEFORE, and OCCURRED_IN edges."],
    columns: [
      { name: "ArrestSurrenderID", type: "INT", key: "PK", description: "Event ID." },
      { name: "CaseMasterID", type: "INT", key: "FK", references: "CaseMaster.CaseMasterID", description: "Linked case." },
      { name: "ArrestSurrenderTypeID", type: "INT", description: "Arrest/surrender type." },
      { name: "ArrestSurrenderDate", type: "DATE", description: "Event date." },
      { name: "ArrestSurrenderStateId", type: "INT", key: "FK", references: "State.StateID", description: "Event state." },
      { name: "ArrestSurrenderDistrictId", type: "INT", key: "FK", references: "District.DistrictID", description: "Event district." },
      { name: "PoliceStationID", type: "INT", key: "FK", references: "Unit.UnitID", description: "Handling station." },
      { name: "IOID", type: "INT", key: "FK", references: "Employee.EmployeeID", description: "Investigating officer." },
      { name: "CourtID", type: "INT", key: "FK", references: "Court.CourtID", description: "Production court." },
      { name: "AccusedMasterID", type: "INT", key: "FK", references: "Accused.AccusedMasterID", description: "Linked accused." }
    ]
  },
  {
    table: "ActSectionAssociation",
    kind: ["transactional"],
    purpose: "Case-to-legal-act/section junction.",
    responsibilities: ["Attach multiple acts and sections to a FIR.", "Preserve print/display order."],
    relationships: ["Many rows belong to one CaseMaster.", "Rows reference Act.ActCode and Section.SectionCode."],
    crud: ["Create after legal lookup validation.", "Read by case, act, section, and crime head.", "Update ordering or corrected charges.", "Soft delete removed charges with audit."],
    aiInteractions: ["Legal classifier proposes act-section pairs.", "Validator checks Act, Section, and CrimeHeadActSection compatibility."],
    columns: [
      { name: "CaseMasterID", type: "INT", key: "FK", references: "CaseMaster.CaseMasterID", description: "Linked case." },
      { name: "ActID", type: "INT", key: "FK", references: "Act.ActCode", description: "Legal act." },
      { name: "SectionID", type: "INT", key: "FK", references: "Section.SectionCode", description: "Legal section." },
      { name: "ActOrderID", type: "INT", description: "Act display order." },
      { name: "SectionOrderID", type: "INT", description: "Section display order." }
    ]
  },
  {
    table: "Act",
    kind: ["lookup", "master"],
    purpose: "Legal act master such as IPC or NDPS.",
    responsibilities: ["Provide official act descriptions, short names, and active flags.", "Parent sections and crime-head mappings."],
    relationships: ["One Act has many Section rows.", "One Act has many CrimeHeadActSection mappings.", "ActSectionAssociation references Act."],
    crud: ["Read for validation and dropdowns.", "Admin-only create/update.", "Deactivate instead of delete."],
    aiInteractions: ["Constrains legal extraction vocabulary."],
    columns: [
      { name: "ActCode", type: "VARCHAR", key: "PK", description: "Act code." },
      { name: "ActDescription", type: "VARCHAR", description: "Official name." },
      { name: "ShortName", type: "VARCHAR", description: "Abbreviation." },
      { name: "Active", type: "BIT", description: "Active flag." }
    ]
  },
  {
    table: "Section",
    kind: ["lookup", "master"],
    purpose: "Legal section master under each act.",
    responsibilities: ["Store section code, description, and active flag.", "Constrain legal charges."],
    relationships: ["Many sections belong to one Act.", "ActSectionAssociation references SectionCode."],
    crud: ["Read for validation/search.", "Admin-only create/update.", "Deactivate instead of delete."],
    aiInteractions: ["Maps text such as 302 IPC into ActCode and SectionCode."],
    columns: [
      { name: "ActCode", type: "VARCHAR", key: "FK", references: "Act.ActCode", description: "Parent act." },
      { name: "SectionCode", type: "VARCHAR", description: "Section code." },
      { name: "SectionDescription", type: "VARCHAR", description: "Description." },
      { name: "Active", type: "BIT", description: "Active flag." }
    ]
  },
  {
    table: "CrimeHead",
    kind: ["lookup", "master", "analytical-dimension"],
    purpose: "Major crime classification.",
    responsibilities: ["Classify cases into major crime groups.", "Anchor sub-heads and act-section mappings."],
    relationships: ["One CrimeHead has many CrimeSubHead and CrimeHeadActSection rows.", "CaseMaster references CrimeHead."],
    crud: ["Read for entry, reports, and predictions.", "Admin-only create/update/deactivate."],
    aiInteractions: ["Classifier predicts CrimeMajorHeadID.", "Dashboards group trends by major head."],
    columns: [
      { name: "CrimeHeadID", type: "INT", key: "PK", description: "Major head ID." },
      { name: "CrimeGroupName", type: "VARCHAR", description: "Major group name." },
      { name: "Active", type: "BIT", description: "Active flag." }
    ]
  },
  {
    table: "CrimeSubHead",
    kind: ["lookup", "master", "analytical-dimension"],
    purpose: "Minor crime classification under a major head.",
    responsibilities: ["Classify specific offence type.", "Support finer-grain analytics."],
    relationships: ["Many CrimeSubHead rows belong to one CrimeHead.", "CaseMaster references CrimeSubHead."],
    crud: ["Read by entry and dashboards.", "Admin-only create/update/deactivate."],
    aiInteractions: ["Classifier predicts CrimeMinorHeadID after major head selection."],
    columns: [
      { name: "CrimeSubHeadID", type: "INT", key: "PK", description: "Sub-head ID." },
      { name: "CrimeHeadID", type: "INT", key: "FK", references: "CrimeHead.CrimeHeadID", description: "Parent head." },
      { name: "CrimeHeadName", type: "VARCHAR", description: "Sub-head name." },
      { name: "SeqID", type: "INT", description: "Sort sequence." }
    ]
  },
  {
    table: "CrimeHeadActSection",
    kind: ["lookup", "master"],
    purpose: "Mapping table between crime heads and valid act-section combinations.",
    responsibilities: ["Validate that selected legal sections are compatible with the crime head.", "Guide AI legal-classification suggestions."],
    relationships: ["Many mappings reference one CrimeHead.", "Many mappings reference one Act and SectionCode."],
    crud: ["Read by validation and classifiers.", "Admin-only maintain.", "No delete while used for historical validation; deactivate through parent records where possible."],
    aiInteractions: ["Rejects or flags model-suggested act/section pairs that do not fit the selected CrimeHead."],
    columns: [
      { name: "CrimeHeadID", type: "INT", key: "FK", references: "CrimeHead.CrimeHeadID", description: "Mapped crime head." },
      { name: "ActCode", type: "VARCHAR", key: "FK", references: "Act.ActCode", description: "Mapped act." },
      { name: "SectionCode", type: "VARCHAR", description: "Mapped section." }
    ]
  },
  {
    table: "CasteMaster",
    kind: ["lookup", "master"],
    purpose: "Caste lookup referenced by complainants.",
    responsibilities: ["Provide normalized caste values where legally collected.", "Support controlled demographic reporting."],
    relationships: ["Many ComplainantDetails rows reference one CasteMaster row."],
    crud: ["Read by complainant workflow.", "Admin-only maintain.", "Deactivate instead of delete."],
    aiInteractions: ["AI may only populate CasteID when explicitly present and validated, never by inference."],
    columns: [
      { name: "caste_master_id", type: "INT", key: "PK", description: "Caste ID." },
      { name: "caste_master_name", type: "VARCHAR", description: "Caste name." }
    ]
  },
  {
    table: "ReligionMaster",
    kind: ["lookup", "master"],
    purpose: "Religion lookup referenced by complainants.",
    responsibilities: ["Provide normalized religion values where legally collected."],
    relationships: ["Many ComplainantDetails rows reference one ReligionMaster row."],
    crud: ["Read by complainant workflow.", "Admin-only maintain.", "Deactivate instead of delete."],
    aiInteractions: ["AI may only populate ReligionID when explicitly present and validated, never by inference."],
    columns: [
      { name: "ReligionID", type: "INT", key: "PK", description: "Religion ID." },
      { name: "ReligionName", type: "VARCHAR", description: "Religion name." }
    ]
  },
  {
    table: "OccupationMaster",
    kind: ["lookup", "master"],
    purpose: "Occupation lookup referenced by complainants.",
    responsibilities: ["Normalize complainant occupations for reporting and validation."],
    relationships: ["Many ComplainantDetails rows reference one OccupationMaster row."],
    crud: ["Read by complainant workflow.", "Admin-only maintain.", "Deactivate instead of delete."],
    aiInteractions: ["NER maps explicit occupation text to OccupationID with confidence and reviewer visibility."],
    columns: [
      { name: "OccupationID", type: "INT", key: "PK", description: "Occupation ID." },
      { name: "OccupationName", type: "VARCHAR", description: "Occupation name." }
    ]
  },
  {
    table: "CaseStatusMaster",
    kind: ["lookup", "master", "analytical-dimension"],
    purpose: "Case status lookup such as under investigation, charge sheeted, and closed.",
    responsibilities: ["Normalize case lifecycle state.", "Drive dashboard filters and legal workflow gates."],
    relationships: ["Many CaseMaster rows reference one CaseStatusMaster row."],
    crud: ["Read by case workflow and analytics.", "Admin-only maintain.", "Deactivate instead of delete."],
    aiInteractions: ["Chargesheet extraction and validation can propose a CaseStatusID transition, but officer approval commits it."],
    columns: [
      { name: "CaseStatusID", type: "INT", key: "PK", description: "Status ID." },
      { name: "CaseStatusName", type: "VARCHAR", description: "Status label." }
    ]
  },
  {
    table: "Court",
    kind: ["master", "analytical-dimension"],
    purpose: "Court master used by CaseMaster and ArrestSurrender.",
    responsibilities: ["Store court name, district, state, and active flag."],
    relationships: ["Many cases and arrest events can reference one Court.", "Court belongs to District and State."],
    crud: ["Read by case and custody workflows.", "Admin create/update/deactivate.", "No delete while referenced."],
    aiInteractions: ["OCR extracts court names from chargesheets and arrest memos."],
    columns: [
      { name: "CourtID", type: "INT", key: "PK", description: "Court ID." },
      { name: "CourtName", type: "VARCHAR", description: "Court name." },
      { name: "DistrictID", type: "INT", key: "FK", references: "District.DistrictID", description: "District." },
      { name: "StateID", type: "INT", key: "FK", references: "State.StateID", description: "State." },
      { name: "Active", type: "BIT", description: "Active flag." }
    ]
  },
  {
    table: "District",
    kind: ["master", "analytical-dimension"],
    purpose: "District geography master.",
    responsibilities: ["Anchor courts, units, employees, arrests, and district analytics."],
    relationships: ["Many districts belong to one State.", "Court, Unit, Employee, and ArrestSurrender reference District."],
    crud: ["Read for filters and joins.", "Admin create/update/deactivate.", "No delete while referenced."],
    aiInteractions: ["Location normalization maps extracted places and GPS points to DistrictID.", "Hotspot models aggregate by district."],
    columns: [
      { name: "DistrictID", type: "INT", key: "PK", description: "District ID." },
      { name: "DistrictName", type: "VARCHAR", description: "District name." },
      { name: "StateID", type: "INT", key: "FK", references: "State.StateID", description: "Parent state." },
      { name: "Active", type: "BIT", description: "Active flag." }
    ]
  },
  {
    table: "State",
    kind: ["master", "analytical-dimension"],
    purpose: "State master.",
    responsibilities: ["Anchor districts, courts, units, and arrest event locations."],
    relationships: ["One State has many District, Unit, Court, and ArrestSurrender records."],
    crud: ["Read for jurisdiction filters.", "Admin create/update/deactivate.", "No delete while referenced."],
    aiInteractions: ["Geocoding uses StateID to disambiguate extracted place names."],
    columns: [
      { name: "StateID", type: "INT", key: "PK", description: "State ID." },
      { name: "StateName", type: "VARCHAR", description: "State name." },
      { name: "NationalityID", type: "INT", description: "Nationality reference." },
      { name: "Active", type: "BIT", description: "Active flag." }
    ]
  },
  {
    table: "Unit",
    kind: ["master", "analytical-dimension"],
    purpose: "Police unit and police station hierarchy.",
    responsibilities: ["Identify police stations and higher units.", "Provide command hierarchy and jurisdiction location."],
    relationships: ["CaseMaster and ArrestSurrender reference Unit as police station.", "Employee references Unit.", "Unit references UnitType, State, District, and parent Unit."],
    crud: ["Read for station-scoped case number generation.", "Admin maintain hierarchy.", "Deactivate closed units."],
    aiInteractions: ["CrimeNo linking requires PoliceStationID.", "Alerts route through Unit hierarchy."],
    columns: [
      { name: "UnitID", type: "INT", key: "PK", description: "Unit ID." },
      { name: "UnitName", type: "VARCHAR", description: "Unit/station name." },
      { name: "TypeID", type: "INT", key: "FK", references: "UnitType.UnitTypeID", description: "Unit type." },
      { name: "ParentUnit", type: "INT", key: "FK", references: "Unit.UnitID", description: "Parent unit." },
      { name: "StateID", type: "INT", key: "FK", references: "State.StateID", description: "State." },
      { name: "DistrictID", type: "INT", key: "FK", references: "District.DistrictID", description: "District." },
      { name: "Active", type: "BIT", description: "Active flag." }
    ]
  },
  {
    table: "Employee",
    kind: ["master", "analytical-dimension"],
    purpose: "Police employee master.",
    responsibilities: ["Store posting, rank, designation, KGID, demographics, and service dates.", "Support officer accountability and audit attribution."],
    relationships: ["CaseMaster references registering Employee.", "ArrestSurrender references IO.", "Employee references District, Unit, Rank, and Designation."],
    crud: ["Read for workflows and auth mapping.", "HR/admin create/update.", "Deactivate or transfer rather than delete."],
    aiInteractions: ["OCR matches officer names/KGIDs to EmployeeID.", "Recommendation routing uses unit, rank, and designation."],
    columns: [
      { name: "EmployeeID", type: "INT", key: "PK", description: "Employee ID." },
      { name: "DistrictID", type: "INT", key: "FK", references: "District.DistrictID", description: "Posting district." },
      { name: "UnitID", type: "INT", key: "FK", references: "Unit.UnitID", description: "Assigned unit." },
      { name: "RankID", type: "INT", key: "FK", references: "Rank.RankID", description: "Rank." },
      { name: "DesignationID", type: "INT", key: "FK", references: "Designation.DesignationID", description: "Designation." },
      { name: "KGID", type: "VARCHAR", description: "Government ID." },
      { name: "FirstName", type: "VARCHAR", description: "First name." },
      { name: "EmployeeDOB", type: "DATE", description: "Date of birth." },
      { name: "GenderID", type: "INT", description: "Gender." },
      { name: "AppointmentDate", type: "DATE", description: "Appointment date." }
    ]
  },
  {
    table: "Rank",
    kind: ["lookup", "master"],
    purpose: "Police rank master.",
    responsibilities: ["Store rank name, hierarchy, and active flag."],
    relationships: ["Many Employee rows reference one Rank."],
    crud: ["Read for profiles and authorization.", "Admin create/update/deactivate."],
    aiInteractions: ["Alert escalation can use rank hierarchy."],
    columns: [
      { name: "RankID", type: "INT", key: "PK", description: "Rank ID." },
      { name: "RankName", type: "VARCHAR", description: "Rank name." },
      { name: "Hierarchy", type: "INT", description: "Rank hierarchy." },
      { name: "Active", type: "BIT", description: "Active flag." }
    ]
  },
  {
    table: "Designation",
    kind: ["lookup", "master"],
    purpose: "Employee designation master.",
    responsibilities: ["Store official designations and sort order."],
    relationships: ["Many Employee rows reference one Designation."],
    crud: ["Read for RBAC and reports.", "Admin create/update/deactivate."],
    aiInteractions: ["Workflow assignment targets designations such as IO or SHO."],
    columns: [
      { name: "DesignationID", type: "INT", key: "PK", description: "Designation ID." },
      { name: "DesignationName", type: "VARCHAR", description: "Designation name." },
      { name: "Active", type: "BIT", description: "Active flag." },
      { name: "SortOrder", type: "INT", description: "Sort order." }
    ]
  },
  {
    table: "UnitType",
    kind: ["lookup", "master"],
    purpose: "Classifies units such as police station, circle office, district office, or state office.",
    responsibilities: ["Drive hierarchy semantics and authorization scope."],
    relationships: ["Many Unit rows reference one UnitType."],
    crud: ["Read for filters and RBAC.", "Admin create/update/deactivate."],
    aiInteractions: ["Notification routing uses hierarchy level."],
    columns: [
      { name: "UnitTypeID", type: "INT", key: "PK", description: "Unit type ID." },
      { name: "UnitTypeName", type: "VARCHAR", description: "Type name." },
      { name: "CityDistState", type: "VARCHAR", description: "Operational level." },
      { name: "Hierarchy", type: "INT", description: "Hierarchy level." },
      { name: "Active", type: "BIT", description: "Active flag." }
    ]
  },
  {
    table: "CaseCategory",
    kind: ["lookup", "master", "analytical-dimension"],
    purpose: "Case category lookup for FIR, UDR, PAR, Zero FIR, and similar values.",
    responsibilities: ["Drive CrimeNo prefix and serial grouping."],
    relationships: ["Many CaseMaster rows reference one CaseCategory."],
    crud: ["Read for creation and reports.", "Admin-only update."],
    aiInteractions: ["Document classifier proposes CaseCategoryID."],
    columns: [
      { name: "CaseCategoryID", type: "INT", key: "PK", description: "Category ID." },
      { name: "LookupValue", type: "VARCHAR", description: "Category label." }
    ]
  },
  {
    table: "GravityOffence",
    kind: ["lookup", "master", "analytical-dimension"],
    purpose: "Offence gravity lookup.",
    responsibilities: ["Classify severity such as heinous or non-heinous.", "Support prioritization."],
    relationships: ["Many CaseMaster rows reference one GravityOffence."],
    crud: ["Read for validation and filters.", "Admin-only update."],
    aiInteractions: ["Severity classifier suggests GravityOffenceID with explanations."],
    columns: [
      { name: "GravityOffenceID", type: "INT", key: "PK", description: "Gravity ID." },
      { name: "LookupValue", type: "VARCHAR", description: "Gravity label." }
    ]
  },
  {
    table: "ChargesheetDetails",
    kind: ["transactional"],
    purpose: "Final report or chargesheet details linked to a case.",
    responsibilities: ["Capture chargesheet date, report type, and police attribution."],
    relationships: ["ChargesheetDetails references CaseMaster and Employee via PolicePersonID."],
    crud: ["Create after chargesheet upload/manual entry.", "Read by case, officer, report type, and date.", "Update under correction workflow.", "Soft delete erroneous duplicates."],
    aiInteractions: ["OCR extracts csdate and cstype.", "Case status refresh can update CaseMaster.CaseStatusID.", "Search indexes final report metadata."],
    columns: [
      { name: "CSID", type: "INT", key: "PK", description: "Chargesheet ID." },
      { name: "CaseMasterID", type: "INT", key: "FK", references: "CaseMaster.CaseMasterID", description: "Linked case." },
      { name: "csdate", type: "DATETIME", description: "Chargesheet date." },
      { name: "cstype", type: "CHAR", description: "A chargesheet, B false case, C undetected." },
      { name: "PolicePersonID", type: "INT", key: "FK", references: "Employee.EmployeeID", description: "Police employee." }
    ]
  }
];
