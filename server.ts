import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Incident, 
  EntityNode, 
  EntityEdge, 
  DistrictMetrics, 
  SimulationScenario, 
  ActionRecommendation, 
  AlertNotification 
} from "./src/types";

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini API initialized successfully.");
    } catch (err) {
      console.error("Failed to initialize Gemini API:", err);
    }
  }
  return aiClient;
}

// ==========================================
// IN-MEMORY DATABASE & SEED DATA
// ==========================================

const INITIAL_DISTRICTS: DistrictMetrics[] = [
  {
    name: "Bengaluru Urban",
    crimeIndex: 78,
    crimeCount: 1240,
    patrolAvailable: 45,
    riskLevel: "High",
    hotspots: [
      { area: "Koramangala", risk: 82, coords: [12.9352, 77.6244] },
      { area: "Majestic Bus Station", risk: 91, coords: [12.9779, 77.5721] },
      { area: "Indiranagar", risk: 75, coords: [12.9784, 77.6408] }
    ]
  },
  {
    name: "Mysuru",
    crimeIndex: 42,
    crimeCount: 380,
    patrolAvailable: 18,
    riskLevel: "Medium",
    hotspots: [
      { area: "Devaraja Market", risk: 55, coords: [12.3115, 76.6521] },
      { area: "Mysuru Palace Precincts", risk: 45, coords: [12.3051, 76.6552] }
    ]
  },
  {
    name: "Hubballi-Dharwad",
    crimeIndex: 65,
    crimeCount: 710,
    patrolAvailable: 22,
    riskLevel: "High",
    hotspots: [
      { area: "Hubli Junction", risk: 78, coords: [15.3524, 75.1481] },
      { area: "Koppikar Road", risk: 62, coords: [15.3611, 75.1394] }
    ]
  },
  {
    name: "Mangaluru",
    crimeIndex: 52,
    crimeCount: 460,
    patrolAvailable: 15,
    riskLevel: "Medium",
    hotspots: [
      { area: "Hampankatta", risk: 64, coords: [12.8712, 74.8431] },
      { area: "Panambur Beach", risk: 48, coords: [12.9405, 74.8211] }
    ]
  },
  {
    name: "Belagavi",
    crimeIndex: 48,
    crimeCount: 390,
    patrolAvailable: 12,
    riskLevel: "Medium",
    hotspots: [
      { area: "Khade Bazar", risk: 58, coords: [15.8521, 74.5042] }
    ]
  },
  {
    name: "Kalaburagi",
    crimeIndex: 72,
    crimeCount: 820,
    patrolAvailable: 14,
    riskLevel: "High",
    hotspots: [
      { area: "Super Market Area", risk: 81, coords: [17.3361, 76.8395] },
      { area: "Maktampura", risk: 76, coords: [17.3195, 76.8288] }
    ]
  },
  {
    name: "Shivamogga",
    crimeIndex: 38,
    crimeCount: 290,
    patrolAvailable: 10,
    riskLevel: "Low",
    hotspots: [
      { area: "Nehru Road", risk: 45, coords: [13.9315, 75.5645] }
    ]
  },
  {
    name: "Udupi",
    crimeIndex: 25,
    crimeCount: 180,
    patrolAvailable: 9,
    riskLevel: "Low",
    hotspots: [
      { area: "Malpe Harbour", risk: 35, coords: [13.3481, 74.7042] }
    ]
  }
];

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "inc-101",
    title: "Armed Robbery at Jeweler shop",
    description: "Three masked suspects entered 'Venkateshwara Jewelers' in Majestic, Bengaluru on Tuesday evening. They threatened the shop owner with a local pistol and fled on an unregistered black Pulsar motorcycle carrying approximately 2kg of gold ornaments. Mobile phone triangulations near the tower show activity matching suspect Rahim.",
    category: "Theft",
    severity: "High",
    date: "2026-07-07",
    time: "19:15",
    location: {
      district: "Bengaluru Urban",
      area: "Majestic Bus Station",
      coordinates: [12.9779, 77.5721]
    },
    extractedEntities: {
      suspects: ["Rahim", "Two Masked Accomplices"],
      victims: ["Venkatesh Rao (Shop Owner)"],
      vehicles: ["Black Pulsar Motorcycle"],
      weapons: ["Country Pistol"],
      phones: ["9845011223", "9845099887"],
      organizations: ["Majestic Criminal Gang"]
    },
    status: "Investigating",
    evidenceCompleteness: 85,
    validationAlerts: ["Conflict: Mobile phone tower 9845011223 registered in Koramangala 10 minutes before Majestic heist (physically impossible speed)."],
    sourceDocument: "FIR No: 234/2026, Majestic Police Station, Karnataka."
  },
  {
    id: "inc-102",
    title: "Corporate Wire Fraud scam",
    description: "A fraud syndicate mimicking corporate email addresses spoofed 'TVS Tech Solutions' in Koramangala, leading to an unauthorized transfer of INR 45 Lakhs into a series of shell bank accounts managed under the name 'Duniya Enterprises'. The wire originated from an IP address in Kalaburagi.",
    category: "Fraud",
    severity: "Medium",
    date: "2026-07-05",
    time: "11:30",
    location: {
      district: "Bengaluru Urban",
      area: "Koramangala",
      coordinates: [12.9352, 77.6244]
    },
    extractedEntities: {
      suspects: ["Unknown Phisher", "Duniya Enterprises"],
      victims: ["TVS Tech Solutions", "Ramesh Kumar (CFO)"],
      vehicles: [],
      weapons: [],
      phones: ["8025534120"],
      organizations: ["Duniya Enterprises", "TVS Tech Solutions"]
    },
    status: "Investigating",
    evidenceCompleteness: 60,
    validationAlerts: ["Missing critical signature on wire requisition authorization."],
    sourceDocument: "Complaint Doc Ref: CC/FRAUD/99201"
  },
  {
    id: "inc-103",
    title: "Gang Clash near Market",
    description: "A violent clash erupted between two local rival groups ('Kalaburagi Boys' and 'Saffron Gladiators') near Super Market Area, Kalaburagi. Swords and wooden bats were brandished. Three police patrols dispatched. Mobile call records indicate suspect Rahim called Kalaburagi gang leader Suresh just before the clash.",
    category: "Assault",
    severity: "High",
    date: "2026-07-08",
    time: "21:00",
    location: {
      district: "Kalaburagi",
      area: "Super Market Area",
      coordinates: [17.3361, 76.8395]
    },
    extractedEntities: {
      suspects: ["Suresh", "Rival Gang members", "Rahim"],
      victims: ["Pedestrians", "Shopkeepers"],
      vehicles: ["KA-32-M-4451 (SUV)"],
      weapons: ["Swords", "Wooden Bats"],
      phones: ["9845011223", "7204123456"],
      organizations: ["Kalaburagi Boys", "Saffron Gladiators"]
    },
    status: "Investigating",
    evidenceCompleteness: 90,
    validationAlerts: ["Link Established: Rahim (from Majestic Robbery) linked to Suresh (Kalaburagi Gang Leader) via active call record."],
    sourceDocument: "Daily Incident Report, Kalaburagi Town PS"
  }
];

