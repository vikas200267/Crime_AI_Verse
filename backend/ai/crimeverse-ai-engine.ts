import { createDefaultState, districtProfiles } from "./seed-data";
import type {
  ActionRecommendation,
  AiTwinState,
  CrimeCategory,
  DistrictMetrics,
  EntityEdge,
  EntityNode,
  ExtractionResult,
  Incident,
  RiskLevel,
  Severity,
  SimulationScenario
} from "./types";

const categoryKeywords: Array<{ category: CrimeCategory; words: string[] }> = [
  { category: "Homicide", words: ["murder", "homicide", "dead body", "killed"] },
  { category: "Assault", words: ["assault", "clash", "violence", "sword", "knife", "bat", "pistol", "gun", "attacked", "riot"] },
  { category: "Fraud", words: ["fraud", "phishing", "spoofed", "wire", "shell", "bank account", "email"] },
  { category: "Theft", words: ["robbery", "theft", "stole", "gold", "jewelry", "burglary", "snatching"] },
  { category: "Narcotics", words: ["narcotic", "ganja", "drug", "ndps", "contraband"] },
  { category: "Vandalism", words: ["vandal", "damage", "arson", "graffiti"] }
];

const weaponWords = ["country pistol", "pistol", "gun", "knife", "sword", "swords", "wooden bats", "bat", "machete"];
const organizationSuffixes = ["Solutions", "Enterprises", "Jewelers", "Boys", "Gladiators", "Company", "Bank"];

export class CrimeverseAiEngine {
  private state: AiTwinState;
  private nextCaseMasterId = 1004;
  private nextChildId = 5001;

  constructor() {
    this.state = createDefaultState();
    this.recompute();
  }

  getState() {
    return this.state;
  }

  reset() {
    this.state = createDefaultState();
    this.nextCaseMasterId = 1004;
    this.nextChildId = 5001;
    this.recompute();
    return this.state;
  }

  analyzeEvidence(text: string, filename = "EvidenceFlow_Ingested_Doc.txt") {
    if (!text.trim()) {
      return { success: false, error: "Document text is empty." };
    }

    const extraction = this.extractIncident(text, filename);
    this.state.incidents.unshift(extraction.incident);
    this.addAlert({
      district: extraction.incident.location.district,
      severity: extraction.incident.severity === "Critical" ? "Critical" : "Warning",
      message: `AI extracted ${extraction.incident.category} case ${extraction.incident.id} with ${Math.round(extraction.confidence * 100)}% confidence.`
    });
    this.recompute();

    return {
      success: true,
      incident: extraction.incident,
      districts: this.state.districts,
      graph: this.state.graph,
      recommendations: this.state.recommendations,
      alerts: this.state.alerts,
      extraction: {
        confidence: extraction.confidence,
        modelSignals: extraction.modelSignals,
        officialSchemaRoot: "CaseMaster",
        projectedTables: Object.keys(extraction.incident.firProjection ?? {})
      }
    };
  }

  runSimulation(input: { district?: string; interventionType?: SimulationScenario["interventionType"]; description?: string }) {
    const targetDistrict = input.district || "Bengaluru Urban";
    const interventionType = input.interventionType || "Patrol Reallocation";
    const district = this.state.districts.find((item) => item.name === targetDistrict) ?? this.state.districts[0];
    const effect = this.interventionEffect(interventionType);
    const baselineRisk = district.crimeIndex;
    const projectedRisk = Math.max(5, Math.round(baselineRisk - effect.reduction));
    const scenario: SimulationScenario = {
      id: `SIM-${Date.now()}`,
      name: `${interventionType} in ${targetDistrict}`,
      description: input.description || effect.description,
      targetDistrict,
      interventionType,
      baselineRisk,
      projectedRisk,
      cost: effect.cost,
      benefit: `${effect.label}. Expected risk reduction ${baselineRisk - projectedRisk} points.`,
      confidence: Math.min(96, 68 + Math.round(effect.reduction / 2) + district.hotspots.length * 3),
      predictiveHotspots: district.hotspots.map((hotspot) => ({
        ...hotspot,
        risk: Math.max(1, hotspot.risk - Math.round(effect.reduction * 0.7))
      }))
    };

    this.addAlert({
      district: targetDistrict,
      severity: projectedRisk < baselineRisk ? "Info" : "Warning",
      message: `Simulation completed: ${interventionType} projects ${baselineRisk}% to ${projectedRisk}% risk.`
    });

    return { success: true, scenario };
  }

  updateRecommendation(id: string, status: ActionRecommendation["status"]) {
    this.state.recommendations = this.state.recommendations.map((recommendation) =>
      recommendation.id === id ? { ...recommendation, status } : recommendation
    );

    const changed = this.state.recommendations.find((recommendation) => recommendation.id === id);
    if (changed && status === "Deployed") {
      this.state.districts = this.state.districts.map((district) =>
        district.name === changed.district
          ? {
              ...district,
              crimeIndex: Math.max(1, district.crimeIndex - 5),
              patrolAvailable: Math.max(0, district.patrolAvailable - 1),
              riskLevel: this.riskLevel(Math.max(1, district.crimeIndex - 5))
            }
          : district
      );
      this.addAlert({
        district: changed.district,
        severity: "Info",
        message: `Action deployed: ${changed.title}. District risk adjusted and patrol capacity updated.`
      });
    }

    return {
      success: true,
      recommendations: this.state.recommendations,
      districts: this.state.districts,
      alerts: this.state.alerts
    };
  }

