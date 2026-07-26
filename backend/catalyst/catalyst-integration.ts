import crypto from "node:crypto";
import type { AiTwinState } from "../ai/types";

type CatalystServiceState = "active" | "ready" | "prototype";

export interface CatalystServiceHealth {
  service: string;
  capability: string;
  state: CatalystServiceState;
  creditStrategy: string;
  endpoint?: string;
}

export interface CatalystUserSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "SCRB_ADMIN" | "DISTRICT_ANALYST" | "INVESTIGATION_OFFICER";
    jurisdiction: string;
  };
  provider: "Catalyst Authentication";
  expiresAt: string;
}

export interface CatalystAuditEvent {
  id: string;
  type: string;
  actor: string;
  message: string;
  createdAt: string;
  delivery: "Catalyst Signals ready" | "In-memory event stream";
}

export class CatalystIntegration {
  private readonly sessions = new Map<string, CatalystUserSession>();
  private readonly auditEvents: CatalystAuditEvent[] = [];

  getServices(): CatalystServiceHealth[] {
    const has = (key: string) => Boolean(process.env[key]);
    return [
      {
        service: "AppSail",
        capability: "Managed full-stack React + Node.js runtime",
        state: "active",
        creditStrategy: "Already deployed; keep one small AppSail service active for the demo."
      },
      {
        service: "Authentication",
        capability: "Police role-based login session",
        state: has("CATALYST_AUTH_ENABLED") ? "active" : "ready",
        creditStrategy: "Use Catalyst Authentication before adding external identity providers."
      },
      {
        service: "Data Store",
        capability: "CaseMaster, FIR, alerts, recommendations and feature rows",
        state: has("CATALYST_DATASTORE_TABLE") ? "active" : "ready",
        creditStrategy: "Persist only structured investigation records; keep analytics aggregates compact."
      },
      {
        service: "NoSQL",
        capability: "Knowledge graph adjacency and AI inference metadata",
        state: has("CATALYST_NOSQL_COLLECTION") ? "active" : "ready",
        creditStrategy: "Store graph snapshots instead of every visualization frame."
      },
      {
        service: "Stratus",
        capability: "FIR documents, charge sheets, evidence files and generated reports",
        state: has("CATALYST_STRATUS_BUCKET") ? "active" : "ready",
        creditStrategy: "Upload only source documents and final reports; avoid storing temporary screenshots."
      },
      {
        service: "QuickML / Zia",
        capability: "Production NLP, OCR, RAG and tabular risk models",
        state: has("CATALYST_QUICKML_MODEL") ? "active" : "prototype",
        creditStrategy: "Use current local schema-aware AI for the demo; turn on QuickML/Zia only for final trained models."
      },
      {
        service: "API Gateway",
        capability: "Secure routing, throttling and authenticated API exposure",
        state: has("CATALYST_API_GATEWAY") ? "active" : "ready",
        creditStrategy: "Protect only public APIs; internal demo routes stay behind AppSail."
      },
      {
        service: "Signals",
        capability: "Event-driven hotspot, anomaly and recommendation notifications",
        state: has("CATALYST_SIGNALS_ENABLED") ? "active" : "ready",
        creditStrategy: "Emit high-value investigation events only, not every UI click."
      }
    ];
  }

  signIn(email = "dcp.admin@ksp.gov.in"): CatalystUserSession {
    const token = crypto.randomUUID();
    const session: CatalystUserSession = {
      token,
      user: {
        id: "ksp-user-60073178125",
        name: "DCP Admin",
        email,
        role: "SCRB_ADMIN",
        jurisdiction: "Bengaluru City"
      },
      provider: "Catalyst Authentication",
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    };
    this.sessions.set(token, session);
    this.recordEvent("auth.login", session.user.name, "Catalyst Authentication session issued.");
    return session;
  }

  getSession(token?: string): CatalystUserSession | null {
    if (!token) return null;
    return this.sessions.get(token.replace(/^Bearer\s+/i, "")) ?? null;
  }

  signOut(token?: string) {
    const cleanToken = token?.replace(/^Bearer\s+/i, "");
    if (cleanToken) this.sessions.delete(cleanToken);
    this.recordEvent("auth.logout", "DCP Admin", "Catalyst Authentication session revoked.");
    return { success: true };
  }

  createEvidenceObject(filename: string, bytes: number, actor = "DCP Admin") {
    const objectKey = `fir-evidence/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${filename}`;
    this.recordEvent("stratus.object.created", actor, `Evidence object prepared for Catalyst Stratus: ${objectKey}`);
    return {
      bucket: process.env.CATALYST_STRATUS_BUCKET ?? "crimeverse-evidence-demo",
      objectKey,
      bytes,
      provider: "Catalyst Stratus",
      mode: process.env.CATALYST_STRATUS_BUCKET ? "active" : "ready"
    };
  }

  syncSnapshot(state: AiTwinState, actor = "DCP Admin") {
    const snapshot = {
      cases: state.incidents.length,
      districts: state.districts.length,
      graphNodes: state.graph.nodes.length,
      graphEdges: state.graph.edges.length,
      recommendations: state.recommendations.length,
      alerts: state.alerts.length,
      syncedAt: new Date().toISOString(),
      targets: ["Catalyst Data Store", "Catalyst NoSQL"]
    };
    this.recordEvent("datastore.snapshot.sync", actor, `Prepared ${snapshot.cases} cases and ${snapshot.graphNodes} graph nodes for Catalyst persistence.`);
    return snapshot;
  }

  recordEvent(type: string, actor: string, message: string) {
    const event: CatalystAuditEvent = {
      id: crypto.randomUUID(),
      type,
      actor,
      message,
      createdAt: new Date().toISOString(),
      delivery: process.env.CATALYST_SIGNALS_ENABLED ? "Catalyst Signals ready" : "In-memory event stream"
    };
    this.auditEvents.unshift(event);
    this.auditEvents.splice(30);
    return event;
  }

  getEvents() {
    return this.auditEvents;
  }
}
