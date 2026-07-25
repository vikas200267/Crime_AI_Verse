import type { Request, Response } from "express";
import { CrimeverseAiEngine } from "../../ai/crimeverse-ai-engine";

export class IntelligenceController {
  constructor(private readonly engine: CrimeverseAiEngine) {}

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
    response.json({ success: true, ...this.engine.reset() });
  }

  analyzeEvidence(request: Request, response: Response) {
    const body = request.body as { text?: string; filename?: string };
    response.json(this.engine.analyzeEvidence(body.text ?? "", body.filename));
  }

  runScenario(request: Request, response: Response) {
    response.json(this.engine.runSimulation(request.body));
  }

  deployRecommendation(request: Request, response: Response) {
    response.json(this.engine.updateRecommendation(request.params.id, "Deployed"));
  }

  dismissRecommendation(request: Request, response: Response) {
    response.json(this.engine.updateRecommendation(request.params.id, "Dismissed"));
  }

  readAlert(request: Request, response: Response) {
    response.json(this.engine.markAlertRead(request.params.id));
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
