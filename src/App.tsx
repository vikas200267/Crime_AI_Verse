import { useState, useEffect, useRef } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { 
  Shield, 
  FileText, 
  Network, 
  TrendingUp, 
  Zap, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Compass, 
  RefreshCw, 
  Sliders, 
  Bell, 
  X, 
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  Info,
  DollarSign,
  Layers,
  Maximize2,
  Minimize2,
  Map as MapIcon,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  Incident, 
  EntityNode, 
  EntityEdge, 
  DistrictMetrics, 
  SimulationScenario, 
  ActionRecommendation, 
  AlertNotification 
} from "./types";

// SAMPLE DOCUMENTS FOR EVIDENCEFLOW DEMONSTRATION
const SAMPLE_DOCS = [
  {
    name: "FIR: Kalaburagi Clash (Timeline & Phone Link)",
    text: `CRIME REPORT / FIR TRANSCRIPT
Station: Kalaburagi Town Police Station
Date of Report: 2026-07-08 | Time: 22:30
Incident: Gang violence near Super Market Precinct.

Complainant states that on July 8 at 21:00, a violent clash erupted between two local rival factions, 'Kalaburagi Boys' and 'Saffron Gladiators', near the Super Market Area, Kalaburagi. Swords and wooden bats were brandished. Three police patrols were dispatched.

We recovered a mobile phone belonging to suspect Suresh (7204123456), which contains active call logs linking him directly to Rahim (9845011223) at 20:45, exactly 15 minutes before the clash.

TIMELINE ANOMALY NOTES: Suspect Suresh claims he was in Bengaluru (350 miles away) at the time of the event, but his mobile number 7204123456 pinged the cell tower in Super Market Area, Kalaburagi at 21:02. Officer signature is verified, but witness signature block is missing.`
  },
  {
    name: "Investigation Note: Koramangala Wire Fraud",
    text: `DIGITAL CRIMES DIVISION NOTE
Case Ref: FRAUD/KOR-99
Date: 2026-07-05 | District: Bengaluru Urban

We are investigating a Spear-Phishing corporate wire fraud against TVS Tech Solutions in Koramangala, Bengaluru. On July 5 at 11:30, CFO Ramesh Kumar received a spoofed email requesting an urgent wire of INR 45 Lakhs. 

The funds were wired to a shell bank account registered under 'Duniya Enterprises' in Kalaburagi. 
IP trace logs show the phisher's terminal logged in from Kalaburagi, suggesting collaboration between Bengaluru phishing operators and Kalaburagi money launderers. No physical weapons or vehicles were used. Complainant TVS Tech Solutions has provided full email headers.`
  },
  {
    name: "FIR Draft: Majestic Jewelry Robbery",
    text: `DRAFT FIR (PENDING VALIDATION)
District: Bengaluru Urban | Beat: Majestic Precinct
Date of Incident: 2026-07-07 | Time: 19:15

Three masked suspects entered 'Venkateshwara Jewelers' near Majestic Bus Station. Complainant Venkatesh Rao (Shop Owner) states suspects held him at gunpoint using a country pistol. They stole approximately 2kg of gold ornaments.

Escape Vehicle: Black Pulsar Motorcycle with no visible registration plate.
Suspect Rahim (9845011223) was identified by local informants running near the site.

DISCREPANCY ALERT: Complainant states the robbery happened at 19:15. However, the arrest log shows suspect Rahim was detained in Koramangala at 19:00 (15 minutes prior, impossible speed and distance).`
  }
];

