import Bun from "bun";
import { SUPPORTED_TARGETS } from "#src/data.ts";

const target  = process.argv[2];
const env = Bun.env;

const defineArgs = Object.entries({
  API_URL: env.API_URL,
  BASE_URL: env.BASE_URL,
}).flatMap(([key, value]) => ["--define", `process.env.${key}='${value}'`]);

const targetMap: Record<string, typeof SUPPORTED_TARGETS[number]> = {
  "linux-x64": "bun-linux-x64",
  "linux-arm64": "bun-linux-arm64",
  "windows-x64": "bun-windows-x64",
  "windows-arm64": "bun-windows-arm64",
  "darwin-x64": "bun-darwin-x64",
  "darwin-arm64": "bun-darwin-arm64",
  "linux-x64-musl": "bun-linux-x64-musl",
  "linux-arm64-musl": "bun-linux-arm64-musl",
}

if (!target) {
  console.error("Please specify a target.");
  console.error(`Valid targets: ${Object.keys(targetMap).join(", ")}`);
  process.exit(1);
}

if (!targetMap[target]) {
  console.error(`Invalid target: ${target}`);
  console.error(`Valid targets: ${Object.keys(targetMap).join(", ")}`);
  process.exit(1);
}

const args = [
  "bun",
  "build", "./src/run.ts",
  "--minify",
  "--bytecode",
  "--compile",
  "--target", targetMap[target],
  "--outfile", "dist/gcw",
  "--external", "electron",
  ...defineArgs,
];

Bun.spawnSync(args, { stdout: "inherit", stderr: "inherit" });