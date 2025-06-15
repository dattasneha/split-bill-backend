import express from "express"
import routes from "./routes/routes.config";

const app = express();

// app.use(
//     cors({
//         origin: process.env.CORS_ORIGIN,
//         credentials: true
//     })
// )

app.use("/api/v1", routes);

export { app };