import {
  aiExtensionTables,
  apiEndpoints,
  architectureDiagram,
  architectureLayers,
  backendFolderStructure,
  chosenFramework,
  crimeverseBackendBlueprint,
  databaseStrategy,
  eventTopics,
  hackathonMvp,
  pipelineStages,
  realtimeSections,
  schemaAnalysis,
  tableClassification
} from "../../blueprint";

export class BlueprintService {
  getFullBlueprint() {
    return crimeverseBackendBlueprint;
  }

  getSummary() {
    return {
      product: crimeverseBackendBlueprint.product,
      sourceSchema: crimeverseBackendBlueprint.sourceSchema,
      rootEntity: crimeverseBackendBlueprint.rootEntity,
      chosenFramework,
      tableCount: schemaAnalysis.length,
      endpointCount: apiEndpoints.length,
      eventTopicCount: eventTopics.length,
      aiExtensionTableCount: aiExtensionTables.length,
      tableClassification,
      architectureDiagram
    };
  }

  getSchemaAnalysis() {
    return schemaAnalysis;
  }

  getArchitecture() {
    return {
      chosenFramework,
      backendFolderStructure,
      architectureDiagram,
      architectureLayers,
      databaseStrategy,
      pipelineStages,
      eventTopics,
      realtimeSections
    };
  }

  getApiDesign() {
    return apiEndpoints;
  }

  getAiExtensionTables() {
    return aiExtensionTables;
  }

  getHackathonMvp() {
    return hackathonMvp;
  }
}