const INITIAL_NODES: EntityNode[] = [
  { id: "person-rahim", label: "Rahim (Robbery Suspect)", type: "Person" },
  { id: "person-suresh", label: "Suresh (Gang Leader)", type: "Person" },
  { id: "person-venkatesh", label: "Venkatesh Rao (Victim)", type: "Person" },
  { id: "person-ramesh", label: "Ramesh Kumar (CFO)", type: "Person" },
  { id: "vehicle-pulsar", label: "Black Pulsar Motorcycle", type: "Vehicle" },
  { id: "vehicle-suv", label: "KA-32-M-4451 (SUV)", type: "Vehicle" },
  { id: "weapon-pistol", label: "Country Pistol", type: "Weapon" },
  { id: "weapon-swords", label: "Swords", type: "Weapon" },
  { id: "phone-rahim", label: "9845011223 (Rahim's Phone)", type: "Phone" },
  { id: "phone-suresh", label: "7204123456 (Suresh's Phone)", type: "Phone" },
  { id: "org-majestic-gang", label: "Majestic Criminal Gang", type: "Organization" },
  { id: "org-kalaburagi-boys", label: "Kalaburagi Boys Gang", type: "Organization" },
  { id: "org-tvs", label: "TVS Tech Solutions", type: "Organization" },
  { id: "inc-101", label: "Majestic Armed Robbery", type: "Incident" },
  { id: "inc-102", label: "Koramangala Wire Fraud", type: "Incident" },
  { id: "inc-103", label: "Kalaburagi Gang Clash", type: "Incident" }
];

