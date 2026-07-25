import type { BlueprintSection } from "./types";

export interface AiTableIntelligence {
  table: string;
  intelligence: string[];
  mlTasks: string[];
  nlpEnrichment: string[];
  predictionUses: string[];
  graphNodes: string[];
  graphRelationships: string[];
  analytics: string[];
}

export interface ModelDecision {
  model: string;
  fit: string;
  whereUsed: string[];
  advantages: string[];
  limitations: string[];
  mvpUse: "build" | "simulate" | "pretrained" | "rule-based" | "roadmap";
}

export const aiArchitectureDiagram = `
Police Documents + Existing FIR Tables
        |
OCR + Layout Understanding
        |
NER + Relation/Event/Temporal Extraction
        |
Normalization + Entity Resolution + Validation
        |
Official FIR Schema Enrichment (CaseMaster root)
        |
Knowledge Graph Projection + Feature Store
        |
Hotspot / Risk / Anomaly / Recommendation Models
        |
Simulation + Explainability + Human Review
        |
Realtime Intelligence Updates
`;

export const aiTableIntelligence: AiTableIntelligence[] = [
  {
    table: "CaseMaster",
    intelligence: ["Root FIR event, incident time window, coordinates, crime class, gravity, station, status, court, registering officer, and facts narrative."],
    mlTasks: ["hotspot prediction", "crime category prediction", "case risk scoring", "trend detection", "duplicate FIR detection"],
    nlpEnrichment: ["BriefFacts summarization", "event extraction", "timeline extraction", "MO pattern extraction", "legal section validation"],
    predictionUses: ["district risk", "station risk", "crime density", "seasonality", "emerging pattern detection"],
    graphNodes: ["Case"],
    graphRelationships: ["REGISTERED_AT Unit", "REGISTERED_BY Employee", "OCCURRED_IN District", "CLASSIFIED_AS CrimeHead/CrimeSubHead", "HEARD_IN Court"],
    analytics: ["crime by time/place/category", "status aging", "offence gravity distribution", "court workload", "station-level incident density"]
  },
  {
    table: "Victim",
    intelligence: ["Victim identity, age, gender, and whether victim is police."],
    mlTasks: ["victim vulnerability analytics", "crime impact scoring", "case severity enrichment"],
    nlpEnrichment: ["victim name extraction", "role labeling", "demographic extraction only when explicit"],
    predictionUses: ["victim-risk segment trends", "crime gravity calibration"],
    graphNodes: ["Person", "Victim"],
    graphRelationships: ["VICTIM_IN_CASE Case", "ASSOCIATED_WITH Accused when supported by evidence"],
    analytics: ["victim demographics by crime type", "police-victim incidents", "multi-victim case patterns"]
  },
  {
    table: "Accused",
    intelligence: ["Accused identity, age, gender, and case-local A1/A2 ordering."],
    mlTasks: ["repeat offender prediction", "alias clustering", "gang/community detection", "arrest likelihood modeling"],
    nlpEnrichment: ["accused extraction", "alias detection", "role disambiguation", "identity normalization"],
    predictionUses: ["repeat-offender count", "prior FIR count", "association risk", "cross-district movement"],
    graphNodes: ["Person", "Accused"],
    graphRelationships: ["ACCUSED_IN_CASE Case", "SAME_AS Person candidate", "ASSOCIATED_WITH Person"],
    analytics: ["repeat accused frequency", "co-accused networks", "age/gender distributions by crime head"]
  },
  {
    table: "ComplainantDetails",
    intelligence: ["Complaint source identity and explicit demographic/occupation context."],
    mlTasks: ["duplicate complaint detection", "complainant-accused conflict detection", "source reliability signals"],
    nlpEnrichment: ["complainant extraction", "occupation normalization", "explicit caste/religion normalization with safeguards"],
    predictionUses: ["case linkage confidence", "complaint pattern analytics"],
    graphNodes: ["Person", "Complainant"],
    graphRelationships: ["FILED_CASE Case", "SAME_AS Accused/Victim candidate when evidence supports it"],
    analytics: ["complaint volume by occupation", "multi-complainant FIRs", "complainant also accused patterns"]
  },
  {
    table: "ActSectionAssociation",
    intelligence: ["Legal act and section set invoked in each case with display ordering."],
    mlTasks: ["legal section classification", "charge consistency checking", "crime head validation"],
    nlpEnrichment: ["act/section extraction", "legal phrase normalization", "section-order reconstruction"],
    predictionUses: ["gravity calibration", "case duration prediction", "chargesheet likelihood"],
    graphNodes: ["Act", "Section"],
    graphRelationships: ["CASE_INVOKES_ACT", "CASE_INVOKES_SECTION", "SECTION_BELONGS_TO_ACT"],
    analytics: ["section frequency", "act-section combinations by crime head", "legal drift over time"]
  },
  {
    table: "ArrestSurrender",
    intelligence: ["Custody event type, date, geography, station, IO, court, accused link, and role flags."],
    mlTasks: ["arrest delay prediction", "absconding risk", "custody workflow anomaly detection"],
    nlpEnrichment: ["arrest date extraction", "court/officer matching", "event type detection"],
    predictionUses: ["arrest lag", "IO workload", "court production patterns"],
    graphNodes: ["ArrestEvent"],
    graphRelationships: ["ARRESTED_IN_CASE", "ARRESTED_BY Employee", "PRODUCED_BEFORE Court", "OCCURRED_IN District"],
    analytics: ["arrest delay by crime type", "IO workload", "cross-district arrest patterns"]
  },
  {
    table: "ChargesheetDetails",
    intelligence: ["Final report date, report type, linked case, and police employee attribution."],
    mlTasks: ["chargesheet delay prediction", "case closure prediction", "investigation quality anomaly detection"],
    nlpEnrichment: ["chargesheet date/type extraction", "final report summarization"],
    predictionUses: ["case aging", "court-readiness risk", "undetected/false-case trend prediction"],
    graphNodes: ["Chargesheet"],
    graphRelationships: ["FILED_FOR Case", "FILED_BY Employee"],
    analytics: ["chargesheet timeliness", "report type distribution", "officer workload"]
  },
  {
    table: "Employee",
    intelligence: ["Officer posting, rank, designation, unit, KGID, and service context."],
    mlTasks: ["workload balancing", "assignment recommendation", "audit anomaly detection"],
    nlpEnrichment: ["officer name/KGID matching from documents"],
    predictionUses: ["IO workload", "case aging risk", "alert routing"],
    graphNodes: ["PoliceOfficer"],
    graphRelationships: ["REGISTERED Case", "INVESTIGATED ArrestEvent", "ASSIGNED_TO Unit", "HOLDS Rank/Designation"],
    analytics: ["case load by officer", "rank/designation workload", "registration trends"]
  },
  {
    table: "Unit",
    intelligence: ["Police station/unit identity, hierarchy, district, state, and active status."],
    mlTasks: ["station risk scoring", "patrol allocation", "jurisdiction anomaly detection"],
    nlpEnrichment: ["station name normalization", "unit hierarchy matching"],
    predictionUses: ["station crime density", "station-level hotspot", "resource recommendation"],
    graphNodes: ["PoliceStation", "PoliceUnit"],
    graphRelationships: ["PARENT_UNIT", "LOCATED_IN District", "REGISTERED Case"],
    analytics: ["station trends", "hierarchical command dashboards", "unit workload"]
  },
  {
    table: "District",
    intelligence: ["Jurisdiction geography and aggregation boundary."],
    mlTasks: ["district risk score", "spatial clustering", "regional trend detection"],
    nlpEnrichment: ["district extraction and geocoding disambiguation"],
    predictionUses: ["district hotspot", "crime density", "emerging pattern detection"],
    graphNodes: ["District"],
    graphRelationships: ["CONTAINS Unit", "IN_STATE State", "HAS_CASE Case"],
    analytics: ["district risk ranking", "inter-district movement", "cross-district accused networks"]
  },
  {
    table: "Court",
    intelligence: ["Court handling case or arrest production with district/state."],
    mlTasks: ["court workload analytics", "case stage prediction"],
    nlpEnrichment: ["court name extraction and matching"],
    predictionUses: ["chargesheet/court delay", "case status progression"],
    graphNodes: ["Court"],
    graphRelationships: ["HEARS Case", "PRODUCED_ACCUSED_FROM ArrestEvent"],
    analytics: ["court workload", "case backlog indicators", "court-linked case outcomes"]
  },
  {
    table: "CrimeHead",
    intelligence: ["Major crime group dimension."],
    mlTasks: ["major category classification", "trend clustering", "risk scoring"],
    nlpEnrichment: ["major crime label extraction/classification"],
    predictionUses: ["hotspot per major head", "seasonal trend per group"],
    graphNodes: ["CrimeHead"],
    graphRelationships: ["CLASSIFIES Case", "HAS_SUBHEAD CrimeSubHead", "MAPS_TO Section"],
    analytics: ["crime mix", "major-head growth", "risk by offence family"]
  },
  {
    table: "CrimeSubHead",
    intelligence: ["Specific crime sub-category under CrimeHead."],
    mlTasks: ["fine-grained category classification", "pattern detection"],
    nlpEnrichment: ["sub-head classification from BriefFacts and sections"],
    predictionUses: ["specific crime hotspot", "emerging sub-head trend"],
    graphNodes: ["CrimeSubHead"],
    graphRelationships: ["SUBCLASSIFIES Case", "BELONGS_TO CrimeHead"],
    analytics: ["sub-head trend", "fine-grained police planning", "legal-section alignment"]
  },
  {
    table: "CaseCategory",
    intelligence: ["FIR/UDR/PAR/Zero FIR category and CrimeNo prefix semantics."],
    mlTasks: ["document type classification", "case intake prediction"],
    nlpEnrichment: ["category extraction from document title and body"],
    predictionUses: ["category-specific volume forecasting"],
    graphNodes: ["CaseCategory"],
    graphRelationships: ["CATEGORIZES Case"],
    analytics: ["FIR vs UDR/PAR mix", "station/category serial quality checks"]
  },
  {
    table: "GravityOffence",
    intelligence: ["Heinous/non-heinous or gravity level."],
    mlTasks: ["severity classification", "priority ranking"],
    nlpEnrichment: ["gravity rationale extraction"],
    predictionUses: ["risk scoring", "alert severity", "resource recommendation"],
    graphNodes: ["Gravity"],
    graphRelationships: ["GRAVITY_OF Case"],
    analytics: ["high-gravity trends", "district severity index"]
  }
];

