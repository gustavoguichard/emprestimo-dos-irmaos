import { createRequestHandler } from "@react-router/express";
import express from "express";

const app = express();

app.use(express.static("build/client", { immutable: true, maxAge: "1y" }));

app.all(
  "{*path}",
  createRequestHandler({
    build: await import("../build/server/index.js"),
  })
);

export default app;
