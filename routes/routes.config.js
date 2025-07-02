import express from "express"
import healthCheckRouter from "./healthCheck.routes.js"
import authRouter from "./auth.routes.js"
import groupRouter from "./group.routes.js"
import expenseRouter from "./expense.routes.js"

const routes = new express.Router();

routes.use("/health-check", healthCheckRouter);
routes.use("/auth", authRouter);
routes.use("/group", groupRouter);
routes.use("/expense", expenseRouter);
export default routes;