export default function App() {
  // STATE
  const [districts, setDistricts] = useState<DistrictMetrics[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [graph, setGraph] = useState<{ nodes: EntityNode[]; edges: EntityEdge[] }>({ nodes: [], edges: [] });
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Bengaluru Urban");
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareDistrict, setCompareDistrict] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<{ d: DistrictMetrics; cx: number; cy: number } | null>(null);
  const [mapLayer, setMapLayer] = useState<'heatmap' | 'boundaries' | 'hotspots' | 'forecast'>('hotspots');
  
  // Tab State: 'dashboard' | 'evidenceflow' | 'knowledgegraph' | 'simulation'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'evidenceflow' | 'knowledgegraph' | 'simulation'>('dashboard');

  // EvidenceFlow UI State
  const [docText, setDocText] = useState<string>(SAMPLE_DOCS[0].text);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [newlyAnalyzed, setNewlyAnalyzed] = useState<Incident | null>(null);

  // Simulation UI State
  const [simDistrict, setSimDistrict] = useState<string>("Bengaluru Urban");
  const [simIntervention, setSimIntervention] = useState<'Patrol Reallocation' | 'Temporary Checkpoints' | 'Street Lighting' | 'Drone Surveillance' | 'Community Outreach'>("Patrol Reallocation");
  const [simDetails, setSimDetails] = useState<string>("");
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<SimulationScenario | null>(null);

  // Knowledge Graph Filter
  const [graphFilter, setGraphFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<EntityNode | null>(null);

  // API Key Warning State
  const [apiConfigured, setApiConfigured] = useState<boolean>(true);

  // Digital Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Map Pan/Zoom State
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [activeRiskFilters, setActiveRiskFilters] = useState<string[]>(['Critical', 'High', 'Medium', 'Low']);
  const [activeIncidentFilters, setActiveIncidentFilters] = useState<string[]>(['Theft', 'Assault', 'Fraud', 'Homicide', 'Vandalism', 'Narcotics', 'Other']);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const el = mapWrapperRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
      setMapZoom((prev) => Math.min(Math.max(0.5, prev * scaleAdjust), 5));
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingMap(true);
    setDragStart({ x: e.clientX - mapPan.x, y: e.clientY - mapPan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingMap || !dragStart) return;
    setMapPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDraggingMap(false);
    setDragStart(null);
  };

  // FETCH DATA ON MOUNT
  const fetchData = async () => {
    try {
      const metricsRes = await fetch("/api/metrics");
      const dData = await metricsRes.json();
      setDistricts(dData);

      const incsRes = await fetch("/api/incidents");
      const iData = await incsRes.json();
      setIncidents(iData);
      if (iData.length > 0) setSelectedIncident(iData[0]);

      const graphRes = await fetch("/api/graph");
      const gData = await graphRes.json();
      setGraph(gData);

      const recsRes = await fetch("/api/recommendations");
      const rData = await recsRes.json();
      setRecommendations(rData);

      const alertsRes = await fetch("/api/alerts");
      const aData = await alertsRes.json();
      setAlerts(aData);
    } catch (err) {
      console.error("Error fetching state:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Quick test if API key is in environment variables (warning banner)
    // The server will print if key is missing, we can assume true/false based on server response flags or mock
    setApiConfigured(true); // Default configured; fallback mode handles gracefully
  }, []);

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset the Digital Twin state to default?")) {
      const res = await fetch("/api/reset", { method: "POST" });
      if (res.ok) {
        fetchData();
        setNewlyAnalyzed(null);
        setSimResult(null);
        setSelectedNode(null);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      }
    }
  };

  // Analyze Unstructured Document
  const handleAnalyze = async () => {
    if (!docText.trim()) return;
    setAnalyzing(true);
    setNewlyAnalyzed(null);
    try {
      const res = await fetch("/api/evidence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: docText, filename: "EvidenceFlow_Ingested_Doc.txt" })
      });
      const data = await res.json();
      if (data.success) {
        setIncidents(data.incident ? [data.incident, ...incidents] : incidents);
        setGraph(data.graph);
        setRecommendations(data.recommendations);
        setDistricts(data.districts);
        setAlerts(data.alerts);
        setNewlyAnalyzed(data.incident);
        setSelectedIncident(data.incident);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        alert("Parser error: " + (data.error || "failed"));
      }
    } catch (err) {
      console.error(err);
      alert("Network or API timeout during heavy analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadGraphData = () => {
    const dataStr = JSON.stringify(graph, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'knowledge_graph_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Run Simulation
  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/scenarios/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: simDistrict,
          interventionType: simIntervention,
          description: simDetails
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimResult(data.scenario);
        confetti({ particleCount: 80, spread: 50, colors: ['#06b6d4', '#eab308'] });
      } else {
        alert("Simulation error: " + (data.error || "failed"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  // Deploy recommendation action
  const handleDeployAction = async (id: string) => {
    try {
      const res = await fetch(`/api/recommendations/${id}/deploy`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations);
        setDistricts(data.districts);
        setAlerts(data.alerts);
        confetti({ particleCount: 150, spread: 80, origin: { x: 0.8, y: 0.4 } });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dismiss recommendation
  const handleDismissAction = async (id: string) => {
    try {
      const res = await fetch(`/api/recommendations/${id}/dismiss`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Read alert
  const handleReadAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/read`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper Coordinates Mapper for karnataka SVG
  // Lat range roughly: 11.5 (South) to 18.5 (North)
  // Lng range roughly: 74.0 (West) to 78.5 (East)
  const mapCoordsToSvg = (lat: number, lng: number): { cx: number; cy: number } => {
    const minLat = 11.2;
    const maxLat = 18.6;
    const minLng = 73.8;
    const maxLng = 78.8;

    const width = 440;
    const height = 480;

    const cx = ((lng - minLng) / (maxLng - minLng)) * width + 30;
    const cy = height - ((lat - minLat) / (maxLat - minLat)) * height + 10;
    return { cx, cy };
  };

  // SVG representation of Karnataka Districts border contours (abstract simplified representation)
  // To keep visual high-fidelity and lightweight, we use simplified lines for Karnataka Map
  const activeDistrictMetrics = districts.find(d => d.name === selectedDistrict);

  // FILTERED NODES AND EDGES FOR KNOWLEDGE GRAPH
  const filteredNodes = graph.nodes?.filter(node => {
    const matchesFilter = graphFilter === "all" || node.type === graphFilter;
    const matchesSearch = searchQuery === "" || node.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  const filteredEdges = graph.edges?.filter(edge => {
    // Only show edges where both source and target exist in filteredNodes
    const sourceExists = filteredNodes.some(n => n.id === edge.source);
    const targetExists = filteredNodes.some(n => n.id === edge.target);
    return sourceExists && targetExists;
  }) || [];

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-slate-100 font-sans selection:bg-cyan-500/30 select-none relative z-0">
      {/* Dynamic Background Effect */}
      <div className="fixed inset-0 bg-[#020617] pointer-events-none z-[-2]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#020617]/80 to-[#020617] pointer-events-none z-[-1]" />
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-[-1]" />

      {/* HEADER SECTION */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-lg text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Shield className="w-6 h-6 stroke-[2]" id="app-logo-shield" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight text-white flex items-center gap-2">
              CRIMEVERSE AI <span className="text-xs px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full font-mono font-medium tracking-widest uppercase">Digital Twin</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              STATEWIDE CRIME INTELLIGENCE COMMAND CENTER
            </p>
          </div>
        </div>

        {/* TOP METRICS / STATUS */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* DIGITAL CLOCK WIDGET (IST) */}
          <div className="flex flex-col items-end justify-center bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-md font-mono text-right">
            <div className="text-cyan-400 font-bold text-sm tracking-widest">
              {currentTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }).toUpperCase()} IST
            </div>
            <div className="text-slate-500 text-[10px] tracking-widest uppercase">
              {currentTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-md font-mono h-10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYSTEM STATUS: <strong className="text-emerald-400">SYNCHRONIZED</strong></span>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-md font-mono h-10">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>GEMINI ENGINE: <strong className="text-cyan-400">ONLINE (3.5-FLASH)</strong></span>
          </div>

          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-md border border-slate-800 transition font-mono"
            title="Reset to default seed data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            RESET STATE
          </button>
        </div>
      </header>

      {/* WARNING BANNER FOR MISSING API KEY (GENTLE AND REASSURING) */}
      {!apiConfigured && (
        <div className="bg-amber-950/40 border-b border-amber-900/60 text-amber-300 px-4 py-2 text-xs font-mono flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span><strong>GEMINI KEY NOT DETECTED:</strong> Running in local rule-based simulation. Configure your <strong>GEMINI_API_KEY</strong> in <strong>Settings &gt; Secrets</strong> to unlock full LLM semantic parsing, real-time validations, and generative predictions.</span>
          </div>
          <button onClick={() => setApiConfigured(true)} className="text-amber-500 hover:text-amber-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 p-4 lg:p-5 max-w-[1700px] w-full mx-auto">
        
        {/* LEFT COLUMN: NAVIGATION & INTERACTIVE TOOLS (4 COLS ON LARGE) */}
        <section className="xl:col-span-3 flex flex-col gap-4">
          
          {/* NAVIGATION BAR */}
          <div className="bg-[#050914]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 flex flex-col gap-1.5 relative overflow-hidden shadow-xl shadow-black/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
               <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
               <p className="text-[10px] font-mono tracking-widest uppercase text-cyan-400/80 font-bold">System Modules</p>
            </div>
            
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`group flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-all duration-300 font-medium ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-cyan-900/60 to-cyan-900/10 border border-cyan-500/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-[1.02]' : 'text-slate-400 border border-transparent hover:border-slate-700/50 hover:bg-slate-800/40 hover:text-slate-200 hover:scale-[1.01]'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-cyan-500/20' : 'bg-slate-800/50 group-hover:bg-slate-700'}`}>
                  <Compass className={`w-4 h-4 stroke-[2] transition-transform duration-300 ${activeTab === 'dashboard' ? 'rotate-12 text-cyan-400' : 'group-hover:rotate-12 text-slate-400 group-hover:text-cyan-300'}`} />
                </div>
                <span>Statewide Digital Twin</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-colors ${activeTab === 'dashboard' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800 group-hover:border-slate-700'}`}>MAP</span>
            </button>

            <button 
              onClick={() => setActiveTab('evidenceflow')}
              className={`group flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-all duration-300 font-medium ${activeTab === 'evidenceflow' ? 'bg-gradient-to-r from-cyan-900/60 to-cyan-900/10 border border-cyan-500/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-[1.02]' : 'text-slate-400 border border-transparent hover:border-slate-700/50 hover:bg-slate-800/40 hover:text-slate-200 hover:scale-[1.01]'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'evidenceflow' ? 'bg-cyan-500/20' : 'bg-slate-800/50 group-hover:bg-slate-700'}`}>
                  <FileText className={`w-4 h-4 stroke-[2] transition-transform duration-300 ${activeTab === 'evidenceflow' ? '-translate-y-0.5 text-cyan-400' : 'group-hover:-translate-y-0.5 text-slate-400 group-hover:text-cyan-300'}`} />
                </div>
                <span>EvidenceFlow AI</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-colors ${activeTab === 'evidenceflow' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800 group-hover:border-slate-700'}`}>INGEST</span>
            </button>

            <button 
              onClick={() => setActiveTab('knowledgegraph')}
              className={`group flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-all duration-300 font-medium ${activeTab === 'knowledgegraph' ? 'bg-gradient-to-r from-cyan-900/60 to-cyan-900/10 border border-cyan-500/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] scale-[1.02]' : 'text-slate-400 border border-transparent hover:border-slate-700/50 hover:bg-slate-800/40 hover:text-slate-200 hover:scale-[1.01]'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'knowledgegraph' ? 'bg-cyan-500/20' : 'bg-slate-800/50 group-hover:bg-slate-700'}`}>
                  <Network className={`w-4 h-4 stroke-[2] transition-transform duration-300 ${activeTab === 'knowledgegraph' ? 'scale-110 text-cyan-400' : 'group-hover:scale-110 text-slate-400 group-hover:text-cyan-300'}`} />
                </div>
                <span>Crime Knowledge Graph</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-colors ${activeTab === 'knowledgegraph' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800 group-hover:border-slate-700'}`}>LINKED</span>
            </button>

            <button 
              onClick={() => setActiveTab('simulation')}
              className={`group flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-all duration-300 font-medium ${activeTab === 'simulation' ? 'bg-gradient-to-r from-amber-900/60 to-amber-900/10 border border-amber-500/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.02]' : 'text-slate-400 border border-transparent hover:border-slate-700/50 hover:bg-slate-800/40 hover:text-slate-200 hover:scale-[1.01]'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${activeTab === 'simulation' ? 'bg-amber-500/20' : 'bg-slate-800/50 group-hover:bg-slate-700'}`}>
                  <Sliders className={`w-4 h-4 stroke-[2] transition-transform duration-300 ${activeTab === 'simulation' ? 'rotate-90 text-amber-400' : 'group-hover:rotate-90 text-slate-400 group-hover:text-amber-300'}`} />
                </div>
                <span>Simulation Engine</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border transition-colors ${activeTab === 'simulation' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800 group-hover:border-slate-700'}`}>PREDICT</span>
            </button>
          </div>

          {/* ACTIVE RECOMMENDED ACTIONS */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
              <h2 className="text-xs font-mono font-semibold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                Action Recommendations
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 rounded-full border border-slate-800 text-slate-400">
                {recommendations.filter(r => r.status === "Pending").length}
              </span>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px]">
              {recommendations.filter(r => r.status === "Pending").length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-mono">
                  No pending recommendations. All actions deployed!
                </div>
              ) : (
                recommendations.filter(r => r.status === "Pending").map((rec, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={rec.id} 
                    className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex flex-col gap-2.5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-500/5 to-transparent pointer-events-none"></div>
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono bg-yellow-950/60 text-yellow-400 border border-yellow-800/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {rec.district}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {rec.actionWindow}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-100">{rec.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{rec.reason}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[10px] font-mono">
                      <span className="text-slate-400">Confidence: <strong className="text-cyan-400">{rec.confidence}%</strong></span>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleDismissAction(rec.id)}
                          className="hover:bg-slate-800 text-slate-400 hover:text-slate-200 p-1.5 rounded transition"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDeployAction(rec.id)}
                          className="flex items-center gap-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800/50 px-2 py-1 rounded transition"
                        >
                          <span>Deploy</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* REALTIME CRIME ALERT LOGS */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
            <h2 className="text-xs font-mono font-semibold tracking-widest uppercase text-slate-400 border-b border-slate-900 pb-2.5 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-rose-500" />
              Live Alerts Center
            </h2>
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-600 font-mono py-4 text-center">No recent alerts.</p>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-2.5 rounded-lg border text-xs font-mono flex flex-col gap-1.5 transition ${
                      alert.read ? 'bg-slate-900/20 border-slate-900 text-slate-400' : 
                      alert.severity === 'Critical' ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' :
                      alert.severity === 'Warning' ? 'bg-amber-950/20 border-amber-900/30 text-amber-300' :
                      'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[10px] uppercase">{alert.district}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-500">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!alert.read && (
                          <button 
                            onClick={() => handleReadAlert(alert.id)}
                            className="text-[9px] text-cyan-400 hover:text-cyan-300 hover:underline"
                          >
                            Read
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] leading-relaxed">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>

        {/* MIDDLE & RIGHT AREA: MAIN ACTION DISPLAY (9 COLS) */}
        <section className="xl:col-span-9 flex flex-col gap-5">
          
          <AnimatePresence mode="wait">
            {/* TAB 1: DIGITAL TWIN MAP & REGIONAL ANALYTICS */}
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-5"
              >
                {/* KARNATAKA DIGITAL TWIN SVG MAP (7 COLS) */}
                <div className={`bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden transition-all duration-500 ease-in-out ${isMapExpanded ? 'fixed inset-4 z-[100] shadow-2xl shadow-cyan-900/20' : 'lg:col-span-7'}`}>
                  
                  {/* Grid background effect */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

                  <div className="flex justify-between items-center border-b border-slate-900 pb-3 z-10">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                          <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                          Interactive Karnataka Digital Twin Map
                        </h2>
                        <button 
                          onClick={() => {
                            setCompareMode(!compareMode);
                            if (compareMode) setCompareDistrict(null);
                          }}
                          className={`border rounded p-1 transition flex items-center gap-1.5 px-2 text-xs font-mono ${compareMode ? 'bg-purple-900/50 border-purple-500/50 text-purple-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                          title={compareMode ? "Disable Compare Mode" : "Enable Compare Mode"}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"></path><path d="M4 21h5v-5"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg>
                          Compare
                        </button>
                        <button 
                          onClick={() => setIsMapExpanded(!isMapExpanded)}
                          className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded p-1 transition"
                          title={isMapExpanded ? "Minimize Map" : "Expand Map"}
                        >
                          {isMapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Click any node marker to select district and pull live indices</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-1 text-[10px] font-mono bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <button 
                          onClick={() => setActiveRiskFilters(prev => prev.includes('Low') ? prev.filter(f => f !== 'Low') : [...prev, 'Low'])}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded transition ${activeRiskFilters.includes('Low') ? 'bg-slate-800 text-slate-200' : 'opacity-40 text-slate-400 hover:opacity-70'}`}
                        >
                          <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span><span>Low</span>
                        </button>
                        <button 
                          onClick={() => setActiveRiskFilters(prev => prev.includes('Medium') ? prev.filter(f => f !== 'Medium') : [...prev, 'Medium'])}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded transition ${activeRiskFilters.includes('Medium') ? 'bg-slate-800 text-slate-200' : 'opacity-40 text-slate-400 hover:opacity-70'}`}
                        >
                          <span className="w-2.5 h-2.5 rounded bg-yellow-500"></span><span>Med</span>
                        </button>
                        <button 
                          onClick={() => setActiveRiskFilters(prev => prev.includes('High') ? prev.filter(f => f !== 'High') : [...prev, 'High'])}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded transition ${activeRiskFilters.includes('High') ? 'bg-slate-800 text-slate-200' : 'opacity-40 text-slate-400 hover:opacity-70'}`}
                        >
                          <span className="w-2.5 h-2.5 rounded bg-orange-500"></span><span>High</span>
                        </button>
                        <button 
                          onClick={() => setActiveRiskFilters(prev => prev.includes('Critical') ? prev.filter(f => f !== 'Critical') : [...prev, 'Critical'])}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded transition ${activeRiskFilters.includes('Critical') ? 'bg-slate-800 text-slate-200' : 'opacity-40 text-slate-400 hover:opacity-70'}`}
                        >
                          <span className={`w-2.5 h-2.5 rounded bg-red-500 ${activeRiskFilters.includes('Critical') ? 'animate-pulse' : ''}`}></span><span>Crit</span>
                        </button>
                      </div>
                      <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 w-full">
                        <button 
                          className={`flex-1 text-[10px] font-mono py-1 px-2 rounded transition flex items-center justify-center gap-1.5 ${mapLayer === 'hotspots' ? 'bg-cyan-900/50 text-cyan-300 shadow-inner' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`} 
                          onClick={() => setMapLayer('hotspots')}
                        >
                          <Layers className="w-3 h-3" />
                          Nodes
                        </button>
                        <button 
                          className={`flex-1 text-[10px] font-mono py-1 px-2 rounded transition flex items-center justify-center gap-1.5 ${mapLayer === 'heatmap' ? 'bg-cyan-900/50 text-cyan-300 shadow-inner' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`} 
                          onClick={() => setMapLayer('heatmap')}
                        >
                          <Layers className="w-3 h-3" />
                          Heatmap
                        </button>
                        <button 
                          className={`flex-1 text-[10px] font-mono py-1 px-2 rounded transition flex items-center justify-center gap-1.5 ${mapLayer === 'boundaries' ? 'bg-cyan-900/50 text-cyan-300 shadow-inner' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`} 
                          onClick={() => setMapLayer('boundaries')}
                        >
                          <Layers className="w-3 h-3" />
                          Bounds
                        </button>
                        <button 
                          className={`flex-1 text-[10px] font-mono py-1 px-2 rounded transition flex items-center justify-center gap-1.5 ${mapLayer === 'forecast' ? 'bg-amber-900/50 text-amber-300 shadow-inner' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`} 
                          onClick={() => setMapLayer('forecast')}
                        >
                          <Layers className="w-3 h-3" />
                          Forecast
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SVG MAP WRAPPER */}
                  <div 
                    ref={mapWrapperRef}
                    className="flex-1 min-h-[460px] flex items-center justify-center relative bg-slate-950/40 rounded-xl border border-slate-900/60 p-4 z-10 overflow-hidden cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    
                    {/* Compass Rose */}
                    <div className="absolute bottom-4 right-4 text-slate-700 flex flex-col items-center gap-1 font-mono text-[9px]">
                      <Compass className="w-8 h-8 stroke-[1] text-slate-600 animate-spin-slow" />
                      <span>CRIME TWIN N-S</span>
                    </div>

                    {/* Minimap Overlay */}
                    <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg p-2 shadow-lg z-20 pointer-events-none w-24 h-24 flex items-center justify-center overflow-hidden">
                      <svg viewBox="0 0 500 520" className="w-full h-full opacity-50">
                        <path 
                          d="M 120 40 L 190 20 L 260 40 L 320 80 L 350 140 L 330 190 L 360 250 L 390 320 L 360 380 L 380 430 L 330 480 L 290 500 L 220 480 L 160 440 L 140 370 L 120 310 L 90 250 L 70 210 L 110 160 Z"
                          fill="#1e293b"
                        />
                      </svg>
                      {/* Viewport Indicator */}
                      <div 
                        className="absolute border border-cyan-400 bg-cyan-400/20"
                        style={{
                          width: `${100 / mapZoom}%`,
                          height: `${100 / mapZoom}%`,
                          left: `${50 - (mapPan.x / 5 / mapZoom) - (50 / mapZoom)}%`,
                          top: `${50 - (mapPan.y / 5.2 / mapZoom) - (50 / mapZoom)}%`,
                        }}
                      />
                    </div>

                    {/* Dynamic Legend Overlay */}
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 shadow-lg z-20 flex flex-col gap-1 pointer-events-none">
                      <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Active Hotspots Rendered</span>
                      <strong className="text-xl text-cyan-400 font-bold font-mono">
                        {mapLayer === 'forecast' 
                          ? districts.filter(d => activeRiskFilters.includes(d.riskLevel)).reduce((sum, d) => sum + (simResult && simResult.targetDistrict === d.name && simResult.predictiveHotspots ? simResult.predictiveHotspots.length : d.hotspots.length), 0)
                          : districts.filter(d => activeRiskFilters.includes(d.riskLevel)).reduce((sum, d) => sum + d.hotspots.length, 0)}
                      </strong>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase mt-1">Incidents Rendered</span>
                      <strong className="text-xl text-cyan-400 font-bold font-mono">
                        {incidents.filter(inc => activeIncidentFilters.includes(inc.category) && activeRiskFilters.includes(districts.find(d => d.name === inc.location.district)?.riskLevel || 'Low')).length}
                      </strong>
                    </div>

                    {/* Incident Filter Overlay */}
                    <div className="absolute top-20 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg p-3 shadow-lg z-20 flex flex-col gap-2 w-36" onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase flex items-center gap-1.5"><Filter className="w-3 h-3 text-cyan-400"/> Incident Filter</span>
                      <div className="flex flex-col gap-1.5 text-[10px] font-mono mt-1">
                        {['Theft', 'Assault', 'Fraud', 'Homicide', 'Vandalism', 'Narcotics', 'Other'].map(cat => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              checked={activeIncidentFilters.includes(cat)}
                              onChange={() => {
                                setActiveIncidentFilters(prev => 
                                  prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                )
                              }}
                              className="w-3 h-3 accent-cyan-500 rounded-sm bg-slate-800 border-slate-700 cursor-pointer"
                            />
                            <span className={`transition ${activeIncidentFilters.includes(cat) ? 'text-slate-200' : 'text-slate-500 group-hover:text-slate-400'}`}>{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Map Controls */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg shadow-lg flex flex-col items-center overflow-hidden py-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMapZoom(prev => Math.min(5, prev * 1.2)); }}
                          className="p-2 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition"
                          title="Zoom In"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                        
                        <div className="h-24 py-2 w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
                           <input 
                             type="range" 
                             min="0.5" 
                             max="5" 
                             step="0.1" 
                             value={mapZoom}
                             onChange={(e) => setMapZoom(parseFloat(e.target.value))}
                             className="vertical-slider w-1 h-full appearance-none bg-slate-800 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                           />
                        </div>

                        <button 
                          onClick={(e) => { e.stopPropagation(); setMapZoom(prev => Math.max(0.5, prev * 0.8)); }}
                          className="p-2 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition"
                          title="Zoom Out"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMapZoom(1); setMapPan({ x: 0, y: 0 }); }}
                        className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition shadow-lg"
                        title="Reset View"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <svg 
                      viewBox="0 0 500 520" 
                      className="w-full max-w-[440px] h-auto drop-shadow-[0_0_25px_rgba(6,182,212,0.03)] origin-center transition-transform duration-75 ease-out"
                      style={{ transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapZoom})` }}
                    >
                      <defs>
                        <radialGradient id="heatmap-critical" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="rgba(239, 68, 68, 0.6)" />
                          <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                        </radialGradient>
                        <radialGradient id="heatmap-high" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="rgba(249, 115, 22, 0.5)" />
                          <stop offset="100%" stopColor="rgba(249, 115, 22, 0)" />
                        </radialGradient>
                        <radialGradient id="heatmap-medium" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="rgba(234, 179, 8, 0.4)" />
                          <stop offset="100%" stopColor="rgba(234, 179, 8, 0)" />
                        </radialGradient>
                        <radialGradient id="heatmap-low" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                          <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                        </radialGradient>
                      </defs>

                      {/* Outline of Karnataka (Simplistic polygonal grid borders for visual aesthetic) */}
                      <path 
                        d="M 120 40 L 190 20 L 260 40 L 320 80 L 350 140 L 330 190 L 360 250 L 390 320 L 360 380 L 380 430 L 330 480 L 290 500 L 220 480 L 160 440 L 140 370 L 120 310 L 90 250 L 70 210 L 110 160 Z"
                        fill="#030712"
                        stroke="#1e293b"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />

                      {/* HEATMAP LAYER */}
                      {mapLayer === 'heatmap' && districts.filter(d => activeRiskFilters.includes(d.riskLevel)).map((d) => {
                        const mainHotspot = d.hotspots[0] || { coords: [12.9716, 77.5946] };
                        const { cx, cy } = mapCoordsToSvg(mainHotspot.coords[0], mainHotspot.coords[1]);
                        const gradientId = 
                          d.riskLevel === "Critical" ? "url(#heatmap-critical)" :
                          d.riskLevel === "High" ? "url(#heatmap-high)" :
                          d.riskLevel === "Medium" ? "url(#heatmap-medium)" : "url(#heatmap-low)";
                        const r = d.riskLevel === "Critical" ? 65 : d.riskLevel === "High" ? 55 : 45;
                        return (
                          <circle key={`heatmap-${d.name}`} cx={cx} cy={cy} r={r} fill={gradientId} style={{ mixBlendMode: 'screen' }} className="pointer-events-none" />
                        );
                      })}

                      {/* FORECAST LAYER (Predictive Hotspots from Simulation Engine) */}
                      {mapLayer === 'forecast' && districts.filter(d => activeRiskFilters.includes(d.riskLevel)).map((d) => {
                        // Use simulation result if available for this district, else default to slightly worsened state
                        let renderHotspots = d.hotspots;
                        if (simResult && simResult.targetDistrict === d.name && simResult.predictiveHotspots) {
                          renderHotspots = simResult.predictiveHotspots;
                        } else {
                           // Simulated worsening if no sim has been run for this specific district
                           renderHotspots = d.hotspots.map(h => ({
                             area: h.area + " (Est)",
                             coords: [h.coords[0] + 0.015, h.coords[1] + 0.015] as [number, number],
                             risk: Math.min(100, h.risk * 1.15)
                           }));
                        }
                        
                        return renderHotspots.map((h, i) => {
                          const { cx, cy } = mapCoordsToSvg(h.coords[0], h.coords[1]);
                          const riskLevel = h.risk > 75 ? "Critical" : h.risk > 50 ? "High" : h.risk > 25 ? "Medium" : "Low";
                          const gradientId = 
                            riskLevel === "Critical" ? "url(#heatmap-critical)" :
                            riskLevel === "High" ? "url(#heatmap-high)" :
                            riskLevel === "Medium" ? "url(#heatmap-medium)" : "url(#heatmap-low)";
                          const r = riskLevel === "Critical" ? 65 : riskLevel === "High" ? 55 : 45;
                          
                          return (
                            <circle key={`forecast-${d.name}-${i}`} cx={cx} cy={cy} r={r} fill={gradientId} style={{ mixBlendMode: 'screen' }} className="pointer-events-none opacity-80 animate-pulse" />
                          );
                        });
                      })}

                      {/* BOUNDARIES LAYER (simulated rough boundary polygons around nodes) */}
                      {mapLayer === 'boundaries' && districts.filter(d => activeRiskFilters.includes(d.riskLevel)).map((d) => {
                        const mainHotspot = d.hotspots[0] || { coords: [12.9716, 77.5946] };
                        const { cx, cy } = mapCoordsToSvg(mainHotspot.coords[0], mainHotspot.coords[1]);
                        const isHovered = hoveredDistrict?.d.name === d.name;
                        const isSelected = selectedDistrict === d.name;
                        const isHighlighted = isHovered || isSelected;
                        const colorClass = 
                          d.riskLevel === "Critical" ? "#ef4444" :
                          d.riskLevel === "High" ? "#f97316" :
                          d.riskLevel === "Medium" ? "#eab308" : "#10b981";
                        return (
                          <g key={`bounds-${d.name}`}>
                            <path 
                              d={`M ${cx-30} ${cy-10} Q ${cx-10} ${cy-30} ${cx+20} ${cy-20} T ${cx+40} ${cy+10} T ${cx+10} ${cy+30} T ${cx-30} ${cy+10} Z`}
                              fill={isHighlighted ? `${colorClass}40` : `${colorClass}10`}
                              stroke={isSecondarySelection ? "#a855f7" : colorClass}
                              strokeWidth={isHighlighted ? "2" : "1"}
                              strokeDasharray={isHighlighted ? "none" : "2 2"}
                              className="pointer-events-none transition-all duration-300"
                            />
                          </g>
                        );
                      })}

                      {/* HOTSPOTS / MESH LAYER */}
                      {mapLayer === 'hotspots' && districts.filter(d => activeRiskFilters.includes(d.riskLevel)).map((d1, i, arr) => {
                        const { cx: cx1, cy: cy1 } = mapCoordsToSvg(d1.hotspots[0]?.coords[0] || 12.9716, d1.hotspots[0]?.coords[1] || 77.5946);
                        return arr.slice(i + 1, i + 3).map((d2, j) => {
                          const { cx: cx2, cy: cy2 } = mapCoordsToSvg(d2.hotspots[0]?.coords[0] || 12.9716, d2.hotspots[0]?.coords[1] || 77.5946);
                          return (
                            <line
                              key={`l-${i}-${j}`}
                              x1={cx1}
                              y1={cy1}
                              x2={cx2}
                              y2={cy2}
                              stroke="rgba(6,182,212,0.06)"
                              strokeWidth="1"
                            />
                          );
                        });
                      })}

                      {/* INCIDENTS LAYER */}
                      {incidents
                        .filter(inc => activeIncidentFilters.includes(inc.category) && activeRiskFilters.includes(districts.find(d => d.name === inc.location.district)?.riskLevel || 'Low'))
                        .map((inc, idx) => {
                          const { cx, cy } = mapCoordsToSvg(inc.location.coordinates[0], inc.location.coordinates[1]);
                          const offsetX = (idx % 5 - 2) * 2;
                          const offsetY = (Math.floor(idx / 5) % 5 - 2) * 2;
                          return (
                            <circle 
                              key={`inc-point-${inc.id}-${idx}`}
                              cx={cx + offsetX}
                              cy={cy + offsetY}
                              r="2.5"
                              fill="#22d3ee" 
                              stroke="#020617"
                              strokeWidth="0.5"
                              className="pointer-events-none opacity-90 shadow-sm"
                            />
                          );
                      })}

                      {/* Plotted District Nodes */}
                      {districts.filter(d => activeRiskFilters.includes(d.riskLevel)).map((d) => {
                        const mainHotspot = d.hotspots[0] || { coords: [12.9716, 77.5946] };
                        const { cx, cy } = mapCoordsToSvg(mainHotspot.coords[0], mainHotspot.coords[1]);
                        const isSelected = d.name === selectedDistrict || (compareMode && d.name === compareDistrict);
                        const isPrimarySelection = d.name === selectedDistrict;
                        const isSecondarySelection = compareMode && d.name === compareDistrict;

                        // Color by risk level
                        const colorClass = 
                          d.riskLevel === "Critical" ? "#ef4444" :
                          d.riskLevel === "High" ? "#f97316" :
                          d.riskLevel === "Medium" ? "#eab308" : "#10b981";

                        return (
                          <g 
                            key={d.name} 
                            className={`cursor-pointer group ${mapLayer !== 'hotspots' && !isSelected ? 'opacity-40' : 'opacity-100'} transition-opacity duration-300`}
                            onClick={() => {
                              if (compareMode) {
                                if (d.name !== selectedDistrict) {
                                  setCompareDistrict(d.name);
                                }
                              } else {
                                setSelectedDistrict(d.name);
                                setTimeout(() => {
                                  document.getElementById("live-district-profile")?.scrollIntoView({ 
                                    behavior: "smooth", 
                                    block: "nearest" 
                                  });
                                }, 30);
                              }
                            }}
                            onMouseEnter={() => {
                              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                              setHoveredDistrict({ d, cx, cy });
                            }}
                            onMouseLeave={() => {
                              hoverTimeoutRef.current = setTimeout(() => {
                                setHoveredDistrict(null);
                              }, 200);
                            }}
                          >
                            {/* Selected Pulsing Ring */}
                            {isSelected && (
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r="18" 
                                fill="none" 
                                stroke={isSecondarySelection ? "#a855f7" : colorClass} 
                                strokeWidth="1.5" 
                                className="radar-pulse"
                              />
                            )}

                            {/* Node Core */}
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={isSelected ? "8" : "5.5"} 
                              fill={isSelected ? "#ffffff" : colorClass} 
                              stroke="#020617" 
                              strokeWidth="2"
                              className={`transition-all duration-300 group-hover:scale-125 ${d.riskLevel === 'Critical' ? 'animate-pulse' : ''}`}
                            />

                            {/* Tooltip Label */}
                            <text
                              x={cx}
                              y={cy - 14}
                              textAnchor="middle"
                              fill={isSelected ? "#ffffff" : "#94a3b8"}
                              fontSize={isSelected ? "10" : "8.5"}
                              fontFamily="JetBrains Mono, monospace"
                              fontWeight={isSelected ? "bold" : "normal"}
                              className="opacity-90 group-hover:opacity-100 transition pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                            >
                              {d.name} ({d.crimeIndex})
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Floating Hover Tooltip */}
                    <AnimatePresence>
                      {hoveredDistrict && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: 10 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="absolute z-50 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl min-w-[200px] flex flex-col gap-2"
                          onMouseEnter={() => {
                            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                          }}
                          onMouseLeave={() => {
                            hoverTimeoutRef.current = setTimeout(() => {
                              setHoveredDistrict(null);
                            }, 200);
                          }}
                          style={{ 
                            left: `calc(${(hoveredDistrict.cx / 500) * 100}% + 10px)`, 
                            top: `calc(${(hoveredDistrict.cy / 520) * 100}% - 10px)`,
                            transform: "translate(-50%, -100%)"
                          }}
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
                            <span className="text-xs font-bold text-white tracking-tight">{hoveredDistrict.d.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase border ${
                              hoveredDistrict.d.riskLevel === 'Critical' ? 'bg-red-950/60 text-red-400 border-red-900/30' :
                              hoveredDistrict.d.riskLevel === 'High' ? 'bg-orange-950/60 text-orange-400 border-orange-900/30' :
                              hoveredDistrict.d.riskLevel === 'Medium' ? 'bg-yellow-950/60 text-yellow-400 border-yellow-900/30' :
                              'bg-emerald-950/60 text-emerald-400 border-emerald-900/30'
                            }`}>
                              {hoveredDistrict.d.riskLevel}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5 text-[11px] font-mono">
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Active Incidents:</span>
                              <strong className="text-cyan-400 font-bold">
                                {incidents.filter(i => i.location.district === hoveredDistrict.d.name).length}
                              </strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Yearly Crime Count:</span>
                              <strong className="text-slate-200">{hoveredDistrict.d.crimeCount}</strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Crime Index:</span>
                              <strong className="text-yellow-400">{hoveredDistrict.d.crimeIndex}/100</strong>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-1">
                            <button 
                              onClick={() => {
                                setMapPan({ x: 250 - hoveredDistrict.cx * 1.5, y: 260 - hoveredDistrict.cy * 1.5 });
                                setMapZoom(1.5);
                              }}
                              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] py-1 rounded transition"
                            >
                              Center Map
                            </button>
                            <button 
                              onClick={() => {
                                const dataStr = JSON.stringify(hoveredDistrict.d, null, 2);
                                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                                const exportFileDefaultName = `${hoveredDistrict.d.name.replace(/ /g, '_')}_profile.json`;
                                const linkElement = document.createElement('a');
                                linkElement.setAttribute('href', dataUri);
                                linkElement.setAttribute('download', exportFileDefaultName);
                                linkElement.click();
                              }}
                              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] py-1 rounded transition"
                            >
                              Export Details
                            </button>
                          </div>

                          <div className={`h-1 w-full rounded-full mt-1 ${
                            hoveredDistrict.d.riskLevel === 'Critical' ? 'bg-red-500' :
                            hoveredDistrict.d.riskLevel === 'High' ? 'bg-orange-500' :
                            hoveredDistrict.d.riskLevel === 'Medium' ? 'bg-yellow-500' :
                            'bg-emerald-500'
                          }`} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* SELECTED DISTRICT INTELLIGENCE & HEATMAPS (5 COLS) */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                  
                  {/* LIVE DISTRICT PROFILE */}
                  <div id="live-district-profile" className="bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/5 to-transparent pointer-events-none"></div>

                    {activeDistrictMetrics ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                          <div>
                            <span className="text-[10px] font-mono tracking-wider text-cyan-400 font-semibold uppercase">Selected District</span>
                            <h3 className="text-lg font-display font-bold text-white mt-0.5">{activeDistrictMetrics.name}</h3>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2.5 py-1 text-xs font-mono border rounded uppercase font-semibold ${
                              activeDistrictMetrics.riskLevel === "Critical" ? "bg-red-950/40 border-red-900 text-red-400" :
                              activeDistrictMetrics.riskLevel === "High" ? "bg-orange-950/40 border-orange-900 text-orange-400" :
                              activeDistrictMetrics.riskLevel === "Medium" ? "bg-yellow-950/40 border-yellow-900 text-yellow-400" :
                              "bg-emerald-950/40 border-emerald-900 text-emerald-400"
                            }`}>
                              {activeDistrictMetrics.riskLevel} Risk
                            </span>
                            <button
                              onClick={async () => {
                                const profileEl = document.getElementById('live-district-profile');
                                if (profileEl) {
                                  try {
                                    const canvas = await html2canvas(profileEl, { backgroundColor: '#020617' });
                                    const imgData = canvas.toDataURL('image/png');
                                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
                                    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                                    pdf.save(`${activeDistrictMetrics.name.replace(/\s+/g, '_')}_Report.pdf`);
                                  } catch (err) {
                                    console.error('Error generating PDF:', err);
                                  }
                                }
                              }}
                              className="text-[9px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-400 px-2 py-1 rounded transition flex items-center gap-1 border border-slate-800"
                            >
                              <Download className="w-3 h-3" />
                              Export PDF
                            </button>
                          </div>
                        </div>

                        {/* RATING GAUGE */}
                        <div className="grid grid-cols-3 gap-3.5">
                          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Crime Index</span>
                            <span className="text-xl font-display font-bold text-white font-mono">{activeDistrictMetrics.crimeIndex}<span className="text-xs text-slate-500">/100</span></span>
                            <div className="w-full bg-slate-850 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  activeDistrictMetrics.crimeIndex > 75 ? 'bg-red-500' :
                                  activeDistrictMetrics.crimeIndex > 55 ? 'bg-orange-500' :
                                  activeDistrictMetrics.crimeIndex > 35 ? 'bg-yellow-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${activeDistrictMetrics.crimeIndex}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-1 justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Total Logged</span>
                              <span className="text-xl font-display font-bold text-white block mt-0.5 font-mono">{activeDistrictMetrics.crimeCount}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono">FIR Count / Year</span>
                          </div>

                          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex flex-col gap-1 justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Patrol Units</span>
                              <span className="text-xl font-display font-bold text-cyan-400 block mt-0.5 font-mono">{activeDistrictMetrics.patrolAvailable}</span>
                            </div>
                            <span className="text-[9px] text-emerald-500 font-mono">● Active Beat</span>
                          </div>
                        </div>

                        {/* 7-DAY TREND */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
                          <span className="text-[10px] font-mono text-slate-400 font-semibold tracking-wider uppercase">7-Day Crime Index Trend</span>
                          <div className="h-16 w-full mt-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={
                                activeDistrictMetrics.trend7Day 
                                  ? activeDistrictMetrics.trend7Day.map((val, i) => ({ day: i, value: val }))
                                  : Array.from({length: 7}, (_, i) => ({ day: i, value: Math.max(0, activeDistrictMetrics.crimeIndex + Math.sin(i)*10 + (i%2 === 0 ? 5 : -5)) }))
                              }>
                                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                                <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2, fill: '#22d3ee' }} isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* TACTICAL INSIGHTS */}
                        {(() => {
                          const districtIncidents = incidents.filter(i => i.location.district === activeDistrictMetrics.name);
                          const categoryCounts = districtIncidents.reduce((acc, inc) => {
                            acc[inc.category] = (acc[inc.category] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);
                          const topCategories = Object.entries(categoryCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3);
                          
                          if (topCategories.length === 0) return null;
                          
                          return (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-slate-400 font-semibold tracking-wider uppercase flex items-center gap-1.5"><TrendingUp className="w-3 h-3 text-cyan-400"/> Tactical Insights (Top Issues)</span>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      const textToRead = `Tactical Insights for ${activeDistrictMetrics.name}. The top crime categories are: ${topCategories.map(([cat, count]) => `${count} records of ${cat}`).join(', ')}. Recommend preemptive patrol staging.`;
                                      const utterance = new SpeechSynthesisUtterance(textToRead);
                                      window.speechSynthesis.speak(utterance);
                                    }}
                                    className="text-[9px] font-mono bg-cyan-950/40 border border-cyan-900/50 hover:bg-cyan-900/60 text-cyan-400 px-2 py-0.5 rounded transition flex items-center gap-1"
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                    Narrate
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      const shareText = `Tactical Insights for ${activeDistrictMetrics.name}:\n${topCategories.map(([cat, count], idx) => `${idx + 1}. ${cat} (${count} records)`).join('\n')}`;
                                      try {
                                        if (navigator.share) {
                                          await navigator.share({
                                            title: `Tactical Insights - ${activeDistrictMetrics.name}`,
                                            text: shareText,
                                          });
                                        } else {
                                          await navigator.clipboard.writeText(shareText);
                                          alert("Insights copied to clipboard!");
                                        }
                                      } catch (err) {
                                        console.error("Error sharing:", err);
                                      }
                                    }}
                                    className="text-[9px] font-mono bg-cyan-950/40 border border-cyan-900/50 hover:bg-cyan-900/60 text-cyan-400 px-2 py-0.5 rounded transition flex items-center gap-1"
                                  >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                    Share
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5 mt-1">
                                {topCategories.map(([cat, count], idx) => (
                                  <div key={cat} className="flex justify-between items-center text-xs font-mono">
                                    <span className="text-slate-300 flex items-center gap-1.5"><span className="text-slate-500">{idx + 1}.</span> {cat}</span>
                                    <span className="text-cyan-400 font-semibold">{count} record{count !== 1 ? 's' : ''}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* PREDICTIVE RISK WARNING */}
                        <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-3 flex gap-3 items-start relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl -mr-10 -mt-10 rounded-full pointer-events-none"></div>
                          <div className="mt-0.5 z-10">
                            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                          </div>
                          <div className="flex flex-col gap-1 z-10">
                            <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">Predictive Risk Forecast (24h)</span>
                            <p className="text-xs text-rose-200/80 leading-relaxed">
                              Historical pattern analysis indicates a <strong className="text-rose-300">{(activeDistrictMetrics.crimeIndex * 0.85).toFixed(1)}% probability</strong> of incident clustering in the northern sector between 18:00 and 02:00. Recommend preemptive patrol staging.
                            </p>
                          </div>
                        </div>

                        {/* DISTRICT HOTSPOTS */}
                        <div className="flex flex-col gap-2.5">
                          <span className="text-xs font-mono text-slate-400 font-semibold tracking-wider uppercase border-b border-slate-900 pb-2">
                            Regional Hotspot Analysis
                          </span>
                          <div className="flex flex-col gap-2">
                            {activeDistrictMetrics.hotspots?.map((hot) => (
                              <div key={hot.area} className="bg-slate-900/40 border border-slate-900 px-3.5 py-2.5 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></div>
                                  <div>
                                    <h4 className="text-xs font-semibold text-slate-200">{hot.area}</h4>
                                    <span className="text-[10px] text-slate-500 font-mono">Coords: {hot.coords[0].toFixed(4)}, {hot.coords[1].toFixed(4)}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-mono font-bold text-slate-300">{hot.risk}% Risk</span>
                                  <span className="text-[9px] text-rose-500 block font-mono">CRITICAL THREAT</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* PREDICTION SUMMARY NOTE */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex gap-2.5 text-xs text-slate-400 leading-relaxed font-mono">
                          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <p>
                            Digital Twin predictive models show that deploying an additional <strong>3 patrol units</strong> in <strong>{activeDistrictMetrics.name}</strong> will decrease local risk ratings by <strong>12-15%</strong> within 48 hours. Use the <strong>Simulation Engine</strong> tab to model custom tactical interventions.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-slate-500 text-center py-12">No district selected.</p>
                    )}
                  </div>

                  {/* INCIDENT DETAILS TRACKER */}
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col gap-3.5">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <h3 className="text-xs font-mono font-semibold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        District Incident Ledger
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                        {incidents.filter(i => i.location.district === selectedDistrict).length} Incidents
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto">
                      {incidents.filter(i => i.location.district === selectedDistrict).length === 0 ? (
                        <p className="text-xs text-slate-500 font-mono py-8 text-center">
                          No recent incidents logged for {selectedDistrict}. Ingest documents via EvidenceFlow AI to register crime records.
                        </p>
                      ) : (
                        incidents.filter(i => i.location.district === selectedDistrict).map((inc) => (
                          <div 
                            key={inc.id} 
                            onClick={() => setSelectedIncident(inc)}
                            className={`p-3 rounded-lg border cursor-pointer transition flex flex-col gap-2 ${
                              selectedIncident?.id === inc.id ? 'bg-slate-900 border-cyan-800' : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">{inc.category}</span>
                              <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded uppercase ${
                                inc.severity === "Critical" ? "bg-red-950/60 text-red-400 border border-red-900/30" :
                                inc.severity === "High" ? "bg-orange-950/60 text-orange-400 border border-orange-900/30" :
                                "bg-yellow-950/60 text-yellow-400 border border-yellow-900/30"
                              }`}>
                                {inc.severity}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{inc.title}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{inc.description}</p>
                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono border-t border-slate-800/40 pt-1.5 mt-0.5">
                              <span>Location: {inc.location.area}</span>
                              <span>{inc.date} | {inc.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 2: EVIDENCEFLOW AI (INGESTION & EXTRACTION) */}
            {activeTab === 'evidenceflow' && (
              <motion.div 
                key="evidenceflow"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-5"
              >
                {/* DOCUMENT INPUT BLOCK (6 COLS) */}
                <div className="lg:col-span-6 bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      EvidenceFlow AI: Document Ingestion Console
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Ingest unstructured FIR forms, witness reports, or cell records into statewide database</p>
                  </div>

                  {/* PRELOADED FIR DEMO CLICKS */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Demo Quick-Presets (1-Click Tryout)</span>
                    <div className="flex flex-col gap-1.5">
                      {SAMPLE_DOCS.map((doc, i) => (
                        <button
                          key={i}
                          onClick={() => setDocText(doc.text)}
                          className="text-left text-xs bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white px-3 py-2.5 rounded-lg border border-slate-800/80 hover:border-slate-700 transition flex items-center gap-2 font-mono"
                        >
                          <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-900/60">Sample {i+1}</span>
                          <span className="truncate">{doc.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TEXT AREA */}
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea
                      value={docText}
                      onChange={(e) => setDocText(e.target.value)}
                      placeholder="Paste raw, messy police document, handwritten FIR transcript, call logs or vehicle scan records here..."
                      className="w-full h-[260px] bg-slate-900/80 border border-slate-850 focus:border-cyan-500 rounded-xl p-3.5 text-xs font-mono leading-relaxed text-slate-200 focus:outline-none resize-none transition"
                    ></textarea>
                    
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing || !docText.trim()}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {analyzing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>RUNNING ADVANCED NER & KNOWLEDGE EXTRACTION...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>ANALYZE EVIDENCE WITH GEMINI 3.5-FLASH</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* EXTRACTION RESULTS (6 COLS) */}
                <div className="lg:col-span-6 bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        AI Extraction Output & Validations
                      </h2>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Structured entities and data discrepancy alerts</p>
                    </div>
                    {newlyAnalyzed && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded font-mono uppercase font-bold animate-pulse">
                        New Ingest
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[500px] flex flex-col gap-4 pr-1">
                    {selectedIncident ? (
                      <div className="flex flex-col gap-4">
                        
                        {/* CASE HEAD */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">{selectedIncident.category}</span>
                            <span className="text-xs font-mono text-slate-500">Case ID: {selectedIncident.id}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white">{selectedIncident.title}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">{selectedIncident.description}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-500">
                            <span>District: <strong>{selectedIncident.location.district} ({selectedIncident.location.area})</strong></span>
                            <span>Time: <strong>{selectedIncident.date} {selectedIncident.time}</strong></span>
                          </div>
                        </div>

                        {/* EVIDENCE SCORE */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-900/40 border border-slate-900 rounded-xl p-3">
                          <div className="md:col-span-4 flex flex-col items-center border-r border-slate-900 pr-2">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Completeness</span>
                            <div className="text-2xl font-display font-bold text-cyan-400 font-mono mt-1">{selectedIncident.evidenceCompleteness}%</div>
                          </div>
                          <div className="md:col-span-8 text-xs text-slate-400 leading-relaxed font-mono">
                            <p>
                              Overall report fidelity score of this case. High completeness indicates key fields (witnesses, phones, and location) are successfully populated.
                            </p>
                          </div>
                        </div>

                        {/* EXTRACTED ENTITIES TAGS */}
                        <div className="flex flex-col gap-2.5">
                          <h4 className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider border-b border-slate-900 pb-1">
                            Named Entity Recognition (NER) Output
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            
                            {/* Suspects */}
                            <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg flex flex-col gap-1.5">
                              <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">Suspects</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedIncident.extractedEntities.suspects.length === 0 ? <span className="text-[11px] text-slate-600 font-mono">None detected</span> : 
                                  selectedIncident.extractedEntities.suspects.map(s => <span key={s} className="text-[10px] bg-rose-950/40 border border-rose-900/30 text-rose-400 px-1.5 py-0.5 rounded font-mono">{s}</span>)
                                }
                              </div>
                            </div>

                            {/* Victims */}
                            <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg flex flex-col gap-1.5">
                              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Victims</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedIncident.extractedEntities.victims.length === 0 ? <span className="text-[11px] text-slate-600 font-mono">None detected</span> : 
                                  selectedIncident.extractedEntities.victims.map(s => <span key={s} className="text-[10px] bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded font-mono">{s}</span>)
                                }
                              </div>
                            </div>

                            {/* Vehicles */}
                            <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg flex flex-col gap-1.5">
                              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Vehicles</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedIncident.extractedEntities.vehicles.length === 0 ? <span className="text-[11px] text-slate-600 font-mono">None detected</span> : 
                                  selectedIncident.extractedEntities.vehicles.map(s => <span key={s} className="text-[10px] bg-cyan-950/40 border border-cyan-900/30 text-cyan-400 px-1.5 py-0.5 rounded font-mono">{s}</span>)
                                }
                              </div>
                            </div>

                            {/* Weapons */}
                            <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg flex flex-col gap-1.5">
                              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">Weapons</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedIncident.extractedEntities.weapons.length === 0 ? <span className="text-[11px] text-slate-600 font-mono">None detected</span> : 
                                  selectedIncident.extractedEntities.weapons.map(s => <span key={s} className="text-[10px] bg-amber-950/40 border border-amber-900/30 text-amber-400 px-1.5 py-0.5 rounded font-mono">{s}</span>)
                                }
                              </div>
                            </div>

                            {/* Phones */}
                            <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg flex flex-col gap-1.5">
                              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">Mobile Phones</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedIncident.extractedEntities.phones.length === 0 ? <span className="text-[11px] text-slate-600 font-mono">None detected</span> : 
                                  selectedIncident.extractedEntities.phones.map(s => <span key={s} className="text-[10px] bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 px-1.5 py-0.5 rounded font-mono">{s}</span>)
                                }
                              </div>
                            </div>

                            {/* Organizations */}
                            <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg flex flex-col gap-1.5">
                              <span className="text-[10px] font-mono text-fuchsia-400 font-bold uppercase tracking-wider">Organizations</span>
                              <div className="flex flex-wrap gap-1">
                                {selectedIncident.extractedEntities.organizations.length === 0 ? <span className="text-[11px] text-slate-600 font-mono">None detected</span> : 
                                  selectedIncident.extractedEntities.organizations.map(s => <span key={s} className="text-[10px] bg-fuchsia-950/40 border border-fuchsia-900/30 text-fuchsia-400 px-1.5 py-0.5 rounded font-mono">{s}</span>)
                                }
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* DATA CHECKS & ALERT CHECKS */}
                        <div className="flex flex-col gap-2 bg-slate-900/40 border border-slate-900 rounded-xl p-4">
                          <h4 className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            Data Contradiction & Validation Alerts
                          </h4>
                          <div className="flex flex-col gap-1.5 font-mono text-xs">
                            {selectedIncident.validationAlerts?.length === 0 ? (
                              <div className="flex items-center gap-2 text-emerald-400 py-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Complete validation check successful. No discrepancies detected in document chronologies or signatures.</span>
                              </div>
                            ) : (
                              selectedIncident.validationAlerts?.map((alertStr, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-rose-300 bg-rose-950/15 border border-rose-900/30 px-3 py-2 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                  <span className="leading-relaxed text-[11px]">{alertStr}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-500 font-mono">
                        Select a sample preset or enter text and click Analyze to test.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: CRIME KNOWLEDGE GRAPH */}
            {activeTab === 'knowledgegraph' && (
              <motion.div 
                key="knowledgegraph"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col gap-4"
              >
                <div className="flex justify-between items-start border-b border-slate-900 pb-3 flex-wrap gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <Network className="w-4 h-4 text-cyan-400 animate-pulse" />
                      Statewide Crime Knowledge Graph Explorer
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Explore relationships between suspects, victims, phone numbers, weapons, and incident ledgers</p>
                  </div>

                  {/* KNOWLEDGE SEARCH AND FILTER TOOLS */}
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search entities..."
                        className="bg-slate-900 border border-slate-850 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-cyan-500 w-[200px] font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-1">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select 
                        value={graphFilter} 
                        onChange={(e) => setGraphFilter(e.target.value)}
                        className="bg-transparent text-slate-300 font-mono focus:outline-none text-[11px]"
                      >
                        <option value="all">All Entities</option>
                        <option value="Person">Suspects/Victims</option>
                        <option value="Vehicle">Vehicles</option>
                        <option value="Weapon">Weapons</option>
                        <option value="Phone">Mobile Phones</option>
                        <option value="Organization">Organizations</option>
                        <option value="Incident">Incidents</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleDownloadGraphData}
                      className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 transition font-mono"
                      title="Download Graph Data (JSON)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Data</span>
                    </button>
                  </div>
                </div>

                {/* VISUAL SVG NODE-LINK PLOTTER */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Graph Canvas Block (8 cols) */}
                  <div className="lg:col-span-8 bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex flex-col justify-center items-center min-h-[480px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

                    {/* RENDER DYNAMIC SVG CHART */}
                    <svg viewBox="0 0 700 460" className="w-full max-w-[660px] h-auto">
                      <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
                        </marker>
                      </defs>

                      {/* Render lines / edges */}
                      {filteredEdges.map((edge) => {
                        // Locate source and target positions
                        const idxS = filteredNodes.findIndex(n => n.id === edge.source);
                        const idxT = filteredNodes.findIndex(n => n.id === edge.target);
                        if (idxS === -1 || idxT === -1) return null;

                        // Circular dynamic coordinates simulation
                        const total = filteredNodes.length;
                        const radius = 170;
                        const centerX = 350;
                        const centerY = 230;

                        const x1 = centerX + radius * Math.cos((idxS / total) * 2 * Math.PI);
                        const y1 = centerY + radius * Math.sin((idxS / total) * 2 * Math.PI);
                        
                        const x2 = centerX + radius * Math.cos((idxT / total) * 2 * Math.PI);
                        const y2 = centerY + radius * Math.sin((idxT / total) * 2 * Math.PI);

                        const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

                        return (
                          <g key={edge.id}>
                            <line
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={isHighlighted ? "#06b6d4" : "rgba(51, 65, 85, 0.45)"}
                              strokeWidth={isHighlighted ? "2" : "1"}
                              markerEnd="url(#arrow)"
                              className="transition"
                            />
                            {/* Label text in middle */}
                            <text
                              x={(x1 + x2) / 2}
                              y={(y1 + y2) / 2 - 3}
                              textAnchor="middle"
                              fill={isHighlighted ? "#06b6d4" : "#475569"}
                              fontSize="8"
                              fontFamily="JetBrains Mono"
                              className="opacity-70 group-hover:opacity-100 select-none"
                            >
                              {edge.type}
                            </text>
                          </g>
                        );
                      })}

                      {/* Render Nodes / Circles */}
                      {filteredNodes.map((node, idx) => {
                        const total = filteredNodes.length;
                        const radius = 170;
                        const centerX = 350;
                        const centerY = 230;

                        // Distribute nodes evenly in circle for absolute clean spacing!
                        const x = centerX + radius * Math.cos((idx / total) * 2 * Math.PI);
                        const y = centerY + radius * Math.sin((idx / total) * 2 * Math.PI);

                        const isSelected = selectedNode?.id === node.id;
                        
                        // Node Colors based on Type
                        const colorClass = 
                          node.type === "Incident" ? "#ef4444" :
                          node.type === "Person" ? "#f97316" :
                          node.type === "Vehicle" ? "#06b6d4" :
                          node.type === "Weapon" ? "#eab308" :
                          node.type === "Phone" ? "#6366f1" : "#d946ef";

                        return (
                          <g 
                            key={node.id} 
                            transform={`translate(${x}, ${y})`}
                            onClick={() => setSelectedNode(node)}
                            className="cursor-pointer group"
                          >
                            <circle 
                              r={isSelected ? "14" : "10"}
                              fill={isSelected ? "#ffffff" : colorClass}
                              stroke="#020617"
                              strokeWidth="2.5"
                              className="transition-all duration-300 group-hover:scale-125"
                            />
                            
                            {/* Short text tags */}
                            <text
                              y={isSelected ? "25" : "20"}
                              textAnchor="middle"
                              fill={isSelected ? "#ffffff" : "#94a3b8"}
                              fontSize="8"
                              fontFamily="JetBrains Mono"
                              fontWeight={isSelected ? "bold" : "normal"}
                              className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition select-none"
                            >
                              {node.label.split(" ")[0]}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Relationship Inspector Panel (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col gap-4 bg-slate-900/40 border border-slate-900 rounded-xl p-4">
                    <h3 className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-850 pb-2">
                      Relationship Investigator
                    </h3>

                    {selectedNode ? (
                      <div className="flex flex-col gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-1">
                          <span className="text-[9px] font-mono text-cyan-400 uppercase">{selectedNode.type} Entity</span>
                          <h4 className="text-sm font-bold text-white mt-0.5">{selectedNode.label}</h4>
                          <span className="text-[10px] text-slate-500 font-mono mt-1">ID: {selectedNode.id}</span>
                        </div>

                        {/* Associated Links */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                            Direct Connected Links
                          </span>
                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                            {graph.edges
                              .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                              .map(edge => {
                                const sourceNode = graph.nodes.find(n => n.id === edge.source);
                                const targetNode = graph.nodes.find(n => n.id === edge.target);
                                const otherNode = edge.source === selectedNode.id ? targetNode : sourceNode;
                                
                                return (
                                  <div key={edge.id} className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-lg flex flex-col gap-1">
                                    <div className="flex justify-between items-center text-[10px] font-mono">
                                      <span className="text-cyan-400 font-semibold">{edge.type}</span>
                                      <span className="text-slate-600">{otherNode?.type}</span>
                                    </div>
                                    <h5 className="text-xs font-bold text-slate-200">{otherNode?.label}</h5>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        <button 
                          onClick={() => setSelectedNode(null)}
                          className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs py-2 rounded border border-slate-800 transition font-mono"
                        >
                          Clear Selection
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-xs text-slate-500 font-mono">
                        <Network className="w-8 h-8 stroke-[1.2] text-slate-700 mb-2" />
                        <span>Click any node in the circular network to isolate its connections and trace investigative relationships in real time.</span>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 4: SIMULATION ENGINE (INTERVENTIONS FORECAST) */}
            {activeTab === 'simulation' && (
              <motion.div 
                key="simulation"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-5"
              >
                {/* INTERVENTION CONFIG FORM (5 COLS) */}
                <div className="lg:col-span-5 bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      Intervention Modeling Sandbox
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Model strategic resource adjustments and forecast risk mitigation impacts</p>
                  </div>

                  <div className="flex flex-col gap-3.5 mt-2">
                    
                    {/* District selection */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Target District</label>
                      <select
                        value={simDistrict}
                        onChange={(e) => setSimDistrict(e.target.value)}
                        className="bg-slate-900 border border-slate-850 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                      >
                        {districts.map(d => (
                          <option key={d.name} value={d.name}>{d.name} (Risk: {d.crimeIndex})</option>
                        ))}
                      </select>
                    </div>

                    {/* Intervention Type */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Intervention Strategy</label>
                      <select
                        value={simIntervention}
                        onChange={(e) => setSimIntervention(e.target.value as any)}
                        className="bg-slate-900 border border-slate-850 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                      >
                        <option value="Patrol Reallocation">Patrol Reallocation (Beat Saturation)</option>
                        <option value="Temporary Checkpoints">Temporary Checkpoints Mesh</option>
                        <option value="Street Lighting">Smart Street Lighting & Infra</option>
                        <option value="Drone Surveillance">Tactical Drone Surveillance</option>
                        <option value="Community Outreach">Community Policing Outreach</option>
                      </select>
                    </div>

                    {/* Simulation parameters description */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Simulation Parameters & Directives</label>
                      <textarea
                        value={simDetails}
                        onChange={(e) => setSimDetails(e.target.value)}
                        placeholder="Define custom simulation directives, weather, local festival impacts or exact unit shifts... e.g., 'Deploy 3 extra SUVs from Gokulam to Devaraja market during Mysore Dussehra festival.'"
                        className="bg-slate-900 border border-slate-850 focus:border-cyan-500 rounded-lg p-3 text-xs text-slate-200 font-mono h-[140px] focus:outline-none resize-none transition"
                      ></textarea>
                    </div>

                    <button
                      onClick={handleRunSimulation}
                      disabled={simulating}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 font-mono text-xs"
                    >
                      {simulating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>AI RUNNING COMPUTATIONAL FORECASTING...</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          <span>RUN AI PREDICTIVE SIMULATION</span>
                        </>
                      )}
                    </button>

                  </div>
                </div>

                {/* FORECASTING OUTCOME (7 COLS) */}
                <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-xl p-5 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-slate-100 border-b border-slate-900 pb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    AI Outcome Projections & Impact Forecast
                  </h2>

                  {simResult ? (
                    <div className="flex flex-col gap-5">
                      
                      {/* GAUGE CONTRAST DISPLAY */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Baseline Crime Risk</span>
                          <div className="text-3xl font-display font-bold text-slate-300 font-mono mt-1.5">{simResult.baselineRisk}</div>
                          <span className="text-[9px] text-slate-500 font-mono mt-1 uppercase">Before Deployment</span>
                        </div>

                        <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-cyan-500/10 to-transparent pointer-events-none"></div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">Projected Crime Risk</span>
                          <div className="text-4xl font-display font-bold text-cyan-400 font-mono mt-1.5">
                            {simResult.projectedRisk}
                          </div>
                          <span className="text-[9px] text-emerald-400 font-mono mt-1 uppercase font-bold">
                            ↓ {simResult.baselineRisk - simResult.projectedRisk}% Mitigation
                          </span>
                        </div>

                      </div>

                      {/* STATS */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg flex items-center gap-3">
                          <DollarSign className="w-6 h-6 text-yellow-500 shrink-0" />
                          <div>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Estimated Budget</span>
                            <span className="text-sm font-bold text-slate-200 block font-mono">₹{simResult.cost.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-cyan-400 shrink-0" />
                          <div>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Forecast Confidence</span>
                            <span className="text-sm font-bold text-cyan-400 block font-mono">{simResult.confidence}%</span>
                          </div>
                        </div>
                      </div>

                      {/* TEXTUAL EXPLANATORY REASONING */}
                      <div className="flex flex-col gap-2.5 bg-slate-900/40 border border-slate-900 rounded-xl p-4">
                        <h4 className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider border-b border-slate-850 pb-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                          Generative Tactical Impact Forecast
                        </h4>
                        <p className="text-xs font-mono leading-relaxed text-slate-300">
                          {simResult.benefit}
                        </p>
                      </div>

                      {/* NOTICE BANNER */}
                      <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl text-[11px] text-slate-400 leading-relaxed font-mono flex gap-2">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>The simulation projection was generated using localized predictive equations coupled with spatial context grids. This data assists Command Center coordinators in testing resource plans before live field execution.</span>
                      </div>

                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-xs text-slate-500 font-mono">
                      <Sliders className="w-8 h-8 stroke-[1.2] text-slate-700 mb-2" />
                      <span>Adjust the modeling parameters on the left and click 'Run Simulation' to load predictive outputs.</span>
                    </div>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </section>

      </main>

      {/* COMPARE DISTRICTS MODAL */}
      <AnimatePresence>
        {compareMode && compareDistrict && activeDistrictMetrics && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setCompareDistrict(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-xl max-w-5xl w-full flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M16 3h5v5"></path><path d="M4 21h5v-5"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg>
                  Tactical Comparison
                </h3>
                <button 
                  onClick={() => setCompareDistrict(null)}
                  className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 p-5 gap-6">
                {/* District A (Selected) */}
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono tracking-wider text-cyan-400 font-semibold uppercase">Primary</span>
                      <h4 className="text-xl font-bold text-white mt-0.5">{activeDistrictMetrics.name}</h4>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-mono border rounded uppercase font-semibold ${
                      activeDistrictMetrics.riskLevel === "Critical" ? "bg-red-950/40 border-red-900 text-red-400" :
                      activeDistrictMetrics.riskLevel === "High" ? "bg-orange-950/40 border-orange-900 text-orange-400" :
                      activeDistrictMetrics.riskLevel === "Medium" ? "bg-yellow-950/40 border-yellow-900 text-yellow-400" :
                      "bg-emerald-950/40 border-emerald-900 text-emerald-400"
                    }`}>
                      {activeDistrictMetrics.riskLevel} Risk
                    </span>
                  </div>
                  
                  <div className="bg-slate-950/50 rounded-lg p-4 grid grid-cols-2 gap-4 border border-slate-800/50">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Crime Index</span>
                      <p className="text-xl font-bold font-mono text-slate-200">{activeDistrictMetrics.crimeIndex}<span className="text-xs text-slate-500">/100</span></p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Patrol Units</span>
                      <p className="text-xl font-bold font-mono text-cyan-400">{activeDistrictMetrics.patrolAvailable}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Total Logged</span>
                      <p className="text-xl font-bold font-mono text-slate-200">{activeDistrictMetrics.crimeCount}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Active Hotspots</span>
                      <p className="text-xl font-bold font-mono text-orange-400">{activeDistrictMetrics.hotspots.length}</p>
                    </div>
                  </div>
                </div>

                {/* District B (Compare) */}
                {(() => {
                  const compDist = districts.find(d => d.name === compareDistrict);
                  if (!compDist) return null;
                  return (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono tracking-wider text-purple-400 font-semibold uppercase">Comparison</span>
                          <h4 className="text-xl font-bold text-white mt-0.5">{compDist.name}</h4>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-mono border rounded uppercase font-semibold ${
                          compDist.riskLevel === "Critical" ? "bg-red-950/40 border-red-900 text-red-400" :
                          compDist.riskLevel === "High" ? "bg-orange-950/40 border-orange-900 text-orange-400" :
                          compDist.riskLevel === "Medium" ? "bg-yellow-950/40 border-yellow-900 text-yellow-400" :
                          "bg-emerald-950/40 border-emerald-900 text-emerald-400"
                        }`}>
                          {compDist.riskLevel} Risk
                        </span>
                      </div>
                      
                      <div className="bg-slate-950/50 rounded-lg p-4 grid grid-cols-2 gap-4 border border-slate-800/50">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Crime Index</span>
                          <p className="text-xl font-bold font-mono text-slate-200">{compDist.crimeIndex}<span className="text-xs text-slate-500">/100</span></p>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Patrol Units</span>
                          <p className="text-xl font-bold font-mono text-purple-400">{compDist.patrolAvailable}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Total Logged</span>
                          <p className="text-xl font-bold font-mono text-slate-200">{compDist.crimeCount}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Active Hotspots</span>
                          <p className="text-xl font-bold font-mono text-orange-400">{compDist.hotspots.length}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 mt-12 py-5 px-6 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
        <p className="font-mono">
          &copy; {new Date().getFullYear()} CRIMEVERSE AI CORE. DEPLOYED IN SECURE CONTAINER ENV.
        </p>
        <div className="flex gap-4 font-mono">
          <a href="#" className="hover:text-slate-300 transition">TERMS OF PATROL SERVICE</a>
          <span>|</span>
          <a href="#" className="hover:text-slate-300 transition">INTELLIGENCE ENCRYPT PORTAL</a>
        </div>
      </footer>
    </div>
  );
}
