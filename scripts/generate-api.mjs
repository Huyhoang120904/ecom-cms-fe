#!/usr/bin/env node
/**
 * Fetch the ecom-be OpenAPI document and regenerate the typed client.
 *
 * The generated file is never hand-edited. If the backend is unreachable the
 * script stops with the actual command error instead of writing a fallback
 * contract from memory.
 *
 * Usage: pnpm run api:generate
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_API_URL = "http://localhost:8000";

/** Read a `KEY=value` env file. Missing files return an empty map. */
async function readEnvFile(file) {
  const entries = {};
  let contents;
  try {
    contents = await readFile(file, "utf8");
  } catch {
    return entries;
  }
  for (const line of contents.split("\n")) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    entries[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return entries;
}

/**
 * Resolve the API origin: an exported variable wins, then `.env.local`, then
 * `.env`, then the local development default.
 */
async function resolveApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  for (const file of [".env.local", ".env"]) {
    const entries = await readEnvFile(resolve(repoRoot, file));
    if (entries.NEXT_PUBLIC_API_URL) return entries.NEXT_PUBLIC_API_URL;
  }
  return DEFAULT_API_URL;
}

async function main() {
  const baseUrl = (await resolveApiUrl()).replace(/\/+$/, "");
  const documentUrl = `${baseUrl}/api/v1/openapi.json`;

  let response;
  try {
    response = await fetch(documentUrl, {
      headers: { accept: "application/json" },
    });
  } catch (error) {
    console.error(`Failed to reach ${documentUrl}: ${error.message}`);
    console.error("Start ecom-be first, then re-run this command.");
    process.exit(1);
  }

  if (!response.ok) {
    console.error(
      `Failed to reach ${documentUrl}: HTTP ${response.status} ${response.statusText}`,
    );
    process.exit(1);
  }

  const document = await response.json();
  if (!document || typeof document !== "object" || !document.openapi) {
    console.error(
      `Unexpected response from ${documentUrl}: it is not an OpenAPI document.`,
    );
    process.exit(1);
  }

  const snapshotDir = resolve(repoRoot, "openapi");
  await mkdir(snapshotDir, { recursive: true });
  await writeFile(
    resolve(snapshotDir, "openapi.json"),
    `${JSON.stringify(document, null, 2)}\n`,
    "utf8",
  );
  console.log(`Saved openapi/openapi.json from ${documentUrl}`);

  const openapiModule = await import("openapi-typescript").catch(() => null);

  if (!openapiModule?.default) {
    console.error(
      "openapi-typescript is not installed, so src/lib/api/generated.ts was not written.",
    );
    console.error(
      "Run `pnpm add -D openapi-typescript` and re-run `pnpm run api:generate`.",
    );
    process.exit(1);
  }

  // openapi-typescript v7 returns an AST; older versions return a string.
  const result = await openapiModule.default(document);
  const output =
    typeof result === "string"
      ? result
      : await openapiModule.astToString(result);

  const generatedPath = resolve(repoRoot, "src/lib/api/generated.ts");
  await mkdir(dirname(generatedPath), { recursive: true });
  await writeFile(generatedPath, `${output}\n`, "utf8");
  console.log(`Wrote src/lib/api/generated.ts from ${documentUrl}`);
}

await main();
