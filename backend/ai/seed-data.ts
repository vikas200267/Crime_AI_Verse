import type { AiTwinState, DistrictMetrics, Incident } from "./types";

export const districtProfiles: Record<string, { coords: [number, number]; stations: Array<{ id: number; name: string; area: string }>; districtId: number }> = {
  "Bengaluru Urban": {
    districtId: 443,
    coords: [12.9716, 77.5946],
    stations: [
      { id: 6, name: "Majestic Police Station", area: "Majestic Precinct" },
      { id: 7, name: "Koramangala Police Station", area: "Koramangala" }
    ]
  },
  Kalaburagi: {
    districtId: 530,
    coords: [17.3297, 76.8343],
    stations: [{ id: 8, name: "Kalaburagi Town Police Station", area: "Super Market Area" }]
  },
  Mysuru: {
    districtId: 441,
    coords: [12.2958, 76.6394],
    stations: [{ id: 9, name: "Mysuru Central Police Station", area: "Devaraja Market" }]
  },
  Mangaluru: {
    districtId: 575,
    coords: [12.9141, 74.856],
    stations: [{ id: 10, name: "Mangaluru North Police Station", area: "Port Zone" }]
  },
  Belagavi: {
    districtId: 580,
    coords: [15.8497, 74.4977],
    stations: [{ id: 11, name: "Belagavi Market Police Station", area: "Market Circle" }]
  }
};

export const defaultIncidents: Incident[] = [
  {
    id: "FIR-104430006202600001",
    title: "Majestic Jewelry Robbery",
    description: "Three masked suspects robbed Venkateshwara Jewelers near Majestic Bus Station and escaped on a black Pulsar motorcycle.",
    category: "Theft",
    severity: "High",
    date: "2026-07-07",
    time: "19:15",
    location: { district: "Bengaluru Urban", area: "Majestic Precinct", coordinates: [12.9767, 77.5713] },
    extractedEntities: {
      suspects: ["Rahim"],
      victims: ["Venkatesh Rao"],
      vehicles: ["Black Pulsar Motorcycle"],
      weapons: ["country pistol"],
      phones: ["9845011223"],
      organizations: ["Venkateshwara Jewelers"]
    },
    status: "Investigating",
    evidenceCompleteness: 82,
    validationAlerts: ["Arrest timeline conflict: Rahim detained in Koramangala 15 minutes before alleged robbery."],
    sourceDocument: "Seed FIR",
    intelligence: {
      modelSignals: ["weapon present", "shared phone candidate", "timeline contradiction"],
      confidence: 0.86,
      graphLinks: ["Rahim shares phone link with Kalaburagi clash intelligence."],
      recommendedAction: "Increase night patrol and verify cross-district custody timeline."
    }
  },
  {
    id: "FIR-104430008202600002",
    title: "Kalaburagi Market Clash",
    description: "Violent clash between local factions near Super Market Area with swords and wooden bats.",
    category: "Assault",
    severity: "Critical",
    date: "2026-07-08",
    time: "21:00",
    location: { district: "Kalaburagi", area: "Super Market Area", coordinates: [17.336, 76.837] },
    extractedEntities: {
      suspects: ["Suresh", "Rahim"],
      victims: ["Police Patrol"],
      vehicles: [],
      weapons: ["swords", "wooden bats"],
      phones: ["7204123456", "9845011223"],
      organizations: ["Kalaburagi Boys", "Saffron Gladiators"]
    },
    status: "Investigating",
    evidenceCompleteness: 74,
    validationAlerts: ["Witness signature block missing.", "Cell tower contradicts suspect alibi."],
    sourceDocument: "Seed FIR",
    intelligence: {
      modelSignals: ["gang/faction language", "weapon present", "phone link", "alibi contradiction"],
      confidence: 0.9,
      graphLinks: ["Rahim appears in Bengaluru robbery and Kalaburagi clash."],
      recommendedAction: "Deploy temporary checkpoint and monitor faction phone graph."
    }
  },
  {
    id: "FIR-104430007202600003",
    title: "Koramangala Corporate Wire Fraud",
    description: "Spoofed email caused fraudulent transfer of INR 45 Lakhs to a shell bank account.",
    category: "Fraud",
    severity: "High",
    date: "2026-07-05",
    time: "11:30",
    location: { district: "Bengaluru Urban", area: "Koramangala", coordinates: [12.9352, 77.6245] },
    extractedEntities: {
      suspects: [],
      victims: ["Ramesh Kumar"],
      vehicles: [],
      weapons: [],
      phones: [],
      organizations: ["TVS Tech Solutions", "Duniya Enterprises"]
    },
    status: "Investigating",
    evidenceCompleteness: 68,
    validationAlerts: ["Cross-district money trail to Kalaburagi requires financial intelligence follow-up."],
    sourceDocument: "Seed investigation note",
    intelligence: {
      modelSignals: ["cyber fraud", "shell company", "cross-district IP trace"],
      confidence: 0.81,
      graphLinks: ["Duniya Enterprises connects Bengaluru fraud to Kalaburagi trace."],
      recommendedAction: "Assign cyber specialist and freeze linked account trail."
    }
  }
];

