import { Router } from "express";
import { BlueprintController } from "../controllers/blueprint.controller";

const controller = new BlueprintController();

export function createBlueprintRouter() {
  const router = Router();

  router.get("/", controller.summary.bind(controller));
  router.get("/full", controller.full.bind(controller));
  router.get("/schema", controller.schema.bind(controller));
  router.get("/architecture", controller.architecture.bind(controller));
  router.get("/api", controller.api.bind(controller));
  router.get("/ai-extension-tables", controller.aiTables.bind(controller));
  router.get("/mvp", controller.mvp.bind(controller));

  return router;
}
