import path from "path";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";

const app: Express = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const staticDir = path.resolve(process.cwd(), "artifacts/tawbah-web/dist/public");
  app.use(express.static(staticDir));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
