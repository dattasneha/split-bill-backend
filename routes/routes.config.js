import express from "express"
import healthCheckRouter from "./healthCheck.routes"

const routes = new express.Router();

routes.use("/health-check", healthCheckRouter);

export default routes;