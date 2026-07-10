export interface Incident {
  id: string;
  title: string;
  description: string;
  category: 'Theft' | 'Assault' | 'Fraud' | 'Homicide' | 'Vandalism' | 'Narcotics' | 'Other';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  date: string;
  time: string;
  location: {
    district: string;
    area: string;
    coordinates: [number, number]; // [lat, lng]
  };
  extractedEntities: {
    suspects: string[];
    victims: string[];
    vehicles: string[];
    weapons: string[];
    phones: string[];
    organizations: string[];
  };
  status: 'Investigating' | 'Solved' | 'Unsolved' | 'Draft';
  evidenceCompleteness: number; // 0 to 100
  validationAlerts: string[];
  sourceDocument?: string; // Original text or filename
}

export interface EntityNode {
  id: string;
  label: string;
  type: 'Person' | 'Vehicle' | 'Location' | 'Weapon' | 'Phone' | 'Incident' | 'Organization';
}

export interface EntityEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface DistrictMetrics {
  name: string;
  crimeIndex: number; // 0 to 100
  crimeCount: number;
  patrolAvailable: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  trend7Day?: number[];
  hotspots: {
    area: string;
    risk: number;
    coords: [number, number];
  }[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  targetDistrict: string;
  interventionType: 'Patrol Reallocation' | 'Temporary Checkpoints' | 'Street Lighting' | 'Drone Surveillance' | 'Community Outreach';
  baselineRisk: number; // 0 to 100
  projectedRisk: number; // 0 to 100
  cost: number; // in INR
  benefit: string;
  confidence: number; // percentage
  predictiveHotspots?: { area: string, coords: [number, number], risk: number }[];
}

export interface ActionRecommendation {
  id: string;
  title: string;
  district: string;
  riskScore: number;
  reason: string;
  actionWindow: string;
  confidence: number;
  status: 'Pending' | 'Deployed' | 'Dismissed';
}

export interface AlertNotification {
  id: string;
  timestamp: string;
  district: string;
  message: string;
  severity: 'Info' | 'Warning' | 'Critical';
  read: boolean;
}
