import { Router } from "express";
import { CrimeverseAiEngine } from "../../ai/crimeverse-ai-engine";
import { CatalystIntegration } from "../../catalyst/catalyst-integration";
import { IntelligenceController } from "../controllers/intelligence.controller";

export function createIntelligenceRouter(engine: CrimeverseAiEngine, catalyst: CatalystIntegration) {
  const controller = new IntelligenceController(engine, catalyst);
  const router = Router();

  router.get("/metrics", controller.metrics.bind(controller));
  router.get("/incidents", controller.incidents.bind(controller));
  router.get("/graph", controller.graph.bind(controller));
  router.get("/recommendations", controller.recommendations.bind(controller));
  router.get("/alerts", controller.alerts.bind(controller));
  router.post("/reset", controller.reset.bind(controller));
  router.post("/evidence/analyze", controller.analyzeEvidence.bind(controller));
  router.post("/scenarios/run", controller.runScenario.bind(controller));
  router.post("/recommendations/:id/deploy", controller.deployRecommendation.bind(controller));
  router.post("/recommendations/:id/dismiss", controller.dismissRecommendation.bind(controller));
  router.post("/alerts/:id/read", controller.readAlert.bind(controller));

  router.get("/ai/status", controller.aiStatus.bind(controller));
  router.get("/ai/fir-projection", controller.firProjection.bind(controller));
  router.get("/ai/features", controller.features.bind(controller));
  router.get("/ai/predictions", controller.predictions.bind(controller));
  router.get("/ai/anomalies", controller.anomalies.bind(controller));
  router.get("/ai/graph-insights", controller.graphInsights.bind(controller));
  router.get("/ai/evaluate", controller.evaluate.bind(controller));
  router.get("/ai/pipeline", controller.pipeline.bind(controller));

  router.get("/search", controller.search.bind(controller));
  router.get("/predictions/hotspots", controller.predictions.bind(controller));
  router.get("/analytics/features", controller.features.bind(controller));
  router.get("/analytics/anomalies", controller.anomalies.bind(controller));
  router.get("/graph/insights", controller.graphInsights.bind(controller));

  router.get("/catalyst/services", controller.catalystServices.bind(controller));
  router.get("/catalyst/events", controller.catalystEvents.bind(controller));
  router.post("/catalyst/sync", controller.catalystSync.bind(controller));
  router.get("/auth/me", controller.authMe.bind(controller));
  router.post("/auth/login", controller.authLogin.bind(controller));
  router.post("/auth/logout", controller.authLogout.bind(controller));

  return router;
}
