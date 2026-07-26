import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Cloud,
  ClipboardList,
  Database,
  FilePlus2,
  FileText,
  Filter,
  Gauge,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Network,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type {
  ActionRecommendation,
  AlertNotification,
  DistrictMetrics,
  EntityEdge,
  EntityNode,
  Incident,
  SimulationScenario
} from "./types";

type ModuleKey = "dashboard" | "cases" | "analytics" | "graph" | "alerts" | "reports" | "settings" | "evidence" | "simulation";
type ScenarioType = SimulationScenario["interventionType"];
type ModuleCard = [ModuleKey, LucideIcon, string, string];
type SummaryCard = [LucideIcon, string, number, string, "red" | "orange" | "blue" | "green"];
type FooterMetric = [LucideIcon, string, string];

type AiStatus = {
  service: string;
  mode: string;
  officialSchemaRoot: string;
  implementedCapabilities: string[];
  counts: Record<string, number>;
};

type Predictions = {
  hotspotPredictions: Array<{ district: string; area: string; riskScore: number; confidence: number; drivers: string[] }>;
  districtRisk: Array<{ district: string; score: number; riskLevel: string; confidence: number; explanation: string[] }>;
  repeatOffenderSignals: Array<{ person: string; score: number; confidence: number }>;
};

type AnomalySet = {
  count: number;
  anomalies: Array<{ anomalyId: string; incidentId: string; district: string; severity: string; score: number; message: string }>;
};

type GraphInsights = {
  repeatOffenderCandidates: Array<{ name: string; caseCount: number; cases: string[]; districts: string[]; sharedPhones: string[] }>;
  centrality: Array<{ node: EntityNode; degree: number }>;
  sharedEntityLinks: Array<{ entityType: string; entity: string; cases: string[] }>;
};

type SearchItem = {
  type: string;
  id: string;
  title: string;
  district?: string;
  entityType?: string;
  degree?: number;
};

type SearchResponse = {
  query: string;
  total: number;
  incidents?: SearchItem[];
  graphEntities?: SearchItem[];
  results?: SearchItem[];
};

type CatalystService = {
  service: string;
  capability: string;
  state: "active" | "ready" | "prototype";
  creditStrategy: string;
};

type CatalystStatus = {
  project: { name: string; pid: string; deployment: string; url: string };
  creditGuardrail: string;
  services: CatalystService[];
};

type CatalystEvent = {
  id: string;
  type: string;
  actor: string;
  message: string;
  createdAt: string;
  delivery: string;
};

type CatalystSession = {
  authenticated?: boolean;
  token?: string;
  user: null | {
    id: string;
    name: string;
    email: string;
    role: string;
    jurisdiction: string;
  };
  provider: string;
  expiresAt?: string;
};

type EvidenceResponse = {
  success: boolean;
  error?: string;
  incident: Incident;
  extraction: {
    confidence: number;
    modelSignals: string[];
  };
  catalyst?: {
    evidenceObject: {
      bucket: string;
      objectKey: string;
      provider: string;
      mode: string;
    };
  };
};

const sampleFir = `District: Bengaluru Urban | Police Station: Majestic PS
Date of Incident: 2026-07-07 | Time: 22:30
An assault and robbery was reported near Majestic Market. Suspect Ramesh K and Suresh P attacked victim Mahesh B with a sharp weapon and escaped on motorcycle KA03MKS123. Mobile 9876543210 was found linked to another case. Witness statement is pending.`;

const timeLabels = ["07 May", "08 May", "09 May", "10 May", "11 May", "12 May", "13 May"];
const districtMapPositions: Record<string, { x: number; y: number }> = {
  Kalaburagi: { x: 49, y: 19 },
  Belagavi: { x: 27, y: 32 },
  Dharwad: { x: 35, y: 40 },
  Mangaluru: { x: 26, y: 75 },
  Mysuru: { x: 52, y: 79 },
  "Bengaluru Urban": { x: 67, y: 73 }
};