const INITIAL_EDGES: EntityEdge[] = [
  { id: "e1", source: "person-rahim", target: "inc-101", type: "Suspect In" },
  { id: "e2", source: "person-venkatesh", target: "inc-101", type: "Victim In" },
  { id: "e3", source: "weapon-pistol", target: "inc-101", type: "Used In" },
  { id: "e4", source: "vehicle-pulsar", target: "inc-101", type: "Used In" },
  { id: "e5", source: "phone-rahim", target: "person-rahim", type: "Belongs To" },
  { id: "e6", source: "person-rahim", target: "org-majestic-gang", type: "Member Of" },
  
  { id: "e7", source: "person-ramesh", target: "inc-102", type: "Reporter Of" },
  { id: "e8", source: "org-tvs", target: "inc-102", type: "Victim In" },
  
  { id: "e9", source: "person-suresh", target: "inc-103", type: "Suspect In" },
  { id: "e10", source: "org-kalaburagi-boys", target: "inc-103", type: "Involved In" },
  { id: "e11", source: "vehicle-suv", target: "inc-103", type: "Spotted At" },
  { id: "e12", source: "weapon-swords", target: "inc-103", type: "Brandished In" },
  { id: "e13", source: "phone-suresh", target: "person-suresh", type: "Belongs To" },
  
  // Cross-incident relationship!
  { id: "e14", source: "phone-rahim", target: "phone-suresh", type: "Direct Call (July 8, 20:45)" },
  { id: "e15", source: "person-rahim", target: "person-suresh", type: "Phone Liaison" }
];

const INITIAL_RECOMMENDATIONS: ActionRecommendation[] = [
  {
    id: "rec-1",
    title: "Deploy Checkpoint Mesh near Majestic",
    district: "Bengaluru Urban",
    riskScore: 88,
    reason: "Recent high-severity armed robbery at Majestic indicates active gang activity. Multi-point checkpoints will restrict motorbike egress routes.",
    actionWindow: "Next 4 hours",
    confidence: 92,
    status: "Pending"
  },
  {
    id: "rec-2",
    title: "Increase Evening Patrol Frequency in Kalaburagi",
    district: "Kalaburagi",
    riskScore: 78,
    reason: "Severe gang clash in Super Market Precinct warrants saturation patrolling to deter retributive violence.",
    actionWindow: "Next 12 hours",
    confidence: 84,
    status: "Pending"
  },
  {
    id: "rec-3",
    title: "Conduct Digital KYC Audit on Duniya Accounts",
    district: "Bengaluru Urban",
    riskScore: 65,
    reason: "Large-scale corporate wire transfer fraud. Audit will freeze cashouts and identify accomplice identities.",
    actionWindow: "Next 24 hours",
    confidence: 76,
    status: "Pending"
  }
];

const INITIAL_ALERTS: AlertNotification[] = [
  {
    id: "alert-1",
    timestamp: "2026-07-09T00:05:00-07:00",
    district: "Bengaluru Urban",
    message: "High-risk correlation detected: Phone Rahim associated with Kalaburagi Suresh call activity.",
    severity: "Critical",
    read: false
  },
  {
    id: "alert-2",
    timestamp: "2026-07-08T22:15:00-07:00",
    district: "Kalaburagi",
    message: "District risk escalated to High after Super Market Gang Clash.",
    severity: "Warning",
    read: false
  }
];

// STATE STORAGE
let districts = [...INITIAL_DISTRICTS];
let incidents = [...INITIAL_INCIDENTS];
let graphNodes = [...INITIAL_NODES];
let graphEdges = [...INITIAL_EDGES];
let recommendations = [...INITIAL_RECOMMENDATIONS];
let alerts = [...INITIAL_ALERTS];

// Helper to update district stats when incidents are added
function recalculateDistrictStats(districtName: string) {
  const dist = districts.find(d => d.name.toLowerCase() === districtName.toLowerCase());
  if (dist) {
    const distIncidents = incidents.filter(i => i.location.district.toLowerCase() === districtName.toLowerCase());
    dist.crimeCount = distIncidents.length + 50; // Offset for historical baseline
    // Adjust index based on severities
    const criticalCount = distIncidents.filter(i => i.severity === "Critical").length;
    const highCount = distIncidents.filter(i => i.severity === "High").length;
    
    dist.crimeIndex = Math.min(95, 40 + distIncidents.length * 4 + criticalCount * 12 + highCount * 7);
    if (dist.crimeIndex > 75) dist.riskLevel = "Critical";
    else if (dist.crimeIndex > 55) dist.riskLevel = "High";
    else if (dist.crimeIndex > 35) dist.riskLevel = "Medium";
    else dist.riskLevel = "Low";
  }
}