export const modelDecisions: ModelDecision[] = [
  {
    model: "LightGBM",
    fit: "Primary tabular model for structured FIR features because it is fast, accurate, explainable with SHAP, and strong on mixed categorical/time/geospatial aggregates.",
    whereUsed: ["district risk score", "station risk score", "case risk", "chargesheet delay", "repeat-offender score"],
    advantages: ["low latency", "high accuracy on structured data", "handles missing values", "SHAP support"],
    limitations: ["needs feature engineering", "not ideal for raw text or graph topology"],
    mvpUse: "build"
  },
  {
    model: "XGBoost",
    fit: "Excellent baseline for tabular risk models, especially when the dataset is smaller and carefully engineered.",
    whereUsed: ["hotspot risk baseline", "case severity", "anomaly scoring features"],
    advantages: ["robust", "well understood", "explainable", "hackathon friendly"],
    limitations: ["can be slower than LightGBM on large data", "manual categorical handling"],
    mvpUse: "build"
  },
  {
    model: "CatBoost",
    fit: "Strong option when categorical variables such as CrimeHead, Unit, District, Act, Section, and CaseCategory dominate.",
    whereUsed: ["crime category prediction", "station risk", "repeat offender likelihood"],
    advantages: ["native categorical handling", "good accuracy with less preprocessing"],
    limitations: ["heavier runtime than simple rules", "less familiar to some teams"],
    mvpUse: "pretrained"
  },
  {
    model: "HDBSCAN",
    fit: "Best practical density clustering for irregular hotspot shapes and unknown cluster counts.",
    whereUsed: ["hotspot discovery", "crime movement detection", "spatial anomaly detection"],
    advantages: ["no fixed cluster count", "handles noise", "strong for geospatial event points"],
    limitations: ["parameter sensitivity", "not a forecasting model by itself"],
    mvpUse: "build"
  },
  {
    model: "Isolation Forest",
    fit: "Fast anomaly detector for abnormal incident patterns, spikes, missing evidence, and inconsistent case attributes.",
    whereUsed: ["suspicious reports", "unusual crime spikes", "data inconsistency alerts"],
    advantages: ["fast", "works without labels", "easy MVP"],
    limitations: ["explanations need feature contribution wrapper", "threshold tuning required"],
    mvpUse: "build"
  },
  {
    model: "Node2Vec",
    fit: "Practical graph embedding for finding similar accused, hidden associations, and repeat-offender candidates without training a full GNN.",
    whereUsed: ["association detection", "similar offender search", "gang candidate detection"],
    advantages: ["simple", "fast enough", "works with graph projection"],
    limitations: ["less expressive than GNN", "needs graph freshness"],
    mvpUse: "simulate"
  },
  {
    model: "Graph Neural Networks",
    fit: "Future upgrade for link prediction and criminal network inference after enough labeled graph outcomes exist.",
    whereUsed: ["hidden association prediction", "gang detection", "influence detection"],
    advantages: ["learns graph topology and attributes jointly"],
    limitations: ["data hungry", "harder to explain", "not 48-hour realistic"],
    mvpUse: "roadmap"
  },
  {
    model: "Temporal Fusion Transformer",
    fit: "Production-grade temporal forecasting when long history and exogenous signals are available.",
    whereUsed: ["district crime forecasting", "seasonality", "festival/holiday-aware trend prediction"],
    advantages: ["multi-horizon forecasting", "handles static and time-varying covariates"],
    limitations: ["requires more data and tuning", "heavier inference"],
    mvpUse: "roadmap"
  },
  {
    model: "Prophet",
    fit: "Quick interpretable time-series baseline for daily/weekly/monthly crime volumes.",
    whereUsed: ["seasonal trend detection", "crime density baseline", "judge demo forecasts"],
    advantages: ["fast setup", "interpretable seasonality", "good MVP baseline"],
    limitations: ["weaker on abrupt regime changes", "not spatial"],
    mvpUse: "build"
  }
];

