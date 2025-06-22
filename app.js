import express from "express"
import routes from "./routes/routes.config.js";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
);

app.use("/api/v1", routes);
app.use(cookieParser());
export { app };