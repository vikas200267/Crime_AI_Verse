import express from "express";
import path from "node:path";
import { CrimeverseAiEngine } from "./backend/ai/crimeverse-ai-engine";
import { createBlueprintRouter } from "./backend/api/routes/blueprint.routes";
import { createIntelligenceRouter } from "./backend/api/routes/intelligence.routes";

const app = express();
const port = Number(process.env.PORT ?? 8180);
const intelligenceEngine = new CrimeverseAiEngine();
const projectRoot = process.cwd();
const isProductionServer = process.env.NODE_ENV === "production" || (process.argv[1] ?? "").endsWith("server.cjs");

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "crimeverse-ai-backend-blueprint",
    schemaSource: "Police_FIR_ER_Diagram.pdf"
  });
});

app.use("/api/blueprint", createBlueprintRouter());
app.use("/api", createIntelligenceRouter(intelligenceEngine));

app.get("/api", (_request, response) => {
  response.json({
    name: "CrimeVerse AI Backend",
    description: "Schema-faithful backend blueprint built around the Police FIR ER diagram.",
    links: {
      health: "/api/health",
      summary: "/api/blueprint",
      full: "/api/blueprint/full",
      schema: "/api/blueprint/schema",
      architecture: "/api/blueprint/architecture",
      apiDesign: "/api/blueprint/api",
      aiExtensionTables: "/api/blueprint/ai-extension-tables",
      mvp: "/api/blueprint/mvp",
      aiStatus: "/api/ai/status",
      incidents: "/api/incidents",
      metrics: "/api/metrics",
      graph: "/api/graph",
      recommendations: "/api/recommendations",
      alerts: "/api/alerts"
    }
  });
});

async function attachFrontend() {
  if (isProductionServer) {
    const distPath = path.join(projectRoot, "dist");
    app.use(express.static(distPath));
    app.get("*", (_request, response) => response.sendFile(path.join(distPath, "index.html")));
    return;
  }

  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

attachFrontend()
  .then(() => {
    app.listen(port, () => {
      console.log(`CrimeVerse AI app + intelligence API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start CrimeVerse AI server", error);
    process.exit(1);
  });