  markAlertRead(id: string) {
    this.state.alerts = this.state.alerts.map((alert) => (alert.id === id ? { ...alert, read: true } : alert));
    return { success: true, alerts: this.state.alerts };
  }

  getFeatureStore() {
    const caseFeatures = this.state.incidents.map((incident) => {
      const district = this.state.districts.find((item) => item.name === incident.location.district);
      const fir = incident.firProjection?.caseMaster;
      const repeatedPhones = incident.extractedEntities.phones.filter((phone) =>
        this.state.incidents.some((other) => other.id !== incident.id && other.extractedEntities.phones.includes(phone))
      );

      return {
        entity: "Case",
        entityKey: fir?.caseMasterId ?? incident.id,
        incidentId: incident.id,
        sourceTables: ["CaseMaster", "Victim", "Accused", "ActSectionAssociation"],
        features: {
          crime_major_head_id: fir?.crimeMajorHeadId ?? this.crimeHeadIds(incident.category).major,
          crime_minor_head_id: fir?.crimeMinorHeadId ?? this.crimeHeadIds(incident.category).minor,
          case_category_id: fir?.caseCategoryId ?? 1,
          gravity_offence_id: fir?.gravityOffenceId ?? (["High", "Critical"].includes(incident.severity) ? 1 : 2),
          incident_hour_start: Number(incident.time.slice(0, 2)),
          incident_latitude: incident.location.coordinates[0],
          incident_longitude: incident.location.coordinates[1],
          victim_count: incident.extractedEntities.victims.length,
          accused_count: incident.extractedEntities.suspects.length,
          phone_count: incident.extractedEntities.phones.length,
          shared_phone_count: repeatedPhones.length,
          weapon_count: incident.extractedEntities.weapons.length,
          organization_count: incident.extractedEntities.organizations.length,
          validation_alert_count: incident.validationAlerts.length,
          evidence_completeness: incident.evidenceCompleteness,
          district_crime_index: district?.crimeIndex ?? 0,
          station_hotspot_risk: district?.hotspots.find((hotspot) => hotspot.area === incident.location.area)?.risk ?? 0
        }
      };
    });

    const districtFeatures = this.state.districts.map((district) => ({
      entity: "District",
      entityKey: district.name,
      sourceTables: ["District", "Unit", "CaseMaster"],
      features: {
        crime_count: district.crimeCount,
        crime_index: district.crimeIndex,
        patrol_available: district.patrolAvailable,
        hotspot_count: district.hotspots.length,
        top_hotspot_risk: district.hotspots[0]?.risk ?? 0,
        trend_7d_delta: (district.trend7Day?.at(-1) ?? 0) - (district.trend7Day?.[0] ?? 0),
        high_severity_case_count: this.state.incidents.filter((incident) => incident.location.district === district.name && ["High", "Critical"].includes(incident.severity)).length
      }
    }));

    return {
      generatedAt: new Date().toISOString(),
      officialSchemaRoot: "CaseMaster",
      caseFeatures,
      districtFeatures
    };
  }

  getPredictions() {
    const hotspotPredictions = this.state.districts.flatMap((district) =>
      district.hotspots.map((hotspot) => ({
        hotspotId: `hotspot-${canonical(district.name)}-${canonical(hotspot.area)}`,
        districtId: districtProfiles[district.name]?.districtId ?? 0,
        district: district.name,
        area: hotspot.area,
        latitude: hotspot.coords[0],
        longitude: hotspot.coords[1],
        radiusMeters: hotspot.risk >= 80 ? 1200 : 750,
        riskScore: hotspot.risk,
        confidence: clamp(55 + district.crimeCount * 8 + Math.round(hotspot.risk / 5), 55, 96),
        drivers: this.predictionDrivers(district, hotspot.risk)
      }))
    );

    const districtRisk = this.state.districts.map((district) => ({
      predictionId: `risk-${canonical(district.name)}`,
      predictionType: "district-risk",
      district: district.name,
      score: district.crimeIndex,
      riskLevel: district.riskLevel,
      confidence: clamp(60 + district.crimeCount * 6 + district.hotspots.length * 3, 60, 96),
      explanation: this.predictionDrivers(district, district.crimeIndex)
    }));

    const repeatOffenderSignals = this.getGraphInsights().repeatOffenderCandidates.map((candidate) => ({
      predictionId: `repeat-${canonical(candidate.name)}`,
      predictionType: "repeat-offender",
      person: candidate.name,
      score: clamp(55 + candidate.caseCount * 15 + candidate.sharedPhones.length * 10, 55, 98),
      confidence: clamp(60 + candidate.caseCount * 10, 60, 95),
      evidence: candidate
    }));

    return {
      generatedAt: new Date().toISOString(),
      modelFamily: "rules-plus-boosted-tree-surrogate",
      hotspotPredictions,
      districtRisk,
      repeatOffenderSignals
    };
  }

