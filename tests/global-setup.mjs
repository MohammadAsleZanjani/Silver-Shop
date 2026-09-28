import { execSync, spawn } from "node:child_process";
import net from "node:net";

const TEST_PORT = 54330;
const TEST_URL = `postgresql://postgres:postgres@127.0.0.1:${TEST_PORT}/postgres?sslmode=disable&pgbouncer=true`;

function waitForPort(port, attempts = 80) {
  return new Promise((resolve, reject) => {
    const tryOnce = (left) => {
      const socket = net.connect({ host: "127.0.0.1", port });
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (left <= 1) {
          reject(new Error(`Embedded Postgres did not listen on 127.0.0.1:${port}`));
          return;
        }
        setTimeout(() => tryOnce(left - 1), 100);
      });
    };
    tryOnce(attempts);
  });
}

export default async function setup() {
  process.env.DATABASE_URL = TEST_URL;

  const child = spawn(
    "npx",
    ["pglite-server", "-d", ".pglite-test", "-p", String(TEST_PORT), "-h", "127.0.0.1", "-m", "20"],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  await waitForPort(TEST_PORT);

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_URL },
  });

  return async () => {
    child.kill("SIGTERM");
  };
}