// ==========================================
// REST ENDPOINTS
// ==========================================

// Get all metrics
app.get("/api/metrics", (req, res) => {
  res.json(districts);
});

// Get all incidents
app.get("/api/incidents", (req, res) => {
  res.json(incidents);
});

// Get alerts
app.get("/api/alerts", (req, res) => {
  res.json(alerts);
});

// Read single alert
app.post("/api/alerts/:id/read", (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (alert) {
    alert.read = true;
  }
  res.json({ success: true, alerts });
});

// Reset db
app.post("/api/reset", (req, res) => {
  districts = JSON.parse(JSON.stringify(INITIAL_DISTRICTS));
  incidents = JSON.parse(JSON.stringify(INITIAL_INCIDENTS));
  graphNodes = JSON.parse(JSON.stringify(INITIAL_NODES));
  graphEdges = JSON.parse(JSON.stringify(INITIAL_EDGES));
  recommendations = JSON.parse(JSON.stringify(INITIAL_RECOMMENDATIONS));
  alerts = JSON.parse(JSON.stringify(INITIAL_ALERTS));
  res.json({ success: true, message: "System state reset successfully." });
});

// Get knowledge graph
app.get("/api/graph", (req, res) => {
  res.json({ nodes: graphNodes, edges: graphEdges });
});

// Deploy recommendation
app.post("/api/recommendations/:id/deploy", (req, res) => {
  const rec = recommendations.find(r => r.id === req.params.id);
  if (rec) {
    rec.status = "Deployed";
    
    // Lower crime index in the target district as a simulation of successful action!
    const dist = districts.find(d => d.name === rec.district);
    if (dist) {
      dist.crimeIndex = Math.max(15, dist.crimeIndex - 12);
      dist.patrolAvailable = dist.patrolAvailable + 3; // Deployed patrol units
      if (dist.crimeIndex > 75) dist.riskLevel = "Critical";
      else if (dist.crimeIndex > 55) dist.riskLevel = "High";
      else if (dist.crimeIndex > 35) dist.riskLevel = "Medium";
      else dist.riskLevel = "Low";
    }

    // Add alert
    const newAlert: AlertNotification = {
      id: `alert-gen-${Date.now()}`,
      timestamp: new Date().toISOString(),
      district: rec.district,
      message: `POLICE RESPONSE DEPLOYED: "${rec.title}" successfully launched. Local patrol level boosted. Crime displacement monitored.`,
      severity: "Info",
      read: false
    };
    alerts.unshift(newAlert);
  }
  res.json({ success: true, recommendations, districts, alerts });
});

// Dismiss recommendation
app.post("/api/recommendations/:id/dismiss", (req, res) => {
  const rec = recommendations.find(r => r.id === req.params.id);
  if (rec) {
    rec.status = "Dismissed";
  }
  res.json({ success: true, recommendations });
});

// Get recommendations
app.get("/api/recommendations", (req, res) => {
  res.json(recommendations);
});