function classNames(...items: Array<string | false | undefined>) {
  return items.filter(Boolean).join(" ");
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} failed with ${response.status}`);
  return response.json() as Promise<T>;
}

function SectionCard({ title, children, className = "", action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={classNames("rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm ring-1 ring-white/70", className)}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {title && <h2 className="min-w-0 text-xs font-extrabold uppercase text-[#063f9f]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Sidebar({ active, setActive }: { active: ModuleKey; setActive: (module: ModuleKey) => void }) {
  const items: Array<[ModuleKey, typeof LayoutDashboard, string]> = [
    ["dashboard", LayoutDashboard, "Dashboard"],
    ["cases", BriefcaseBusiness, "Cases"],
    ["analytics", BarChart3, "Analytics"],
    ["graph", Network, "Graph"],
    ["alerts", Bell, "Alerts"],
    ["reports", ClipboardList, "Reports"],
    ["settings", Settings, "Settings"]
  ];

  return (
    <aside className="sticky top-3 hidden h-[calc(100vh-24px)] w-[72px] shrink-0 rounded-xl bg-[#06295c] p-2 text-white shadow-[0_16px_36px_rgba(6,41,92,0.28)] md:block">
      <nav className="flex h-full flex-col items-center gap-2">
        {items.map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={classNames(
              "flex h-[60px] w-full flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold transition",
              active === key ? "bg-[#1877f2] shadow-lg shadow-blue-900/20" : "hover:bg-white/10"
            )}
            title={label}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function KarnatakaMap({
  districts,
  selectedDistrict,
  onSelectDistrict
}: {
  districts: DistrictMetrics[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const visibleDistricts = districts.filter((district) => selectedDistrict === "All Districts" || district.name === selectedDistrict);

  return (
    <div className="relative min-h-[300px] overflow-hidden rounded-lg bg-[radial-gradient(circle_at_20%_20%,#f8fbff_0,#ffffff_42%,#eef5ff_100%)] 2xl:min-h-[330px]">
      <div className="absolute left-3 top-10 z-10 flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <button onClick={() => setZoom((value) => Math.min(1.25, value + 0.08))} className="h-8 w-8 text-base font-semibold text-slate-700 hover:bg-blue-50" title="Zoom in">+</button>
        <button onClick={() => setZoom((value) => Math.max(0.86, value - 0.08))} className="h-8 w-8 border-t border-slate-200 text-base font-semibold text-slate-700 hover:bg-blue-50" title="Zoom out">-</button>
      </div>

      <svg viewBox="0 0 560 500" className="absolute inset-0 h-full w-full transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
        <defs>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <path
          d="M248 34 L305 53 L334 82 L325 126 L354 160 L340 205 L376 247 L360 292 L398 332 L376 381 L330 412 L292 468 L238 448 L206 398 L152 382 L134 334 L88 304 L112 250 L92 204 L124 162 L120 112 L166 88 L194 48 Z"
          fill="#ffffff"
          stroke="#9ca3af"
          strokeWidth="2"
        />
        {[
          "M194 48 L210 104 L166 142 L120 112",
          "M210 104 L268 104 L305 53",
          "M166 142 L226 168 L268 104",
          "M226 168 L292 176 L325 126",
          "M124 162 L182 214 L226 168",
          "M182 214 L254 236 L292 176",
          "M254 236 L326 244 L354 160",
          "M112 250 L178 286 L182 214",
          "M178 286 L250 310 L254 236",
          "M250 310 L326 300 L326 244",
          "M134 334 L204 356 L178 286",
          "M204 356 L278 366 L250 310",
          "M278 366 L360 292 L326 300",
          "M206 398 L278 366 L292 468",
          "M278 366 L330 412 L376 381"
        ].map((d) => (
          <path key={d} d={d} fill="none" stroke="#d1d5db" strokeWidth="1.3" />
        ))}

        {[
          ["Bidar", 296, 83],
          ["Kalaburagi", 274, 116],
          ["Vijayapura", 188, 156],
          ["Raichur", 325, 180],
          ["Belagavi", 141, 204],
          ["Dharwad", 176, 252],
          ["Davanagere", 245, 284],
          ["Shivamogga", 198, 323],
          ["Tumakuru", 302, 354],
          ["Bengaluru Rural", 356, 392],
          ["Bengaluru Urban", 352, 420],
          ["Mysuru", 256, 418]
        ].map(([label, x, y]) => (
          <text key={String(label)} x={Number(x)} y={Number(y)} className="fill-slate-700 text-[12px] font-bold">
            {label}
          </text>
        ))}

        {visibleDistricts.map((district) => {
          const pos = districtMapPositions[district.name] ?? { x: 48, y: 48 };
          const color = district.riskLevel === "Critical" ? "#ef4444" : district.riskLevel === "High" ? "#f97316" : district.riskLevel === "Medium" ? "#fbbf24" : "#22c55e";
          const radius = district.crimeIndex >= 80 ? 28 : district.crimeIndex >= 60 ? 22 : 17;
          return (
            <g key={district.name} onClick={() => onSelectDistrict(district.name)} className="cursor-pointer">
              <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r={radius} fill={color} opacity="0.16" filter="url(#softGlow)" />
              <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r={radius / 2} fill={color} opacity="0.25" />
              <circle cx={`${pos.x}%`} cy={`${pos.y}%`} r={selectedDistrict === district.name ? 7 : 4} fill={color} stroke="#fff" strokeWidth="2" />
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 left-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-[10px] font-extrabold uppercase text-[#06295c]">Hotspot Intensity</div>
        <div className="h-2 w-28 rounded-full bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500" />
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-600">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "red" | "orange" | "slate" }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200"
  };
  return <span className={classNames("rounded-full border px-2 py-1 text-[10px] font-black uppercase", styles[tone])}>{children}</span>;
}

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard");
  const [districts, setDistricts] = useState<DistrictMetrics[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [graph, setGraph] = useState<{ nodes: EntityNode[]; edges: EntityEdge[] }>({ nodes: [], edges: [] });
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalySet | null>(null);
  const [graphInsights, setGraphInsights] = useState<GraphInsights | null>(null);
  const [catalystStatus, setCatalystStatus] = useState<CatalystStatus | null>(null);
  const [catalystEvents, setCatalystEvents] = useState<CatalystEvent[]>([]);
  const [session, setSession] = useState<CatalystSession | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedStation, setSelectedStation] = useState("All Police Stations");
  const [category, setCategory] = useState("All");
  const [timeRange, setTimeRange] = useState("30D");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("");
  const [firText, setFirText] = useState(sampleFir);
  const [analysisResult, setAnalysisResult] = useState<{ incident: Incident; confidence: number; modelSignals: string[] } | null>(null);
  const [scenario, setScenario] = useState<SimulationScenario | null>(null);
  const [scenarioType, setScenarioType] = useState<ScenarioType>("Patrol Reallocation");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshData = async () => {
    setError(null);
    const [metricsData, incidentData, graphData, recData, alertData, statusData, predictionData, anomalyData, insightData, catalystData, eventData] = await Promise.all([
      getJson<DistrictMetrics[]>("/api/metrics"),
      getJson<Incident[]>("/api/incidents"),
      getJson<{ nodes: EntityNode[]; edges: EntityEdge[] }>("/api/graph"),
      getJson<ActionRecommendation[]>("/api/recommendations"),
      getJson<AlertNotification[]>("/api/alerts"),
      getJson<AiStatus>("/api/ai/status"),
      getJson<Predictions>("/api/ai/predictions"),
      getJson<AnomalySet>("/api/ai/anomalies"),
      getJson<GraphInsights>("/api/ai/graph-insights"),
      getJson<CatalystStatus>("/api/catalyst/services"),
      getJson<{ events: CatalystEvent[] }>("/api/catalyst/events")
    ]);
    setDistricts(metricsData);
    setIncidents(incidentData);
    setGraph(graphData);
    setRecommendations(recData);
    setAlerts(alertData);
    setAiStatus(statusData);
    setPredictions(predictionData);
    setAnomalies(anomalyData);
    setGraphInsights(insightData);
    setCatalystStatus(catalystData);
    setCatalystEvents(eventData.events);
    if (!selectedIncidentId && incidentData[0]) setSelectedIncidentId(incidentData[0].id);
  };

  useEffect(() => {
    refreshData()
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load backend intelligence APIs."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem("crimeverseCatalystToken");
    if (!token) return;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then((data: CatalystSession) => {
        if (data.user) setSession({ ...data, token });
      })
      .catch(() => window.localStorage.removeItem("crimeverseCatalystToken"));
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      getJson<SearchResponse>(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then((data) => setSearchResults(data.results ?? [...(data.incidents ?? []), ...(data.graphEntities ?? [])]))
        .catch(() => setSearchResults([]));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    if (!actionMessage) return;
    const handle = window.setTimeout(() => setActionMessage(null), 4200);
    return () => window.clearTimeout(handle);
  }, [actionMessage]);

  const districtNames = useMemo(() => ["All Districts", ...districts.map((item) => item.name)], [districts]);
  const stationNames = useMemo(
    () => [
      "All Police Stations",
      ...new Set(
        incidents
          .filter((incident) => selectedDistrict === "All Districts" || incident.location.district === selectedDistrict)
          .map((incident) => `${incident.location.area} PS`)
      )
    ],
    [incidents, selectedDistrict]
  );
  const selectedIncident = incidents.find((incident) => incident.id === selectedIncidentId) ?? analysisResult?.incident ?? incidents[0];
  const activeDistrict = selectedDistrict === "All Districts" ? districts[0] : districts.find((district) => district.name === selectedDistrict) ?? districts[0];

  const filteredIncidents = incidents.filter((incident) => {
    const districtMatch = selectedDistrict === "All Districts" || incident.location.district === selectedDistrict;
    const stationMatch = selectedStation === "All Police Stations" || `${incident.location.area} PS` === selectedStation;
    const categoryMatch = category === "All" || incident.category === category;
    const query = searchQuery.trim().toLowerCase();
    const queryMatch =
      !query ||
      [incident.id, incident.title, incident.location.district, incident.location.area, incident.category, ...incident.extractedEntities.suspects, ...incident.extractedEntities.victims]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return districtMatch && stationMatch && categoryMatch && queryMatch;
  });

  const trendData = timeLabels.map((day, index) => ({
    day,
    theft: 40 + incidents.filter((item) => item.category === "Theft").length * 18 + index * 4 + (index % 2 ? 12 : 0),
    assault: 32 + incidents.filter((item) => item.category === "Assault").length * 18 + index * 3,
    cyber: 18 + incidents.filter((item) => item.category === "Fraud").length * 14 + (index % 3) * 4,
    robbery: 20 + filteredIncidents.length * 7 + index * 2,
    others: 12 + incidents.filter((item) => !["Theft", "Assault", "Fraud"].includes(item.category)).length * 8 + index
  }));

  const zoneData = districts.map((district) => ({
    zone: district.name.replace("Bengaluru ", "BLR "),
    current: district.crimeIndex + district.crimeCount * 40,
    previous: Math.max(20, district.crimeIndex + district.crimeCount * 25 - 24)
  }));

  const evidenceItems = selectedIncident
    ? [
        ["FIR Details", true],
        ["Victim Details", selectedIncident.extractedEntities.victims.length > 0],
        ["Accused Details", selectedIncident.extractedEntities.suspects.length > 0],
        ["Evidence Info", selectedIncident.extractedEntities.weapons.length + selectedIncident.extractedEntities.vehicles.length > 0],
        ["Witness Statements", selectedIncident.validationAlerts.length === 0]
      ]
    : [];

  const authHeaders = (): Record<string, string> => {
    const token = session?.token ?? window.localStorage.getItem("crimeverseCatalystToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const runEvidenceAnalysis = async () => {
    setBusyAction("analyze");
    try {
      const response = await fetch("/api/evidence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ text: firText, filename: "manual-fir-entry.txt" })
      });
      if (!response.ok) throw new Error("Evidence analysis failed");
      const data = (await response.json()) as EvidenceResponse;
      if (!data.success) throw new Error(data.error ?? "Evidence analysis failed");
      setAnalysisResult({
        incident: data.incident,
        confidence: data.extraction.confidence,
        modelSignals: data.extraction.modelSignals
      });
      setSelectedIncidentId(data.incident.id);
      setActiveModule("cases");
      setActionMessage(`EvidenceFlow AI created ${data.incident.id}; ${data.catalyst?.evidenceObject.provider ?? "Catalyst Stratus"} evidence metadata is ready.`);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evidence analysis failed");
    } finally {
      setBusyAction(null);
    }
  };

  const runScenario = async () => {
    setBusyAction("scenario");
    try {
      const response = await fetch("/api/scenarios/run", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          district: activeDistrict?.name ?? "Bengaluru Urban",
          interventionType: scenarioType,
          description: `Command center simulation from ${timeRange} risk window.`
        })
      });
      if (!response.ok) throw new Error("Scenario simulation failed");
      const data = (await response.json()) as { success: boolean; scenario: SimulationScenario };
      setScenario(data.scenario);
      setActionMessage(`${data.scenario.interventionType} simulation completed for ${data.scenario.targetDistrict}.`);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scenario simulation failed");
    } finally {
      setBusyAction(null);
    }
  };

  const updateRecommendation = async (id: string, action: "deploy" | "dismiss") => {
    setBusyAction(`${action}-${id}`);
    try {
      await fetch(`/api/recommendations/${id}/${action}`, { method: "POST", headers: authHeaders() });
      setActionMessage(`Recommendation ${action === "deploy" ? "deployed" : "dismissed"} and backend state refreshed.`);
      await refreshData();
    } finally {
      setBusyAction(null);
    }
  };

  const markAlertRead = async (id: string) => {
    await fetch(`/api/alerts/${id}/read`, { method: "POST", headers: authHeaders() });
    setActionMessage("Alert marked as reviewed.");
    await refreshData();
  };

  const resetTwin = async () => {
    setBusyAction("reset");
    try {
      await fetch("/api/reset", { method: "POST" });
      setAnalysisResult(null);
      setScenario(null);
      setSelectedDistrict("All Districts");
      setSelectedStation("All Police Stations");
      setCategory("All");
      setSearchQuery("");
      setActionMessage("Digital twin demo state reset from backend.");
      await refreshData();
    } finally {
      setBusyAction(null);
    }
  };

  const refreshIntelligence = async () => {
    setBusyAction("refresh");
    try {
      await refreshData();
      setActionMessage("Live backend intelligence APIs refreshed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh intelligence APIs.");
    } finally {
      setBusyAction(null);
    }
  };

  const signInCatalyst = async () => {
    setBusyAction("auth");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dcp.admin@ksp.gov.in" })
      });
      if (!response.ok) throw new Error("Catalyst Authentication failed");
      const data = (await response.json()) as CatalystSession;
      if (data.token) window.localStorage.setItem("crimeverseCatalystToken", data.token);
      setSession(data);
      setActionMessage("Catalyst Authentication session active for DCP Admin.");
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Catalyst Authentication failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const signOutCatalyst = async () => {
    setBusyAction("auth");
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: authHeaders() });
      window.localStorage.removeItem("crimeverseCatalystToken");
      setSession(null);
      setActionMessage("Catalyst Authentication session closed.");
      await refreshData();
    } finally {
      setBusyAction(null);
    }
  };

  const syncCatalyst = async () => {
    setBusyAction("sync");
    try {
      const response = await fetch("/api/catalyst/sync", { method: "POST", headers: authHeaders() });
      if (!response.ok) throw new Error("Catalyst sync failed");
      const data = (await response.json()) as { snapshot: { cases: number; graphNodes: number } };
      setActionMessage(`Catalyst Data Store/NoSQL sync prepared ${data.snapshot.cases} cases and ${data.snapshot.graphNodes} graph nodes.`);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Catalyst sync failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const categories = ["All", "Theft", "Assault", "Fraud", "Homicide", "Vandalism", "Narcotics", "Other"];
  const primaryRecommendation = recommendations.find((item) => item.status === "Pending") ?? recommendations[0];
  const latestAnomaly = anomalies?.anomalies[0] ?? null;
  const moduleTitle: Record<ModuleKey, string> = {
    dashboard: "Karnataka Crime Hotspot Map",
    cases: "FIR Case Intelligence Workspace",
    analytics: "Predictive Analytics & Anomaly Center",
    graph: "Crime Knowledge Graph",
    alerts: "Live Alert Operations",
    reports: "SCRB Intelligence Reports",
    settings: "System Settings & Controls",
    evidence: "EvidenceFlow AI Workbench",
    simulation: "Intervention Simulation Engine"
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#edf4fb_44%,#f7fafc_100%)] text-[#07152f]">
      <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="grid gap-3 xl:grid-cols-[270px_1fr_340px] xl:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#06295c] text-[#06295c]">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-black tracking-normal text-[#07152f]">EVIDENCEFLOW AI</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#06295c]">Karnataka Police</div>
            </div>
          </div>
          <div className="text-left xl:text-center">
            <h1 className="text-xl font-black leading-tight tracking-normal text-[#07152f] md:text-2xl">
              EvidenceFlow AI - Crime Intelligence Command Center
            </h1>
            <p className="text-sm font-medium text-[#07152f] md:text-base">From Data to Decision. From Intelligence to Impact.</p>
          </div>
          <div className="flex items-center justify-between gap-4 xl:justify-end">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase text-[#07152f]">
                <span className={classNames("h-3 w-3 rounded-full", error ? "bg-red-500" : "bg-emerald-500")} />
                System Status
              </div>
              <div className={classNames("mt-1 text-xs font-semibold", error ? "text-red-600" : "text-emerald-600")}>
                {error ? "Backend Attention Needed" : catalystStatus?.project.deployment ?? aiStatus?.mode ?? "Connected"}
              </div>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <CircleUserRound className="h-8 w-8 text-[#07152f]" />
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold">{session?.user?.name ?? "DCP Admin"}</div>
                <div className="truncate text-xs text-slate-500">{session?.user ? `${session.user.role} / ${session.user.jurisdiction}` : "Catalyst auth ready"}</div>
              </div>
              <button
                onClick={session?.user ? signOutCatalyst : signInCatalyst}
                disabled={busyAction === "auth"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#06295c] hover:bg-blue-50 disabled:opacity-60"
                title={session?.user ? "Sign out" : "Sign in with Catalyst Authentication"}
              >
                {busyAction === "auth" ? <Loader2 className="h-4 w-4 animate-spin" /> : session?.user ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-3 py-3 lg:px-4">
        <div className="mb-3 grid gap-2 lg:grid-cols-[minmax(280px,1fr)_180px_200px_220px_110px]">
          <div className="relative flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 shadow-sm">
            <Search className="h-5 w-5 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
              placeholder="Search FIR No., district, police station, suspect..."
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-11 z-30 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                {searchResults.slice(0, 6).map((result) => (
                  <button
                    key={String(result.id)}
                    onClick={() => {
                      if (result.type === "case") {
                        setSelectedIncidentId(result.id);
                        setActiveModule("cases");
                      } else {
                        setActiveModule("graph");
                      }
                      setSearchQuery(result.title);
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-blue-50"
                  >
                    <b>{result.title}</b>
                    <span className="ml-2 text-slate-500">{result.district ?? result.entityType ?? ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold shadow-sm">
            <select
              value={selectedDistrict}
              onChange={(event) => {
                setSelectedDistrict(event.target.value);
                setSelectedStation("All Police Stations");
              }}
              className="w-full bg-transparent outline-none"
            >
              {districtNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>

          <label className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold shadow-sm">
            <select value={selectedStation} onChange={(event) => setSelectedStation(event.target.value)} className="w-full bg-transparent outline-none">
              {stationNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>

          <button onClick={() => setShowFilters((value) => !value)} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold shadow-sm hover:border-blue-300 hover:bg-blue-50">
            <CalendarDays className="h-4 w-4" />
            {timeRange} Intelligence Window
            <ChevronDown className="h-4 w-4" />
          </button>

          <button onClick={() => { setShowFilters((value) => !value); setActiveModule("analytics"); }} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm hover:border-blue-300 hover:bg-blue-50">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mb-3 grid gap-3 rounded-xl border border-blue-100 bg-white/95 p-3 shadow-sm lg:grid-cols-[1fr_auto]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-black uppercase text-[#063f9f]">Crime Category</span>
              {categories.map((item) => (
                <button key={item} onClick={() => setCategory(item)} className={classNames("rounded-full border px-3 py-1.5 text-xs font-black", category === item ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-blue-50")}>
                  {item}
                </button>
              ))}
              <span className="ml-2 mr-1 text-xs font-black uppercase text-[#063f9f]">Window</span>
              {["7D", "30D", "90D", "YTD"].map((item) => (
                <button key={item} onClick={() => setTimeRange(item)} className={classNames("rounded-full border px-3 py-1.5 text-xs font-black", timeRange === item ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-blue-50")}>
                  {item}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setSelectedDistrict("All Districts");
                setSelectedStation("All Police Stations");
                setCategory("All");
                setSearchQuery("");
                setActionMessage("Filters cleared and live intelligence view refreshed.");
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-[#06295c] hover:bg-slate-100"
            >
              Clear Filters
            </button>
          </div>
        )}

        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        {actionMessage && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{actionMessage}</div>}

        <div className="mb-3 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm md:hidden">
          {([
            ["dashboard", LayoutDashboard, "Dashboard"],
            ["cases", BriefcaseBusiness, "Cases"],
            ["analytics", BarChart3, "Analytics"],
            ["graph", Network, "Graph"],
            ["alerts", Bell, "Alerts"],
            ["reports", ClipboardList, "Reports"],
            ["settings", Settings, "Settings"]
          ] satisfies Array<[ModuleKey, LucideIcon, string]>).map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setActiveModule(key)}
              className={classNames("flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black", activeModule === key ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-[#06295c]")}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Sidebar active={activeModule} setActive={setActiveModule} />

          <div className="grid min-w-0 flex-1 gap-3 xl:grid-cols-[220px_minmax(0,1fr)_260px] 2xl:grid-cols-[280px_minmax(520px,1fr)_360px]">
            <div className="space-y-3">
              <SectionCard title="Command Center Modules">
                <div className="grid gap-2">
                  {([
                    ["dashboard", Gauge, "Statewide Digital Twin", "Real-time spatial view of crime incidents and police assets."],
                    ["evidence", Network, "EvidenceFlow AI", "Analyze FIRs, charge sheets and case documents."],
                    ["graph", UsersRound, "Crime Knowledge Graph", "Discover entities, patterns and recurring networks."],
                    ["simulation", SlidersHorizontal, "Simulation Engine", "What-if analysis for deployment and patrol planning."]
                  ] satisfies ModuleCard[]).map(([key, Icon, title, body]) => (
                    <button
                      key={String(key)}
                      onClick={() => setActiveModule(key as ModuleKey)}
                      className={classNames(
                        "flex min-h-[70px] items-center gap-2 rounded-lg border p-2.5 text-left",
                        activeModule === key ? "border-blue-300 bg-blue-50/80" : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <Icon className="h-7 w-7 shrink-0 text-[#063f9f] 2xl:h-9 2xl:w-9" />
                      <span>
                        <span className="flex items-center justify-between gap-2 text-xs font-black uppercase text-[#06295c]">
                          <span>{title}</span>
                          {key === "evidence" && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] text-blue-700">{incidents.length}</span>}
                          {key === "graph" && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] text-emerald-700">{graph.nodes.length}</span>}
                        </span>
                        <span className="mt-1 block text-[10px] font-medium leading-4 text-slate-700 2xl:text-[11px]">{body}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Alert Summary" action={<button onClick={() => setActiveModule("alerts")} className="text-xs font-semibold text-[#06295c]">View All</button>}>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    [Siren, "High Risk Alerts", alerts.filter((item) => item.severity === "Critical").length, "Critical", "red"],
                    [AlertTriangle, "Anomalies", anomalies?.count ?? 0, "AI detected", "orange"],
                    [FilePlus2, "Cases", incidents.length, "Analyzed", "blue"],
                    [ShieldCheck, "Active", recommendations.filter((item) => item.status === "Pending").length, "Pending actions", "green"]
                  ] satisfies SummaryCard[]).map(([Icon, label, value, meta, color]) => (
                    <button
                      key={String(label)}
                      onClick={() => setActiveModule(label === "Anomalies" ? "analytics" : label === "Cases" ? "cases" : "alerts")}
                      className={classNames(
                        "rounded-lg border p-3 text-left",
                        color === "red" && "border-red-200 bg-red-50",
                        color === "orange" && "border-orange-200 bg-orange-50",
                        color === "green" && "border-emerald-200 bg-emerald-50",
                        color === "blue" && "border-blue-200 bg-blue-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={classNames("h-5 w-5", color === "red" && "text-red-500", color === "orange" && "text-orange-500", color === "green" && "text-emerald-600", color === "blue" && "text-blue-600")} />
                        <div className="text-[9px] font-black uppercase text-[#063f9f]">{label}</div>
                      </div>
                      <div className="mt-1 text-xl font-black">{String(value)}</div>
                      <div className="text-[11px] font-semibold text-slate-600">{String(meta)}</div>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Live Alerts Feed">
                <div className="max-h-[220px] space-y-2 overflow-auto pr-1">
                  {alerts.map((alert) => (
                    <button key={alert.id} onClick={() => markAlertRead(alert.id)} className="flex w-full items-start gap-2 rounded-lg border border-slate-100 p-2 text-left hover:bg-slate-50">
                      <AlertTriangle className={classNames("mt-0.5 h-4 w-4 shrink-0", alert.severity === "Critical" ? "text-red-500" : "text-orange-500")} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold">{alert.message}</span>
                        <span className="text-[10px] font-semibold text-slate-500">{alert.district}</span>
                      </span>
                      {!alert.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                    </button>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div className="min-w-0 space-y-3 xl:sticky xl:top-3 xl:self-start">
              <SectionCard
                title={moduleTitle[activeModule]}
                action={loading ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <StatusPill tone="green">Live API</StatusPill>}
              >
                {activeModule === "evidence" ? (
                  <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
                    <textarea value={firText} onChange={(event) => setFirText(event.target.value)} className="min-h-[330px] resize-none rounded-lg border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-blue-400" />
                    <div className="space-y-3">
                      <button onClick={runEvidenceAnalysis} disabled={busyAction === "analyze"} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
                        {busyAction === "analyze" && <Loader2 className="h-4 w-4 animate-spin" />}
                        Analyze FIR Evidence
                      </button>
                      {analysisResult && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <div className="text-xs font-black uppercase text-[#063f9f]">Latest AI Extraction</div>
                          <div className="mt-2 text-sm font-black">{analysisResult.incident.title}</div>
                          <div className="mt-1 text-xs font-semibold">Category: {analysisResult.incident.category}</div>
                          <div className="text-xs font-semibold">Severity: {analysisResult.incident.severity}</div>
                          <div className="text-xs font-semibold">Confidence: {Math.round(analysisResult.confidence * 100)}%</div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {analysisResult.modelSignals.map((signal) => <StatusPill key={signal} tone="blue">{signal}</StatusPill>)}
                          </div>
                        </div>
                      )}
                      <button onClick={resetTwin} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#06295c]">Reset Digital Twin</button>
                    </div>
                  </div>
                ) : activeModule === "graph" ? (
                  <div className="grid gap-3 xl:grid-cols-[1fr_280px]">
                    <div className="relative min-h-[330px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      <svg viewBox="0 0 720 360" className="h-full min-h-[330px] w-full">
                        {graph.edges.slice(0, 38).map((edge, index) => {
                          const sourceIndex = graph.nodes.findIndex((node) => node.id === edge.source);
                          const targetIndex = graph.nodes.findIndex((node) => node.id === edge.target);
                          const sx = 80 + (sourceIndex % 8) * 80;
                          const sy = 70 + Math.floor(sourceIndex / 8) * 80;
                          const tx = 80 + (targetIndex % 8) * 80;
                          const ty = 70 + Math.floor(targetIndex / 8) * 80;
                          return <line key={edge.id} x1={sx} y1={sy} x2={tx} y2={ty} stroke="#cbd5e1" strokeWidth="1.5" opacity={0.8} />;
                        })}
                        {graph.nodes.slice(0, 32).map((node, index) => {
                          const x = 80 + (index % 8) * 80;
                          const y = 70 + Math.floor(index / 8) * 80;
                          const color = node.type === "Person" ? "#2563eb" : node.type === "Incident" ? "#ef4444" : node.type === "Location" ? "#f97316" : "#059669";
                          return (
                            <g key={node.id}>
                              <circle cx={x} cy={y} r="18" fill={color} opacity="0.92" />
                              <text x={x} y={y + 34} textAnchor="middle" className="fill-slate-700 text-[9px] font-bold">
                                {node.label.slice(0, 12)}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                    <div className="space-y-3">
                      <StatusPill tone="blue">{graph.nodes.length} nodes</StatusPill>
                      <StatusPill tone="green">{graph.edges.length} links</StatusPill>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <div className="mb-2 text-xs font-black uppercase text-[#063f9f]">Top Central Entities</div>
                        {(graphInsights?.centrality ?? []).slice(0, 6).map((item) => (
                          <div key={item.node.id} className="flex justify-between border-t border-slate-100 py-2 text-xs">
                            <b>{item.node.label}</b>
                            <span>{item.degree} links</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : activeModule === "simulation" ? (
                  <div className="grid gap-3 2xl:grid-cols-[1fr_330px]">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-xs font-black uppercase text-[#063f9f]">
                          Target District
                          <select value={activeDistrict?.name ?? ""} onChange={(event) => setSelectedDistrict(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800">
                            {districts.map((district) => <option key={district.name}>{district.name}</option>)}
                          </select>
                        </label>
                        <label className="text-xs font-black uppercase text-[#063f9f]">
                          Intervention
                          <select value={scenarioType} onChange={(event) => setScenarioType(event.target.value as ScenarioType)} className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800">
                            {["Patrol Reallocation", "Temporary Checkpoints", "Street Lighting", "Drone Surveillance", "Community Outreach"].map((item) => <option key={item}>{item}</option>)}
                          </select>
                        </label>
                      </div>
                      <button onClick={runScenario} disabled={busyAction === "scenario"} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white">
                        {busyAction === "scenario" && <Loader2 className="h-4 w-4 animate-spin" />}
                        Run Scenario Simulation
                      </button>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <div className="text-xs font-black uppercase text-emerald-700">Simulation Result</div>
                      {scenario ? (
                        <div className="mt-3 space-y-2 text-sm font-semibold">
                          <div>{scenario.name}</div>
                          <div>Baseline risk: <b>{scenario.baselineRisk}</b></div>
                          <div>Projected risk: <b>{scenario.projectedRisk}</b></div>
                          <div>Confidence: <b>{scenario.confidence}%</b></div>
                          <div>Cost: <b>₹{scenario.cost.toLocaleString("en-IN")}</b></div>
                          <p className="text-xs leading-5">{scenario.benefit}</p>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm font-semibold text-slate-600">Choose an intervention and run simulation.</p>
                      )}
                    </div>
                  </div>
                ) : activeModule === "cases" ? (
                  <div className="grid gap-3 2xl:grid-cols-[1fr_300px]">
                    <div className="max-h-[430px] overflow-auto rounded-lg border border-slate-200">
                      <table className="w-full min-w-[620px] text-left text-xs">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr>
                            {["FIR No.", "Case Title", "District", "Category", "Evidence", "Status"].map((heading) => (
                              <th key={heading} className="px-3 py-2 font-black text-[#063f9f]">{heading}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredIncidents.map((incident) => (
                            <tr key={incident.id} onClick={() => setSelectedIncidentId(incident.id)} className="cursor-pointer border-t border-slate-100 hover:bg-blue-50">
                              <td className="px-3 py-2 font-bold">{incident.id}</td>
                              <td className="px-3 py-2 font-semibold">{incident.title}</td>
                              <td className="px-3 py-2">{incident.location.district}</td>
                              <td className="px-3 py-2">{incident.category}</td>
                              <td className="px-3 py-2">{incident.evidenceCompleteness}%</td>
                              <td className="px-3 py-2"><StatusPill tone="blue">{incident.status}</StatusPill></td>
                            </tr>
                          ))}
                          {filteredIncidents.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                                No FIR records match the current filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <h3 className="text-xs font-black uppercase text-[#063f9f]">Selected Case</h3>
                      <p className="mt-2 text-sm font-black">{selectedIncident?.title ?? "No case selected"}</p>
                      <p className="mt-2 text-xs font-medium leading-5">{selectedIncident?.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedIncident?.validationAlerts.map((alert) => <StatusPill key={alert} tone="orange">{alert.slice(0, 32)}</StatusPill>)}
                      </div>
                    </div>
                  </div>
                ) : activeModule === "analytics" ? (
                  <div className="grid gap-3 2xl:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-3">
                      <h3 className="mb-3 text-xs font-black uppercase text-[#063f9f]">Hotspot Predictions</h3>
                      <div className="max-h-[370px] space-y-2 overflow-auto">
                        {(predictions?.hotspotPredictions ?? []).map((hotspot) => (
                          <button key={`${hotspot.district}-${hotspot.area}`} onClick={() => setSelectedDistrict(hotspot.district)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:bg-blue-50">
                            <div className="flex justify-between gap-3 text-xs font-black">
                              <span>{hotspot.area}, {hotspot.district}</span>
                              <span>{hotspot.riskScore}</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-red-500" style={{ width: `${hotspot.riskScore}%` }} />
                            </div>
                            <div className="mt-2 text-[11px] font-semibold text-slate-600">Confidence {hotspot.confidence}% · {hotspot.drivers.slice(0, 2).join(", ")}</div>
                          </button>
                        ))}
                        {(predictions?.hotspotPredictions ?? []).length === 0 && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">No hotspot predictions available from backend.</div>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <h3 className="mb-3 text-xs font-black uppercase text-[#063f9f]">Anomaly Queue</h3>
                      <div className="max-h-[370px] space-y-2 overflow-auto">
                        {(anomalies?.anomalies ?? []).map((anomaly) => (
                          <div key={anomaly.anomalyId} className="rounded-lg border border-red-100 bg-red-50 p-3">
                            <div className="flex justify-between gap-3 text-xs font-black text-red-700">
                              <span>{anomaly.district}</span>
                              <span>{anomaly.score}</span>
                            </div>
                            <p className="mt-2 text-xs font-semibold leading-5">{anomaly.message}</p>
                            <StatusPill tone={anomaly.severity === "High" ? "red" : "orange"}>{anomaly.severity}</StatusPill>
                          </div>
                        ))}
                        {(anomalies?.anomalies ?? []).length === 0 && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">No anomaly signals available from backend.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : activeModule === "alerts" ? (
                  <div className="grid gap-3 xl:grid-cols-[1fr_260px]">
                    <div className="max-h-[430px] space-y-2 overflow-auto pr-1">
                      {alerts.map((alert) => (
                        <button key={alert.id} onClick={() => markAlertRead(alert.id)} className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:bg-blue-50">
                          <AlertTriangle className={classNames("mt-1 h-5 w-5 shrink-0", alert.severity === "Critical" ? "text-red-500" : alert.severity === "Warning" ? "text-orange-500" : "text-blue-500")} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold">{alert.message}</span>
                            <span className="mt-1 block text-xs font-semibold text-slate-500">{alert.district} · {new Date(alert.timestamp).toLocaleString("en-IN")}</span>
                          </span>
                          <StatusPill tone={alert.read ? "slate" : "blue"}>{alert.read ? "Read" : "New"}</StatusPill>
                        </button>
                      ))}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <h3 className="text-xs font-black uppercase text-[#063f9f]">Alert Actions</h3>
                      <p className="mt-2 text-xs font-semibold leading-5">Click an alert to mark it reviewed. Alerts are generated by evidence analysis, simulations, anomaly detection, and hotspot risk changes.</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white p-3"><b>{alerts.filter((item) => !item.read).length}</b><br /><span className="text-xs">Unread</span></div>
                        <div className="rounded-lg bg-white p-3"><b>{alerts.filter((item) => item.severity === "Critical").length}</b><br /><span className="text-xs">Critical</span></div>
                      </div>
                    </div>
                  </div>
                ) : activeModule === "reports" ? (
                  <div className="grid gap-3 2xl:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-3">
                      <h3 className="mb-2 text-xs font-black uppercase text-[#063f9f]">SCRB Report Summary</h3>
                      <ul className="space-y-2 text-sm font-semibold">
                        <li>Total incidents analyzed: {incidents.length}</li>
                        <li>Graph nodes: {graph.nodes.length}</li>
                        <li>Graph relationships: {graph.edges.length}</li>
                        <li>Hotspot predictions: {predictions?.hotspotPredictions.length ?? 0}</li>
                        <li>Anomaly signals: {anomalies?.count ?? 0}</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <h3 className="mb-2 text-xs font-black uppercase text-[#063f9f]">Implemented AI Capabilities</h3>
                      <div className="max-h-[320px] overflow-auto">
                        {(aiStatus?.implementedCapabilities ?? []).map((capability) => (
                          <div key={capability} className="border-b border-slate-100 py-2 text-xs font-semibold">{capability}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : activeModule === "settings" ? (
                  <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <h3 className="text-xs font-black uppercase text-[#063f9f]">System Controls</h3>
                      <button onClick={refreshIntelligence} disabled={busyAction === "refresh"} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
                        {busyAction === "refresh" && <Loader2 className="h-4 w-4 animate-spin" />}
                        Refresh Intelligence APIs
                      </button>
                      <button onClick={resetTwin} disabled={busyAction === "reset"} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#06295c] disabled:opacity-60">
                        {busyAction === "reset" && <Loader2 className="h-4 w-4 animate-spin" />}
                        Reset Digital Twin Demo State
                      </button>
                      <button onClick={syncCatalyst} disabled={busyAction === "sync"} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 disabled:opacity-60">
                        {busyAction === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                        Sync to Catalyst Data Store / NoSQL
                      </button>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <h3 className="text-xs font-black uppercase text-[#063f9f]">Backend Connection</h3>
                      <p className="mt-2 text-sm font-semibold">{aiStatus?.service}</p>
                      <p className="text-xs font-medium text-slate-600">Official schema root: {aiStatus?.officialSchemaRoot}</p>
                      <StatusPill tone={error ? "red" : "green"}>{error ? "Attention" : "Operational"}</StatusPill>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4 2xl:col-span-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xs font-black uppercase text-[#063f9f]">Catalyst Services</h3>
                          <p className="mt-1 text-xs font-semibold text-slate-600">{catalystStatus?.creditGuardrail}</p>
                        </div>
                        <StatusPill tone={session?.user ? "green" : "orange"}>{session?.user ? "Authenticated" : "Auth Ready"}</StatusPill>
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
                        {(catalystStatus?.services ?? []).map((service) => (
                          <div key={service.service} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <Cloud className="h-4 w-4 shrink-0 text-blue-600" />
                                <span className="truncate text-xs font-black uppercase text-[#07152f]">{service.service}</span>
                              </div>
                              <StatusPill tone={service.state === "active" ? "green" : service.state === "ready" ? "blue" : "orange"}>{service.state}</StatusPill>
                            </div>
                            <p className="text-xs font-semibold text-slate-700">{service.capability}</p>
                            <p className="mt-2 text-[11px] font-medium leading-4 text-slate-500">{service.creditStrategy}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4 2xl:col-span-2">
                      <h3 className="text-xs font-black uppercase text-[#063f9f]">Catalyst Signals / Audit Events</h3>
                      <div className="mt-3 max-h-[240px] overflow-auto rounded-lg border border-slate-100">
                        {(catalystEvents.length ? catalystEvents : [{ id: "empty", type: "system.ready", actor: "CrimeVerse AI", message: "Run an AI action to emit Catalyst-ready audit events.", createdAt: new Date().toISOString(), delivery: "In-memory event stream" }]).map((event) => (
                          <div key={event.id} className="grid gap-1 border-b border-slate-100 p-3 text-xs md:grid-cols-[150px_1fr_150px]">
                            <div className="font-black text-[#07152f]">{event.type}</div>
                            <div>
                              <div className="font-semibold">{event.message}</div>
                              <div className="text-[11px] font-medium text-slate-500">{event.actor} / {event.delivery}</div>
                            </div>
                            <div className="font-medium text-slate-500">{new Date(event.createdAt).toLocaleString("en-IN")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_310px]">
                    <KarnatakaMap
                      districts={districts}
                      selectedDistrict={activeDistrict?.name ?? ""}
                      onSelectDistrict={(name) => setSelectedDistrict(name)}
                    />
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <h3 className="mb-2 text-xs font-black uppercase text-[#063f9f]">Select Crime Category</h3>
                        <div className="flex max-h-28 flex-wrap gap-2 overflow-auto pr-1">
                          {categories.map((item) => (
                            <button key={item} onClick={() => setCategory(item)} className={classNames("rounded-md border px-3 py-2 text-[11px] font-bold", category === item ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700")}>
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <h3 className="mb-3 text-xs font-black uppercase text-[#063f9f]">District Risk Score</h3>
                        <div className="space-y-3">
                          {[...(predictions?.districtRisk ?? [])].sort((a, b) => b.score - a.score).slice(0, 5).map((risk) => (
                            <button key={risk.district} onClick={() => setSelectedDistrict(risk.district)} className="grid w-full grid-cols-[110px_1fr_34px] items-center gap-2 text-left text-xs font-bold">
                              <span className="truncate">{risk.district}</span>
                              <span className="h-1.5 rounded-full bg-slate-100">
                                <span className={classNames("block h-full rounded-full", risk.score >= 80 ? "bg-red-500" : risk.score >= 60 ? "bg-orange-500" : "bg-yellow-400")} style={{ width: `${risk.score}%` }} />
                              </span>
                              <span>{risk.score}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <h3 className="mb-2 text-xs font-black uppercase text-[#063f9f]">Active View</h3>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone="blue">{selectedDistrict}</StatusPill>
                          <StatusPill tone="slate">{selectedStation}</StatusPill>
                          <StatusPill tone="orange">{category}</StatusPill>
                          <StatusPill tone="green">{timeRange}</StatusPill>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <h3 className="mb-2 text-xs font-black uppercase text-[#063f9f]">Time Range</h3>
                        <div className="flex gap-2">
                          {["7D", "30D", "90D", "YTD"].map((item) => (
                            <button key={item} onClick={() => setTimeRange(item)} className={classNames("rounded-md border px-3 py-2 text-xs font-bold", timeRange === item ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white")}>{item}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard>
                <div className="grid gap-4 2xl:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-xs font-extrabold uppercase text-[#063f9f]">Crime Trends Over Time</h3>
                    <div className="h-[180px]">
                      <ResponsiveContainer>
                        <LineChart data={trendData}>
                          <CartesianGrid stroke="#e5e7eb" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} width={28} />
                          <Tooltip />
                          <Line type="monotone" dataKey="theft" stroke="#2563eb" strokeWidth={3} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="assault" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="cyber" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="robbery" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="others" stroke="#16a34a" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-extrabold uppercase text-[#063f9f]">Zone Comparison</h3>
                    <div className="h-[180px]">
                      <ResponsiveContainer>
                        <BarChart data={zoneData}>
                          <CartesianGrid stroke="#e5e7eb" vertical={false} />
                          <XAxis dataKey="zone" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} width={28} />
                          <Tooltip />
                          <Bar dataKey="current" fill="#2563eb" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="previous" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
                <SectionCard title="Recent Cases" action={<StatusPill tone="slate">{filteredIncidents.length} shown</StatusPill>}>
                  <div className="max-h-[210px] overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr>{["FIR No.", "Title", "District", "Severity"].map((h) => <th key={h} className="pb-2 font-black">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {filteredIncidents.map((incident) => (
                          <tr key={incident.id} onClick={() => setSelectedIncidentId(incident.id)} className="cursor-pointer border-t border-slate-100 hover:bg-blue-50">
                            <td className="py-2 font-semibold">{incident.id.slice(-10)}</td>
                            <td className="py-2 font-semibold">{incident.title}</td>
                            <td className="py-2">{incident.location.district}</td>
                            <td className="py-2"><StatusPill tone={incident.severity === "Critical" || incident.severity === "High" ? "red" : "orange"}>{incident.severity}</StatusPill></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>

                <SectionCard title="Active Investigation Queue">
                  <div className="max-h-[210px] overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr>{["Case", "Officer Action", "Priority", "Status"].map((h) => <th key={h} className="pb-2 font-black">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {recommendations.map((rec) => (
                          <tr key={rec.id} className="border-t border-slate-100">
                            <td className="py-2 font-semibold">{rec.district}</td>
                            <td className="py-2">{rec.title}</td>
                            <td className="py-2"><StatusPill tone={rec.riskScore >= 80 ? "red" : "orange"}>{rec.riskScore}</StatusPill></td>
                            <td className="py-2 font-bold text-blue-700">{rec.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              <SectionCard title="Case Insights & Intelligence">
                {selectedIncident ? (
                  <>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="text-xs font-black uppercase text-[#063f9f]">Evidence Completeness Score</h3>
                        <StatusPill tone="blue">{selectedIncident.category}</StatusPill>
                      </div>
                      <div className="grid gap-2 2xl:grid-cols-[120px_1fr] 2xl:items-center">
                        <div className="relative h-24 2xl:h-28">
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie data={[{ value: selectedIncident.evidenceCompleteness }, { value: 100 - selectedIncident.evidenceCompleteness }]} dataKey="value" innerRadius={36} outerRadius={54} startAngle={90} endAngle={-270}>
                                <Cell fill="#2faf68" />
                                <Cell fill="#dce5ee" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-black 2xl:text-2xl">{selectedIncident.evidenceCompleteness}%</div>
                        </div>
                        <div className="space-y-1.5 text-[11px] font-semibold 2xl:text-xs">
                          {evidenceItems.map(([label, ok]) => (
                            <div key={String(label)} className="flex items-center gap-2">
                              {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-500" />}
                              {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-slate-200 p-3">
                      <h3 className="mb-2 text-xs font-black uppercase text-[#063f9f]">Extracted Entities</h3>
                      <div className="grid gap-2 2xl:grid-cols-2">
                        <EntityBox title={`Suspects (${selectedIncident.extractedEntities.suspects.length})`} items={selectedIncident.extractedEntities.suspects} />
                        <EntityBox title={`Victims (${selectedIncident.extractedEntities.victims.length})`} items={selectedIncident.extractedEntities.victims} />
                      </div>
                      <div className="mt-2">
                        <EntityBox title="Linked Entities" items={[...selectedIncident.extractedEntities.vehicles, ...selectedIncident.extractedEntities.phones, ...selectedIncident.extractedEntities.weapons, ...selectedIncident.extractedEntities.organizations]} />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-slate-600">No case selected.</p>
                )}
              </SectionCard>

              {primaryRecommendation && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
                  <div className="flex gap-3">
                    <ShieldCheck className="h-8 w-8 shrink-0 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-black uppercase text-[#07152f]">Recommended Action</h3>
                      <p className="mt-2 text-sm font-bold">{primaryRecommendation.title}</p>
                      <p className="text-xs font-medium">{primaryRecommendation.reason}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-[#063f9f]">Confidence</span>
                        <div className="h-2 flex-1 rounded-full bg-white">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${primaryRecommendation.confidence}%` }} />
                        </div>
                        <span className="text-lg font-black text-emerald-600">{primaryRecommendation.confidence}%</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button disabled={busyAction === `deploy-${primaryRecommendation.id}`} onClick={() => updateRecommendation(primaryRecommendation.id, "deploy")} className="rounded-md bg-[#06295c] px-3 py-2 text-xs font-black text-white disabled:opacity-60">Deploy</button>
                        <button disabled={busyAction === `dismiss-${primaryRecommendation.id}`} onClick={() => updateRecommendation(primaryRecommendation.id, "dismiss")} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-[#06295c] disabled:opacity-60">Dismiss</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {latestAnomaly && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 shadow-sm">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-8 w-8 shrink-0 text-red-500" />
                    <div>
                      <h3 className="text-xs font-black uppercase text-[#07152f]">Anomaly Explanation</h3>
                      <p className="mt-2 text-sm font-semibold">{latestAnomaly.message}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusPill tone="red">{latestAnomaly.severity}</StatusPill>
                        <StatusPill tone="orange">Score {latestAnomaly.score}</StatusPill>
                        <StatusPill tone="slate">{latestAnomaly.district}</StatusPill>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <SectionCard title="AI Engine Status">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(aiStatus?.counts ?? {}).slice(0, 8).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="text-[10px] font-black uppercase text-slate-500">{key}</div>
                      <div className="text-lg font-black">{value}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>

        <footer className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:grid-cols-5">
          {([
            [FileText, "Total FIRs (YTD)", "12,458"],
            [BriefcaseBusiness, "Cases Analyzed", String(aiStatus?.counts.incidents ?? incidents.length)],
            [Network, "Predictions", String(aiStatus?.counts.hotspotPredictions ?? 0)],
            [MapPin, "Hotspots", String(predictions?.hotspotPredictions.length ?? 0)]
          ] satisfies FooterMetric[]).map(([Icon, label, value]) => (
            <div key={String(label)} className="flex items-center gap-3 md:border-r md:border-slate-200">
              <Icon className="h-7 w-7 text-[#07152f]" />
              <div>
                <div className="text-[10px] font-black uppercase text-[#07152f]">{label}</div>
                <div className="text-xl font-black">{value}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-end gap-3 text-xs font-semibold text-slate-700">
            Last Updated: {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            <span className="flex items-center gap-2 font-black text-emerald-600">
              <span className="h-3 w-3 rounded-full bg-emerald-500" /> LIVE
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function EntityBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase text-[#063f9f]">
        <UsersRound className="h-4 w-4 text-blue-600" /> {title}
      </div>
      {items.length ? (
        <ul className="ml-4 list-disc text-xs font-medium leading-5">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <div className="text-xs font-semibold text-slate-500">No extracted value</div>
      )}
    </div>
  );
}
