require('dotenv').config();

// Plain-JS config consumed only by sequelize-cli (migrate/seed). The app
// runtime uses config/database.ts instead — kept separate so the CLI never
// needs ts-node.
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

const shared = {
  url,
  dialect: 'postgres',
  logging: false,
  ...(process.env.DB_SSL === 'true'
    ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } }
    : {}),
};

module.exports = {
  development: shared,
  test: shared,
  production: shared,
};