// EvidenceFlow AI: Document analysis
app.post("/api/evidence/analyze", async (req, res) => {
  const { text, filename } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "Document text content is required." });
  }

  const ai = getGeminiClient();

  if (ai) {
    try {
      console.log("Analyzing document with Gemini...");
      const systemInstruction = `
        You are 'EvidenceFlow AI', the deep analysis and Named Entity Extraction engine of CrimeVerse AI.
        Your job is to read unstructured police reports, FIR transcripts, witness testimonies, or investigation notes, and extract structured Intelligence.
        
        CRITICAL RULES:
        1. Extract the Title, a concise Summary/Description, Crime Category, Severity, Date, Time, and Location.
        2. Extract all Named Entities:
           - suspects (people accused or suspicious)
           - victims (impacted parties or businesses)
           - vehicles (license plates, descriptions)
           - weapons (guns, knives, tools)
           - phones (numbers mentioned)
           - organizations (gangs, companies)
        3. Determine evidenceCompleteness (0 to 100) based on availability of critical fields like signatures, exact locations, witness details, weapons, timestamps.
        4. Detect and list 'validationAlerts'. Run these checks:
           - Check for missing witness names or signatures.
           - Check for impossible timestamps or rapid speeds (e.g. suspect spotted in two distant cities 30 minutes apart).
           - Identify direct contradictions or chronological conflicts (e.g., suspect was arrested on July 4 but crime occurred on July 5).
           - Identify connections/similarities to known seed entities (e.g., Rahim, Suresh, black Pulsar, Majestic).
        5. Map the location district to one of these valid Karnataka districts if possible: "Bengaluru Urban", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Shivamogga", "Udupi". If unknown, guess the closest or default to "Bengaluru Urban".
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the following incident report:\n\n${text}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { 
                type: Type.STRING, 
                description: "Must be exactly one of: Theft, Assault, Fraud, Homicide, Vandalism, Narcotics, Other" 
              },
              severity: { 
                type: Type.STRING, 
                description: "Must be exactly one of: Low, Medium, High, Critical" 
              },
              date: { type: Type.STRING, description: "Date of crime in YYYY-MM-DD format" },
              time: { type: Type.STRING, description: "Time of crime in HH:MM format" },
              location: {
                type: Type.OBJECT,
                properties: {
                  district: { type: Type.STRING, description: "Must match a Karnataka district like Bengaluru Urban, Mysuru, Mangaluru, Belagavi, Hubballi-Dharwad, Kalaburagi, Shivamogga, Udupi" },
                  area: { type: Type.STRING, description: "Specific neighborhood or local spot" }
                },
                required: ["district", "area"]
              },
              extractedEntities: {
                type: Type.OBJECT,
                properties: {
                  suspects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  victims: { type: Type.ARRAY, items: { type: Type.STRING } },
                  vehicles: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weapons: { type: Type.ARRAY, items: { type: Type.STRING } },
                  phones: { type: Type.ARRAY, items: { type: Type.STRING } },
                  organizations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["suspects", "victims", "vehicles", "weapons", "phones", "organizations"]
              },
              evidenceCompleteness: { type: Type.INTEGER, description: "Percentage score 0 to 100 of data quality and evidence checks" },
              validationAlerts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Contradictions, missing info, or timeline discrepancies found" }
            },
            required: ["title", "description", "category", "severity", "date", "time", "location", "extractedEntities", "evidenceCompleteness", "validationAlerts"]
          }
        }
      });

      if (!response.text) {
        throw new Error("No response text returned from Gemini");
      }
      const parsed = JSON.parse(response.text.trim());

      // Format clean Coordinates based on district mapping
      let coords: [number, number] = [12.9716, 77.5946]; // default Bengaluru Urban
      const matchedDist = districts.find(d => d.name.toLowerCase() === parsed.location.district.toLowerCase());
      if (matchedDist && matchedDist.hotspots && matchedDist.hotspots.length > 0) {
        coords = matchedDist.hotspots[0].coords;
      } else {
        // Fallback coordination based on district name match
        const distName = parsed.location.district.toLowerCase();
        if (distName.includes("mysuru") || distName.includes("mysore")) coords = [12.2958, 76.6394];
        else if (distName.includes("hubli") || distName.includes("dharwad") || distName.includes("hubballi")) coords = [15.3647, 75.1240];
        else if (distName.includes("mangaluru") || distName.includes("mangalore")) coords = [12.9141, 74.8560];
        else if (distName.includes("belagavi") || distName.includes("belgaum")) coords = [15.8497, 74.4977];
        else if (distName.includes("kalaburagi") || distName.includes("gulbarga")) coords = [17.3291, 76.8341];
        else if (distName.includes("shivamogga") || distName.includes("shimoga")) coords = [13.9299, 75.5681];
        else if (distName.includes("udupi")) coords = [13.3409, 74.7421];
      }

      // Build Incident Object
      const newIncident: Incident = {
        id: `inc-${Date.now()}`,
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        severity: parsed.severity,
        date: parsed.date,
        time: parsed.time,
        location: {
          district: parsed.location.district,
          area: parsed.location.area,
          coordinates: coords
        },
        extractedEntities: parsed.extractedEntities,
        status: "Investigating",
        evidenceCompleteness: parsed.evidenceCompleteness,
        validationAlerts: parsed.validationAlerts,
        sourceDocument: filename || "Uploaded Document AI Extraction"
      };

      // Store in memory
      incidents.unshift(newIncident);
      recalculateDistrictStats(newIncident.location.district);

      // Add nodes and edges to Knowledge Graph
      const incNodeId = newIncident.id;
      graphNodes.push({ id: incNodeId, label: newIncident.title, type: "Incident" });

      // Add extracted entities to Knowledge Graph
      const entities = newIncident.extractedEntities;
      
      const addEntitiesAndEdges = (list: string[], type: 'Person' | 'Vehicle' | 'Weapon' | 'Phone' | 'Organization', relName: string) => {
        list.forEach(item => {
          const formattedId = `${type.toLowerCase()}-${item.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
          // Check if node already exists
          const exists = graphNodes.some(n => n.id === formattedId);
          if (!exists) {
            graphNodes.push({ id: formattedId, label: item, type });
          }
          // Link entity to Incident
          graphEdges.push({
            id: `edge-${Date.now()}-${Math.floor(Math.random()*100000)}`,
            source: formattedId,
            target: incNodeId,
            type: relName
          });
        });
      };

      addEntitiesAndEdges(entities.suspects, "Person", "Suspect In");
      addEntitiesAndEdges(entities.victims, "Person", "Victim In");
      addEntitiesAndEdges(entities.vehicles, "Vehicle", "Used In");
      addEntitiesAndEdges(entities.weapons, "Weapon", "Weapon Used");
      addEntitiesAndEdges(entities.phones, "Phone", "Triangulated At");
      addEntitiesAndEdges(entities.organizations, "Organization", "Affiliated With");

      // Generate AI Action Recommendation
      const recId = `rec-${Date.now()}`;
      const riskScoreMap = { "Low": 30, "Medium": 55, "High": 80, "Critical": 95 };
      const baseRisk = riskScoreMap[newIncident.severity] || 50;

      // Ask Gemini to generate a dedicated actionable policing recommendation
      const recResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Based on this crime incident in ${newIncident.location.district}:\nTitle: ${newIncident.title}\nCategory: ${newIncident.category}\nDescription: ${newIncident.description}\nSeverity: ${newIncident.severity}\n\nGenerate a prioritized policing recommendation for a tactical Command Center. It must include:\n1. Action Title\n2. Practical Tactical Reason\n3. Action Window (e.g. "Next 2 hours", "Next 12 hours")\n4. Recommended deployment budget/cost (in INR)\n5. Confidence percentage (0-100)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              reason: { type: Type.STRING },
              actionWindow: { type: Type.STRING },
              cost: { type: Type.INTEGER },
              confidence: { type: Type.INTEGER }
            },
            required: ["title", "reason", "actionWindow", "cost", "confidence"]
          }
        }
      });

      if (!recResponse.text) {
        throw new Error("No recommendation text returned from Gemini");
      }
      const parsedRec = JSON.parse(recResponse.text.trim());

      const newRec: ActionRecommendation = {
        id: recId,
        title: parsedRec.title,
        district: newIncident.location.district,
        riskScore: baseRisk,
        reason: parsedRec.reason,
        actionWindow: parsedRec.actionWindow,
        confidence: parsedRec.confidence,
        status: "Pending"
      };
      recommendations.unshift(newRec);

      // Trigger Alert if severity is High or Critical
      if (newIncident.severity === "High" || newIncident.severity === "Critical") {
        alerts.unshift({
          id: `alert-gen-${Date.now()}`,
          timestamp: new Date().toISOString(),
          district: newIncident.location.district,
          message: `CRIME ALERT: ${newIncident.severity} incident reported in ${newIncident.location.district} (${newIncident.location.area}). Tactical recommendations queued.`,
          severity: newIncident.severity === "Critical" ? "Critical" : "Warning",
          read: false
        });
      }

      return res.json({
        success: true,
        incident: newIncident,
        graph: { nodes: graphNodes, edges: graphEdges },
        recommendations,
        districts,
        alerts
      });

    } catch (err: any) {
      console.error("Gemini processing error:", err);
      return res.status(500).json({ error: "Gemini parser failure: " + err.message });
    }
  } else {
    // FALLBACK SIMULATION (Rule-based parsing)
    console.log("No Gemini API key. Running smart local parsing...");
    const lowerText = text.toLowerCase();
    
    // Simple category matching
    let category: any = "Other";
    if (lowerText.includes("theft") || lowerText.includes("steal") || lowerText.includes("robber") || lowerText.includes("burglar") || lowerText.includes("stole")) {
      category = "Theft";
    } else if (lowerText.includes("assault") || lowerText.includes("fight") || lowerText.includes("clash") || lowerText.includes("attack") || lowerText.includes("beat")) {
      category = "Assault";
    } else if (lowerText.includes("fraud") || lowerText.includes("scam") || lowerText.includes("cyber") || lowerText.includes("phish") || lowerText.includes("money")) {
      category = "Fraud";
    } else if (lowerText.includes("kill") || lowerText.includes("murder") || lowerText.includes("homicide") || lowerText.includes("dead")) {
      category = "Homicide";
    } else if (lowerText.includes("drugs") || lowerText.includes("narcotics") || lowerText.includes("weed") || lowerText.includes("cocaine")) {
      category = "Narcotics";
    }

    // Severity
    let severity: any = "Medium";
    if (lowerText.includes("critical") || lowerText.includes("homicide") || lowerText.includes("pistol") || lowerText.includes("weapon")) {
      severity = "High";
    } else if (lowerText.includes("minor") || lowerText.includes("petty")) {
      severity = "Low";
    }

    // Match district
    let matchedDistrictName = "Bengaluru Urban";
    for (const d of districts) {
      if (lowerText.includes(d.name.toLowerCase())) {
        matchedDistrictName = d.name;
        break;
      }
    }

    const matchedDist = districts.find(d => d.name === matchedDistrictName)!;

    // Entity mocks
    const suspects = lowerText.includes("rahim") ? ["Rahim"] : ["Unknown Person"];
    if (lowerText.includes("suresh")) suspects.push("Suresh");
    const victims = [lowerText.includes("shopkeeper") ? "Local Shopkeeper" : "Unspecified Complainant"];
    const vehicles = lowerText.includes("pulsar") ? ["Black Pulsar Motorcycle"] : [];
    const weapons = lowerText.includes("pistol") ? ["Country Pistol"] : (lowerText.includes("sword") ? ["Sword"] : []);
    const phones: string[] = [];
    const phoneMatch = text.match(/\b\d{10}\b/g);
    if (phoneMatch) {
      phones.push(...phoneMatch);
    } else {
      phones.push("9845011000");
    }

    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      title: `Reported ${category} in ${matchedDistrictName}`,
      description: text.substring(0, 300) + (text.length > 300 ? "..." : ""),
      category,
      severity,
      date: new Date().toISOString().split("T")[0],
      time: "12:00",
      location: {
        district: matchedDistrictName,
        area: matchedDist.hotspots[0]?.area || "Main Ward",
        coordinates: matchedDist.hotspots[0]?.coords || [12.9716, 77.5946]
      },
      extractedEntities: {
        suspects,
        victims,
        vehicles,
        weapons,
        phones,
        organizations: ["Local syndicate"]
      },
      status: "Investigating",
      evidenceCompleteness: 75,
      validationAlerts: [
        "SIMULATED PARSE: Please add a real GEMINI_API_KEY to unlock actual deep semantic extraction, timeline checking, and contradiction detection.",
        "Signature verified: Constable Desk Stamp present."
      ],
      sourceDocument: filename || "Local Simulated OCR"
    };

    incidents.unshift(newIncident);
    recalculateDistrictStats(matchedDistrictName);

    // Update Graph Nodes
    graphNodes.push({ id: newIncident.id, label: newIncident.title, type: "Incident" });
    suspects.forEach(s => {
      const id = `person-${s.toLowerCase().replace(/ /g, "-")}`;
      if (!graphNodes.some(n => n.id === id)) graphNodes.push({ id, label: s, type: "Person" });
      graphEdges.push({ id: `e-${Date.now()}-${s}`, source: id, target: newIncident.id, type: "Suspect In" });
    });

    const newRec: ActionRecommendation = {
      id: `rec-${Date.now()}`,
      title: `Intensify Beat Patrols in ${matchedDistrictName}`,
      district: matchedDistrictName,
      riskScore: severity === "High" ? 80 : 50,
      reason: `Synthesized response for reported ${category}. Direct patrol reallocation protects the local area beat from spillover displacements.`,
      actionWindow: "Next 6 hours",
      confidence: 80,
      status: "Pending"
    };
    recommendations.unshift(newRec);

    if (severity === "High" || severity === "Critical") {
      alerts.unshift({
        id: `alert-gen-${Date.now()}`,
        timestamp: new Date().toISOString(),
        district: matchedDistrictName,
        message: `CRIME ALERT: ${severity} incident reported in ${matchedDistrictName}. Tactical recommendations queued.`,
        severity: "Warning",
        read: false
      });
    }

    return res.json({
      success: true,
      incident: newIncident,
      graph: { nodes: graphNodes, edges: graphEdges },
      recommendations,
      districts,
      alerts
    });
  }
});