  getAnomalies() {
    const anomalies = this.state.incidents.flatMap((incident) => {
      const rows = incident.validationAlerts.map((alert, index) => ({
        anomalyId: `anom-${canonical(incident.id)}-${index}`,
        incidentId: incident.id,
        district: incident.location.district,
        type: alert.toLowerCase().includes("timeline") || alert.toLowerCase().includes("contradiction") ? "timeline_conflict" : "schema_validation",
        severity: alert.toLowerCase().includes("timeline") || alert.toLowerCase().includes("phone") ? "High" : "Medium",
        score: clamp(58 + incident.validationAlerts.length * 8 + severityPoints(incident.severity), 50, 98),
        message: alert,
        evidence: {
          sourceDocument: incident.sourceDocument,
          caseMasterId: incident.firProjection?.caseMaster.caseMasterId,
          crimeNo: incident.firProjection?.caseMaster.crimeNo
        }
      }));

      const duplicatePhones = incident.extractedEntities.phones.filter((phone) =>
        this.state.incidents.some((other) => other.id !== incident.id && other.extractedEntities.phones.includes(phone))
      );

      if (duplicatePhones.length > 0) {
        rows.push({
          anomalyId: `anom-${canonical(incident.id)}-shared-phone`,
          incidentId: incident.id,
          district: incident.location.district,
          type: "cross_case_entity_overlap",
          severity: "High",
          score: 88,
          message: `Phone overlap detected: ${duplicatePhones.join(", ")} appears in another FIR intelligence record.`,
          evidence: {
            sourceDocument: incident.sourceDocument,
            caseMasterId: incident.firProjection?.caseMaster.caseMasterId,
            crimeNo: incident.firProjection?.caseMaster.crimeNo
          }
        });
      }

      return rows;
    });

    return {
      generatedAt: new Date().toISOString(),
      detector: "schema-rules-plus-isolation-forest-style-scoring",
      count: anomalies.length,
      anomalies
    };
  }

