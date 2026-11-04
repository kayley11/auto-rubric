import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./hosting/schema.ts",
  dialect: "sqlite",
});