// Run Simulation Scenario
app.post("/api/scenarios/run", async (req, res) => {
  const { district, interventionType, description } = req.body;

  if (!district || !interventionType) {
    return res.status(400).json({ error: "District and Intervention Type are required." });
  }

  const dist = districts.find(d => d.name === district);
  if (!dist) {
    return res.status(404).json({ error: "District not found in digital twin database." });
  }

  const baselineRisk = dist.crimeIndex;
  const ai = getGeminiClient();

  if (ai) {
    try {
      console.log("Simulating intervention with Gemini...");
      const prompt = `
        We are running a police intervention simulation in the Karnataka state digital crime twin.
        District: ${district}
        Intervention Type: ${interventionType}
        Details / Description: ${description || "General deployment of strategic units"}
        Baseline Crime/Risk Index: ${baselineRisk} out of 100
        
        Predict the outcome of this intervention. Return a JSON object with:
        1. projectedRisk (integer, 0 to 100): The estimated crime risk after intervention. Checks if this decreases risk or displaces it.
        2. cost (integer, INR): Simulated financial cost of deployment.
        3. benefit (string): Clear text summary of tactical impact, confidence, and side-effects (e.g., risk of crime displacement to adjacent areas).
        4. confidence (integer, percentage 0 to 100): Certainty of forecast.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectedRisk: { type: Type.INTEGER },
              cost: { type: Type.INTEGER },
              benefit: { type: Type.STRING },
              confidence: { type: Type.INTEGER }
            },
            required: ["projectedRisk", "cost", "benefit", "confidence"]
          }
        }
      });

      if (!response.text) {
        throw new Error("No simulation text returned from Gemini");
      }
      const parsed = JSON.parse(response.text.trim());
      
      const scenario: SimulationScenario = {
        id: `sim-${Date.now()}`,
        name: `${interventionType} Simulation`,
        description: description || "Tactical unit deployment and saturation.",
        targetDistrict: district,
        interventionType,
        baselineRisk,
        projectedRisk: parsed.projectedRisk,
        cost: parsed.cost,
        benefit: parsed.benefit,
        confidence: parsed.confidence,
        predictiveHotspots: dist.hotspots.map(h => ({
          area: h.area + " (Predicted)",
          coords: [h.coords[0] + (Math.random() * 0.02 - 0.01), h.coords[1] + (Math.random() * 0.02 - 0.01)] as [number, number],
          risk: Math.max(10, Math.min(100, Math.round(h.risk * (parsed.projectedRisk / baselineRisk))))
        }))
      };

      return res.json({ success: true, scenario });

    } catch (err: any) {
      console.error("Gemini Simulation error:", err);
      return res.status(500).json({ error: "Gemini Simulation failed: " + err.message });
    }
  } else {
    // LOCAL SIMULATION
    console.log("Running local simulation model...");
    // Simple mock logic
    const reduction = interventionType === "Patrol Reallocation" ? 15 : 
                      interventionType === "Temporary Checkpoints" ? 20 : 
                      interventionType === "Drone Surveillance" ? 10 : 12;
    const projectedRisk = Math.max(10, baselineRisk - reduction);
    const cost = interventionType === "Drone Surveillance" ? 120000 : 
                 interventionType === "Patrol Reallocation" ? 45000 : 25000;
    
    const scenario: SimulationScenario = {
      id: `sim-${Date.now()}`,
      name: `${interventionType} Simulation`,
      description: description || "Standard tactical intervention.",
      interventionType,
      baselineRisk,
      projectedRisk,
      cost,
      benefit: `SIMULATED OUTCOME: Projected 15-20% decrease in overall hotspot risks. Displacement possibility to neighboring sectors is low. Add a GEMINI_API_KEY to unlock advanced AI-powered spatial modeling.`,
      confidence: 85
    };

    return res.json({ success: true, scenario });
  }
});


// ==========================================
// VITE OR STATIC FRONTEND SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Express in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Express in PRODUCTION mode, serving static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CrimeVerse AI server booting on http://0.0.0.0:${PORT}`);
  });
}

startServer();