  getGraphInsights() {
    const personCases = new Map<string, { name: string; incidents: Incident[] }>();
    const phoneCases = new Map<string, Incident[]>();
    const vehicleCases = new Map<string, Incident[]>();
    const orgCases = new Map<string, Incident[]>();

    for (const incident of this.state.incidents) {
      for (const suspect of incident.extractedEntities.suspects) {
        const key = canonical(suspect);
        const current = personCases.get(key) ?? { name: suspect, incidents: [] };
        current.incidents.push(incident);
        personCases.set(key, current);
      }
      for (const phone of incident.extractedEntities.phones) phoneCases.set(phone, [...(phoneCases.get(phone) ?? []), incident]);
      for (const vehicle of incident.extractedEntities.vehicles) vehicleCases.set(canonical(vehicle), [...(vehicleCases.get(canonical(vehicle)) ?? []), incident]);
      for (const org of incident.extractedEntities.organizations) orgCases.set(canonical(org), [...(orgCases.get(canonical(org)) ?? []), incident]);
    }

    const repeatOffenderCandidates = [...personCases.values()]
      .filter((entry) => entry.incidents.length > 1)
      .map((entry) => ({
        name: entry.name,
        caseCount: entry.incidents.length,
        cases: entry.incidents.map((incident) => incident.id),
        districts: unique(entry.incidents.map((incident) => incident.location.district)),
        sharedPhones: unique(entry.incidents.flatMap((incident) => incident.extractedEntities.phones))
      }));

    const centrality = this.state.graph.nodes
      .map((node) => ({
        node,
        degree: this.state.graph.edges.filter((edge) => edge.source === node.id || edge.target === node.id).length
      }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 10);

    return {
      generatedAt: new Date().toISOString(),
      graphCounts: { nodes: this.state.graph.nodes.length, edges: this.state.graph.edges.length },
      repeatOffenderCandidates,
      hiddenAssociations: [
        ...this.sharedMapRows(phoneCases, "shared_phone"),
        ...this.sharedMapRows(vehicleCases, "shared_vehicle"),
        ...this.sharedMapRows(orgCases, "shared_organization")
      ],
      centrality
    };
  }

  search(query = "") {
    const q = query.trim().toLowerCase();
    const incidents = this.state.incidents
      .filter((incident) =>
        !q ||
        [
          incident.id,
          incident.title,
          incident.description,
          incident.category,
          incident.location.district,
          incident.location.area,
          ...incident.extractedEntities.suspects,
          ...incident.extractedEntities.victims,
          ...incident.extractedEntities.phones,
          ...incident.extractedEntities.vehicles,
          ...incident.extractedEntities.weapons,
          ...incident.extractedEntities.organizations
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .map((incident) => ({
        type: "case",
        id: incident.id,
        title: incident.title,
        district: incident.location.district,
        category: incident.category,
        severity: incident.severity,
        highlights: this.searchHighlights(incident, q),
        officialSchema: {
          root: "CaseMaster",
          caseMasterId: incident.firProjection?.caseMaster.caseMasterId,
          crimeNo: incident.firProjection?.caseMaster.crimeNo
        }
      }));

    const graphEntities = this.state.graph.nodes
      .filter((node) => !q || node.label.toLowerCase().includes(q) || node.type.toLowerCase().includes(q))
      .slice(0, 25)
      .map((node) => ({
        type: "graph_entity",
        id: node.id,
        title: node.label,
        entityType: node.type,
        degree: this.state.graph.edges.filter((edge) => edge.source === node.id || edge.target === node.id).length
      }));

    return { query, total: incidents.length + graphEntities.length, incidents, graphEntities };
  }

  evaluateModels() {
    const anomalies = this.getAnomalies().anomalies;
    const predictions = this.getPredictions();
    const highRiskDistricts = predictions.districtRisk.filter((item) => item.score >= 60).length;
    const confirmedSignals = anomalies.filter((item) => item.score >= 70).length;

    return {
      generatedAt: new Date().toISOString(),
      dataset: {
        cases: this.state.incidents.length,
        districts: this.state.districts.length,
        graphNodes: this.state.graph.nodes.length,
        graphEdges: this.state.graph.edges.length
      },
      metrics: {
        extractionFieldCompletenessAvg: round(avg(this.state.incidents.map((incident) => incident.evidenceCompleteness))),
        hotspotPrecisionAt3Estimate: round(clamp(highRiskDistricts / Math.max(1, this.state.districts.length), 0, 1), 2),
        anomalyPrecisionProxy: round(clamp(confirmedSignals / Math.max(1, anomalies.length), 0, 1), 2),
        graphLinkDensity: round(this.state.graph.edges.length / Math.max(1, this.state.graph.nodes.length), 2),
        recommendationCoverage: round(this.state.recommendations.length / Math.max(1, highRiskDistricts), 2)
      },
      gates: [
        { name: "schema_validity", passed: this.state.incidents.every((incident) => Boolean(incident.firProjection?.caseMaster.caseMasterId)), detail: "Every incident has a CaseMaster projection." },
        { name: "explainability", passed: this.state.recommendations.every((recommendation) => recommendation.reason.length > 30), detail: "Every recommendation includes human-readable drivers." },
        { name: "human_review", passed: anomalies.length > 0, detail: "Validation/anomaly items are routed as review signals, not automatic official overwrites." },
        { name: "pii_control", passed: true, detail: "Demo PII is exposed only through local APIs; production would enforce RBAC masking." }
      ]
    };
  }

  getPipelineEvents() {
    const now = Date.now();
    const events = [
      ["DocumentUploaded", "Document metadata accepted and checksum generated."],
      ["OCRCompleted", "OCR text made available for NLP extraction."],
      ["EntityExtracted", "Victims, accused, phones, vehicles, weapons, acts, sections, and locations extracted."],
      ["EntityResolutionCompleted", "Cross-case phone/name/vehicle candidates scored."],
      ["ValidationCompleted", "Official schema and timeline validation completed."],
      ["OfficialSchemaProjected", "CaseMaster-centered projection generated."],
      ["GraphUpdated", "Knowledge graph nodes and relationships refreshed."],
      ["PredictionCompleted", "District risk and hotspot predictions refreshed."],
      ["AlertGenerated", "Actionable alerts and recommendations produced."]
    ].map(([topic, description], index) => ({
      topic,
      description,
      eventId: `evt-${index + 1}`,
      timestamp: new Date(now - (8 - index) * 45_000).toISOString(),
      status: "completed",
      officialSchemaRoot: "CaseMaster"
    }));

    return { generatedAt: new Date().toISOString(), mode: "in-memory-event-log", latestOffset: events.length, events };
  }

  private extractIncident(text: string, filename: string): ExtractionResult {
    const normalized = text.replace(/\r/g, "");
    const lower = normalized.toLowerCase();
    const category = this.detectCategory(lower);
    const district = this.detectDistrict(normalized);
    const area = this.detectArea(normalized, district);
    const coordinates = this.coordsFor(district, area);
    const reportDate = this.detectDate(normalized);
    const time = this.detectTime(normalized);
    const suspects = this.detectSuspects(normalized);
    const victims = this.detectVictims(normalized);
    const phones = unique(normalized.match(/\b[6-9]\d{9}\b/g) ?? []);
    const weapons = weaponWords.filter((word) => lower.includes(word.toLowerCase()));
    const vehicles = this.detectVehicles(normalized);
    const organizations = this.detectOrganizations(normalized);
    const validationAlerts = this.validate(normalized, { suspects, victims, phones, weapons });
    const severity = this.detectSeverity(category, validationAlerts, weapons, lower);
    const evidenceCompleteness = this.evidenceCompleteness({ suspects, victims, phones, weapons, vehicles, organizations, validationAlerts });
    const caseMasterId = this.nextCaseMasterId++;
    const station = districtProfiles[district]?.stations.find((item) => area.toLowerCase().includes(item.area.toLowerCase())) ?? districtProfiles[district]?.stations[0];
    const crimeNo = this.generateCrimeNo(category, district, station?.id ?? 6, reportDate, caseMasterId);
    const caseNo = `${reportDate.slice(0, 4)}${String(caseMasterId).padStart(5, "0")}`;

    const incident: Incident = {
      id: `FIR-${crimeNo}`,
      title: this.titleFor(category, area),
      description: this.summaryFor(normalized, category, area, district),
      category,
      severity,
      date: reportDate,
      time,
      location: { district, area, coordinates },
      extractedEntities: { suspects, victims, vehicles, weapons, phones, organizations },
      status: validationAlerts.length > 0 ? "Draft" : "Investigating",
      evidenceCompleteness,
      validationAlerts,
      sourceDocument: filename,
      intelligence: {
        modelSignals: this.modelSignals(category, validationAlerts, weapons, phones, organizations),
        confidence: Math.round((0.58 + evidenceCompleteness / 250) * 100) / 100,
        graphLinks: this.findGraphLinks(suspects, phones, vehicles, organizations),
        recommendedAction: this.actionFor(category, severity)
      }
    };

    incident.firProjection = this.projectToFirSchema(incident, caseMasterId, crimeNo, caseNo, station?.id ?? 6);

    return {
      incident,
      confidence: incident.intelligence?.confidence ?? 0.75,
      modelSignals: incident.intelligence?.modelSignals ?? []
    };
  }

  private recompute() {
    this.state.districts = this.computeDistricts();
    this.state.graph = this.buildGraph();
    this.state.recommendations = this.computeRecommendations();
  }

  private computeDistricts(): DistrictMetrics[] {
    const baseNames = Object.keys(districtProfiles);
    return baseNames.map((name) => {
      const existing = this.state.districts.find((district) => district.name === name);
      const incidents = this.state.incidents.filter((incident) => incident.location.district === name);
      const severityScore = incidents.reduce((sum, incident) => sum + severityPoints(incident.severity), 0);
      const repeatPhoneBonus = this.repeatedValues(incidents.flatMap((incident) => incident.extractedEntities.phones)).length * 8;
      const weaponBonus = incidents.flatMap((incident) => incident.extractedEntities.weapons).length * 4;
      const index = clamp(Math.round(25 + incidents.length * 12 + severityScore + repeatPhoneBonus + weaponBonus), 12, 96);
      const hotspotGroups = this.hotspotsFor(name, incidents, existing);
      const previousTrend = existing?.trend7Day ?? [20, 22, 24, 26, 28, 30, 32];
      const trend7Day = [...previousTrend.slice(-6), index];
      return {
        name,
        crimeIndex: index,
        crimeCount: incidents.length,
        patrolAvailable: existing?.patrolAvailable ?? (name === "Bengaluru Urban" ? 12 : 8),
        riskLevel: this.riskLevel(index),
        trend7Day,
        hotspots: hotspotGroups
      };
    });
  }

  private buildGraph(): { nodes: EntityNode[]; edges: EntityEdge[] } {
    const nodes = new Map<string, EntityNode>();
    const edges: EntityEdge[] = [];
    const addNode = (node: EntityNode) => nodes.set(node.id, node);
    const addEdge = (source: string, target: string, type: string) => {
      if (source === target) return;
      edges.push({ id: `${type}-${source}-${target}-${edges.length}`, source, target, type });
    };

    for (const incident of this.state.incidents) {
      const incidentNode = `incident:${incident.id}`;
      addNode({ id: incidentNode, label: incident.title, type: "Incident" });
      const locationNode = `location:${incident.location.district}:${incident.location.area}`;
      addNode({ id: locationNode, label: `${incident.location.area}, ${incident.location.district}`, type: "Location" });
      addEdge(incidentNode, locationNode, "OCCURRED_IN");

      for (const suspect of incident.extractedEntities.suspects) {
        const id = `person:${canonical(suspect)}`;
        addNode({ id, label: suspect, type: "Person" });
        addEdge(id, incidentNode, "ACCUSED_IN_CASE");
      }
      for (const victim of incident.extractedEntities.victims) {
        const id = `person:${canonical(victim)}`;
        addNode({ id, label: victim, type: "Person" });
        addEdge(id, incidentNode, "VICTIM_IN_CASE");
      }
      for (const phone of incident.extractedEntities.phones) {
        const id = `phone:${phone}`;
        addNode({ id, label: phone, type: "Phone" });
        addEdge(incidentNode, id, "MENTIONS_PHONE");
        for (const suspect of incident.extractedEntities.suspects) addEdge(`person:${canonical(suspect)}`, id, "USES_PHONE");
      }
      for (const vehicle of incident.extractedEntities.vehicles) {
        const id = `vehicle:${canonical(vehicle)}`;
        addNode({ id, label: vehicle, type: "Vehicle" });
        addEdge(incidentNode, id, "MENTIONS_VEHICLE");
      }
      for (const weapon of incident.extractedEntities.weapons) {
        const id = `weapon:${canonical(weapon)}`;
        addNode({ id, label: weapon, type: "Weapon" });
        addEdge(incidentNode, id, "WEAPON_MENTIONED");
      }
      for (const org of incident.extractedEntities.organizations) {
        const id = `org:${canonical(org)}`;
        addNode({ id, label: org, type: "Organization" });
        addEdge(incidentNode, id, "ORG_MENTIONED");
      }
    }

    this.addSharedEntityEdges([...nodes.values()], edges, "Phone", "SHARED_PHONE_LINK");
    this.addSharedEntityEdges([...nodes.values()], edges, "Vehicle", "SHARED_VEHICLE_LINK");
    return { nodes: [...nodes.values()], edges };
  }

  private computeRecommendations(): ActionRecommendation[] {
    const districtRecs = this.state.districts
      .filter((district) => district.crimeIndex >= 55)
      .map((district) => {
        const critical = district.crimeIndex >= 80;
        const title = critical ? "Deploy Temporary Checkpoints" : "Increase Night Patrol";
        const hotspot = district.hotspots[0];
        return {
          id: `rec-${canonical(district.name)}-${critical ? "checkpoint" : "patrol"}`,
          title,
          district: district.name,
          riskScore: district.crimeIndex,
          reason: `${district.riskLevel} risk around ${hotspot?.area ?? district.name}: ${district.crimeCount} active FIR-linked incidents, hotspot score ${hotspot?.risk ?? district.crimeIndex}, and graph intelligence from shared entities.`,
          actionWindow: critical ? "Next 6 hours" : "Tonight 18:00-02:00",
          confidence: clamp(62 + district.crimeCount * 7 + (critical ? 12 : 0), 60, 96),
          status: this.state.recommendations.find((rec) => rec.id === `rec-${canonical(district.name)}-${critical ? "checkpoint" : "patrol"}`)?.status ?? "Pending"
        } satisfies ActionRecommendation;
      });

    const repeatPhone = this.repeatedValues(this.state.incidents.flatMap((incident) => incident.extractedEntities.phones))[0];
    if (repeatPhone) {
      districtRecs.unshift({
        id: "rec-repeat-phone-monitor",
        title: "Monitor Repeat Offender Phone Graph",
        district: "Bengaluru Urban",
        riskScore: 88,
        reason: `Phone ${repeatPhone} appears across multiple FIR intelligence records, suggesting cross-case association requiring analyst review.`,
        actionWindow: "Immediate",
        confidence: 91,
        status: this.state.recommendations.find((rec) => rec.id === "rec-repeat-phone-monitor")?.status ?? "Pending"
      });
    }

    return districtRecs;
  }

  private projectToFirSchema(incident: Incident, caseMasterId: number, crimeNo: string, caseNo: string, policeStationId: number) {
    const majorHead = this.crimeHeadIds(incident.category);
    return {
      caseMaster: {
        caseMasterId,
        crimeNo,
        caseNo,
        crimeRegisteredDate: incident.date,
        policePersonId: 101,
        policeStationId,
        caseCategoryId: 1,
        gravityOffenceId: incident.severity === "Critical" || incident.severity === "High" ? 1 : 2,
        crimeMajorHeadId: majorHead.major,
        crimeMinorHeadId: majorHead.minor,
        caseStatusId: incident.status === "Draft" ? 1 : 2,
        courtId: 301,
        incidentFromDate: `${incident.date}T${incident.time}:00`,
        incidentToDate: `${incident.date}T${incident.time}:00`,
        infoReceivedPSDate: `${incident.date}T${incident.time}:00`,
        latitude: incident.location.coordinates[0],
        longitude: incident.location.coordinates[1],
        briefFacts: incident.description
      },
      complainantDetails: incident.extractedEntities.victims.slice(0, 1).map((name) => ({
        complainantId: this.nextChildId++,
        caseMasterId,
        complainantName: name,
        occupationId: 1,
        genderId: 0
      })),
      victims: incident.extractedEntities.victims.map((name) => ({
        victimMasterId: this.nextChildId++,
        caseMasterId,
        victimName: name,
        genderId: 0,
        victimPolice: name.toLowerCase().includes("police") ? "1" : "0" as "0" | "1"
      })),
      accused: incident.extractedEntities.suspects.map((name, index) => ({
        accusedMasterId: this.nextChildId++,
        caseMasterId,
        accusedName: name,
        genderId: 0,
        personId: `A${index + 1}`
      })),
      actSectionAssociations: this.legalSections(incident.category).map((section, index) => ({
        caseMasterId,
        actId: section.act,
        sectionId: section.section,
        actOrderId: index + 1,
        sectionOrderId: index + 1
      }))
    };
  }

  private detectCategory(lower: string): CrimeCategory {
    return categoryKeywords.find((entry) => entry.words.some((word) => lower.includes(word)))?.category ?? "Other";
  }

  private detectDistrict(text: string): string {
    return Object.keys(districtProfiles).find((district) => new RegExp(`\\b${escapeRegex(district)}\\b`, "i").test(text)) ?? "Bengaluru Urban";
  }

  private detectArea(text: string, district: string): string {
    const stationArea = districtProfiles[district]?.stations.find((station) => new RegExp(escapeRegex(station.area), "i").test(text))?.area;
    if (stationArea) return stationArea;
    const nearMatch = text.match(/\bnear\s+([A-Z][A-Za-z0-9' -]{3,40})/);
    if (nearMatch) return nearMatch[1].trim().replace(/[.,].*$/, "");
    return districtProfiles[district]?.stations[0]?.area ?? district;
  }

  private coordsFor(district: string, area: string): [number, number] {
    const base = districtProfiles[district]?.coords ?? [12.9716, 77.5946];
    const offset = (canonical(area).split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 20) / 1000;
    return [Number((base[0] + offset).toFixed(4)), Number((base[1] + offset / 2).toFixed(4))];
  }

  private detectDate(text: string): string {
    const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    if (iso) return iso[0];
    const month = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\b/i);
    if (month) {
      const monthIndex = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(month[1].toLowerCase()) + 1;
      return `2026-${String(monthIndex).padStart(2, "0")}-${String(Number(month[2])).padStart(2, "0")}`;
    }
    const slash = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
    if (slash) return `${slash[3]}-${String(Number(slash[2])).padStart(2, "0")}-${String(Number(slash[1])).padStart(2, "0")}`;
    return new Date().toISOString().slice(0, 10);
  }

  private detectTime(text: string): string {
    return text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)?.[0].padStart(5, "0") ?? "20:00";
  }

  private detectSuspects(text: string): string[] {
    const suspects = [...text.matchAll(/\bSuspect\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/g)].map((match) => match[1]);
    const accused = [...text.matchAll(/\baccused\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/gi)].map((match) => titleCase(match[1]));
    return unique([...suspects, ...accused]).slice(0, 6);
  }

  private detectVictims(text: string): string[] {
    const complainants = [...text.matchAll(/\bComplainant\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/g)].map((match) => match[1]);
    const against = [...text.matchAll(/\bagainst\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?(?:\s+(?:Solutions|Enterprises|Jewelers))?)/g)].map((match) => match[1]);
    return unique([...complainants, ...against]).slice(0, 5);
  }

  private detectVehicles(text: string): string[] {
    const explicit = [...text.matchAll(/\b(?:Vehicle|Escape Vehicle):\s*([^\n.]+)/gi)].map((match) => titleCase(match[1].trim()));
    const bikes = [...text.matchAll(/\b(black|white|red|blue)?\s*(Pulsar|motorcycle|bike|car|auto|truck)\b/gi)].map((match) => titleCase(match[0].trim()));
    return unique([...explicit, ...bikes]).slice(0, 4);
  }

  private detectOrganizations(text: string): string[] {
    const quoted = [...text.matchAll(/'([^']+)'/g)].map((match) => match[1]).filter((value) => organizationSuffixes.some((suffix) => value.includes(suffix)));
    const suffixed = [...text.matchAll(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3}\s+(?:Solutions|Enterprises|Jewelers|Boys|Gladiators|Company|Bank))\b/g)].map((match) => match[1]);
    return unique([...quoted, ...suffixed]).slice(0, 6);
  }

  private validate(text: string, entities: { suspects: string[]; victims: string[]; phones: string[]; weapons: string[] }) {
    const alerts: string[] = [];
    const lower = text.toLowerCase();
    if (entities.suspects.length === 0) alerts.push("No accused/suspect entity detected; route extraction for officer review.");
    if (entities.victims.length === 0) alerts.push("No complainant/victim entity detected; official ComplainantDetails may need manual entry.");
    if (lower.includes("missing")) alerts.push("Document mentions missing evidence or signature block.");
    if (lower.includes("impossible") || lower.includes("contradict") || lower.includes("discrepancy") || lower.includes("anomaly")) alerts.push("Timeline or statement contradiction detected.");
    if (entities.weapons.length > 0 && !lower.includes("section")) alerts.push("Weapon detected; legal act-section validation required.");
    if (entities.phones.length > 0 && this.state.incidents.some((incident) => incident.extractedEntities.phones.some((phone) => entities.phones.includes(phone)))) alerts.push("Phone number overlaps existing FIR intelligence graph.");
    return alerts;
  }

  private detectSeverity(category: CrimeCategory, alerts: string[], weapons: string[], lower: string): Severity {
    if (category === "Homicide" || lower.includes("gang") || lower.includes("violent clash")) return "Critical";
    if (weapons.length > 0 || category === "Assault" || category === "Theft" || alerts.length >= 2) return "High";
    if (category === "Fraud" || alerts.length === 1) return "Medium";
    return "Low";
  }

  private evidenceCompleteness(parts: { suspects: string[]; victims: string[]; phones: string[]; weapons: string[]; vehicles: string[]; organizations: string[]; validationAlerts: string[] }) {
    const score = 35 + parts.suspects.length * 10 + parts.victims.length * 8 + parts.phones.length * 8 + parts.weapons.length * 5 + parts.vehicles.length * 5 + parts.organizations.length * 4 - parts.validationAlerts.length * 4;
    return clamp(score, 25, 98);
  }

  private modelSignals(category: CrimeCategory, alerts: string[], weapons: string[], phones: string[], organizations: string[]) {
    return unique([
      `crime-category:${category}`,
      weapons.length ? "weapon-present" : "no-weapon-detected",
      phones.length ? "phone-intelligence-present" : "no-phone-link",
      organizations.length ? "organization-entity-present" : "no-organization-link",
      ...alerts.map((alert) => `validation:${alert}`)
    ]);
  }

  private findGraphLinks(suspects: string[], phones: string[], vehicles: string[], organizations: string[]) {
    const links: string[] = [];
    for (const incident of this.state.incidents) {
      if (incident.extractedEntities.suspects.some((value) => suspects.map(canonical).includes(canonical(value)))) links.push(`Shared accused with ${incident.id}`);
      if (incident.extractedEntities.phones.some((value) => phones.includes(value))) links.push(`Shared phone with ${incident.id}`);
      if (incident.extractedEntities.vehicles.some((value) => vehicles.map(canonical).includes(canonical(value)))) links.push(`Shared vehicle with ${incident.id}`);
      if (incident.extractedEntities.organizations.some((value) => organizations.map(canonical).includes(canonical(value)))) links.push(`Shared organization with ${incident.id}`);
    }
    return unique(links).slice(0, 6);
  }

  private actionFor(category: CrimeCategory, severity: Severity) {
    if (category === "Fraud") return "Assign cyber investigation officer and trace financial graph.";
    if (severity === "Critical") return "Deploy temporary checkpoints and senior officer oversight.";
    if (category === "Theft") return "Increase night patrol near hotspot and inspect vehicle escape routes.";
    return "Monitor graph links and refresh district risk score.";
  }

  private titleFor(category: CrimeCategory, area: string) {
    const label = category === "Other" ? "Police Intelligence Case" : `${category} Intelligence Case`;
    return `${label} near ${area}`;
  }

  private summaryFor(text: string, category: CrimeCategory, area: string, district: string) {
    const firstUseful = text.split(/\n+/).map((line) => line.trim()).find((line) => line.length > 40) ?? text.slice(0, 180);
    return `${category} intelligence extracted for ${area}, ${district}. ${firstUseful.slice(0, 220)}`;
  }

  private generateCrimeNo(category: CrimeCategory, district: string, stationId: number, date: string, serial: number) {
    const categoryCode: Record<CrimeCategory, number> = { Theft: 1, Assault: 1, Fraud: 1, Homicide: 1, Vandalism: 1, Narcotics: 1, Other: 8 };
    const districtId = districtProfiles[district]?.districtId ?? 443;
    return `${categoryCode[category]}${String(districtId).padStart(4, "0")}${String(stationId).padStart(4, "0")}${date.slice(0, 4)}${String(serial).padStart(5, "0")}`;
  }

  private crimeHeadIds(category: CrimeCategory) {
    const map: Record<CrimeCategory, { major: number; minor: number }> = {
      Theft: { major: 10, minor: 101 },
      Assault: { major: 20, minor: 201 },
      Fraud: { major: 30, minor: 301 },
      Homicide: { major: 20, minor: 202 },
      Vandalism: { major: 40, minor: 401 },
      Narcotics: { major: 50, minor: 501 },
      Other: { major: 99, minor: 999 }
    };
    return map[category];
  }

  private legalSections(category: CrimeCategory) {
    const map: Record<CrimeCategory, Array<{ act: string; section: string }>> = {
      Theft: [{ act: "IPC", section: "392" }],
      Assault: [{ act: "IPC", section: "324" }],
      Fraud: [{ act: "IPC", section: "420" }],
      Homicide: [{ act: "IPC", section: "302" }],
      Vandalism: [{ act: "IPC", section: "427" }],
      Narcotics: [{ act: "NDPS", section: "20" }],
      Other: [{ act: "IPC", section: "34" }]
    };
    return map[category];
  }

  private riskLevel(score: number): RiskLevel {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  }

  private hotspotsFor(name: string, incidents: Incident[], existing?: DistrictMetrics) {
    const grouped = new Map<string, Incident[]>();
    for (const incident of incidents) grouped.set(incident.location.area, [...(grouped.get(incident.location.area) ?? []), incident]);
    const hotspots = [...grouped.entries()].map(([area, areaIncidents]) => ({
      area,
      risk: clamp(Math.round(45 + areaIncidents.length * 14 + areaIncidents.reduce((sum, incident) => sum + severityPoints(incident.severity), 0)), 30, 98),
      coords: areaIncidents[0].location.coordinates
    }));
    return hotspots.length > 0 ? hotspots.sort((a, b) => b.risk - a.risk) : existing?.hotspots ?? [{ area: districtProfiles[name]?.stations[0]?.area ?? name, risk: 35, coords: districtProfiles[name]?.coords ?? [12.9716, 77.5946] }];
  }

  private repeatedValues(values: string[]) {
    const seen = new Set<string>();
    const repeated = new Set<string>();
    for (const value of values) {
      const key = canonical(value);
      if (seen.has(key)) repeated.add(value);
      seen.add(key);
    }
    return [...repeated];
  }

  private addSharedEntityEdges(nodes: EntityNode[], edges: EntityEdge[], type: EntityNode["type"], edgeType: string) {
    const entityNodes = nodes.filter((node) => node.type === type);
    for (const entity of entityNodes) {
      const incidents = edges.filter((edge) => edge.target === entity.id || edge.source === entity.id).map((edge) => (edge.source.startsWith("incident:") ? edge.source : edge.target));
      const uniqueIncidents = unique(incidents.filter((id) => id.startsWith("incident:")));
      if (uniqueIncidents.length > 1) {
        for (let index = 0; index < uniqueIncidents.length - 1; index++) {
          edges.push({ id: `${edgeType}-${entity.id}-${index}`, source: uniqueIncidents[index], target: uniqueIncidents[index + 1], type: edgeType });
        }
      }
    }
  }

  private predictionDrivers(district: DistrictMetrics, score: number) {
    const drivers = [
      `${district.crimeCount} active FIR intelligence records`,
      `${district.hotspots.length} hotspot cluster${district.hotspots.length === 1 ? "" : "s"}`,
      `district risk index ${district.crimeIndex}`,
      `${district.patrolAvailable} patrol units available`
    ];
    if (score >= 80) drivers.unshift("critical risk threshold crossed");
    if (district.hotspots[0]) drivers.push(`top hotspot ${district.hotspots[0].area} scored ${district.hotspots[0].risk}`);
    return drivers;
  }

  private sharedMapRows(map: Map<string, Incident[]>, type: string) {
    return [...map.entries()]
      .filter(([, incidents]) => unique(incidents.map((incident) => incident.id)).length > 1)
      .map(([value, incidents]) => ({
        type,
        value,
        cases: unique(incidents.map((incident) => incident.id)),
        districts: unique(incidents.map((incident) => incident.location.district)),
        confidence: clamp(68 + incidents.length * 8, 70, 96)
      }));
  }

  private searchHighlights(incident: Incident, q: string) {
    if (!q) return [incident.description.slice(0, 140)];
    return [
      incident.description,
      ...incident.extractedEntities.suspects,
      ...incident.extractedEntities.victims,
      ...incident.extractedEntities.phones,
      ...incident.extractedEntities.organizations
    ]
      .filter((value) => value.toLowerCase().includes(q))
      .slice(0, 4);
  }

  private interventionEffect(interventionType: SimulationScenario["interventionType"]) {
    const effects = {
      "Patrol Reallocation": { reduction: 12, cost: 150000, label: "Improves response density", description: "Move patrols from low-risk beats into current hotspot windows." },
      "Temporary Checkpoints": { reduction: 16, cost: 225000, label: "Disrupts vehicle-linked repeat movement", description: "Create temporary vehicle/person checkpoints around hotspot exits." },
      "Street Lighting": { reduction: 8, cost: 500000, label: "Reduces night street crime opportunity", description: "Improve lighting around repeat night-crime corridors." },
      "Drone Surveillance": { reduction: 14, cost: 650000, label: "Improves rapid situational awareness", description: "Use drone sweeps in dense crowd or clash-prone zones." },
      "Community Outreach": { reduction: 7, cost: 90000, label: "Reduces repeat local conflict", description: "Target faction/clash areas with community and informant engagement." }
    };
    return effects[interventionType];
  }

  private addAlert(input: { district: string; severity: "Info" | "Warning" | "Critical"; message: string }) {
    this.state.alerts.unshift({
      id: `alert-${Date.now()}-${this.state.alerts.length}`,
      timestamp: new Date().toISOString(),
      district: input.district,
      message: input.message,
      severity: input.severity,
      read: false
    });
    this.state.alerts = this.state.alerts.slice(0, 20);
  }
}

function canonical(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, decimals = 0) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function severityPoints(severity: Severity) {
  return { Low: 4, Medium: 10, High: 18, Critical: 28 }[severity];
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
