process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/silver_mvp_test";
process.env.DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? "default-user";
process.env.DEFAULT_MARKET_ID = process.env.DEFAULT_MARKET_ID ?? "default-market";
