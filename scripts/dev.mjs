#!/usr/bin/env node
import { spawn } from "node:child_process";
import { config } from "dotenv";

config();

const useExternalDb = process.env.SKIP_EMBEDDED_DB === "1";

function runForeground(command, args, env = process.env) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
  child.on("exit", (code) => process.exit(code ?? 0));
  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
}

if (useExternalDb) {
  if (!process.env.DATABASE_URL) {
    throw new Error("SKIP_EMBEDDED_DB=1 requires DATABASE_URL.");
  }
  runForeground("npm", ["run", "dev:app"]);
} else {
  process.env.DATABASE_URL =
    "postgresql://postgres:postgres@127.0.0.1:54329/postgres?sslmode=disable&pgbouncer=true";
  console.log("Starting embedded Postgres (no Docker, no Postgres install)...");
  runForeground("npx", [
    "pglite-server",
    "-d",
    ".pglite-data",
    "-p",
    "54329",
    "-h",
    "127.0.0.1",
    "-m",
    "20",
    "--run",
    "npm run dev:app",
  ]);
}
