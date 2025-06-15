import { Router } from "express";
import { serverHealthCheck } from "../controller/healthCheck.controller";

const router = new Router();

router.route("/server").get(serverHealthCheck);

export default router;
