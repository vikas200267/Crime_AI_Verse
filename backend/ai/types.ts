export type CrimeCategory = "Theft" | "Assault" | "Fraud" | "Homicide" | "Vandalism" | "Narcotics" | "Other";
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: CrimeCategory;
  severity: Severity;
  date: string;
  time: string;
  location: {
    district: string;
    area: string;
    coordinates: [number, number];
  };
  extractedEntities: {
    suspects: string[];
    victims: string[];
    vehicles: string[];
    weapons: string[];
    phones: string[];
    organizations: string[];
  };
  status: "Investigating" | "Solved" | "Unsolved" | "Draft";
  evidenceCompleteness: number;
  validationAlerts: string[];
  sourceDocument?: string;
  firProjection?: FirProjection;
  intelligence?: {
    modelSignals: string[];
    confidence: number;
    graphLinks: string[];
    recommendedAction: string;
  };
}

export interface FirProjection {
  caseMaster: {
    caseMasterId: number;
    crimeNo: string;
    caseNo: string;
    crimeRegisteredDate: string;
    policePersonId: number;
    policeStationId: number;
    caseCategoryId: number;
    gravityOffenceId: number;
    crimeMajorHeadId: number;
    crimeMinorHeadId: number;
    caseStatusId: number;
    courtId: number;
    incidentFromDate: string;
    incidentToDate: string;
    infoReceivedPSDate: string;
    latitude: number;
    longitude: number;
    briefFacts: string;
  };
  complainantDetails: Array<{ complainantId: number; caseMasterId: number; complainantName: string; ageYear?: number; occupationId?: number; genderId?: number }>;
  victims: Array<{ victimMasterId: number; caseMasterId: number; victimName: string; ageYear?: number; genderId?: number; victimPolice: "0" | "1" }>;
  accused: Array<{ accusedMasterId: number; caseMasterId: number; accusedName: string; ageYear?: number; genderId?: number; personId: string }>;
  actSectionAssociations: Array<{ caseMasterId: number; actId: string; sectionId: string; actOrderId: number; sectionOrderId: number }>;
}

export interface EntityNode {
  id: string;
  label: string;
  type: "Person" | "Vehicle" | "Location" | "Weapon" | "Phone" | "Incident" | "Organization";
}

export interface EntityEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface DistrictMetrics {
  name: string;
  crimeIndex: number;
  crimeCount: number;
  patrolAvailable: number;
  riskLevel: RiskLevel;
  trend7Day?: number[];
  hotspots: Array<{
    area: string;
    risk: number;
    coords: [number, number];
  }>;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  targetDistrict: string;
  interventionType: "Patrol Reallocation" | "Temporary Checkpoints" | "Street Lighting" | "Drone Surveillance" | "Community Outreach";
  baselineRisk: number;
  projectedRisk: number;
  cost: number;
  benefit: string;
  confidence: number;
  predictiveHotspots?: Array<{ area: string; coords: [number, number]; risk: number }>;
}

export interface ActionRecommendation {
  id: string;
  title: string;
  district: string;
  riskScore: number;
  reason: string;
  actionWindow: string;
  confidence: number;
  status: "Pending" | "Deployed" | "Dismissed";
}

export interface AlertNotification {
  id: string;
  timestamp: string;
  district: string;
  message: string;
  severity: "Info" | "Warning" | "Critical";
  read: boolean;
}

export interface AiTwinState {
  incidents: Incident[];
  districts: DistrictMetrics[];
  graph: { nodes: EntityNode[]; edges: EntityEdge[] };
  recommendations: ActionRecommendation[];
  alerts: AlertNotification[];
}

export interface ExtractionResult {
  incident: Incident;
  confidence: number;
  modelSignals: string[];
}
