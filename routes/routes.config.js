import express from "express"
import healthCheckRouter from "./healthCheck.routes.js"
import authRouter from "./auth.routes.js"

const routes = new express.Router();

routes.use("/health-check", healthCheckRouter);
routes.use("/auth", authRouter);

export default routes;