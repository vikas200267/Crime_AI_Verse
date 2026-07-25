import type { Request, Response } from "express";
import { BlueprintService } from "../services/blueprint.service";

const service = new BlueprintService();

export class BlueprintController {
  summary(_request: Request, response: Response) {
    response.json(service.getSummary());
  }

  full(_request: Request, response: Response) {
    response.json(service.getFullBlueprint());
  }

  schema(_request: Request, response: Response) {
    response.json(service.getSchemaAnalysis());
  }

  architecture(_request: Request, response: Response) {
    response.json(service.getArchitecture());
  }

  api(_request: Request, response: Response) {
    response.json(service.getApiDesign());
  }

  aiTables(_request: Request, response: Response) {
    response.json(service.getAiExtensionTables());
  }

  mvp(_request: Request, response: Response) {
    response.json(service.getHackathonMvp());
  }
}
