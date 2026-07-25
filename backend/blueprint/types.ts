export type TableKind =
  | "root"
  | "transactional"
  | "lookup"
  | "master"
  | "analytical-dimension";

export interface SchemaColumn {
  name: string;
  type: string;
  key?: "PK" | "FK";
  references?: string;
  description: string;
}

export interface TableAnalysis {
  table: string;
  kind: TableKind[];
  purpose: string;
  responsibilities: string[];
  relationships: string[];
  crud: string[];
  aiInteractions: string[];
  columns: SchemaColumn[];
}

export interface FolderNode {
  path: string;
  purpose: string;
}

export interface ArchitectureLayer {
  name: string;
  responsibility: string;
  keyComponents: string[];
}

export interface AiTableColumn {
  name: string;
  type: string;
  description: string;
}

export interface AiExtensionTable {
  table: string;
  purpose: string;
  columns: AiTableColumn[];
  relationships: string[];
  indexes: string[];
  retention: string;
}

export interface ApiEndpoint {
  area: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  request: string;
  response: string;
  validation: string[];
  errors: string[];
  status: number[];
  security: string;
}

export interface EventTopic {
  topic: string;
  producer: string;
  subscribers: string[];
  payload: string;
}

export interface BlueprintSection {
  title: string;
  content: string[];
}
