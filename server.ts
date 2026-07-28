import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import { spawn } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const FASTAPI_PORT = 8001;

async function startServer() {
  // 1. Start Python FastAPI backend process
  console.log("Starting Python FastAPI backend on port " + FASTAPI_PORT + "...");
  const pythonBin = "python3";
  const fastApiProcess = spawn(pythonBin, [
    "-m", "uvicorn", "backend.main:app",
    "--host", "127.0.0.1",
    "--port", String(FASTAPI_PORT)
  ], {
    stdio: "inherit",
    env: { ...process.env, PATH: `/root/.local/bin:${process.env.PATH}` }
  });

  fastApiProcess.on("error", (err) => {
    console.error("FastAPI process error:", err);
  });

  fastApiProcess.on("exit", (code, signal) => {
    console.log(`FastAPI process exited with code ${code}, signal ${signal}`);
  });

  const app = express();

  // 2. Proxy /api requests to FastAPI backend
  app.use(
    "/api",
    createProxyMiddleware({
      target: `http://127.0.0.1:${FASTAPI_PORT}`,
      changeOrigin: true,
      pathRewrite: (path) => "/api" + path,
    })
  );

  // 3. Vite middleware for dev or static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Full-stack app running on http://0.0.0.0:${PORT}`);
    console.log(`⚡ FastAPI backend proxied on /api -> http://127.0.0.1:${FASTAPI_PORT}`);
  });
}

startServer();
