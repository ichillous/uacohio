import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://uacohio:uacohio-local-only@127.0.0.1:3306/uacohio",
  },
  strict: true,
  verbose: true,
});
