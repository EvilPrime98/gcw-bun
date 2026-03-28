import Bun from "bun";

const env = Bun.env;

const defineArgs = Object.entries({
  API_URL: env.API_URL,
  BASE_URL: env.BASE_URL,
}).flatMap(([key, value]) => ["--define", `process.env.${key}='${value}'`]);

const args = [
  "bun", "build", "./src/run.ts",
  "--compile",
  "--outfile", "dist/gcw",
  "--external", "electron",
  ...defineArgs,
];

Bun.spawnSync(args, { stdout: "inherit", stderr: "inherit" });