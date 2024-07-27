import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/llama3.ts"],
  format: ["cjs", "esm"],
  target: "es2022",
  platform: "neutral",
  dts: true,
});