export const aiDesignSections: BlueprintSection[] = [
  {
    title: "OCR Intelligence",
    content: [
      "Hackathon stack: PaddleOCR or EasyOCR for offline documents, with Google Vision or Microsoft OCR as an optional cloud path when internet and credentials are available.",
      "Production stack: hybrid OCR router. Printed/scanned forms go to PaddleOCR or DocTR; complex forms and tables go to Textract/Form Recognizer; layout-heavy documents use LayoutLM-style models; handwriting is a future specialized path.",
      "Tesseract is acceptable as a fallback but weaker on noisy scans and mixed layouts.",
      "Donut and LayoutLM are document-understanding models, not just OCR engines; use them after text/layout extraction when enough labeled police forms exist."
    ]
  },
  {
    title: "Document Understanding",
    content: [
      "Classify document type first: FIR, chargesheet, witness statement, complaint, scanned form, police report, handwritten note, or mixed packet.",
      "Parse page layout into headers, body blocks, tables, signatures, seals, footers, and marginal notes.",
      "Extract key-values for CrimeNo, CaseNo, police station, dates, officer, court, complainant, accused, victim, act, section, and location.",
      "Use multi-page memory keyed by document id so entities introduced on page one can be resolved on later pages.",
      "Attach confidence to every field and keep raw evidence spans for reviewer approval."
    ]
  },
  {
    title: "NLP Pipeline",
    content: [
      "NER extracts person, role, phone, vehicle, weapon, address, place, court, police unit, officer, act, section, date, time, and crime method entities.",
      "Relation extraction links accused-to-case, victim-to-case, complainant-to-case, officer-to-case, act-section-to-case, and arrest-to-accused.",
      "Event extraction creates incident, information-received, FIR-registered, arrest/surrender, court-production, and chargesheet events.",
      "Temporal extraction normalizes incident ranges and delay features such as arrest delay and chargesheet delay.",
      "Legal section detection maps text like 302 IPC to Act.ActCode and Section.SectionCode, then validates against CrimeHeadActSection.",
      "Contradiction detection flags mismatched dates, impossible timelines, conflicting names, inconsistent station/category numbers, and unsupported legal sections."
    ]
  },
  {
    title: "Entity Resolution",
    content: [
      "Resolve same accused across FIRs with canonicalized name, alias list, age band, gender, phone, vehicle, address, co-accused, station, district, and MO pattern.",
      "Use deterministic exact matches for CrimeNo, CaseNo, phone, vehicle registration, KGID, checksum, and official IDs.",
      "Use fuzzy matching for names and addresses with phonetic keys, edit distance, token similarity, transliteration normalization, and district-aware blocking.",
      "Prevent duplicates by writing candidate SAME_AS graph edges first, requiring confidence thresholds and human approval before merging identities.",
      "Never overwrite official Accused/Victim/Complainant rows; maintain resolved intelligence as graph/entity-resolution metadata."
    ]
  },
  {
    title: "Feature Engineering",
    content: [
      "Core case features: crime frequency, incident hour/day/month, incident duration, registration delay, latitude, longitude, CrimeHead, CrimeSubHead, CaseCategory, GravityOffence, status, act-section set.",
      "Person features: victim age/gender, accused age/gender, prior FIR count, repeat-offender count, co-accused degree, alias count, cross-district count.",
      "Process features: arrest delay, chargesheet delay, IO workload, station workload, court workload, status aging.",
      "Geospatial features: historical crime density, distance to prior hotspots, district/station rolling rates, HDBSCAN cluster id, road/population/festival/weather joins when available.",
      "Streaming features: rolling 1h/24h/7d counts by district, station, crime head, gravity, and case category."
    ]
  },
  {
    title: "Crime Prediction Engine",
    content: [
      "Hotspot prediction outputs geospatial risk cells or center/radius hotspots with confidence and top drivers.",
      "Crime category prediction maps extracted text and structured context to CrimeHead/CrimeSubHead while validating legal sections.",
      "District and station risk scores combine rolling crime frequency, severity, repeat-offender activity, hotspot density, event calendar, and resource signals.",
      "Emerging pattern detection compares current windows against seasonal baselines and neighboring districts.",
      "Evaluation uses precision/recall for alert usefulness, RMSE/MAE/MAPE for volume forecasts, AUC for risk models, and analyst feedback for recommendations."
    ]
  },
  {
    title: "Recommendation Engine",
    content: [
      "Generate recommendations from model outputs, graph signals, current police resources, and rule constraints.",
      "Actions include increase patrol, temporary checkpoint, special unit deployment, night patrol, awareness campaign, repeat-offender monitoring, senior officer assignment, and CCTV coverage.",
      "Rank by expected risk reduction, confidence, severity, cost, feasibility, jurisdiction, and urgency.",
      "Each recommendation must include evidence: affected district/unit, crime head, hotspot, trend delta, repeat-offender signal, and estimated impact."
    ]
  },
  {
    title: "Simulation AI",
    content: [
      "MVP simulation uses scenario templates and calibrated effect sizes rather than pretending to have a trained reinforcement model.",
      "Inputs: target district/unit, intervention type, patrol delta, checkpoint count, time window, crime head, festival/weather assumptions.",
      "Outputs: baseline risk, projected risk, confidence interval, affected hotspots, expected tradeoffs, and explanation.",
      "Production simulation can evolve into causal inference and reinforcement learning after historical intervention/outcome data exists."
    ]
  },
  {
    title: "Explainable AI",
    content: [
      "Use SHAP for LightGBM/XGBoost/CatBoost tabular models.",
      "Use LIME only for quick local text or tabular demos where SHAP is unavailable.",
      "Use attention maps for transformer document models as supporting evidence, not as the sole explanation.",
      "Graph explanations return shortest paths, shared phones/vehicles/addresses/co-accused, centrality changes, and evidence documents.",
      "Natural-language explanations must cite official table fields and confidence, for example: hotspot predicted because theft rose 35%, repeat-offender graph activity increased, tomorrow is a festival, and patrol density is low."
    ]
  },
  {
    title: "Realtime AI Pipeline",
    content: [
      "Kafka events trigger incremental OCR, extraction, entity resolution, graph sync, feature updates, predictions, alerts, and dashboard refresh.",
      "Feature store keeps offline training features and online inference features consistent.",
      "Prediction cache stores latest risk by district, unit, crime head, and time window.",
      "GPU is optional for OCR/transformer inference; tabular models and clustering can run on CPU for MVP.",
      "Batch handles nightly retraining and large reindexing; online inference handles new documents and case updates."
    ]
  },
  {
    title: "AI Security",
    content: [
      "Treat uploaded documents as hostile input: scan files, strip active content, isolate OCR, and never let document text become system instructions.",
      "Use confidence thresholds and human verification for database-enriching outputs.",
      "Protect against poisoned data by tracking source documents, reviewers, model versions, feature hashes, and anomaly scores.",
      "Prevent hallucination by constraining outputs to official table fields and lookup values from the ER schema.",
      "Audit every AI recommendation, extraction, correction, approval, and rejection."
    ]
  },
  {
    title: "Hackathon AI MVP",
    content: [
      "Build: OCR adapter/mock, NER/rule extraction, legal section detector, HDBSCAN hotspot clustering, LightGBM/XGBoost risk baseline, Isolation Forest anomaly detector, graph projection demo, SHAP-style explanations.",
      "Use pretrained: OCR, sentence embeddings, multilingual NER if available, geocoder if configured.",
      "Rule-based: CrimeNo parsing, act-section validation, timeline validation, high-confidence entity matching, recommendation templates.",
      "Simulate: GNNs, online learning, full causal simulation, handwriting recognition, federated learning, and reinforcement patrol optimization.",
      "Judges should see document-to-intelligence, CaseMaster-centered enrichment, graph hidden links, hotspot forecast, explainable action recommendation, and realtime update."
    ]
  },
  {
    title: "Future AI Roadmap",
    content: [
      "Graph Neural Networks for link prediction after enough approved graph labels exist.",
      "Federated learning and multi-state sharing with privacy-preserving entity matching.",
      "Voice-based FIR understanding and multilingual Kannada/English NLP.",
      "Handwriting recognition for police notes and scanned complaint letters.",
      "CCTV metadata fusion, vehicle/face event correlation where legally permitted, and agentic investigator assistant.",
      "Reinforcement learning for patrol optimization only after intervention/outcome feedback loops mature."
    ]
  }
];

export const aiIntelligenceLayer = {
  title: "CrimeVerse AI Intelligence Layer",
  sourceOfTruth: "Police_FIR_ER_Diagram.pdf official FIR schema",
  principle: "AI consumes, enriches, validates, predicts from, and projects the official schema. It does not replace CaseMaster or any operational FIR table.",
  architectureDiagram: aiArchitectureDiagram,
  tableIntelligence: aiTableIntelligence,
  modelDecisions,
  sections: aiDesignSections
};
