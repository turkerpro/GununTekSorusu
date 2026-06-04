import app from "./api/app";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = process.env.PORT || 3000;

// Serve static assets or mount Vite dev middleware
async function startServer() {
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

  app.listen(PORT, () => {
    console.log(`[Günün Tek Sorusu] Server is booting on http://localhost:${PORT}`);
  });
}

startServer();
