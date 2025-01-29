import * as fs from "fs";
import * as path from "path";
import { serve } from "@hono/node-server";
import { apiReference } from "@scalar/hono-api-reference";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { waitUntil } from "async-wait-until";
import { trimTrailingSlash } from "hono/trailing-slash";

// Log
console.log("🚀 Starting server...");

// Instantiate Server App
const app = new OpenAPIHono();
app.use(trimTrailingSlash());
app.use(logger());

// Load Functions
var functionsWithPath = [
  {
    name: "healthcheck",
    path: path.resolve("./src/functions/healthcheck/healthcheck.ts"),
  },
  {
    name: "healthcheck",
    path: path.resolve("./workspace/src/functions/healthcheck/healthcheck.ts"),
  },
  {
    name: "healthcheck",
    path: path.resolve("../workspace/src/functions/healthcheck/healthcheck.ts"),
  },
];
console.log("Loading functions...", functionsWithPath);

var total = functionsWithPath.length;
var current = 1;
for (const fn of functionsWithPath) {
  function setupRoute(module: any) {
    console.log(
      "Mounting function # " +
        current +
        " of " +
        total +
        "/api/" +
        fn.name +
        "\n" +
        fn.path +
        "\n\n"
    );

    try {
      app.route("/api/" + fn.name + current, module.default);
      console.log("Success.");
      current = current + 1;
    } catch (error) {
      console.log(error);
    }
  }

  await import(fn.path)
    .then(async (module) => setupRoute(module))
    .catch((error) => console.log(error));
}
await waitUntil(() => current >= total + 1, { timeout: 10000 });

// The OpenAPI spec will be available at /api/openapi-spec.json
app.doc("/api/openapi-spec.json", {
  openapi: "3.1.0",
  info: {
    version: "1.0.0",
    title: (process.env.SITE_NAME || "My") + " API",
  },
});

// The OpenAPI documentation will be available at /api
app.get(
  "/api/",
  apiReference({
    theme: "saturn",
    spec: { url: "/api/openapi-spec.json" },
  })
);

const port = 8000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