export const defaultDistricts: DistrictMetrics[] = [
  {
    name: "Bengaluru Urban",
    crimeIndex: 78,
    crimeCount: 2,
    patrolAvailable: 12,
    riskLevel: "High",
    trend7Day: [42, 44, 51, 49, 55, 61, 67],
    hotspots: [
      { area: "Majestic Precinct", risk: 86, coords: [12.9767, 77.5713] },
      { area: "Koramangala", risk: 72, coords: [12.9352, 77.6245] }
    ]
  },
  {
    name: "Kalaburagi",
    crimeIndex: 84,
    crimeCount: 1,
    patrolAvailable: 7,
    riskLevel: "Critical",
    trend7Day: [50, 48, 54, 58, 62, 69, 78],
    hotspots: [{ area: "Super Market Area", risk: 91, coords: [17.336, 76.837] }]
  },
  {
    name: "Mysuru",
    crimeIndex: 42,
    crimeCount: 0,
    patrolAvailable: 9,
    riskLevel: "Medium",
    trend7Day: [20, 24, 22, 30, 29, 31, 35],
    hotspots: [{ area: "Devaraja Market", risk: 48, coords: [12.309, 76.655] }]
  },
  {
    name: "Mangaluru",
    crimeIndex: 34,
    crimeCount: 0,
    patrolAvailable: 8,
    riskLevel: "Low",
    trend7Day: [18, 16, 22, 20, 21, 24, 25],
    hotspots: [{ area: "Port Zone", risk: 38, coords: [12.9141, 74.856] }]
  },
  {
    name: "Belagavi",
    crimeIndex: 39,
    crimeCount: 0,
    patrolAvailable: 8,
    riskLevel: "Low",
    trend7Day: [19, 20, 22, 23, 25, 24, 28],
    hotspots: [{ area: "Market Circle", risk: 40, coords: [15.8497, 74.4977] }]
  }
];

export function createDefaultState(): AiTwinState {
  return {
    incidents: defaultIncidents.map((incident) => ({ ...incident, extractedEntities: { ...incident.extractedEntities }, validationAlerts: [...incident.validationAlerts] })),
    districts: defaultDistricts.map((district) => ({
      ...district,
      trend7Day: [...(district.trend7Day ?? [])],
      hotspots: district.hotspots.map((hotspot) => ({ ...hotspot }))
    })),
    graph: { nodes: [], edges: [] },
    recommendations: [],
    alerts: [
      {
        id: "alert-seed-1",
        timestamp: new Date().toISOString(),
        district: "Kalaburagi",
        message: "Critical assault hotspot forming near Super Market Area with repeat phone link to Bengaluru case.",
        severity: "Critical",
        read: false
      },
      {
        id: "alert-seed-2",
        timestamp: new Date().toISOString(),
        district: "Bengaluru Urban",
        message: "Jewelry robbery and wire fraud both show cross-district intelligence links.",
        severity: "Warning",
        read: false
      }
    ]
  };
}
