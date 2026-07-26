import type { Request, Response } from "express";
import { CrimeverseAiEngine } from "../../ai/crimeverse-ai-engine";
import { CatalystIntegration } from "../../catalyst/catalyst-integration";

export class IntelligenceController {
  constructor(
    private readonly engine: CrimeverseAiEngine,
    private readonly catalyst: CatalystIntegration
  ) {}

  private actor(request: Request) {
    return this.catalyst.getSession(request.headers.authorization)?.user.name ?? "DCP Admin";
  }

  metrics(_request: Request, response: Response) {
    response.json(this.engine.getState().districts);
  }

  incidents(_request: Request, response: Response) {
    response.json(this.engine.getState().incidents);
  }

  graph(_request: Request, response: Response) {
    response.json(this.engine.getState().graph);
  }

  recommendations(_request: Request, response: Response) {
    response.json(this.engine.getState().recommendations);
  }

  alerts(_request: Request, response: Response) {
    response.json(this.engine.getState().alerts);
  }

  reset(_request: Request, response: Response) {
    const resetState = this.engine.reset();
    this.catalyst.recordEvent("digital-twin.reset", "DCP Admin", "CrimeVerse AI digital twin demo state reset.");
    response.json({ success: true, ...resetState });
  }

  analyzeEvidence(request: Request, response: Response) {
    const body = request.body as { text?: string; filename?: string };
    const result = this.engine.analyzeEvidence(body.text ?? "", body.filename);
    if (result.success && "incident" in result) {
      const incident = result.incident;
      if (!incident) {
        response.status(500).json({ success: false, error: "Evidence analysis completed without an incident payload." });
        return;
      }
      const object = this.catalyst.createEvidenceObject(body.filename ?? "manual-fir-entry.txt", Buffer.byteLength(body.text ?? ""), this.actor(request));
      this.catalyst.recordEvent("ai.evidence.analyzed", this.actor(request), `EvidenceFlow AI analyzed ${incident.id} and updated graph intelligence.`);
      response.json({ ...result, catalyst: { evidenceObject: object } });
      return;
    }
    response.json(result);
  }

  runScenario(request: Request, response: Response) {
    const result = this.engine.runSimulation(request.body);
    if (result.success) {
      this.catalyst.recordEvent("simulation.completed", this.actor(request), `${result.scenario.interventionType} simulation completed for ${result.scenario.targetDistrict}.`);
    }
    response.json(result);
  }

  deployRecommendation(request: Request, response: Response) {
    const result = this.engine.updateRecommendation(request.params.id, "Deployed");
    this.catalyst.recordEvent("recommendation.deployed", this.actor(request), `Recommendation ${request.params.id} deployed from command center.`);
    response.json(result);
  }

  dismissRecommendation(request: Request, response: Response) {
    const result = this.engine.updateRecommendation(request.params.id, "Dismissed");
    this.catalyst.recordEvent("recommendation.dismissed", this.actor(request), `Recommendation ${request.params.id} dismissed after analyst review.`);
    response.json(result);
  }

  readAlert(request: Request, response: Response) {
    const result = this.engine.markAlertRead(request.params.id);
    this.catalyst.recordEvent("alert.read", this.actor(request), `Alert ${request.params.id} acknowledged.`);
    response.json(result);
  }

  aiStatus(_request: Request, response: Response) {
    const state = this.engine.getState();
    response.json({
      service: "crimeverse-ai-intelligence-layer",
      mode: "local-schema-aware-ai",
      officialSchemaRoot: "CaseMaster",
      implementedCapabilities: [
        "document text extraction simulation",
        "NLP entity extraction",
        "legal act-section projection",
        "CaseMaster projection",
        "entity resolution signals",
        "knowledge graph projection",
        "district hotspot scoring",
        "risk recommendations",
        "what-if simulation",
        "alert generation",
        "feature store projection",
        "prediction endpoint",
        "anomaly detection endpoint",
        "graph intelligence endpoint",
        "schema-aware search",
        "model evaluation gates",
        "realtime pipeline event log"
      ],
      counts: {
        incidents: state.incidents.length,
        graphNodes: state.graph.nodes.length,
        graphEdges: state.graph.edges.length,
        recommendations: state.recommendations.length,
        alerts: state.alerts.length,
        featureRows: this.engine.getFeatureStore().caseFeatures.length + this.engine.getFeatureStore().districtFeatures.length,
        anomalies: this.engine.getAnomalies().count,
        hotspotPredictions: this.engine.getPredictions().hotspotPredictions.length
      }
    });
  }

  catalystServices(_request: Request, response: Response) {
    response.json({
      project: {
        name: "Project-Rainfall",
        pid: "44619000000013025",
        deployment: "Catalyst AppSail",
        url: "https://crimeverse-ai-50042732570.development.catalystappsail.in"
      },
      creditGuardrail: "Keep AppSail active; enable Data Store, Stratus, Auth, API Gateway and Signals with compact records before using paid QuickML/Zia workloads.",
      services: this.catalyst.getServices()
    });
  }

  catalystEvents(_request: Request, response: Response) {
    response.json({ events: this.catalyst.getEvents() });
  }

  catalystSync(request: Request, response: Response) {
    response.json({ success: true, snapshot: this.catalyst.syncSnapshot(this.engine.getState(), this.actor(request)) });
  }

  authMe(request: Request, response: Response) {
    response.json(this.catalyst.getSession(request.headers.authorization) ?? { user: null, provider: "Catalyst Authentication", authenticated: false });
  }

  authLogin(request: Request, response: Response) {
    const body = request.body as { email?: string };
    response.json({ authenticated: true, ...this.catalyst.signIn(body.email) });
  }

  authLogout(request: Request, response: Response) {
    response.json(this.catalyst.signOut(request.headers.authorization));
  }

  firProjection(_request: Request, response: Response) {
    response.json(
      this.engine.getState().incidents.map((incident) => ({
        incidentId: incident.id,
        title: incident.title,
        firProjection: incident.firProjection ?? null,
        intelligence: incident.intelligence ?? null
      }))
    );
  }

  features(_request: Request, response: Response) {
    response.json(this.engine.getFeatureStore());
  }

  predictions(_request: Request, response: Response) {
    response.json(this.engine.getPredictions());
  }

  anomalies(_request: Request, response: Response) {
    response.json(this.engine.getAnomalies());
  }

  graphInsights(_request: Request, response: Response) {
    response.json(this.engine.getGraphInsights());
  }

  search(request: Request, response: Response) {
    response.json(this.engine.search(String(request.query.q ?? "")));
  }

  evaluate(_request: Request, response: Response) {
    response.json(this.engine.evaluateModels());
  }

  pipeline(_request: Request, response: Response) {
    response.json(this.engine.getPipelineEvents());
  }
}
