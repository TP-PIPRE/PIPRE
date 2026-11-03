const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.startsWith("pnpm/")) {
  console.error("PIPRE usa pnpm. Ejecuta corepack pnpm install --frozen-lockfile desde frontend/.");
  process.exit(1);
}
