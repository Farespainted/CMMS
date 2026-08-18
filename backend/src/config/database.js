const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'postgres') {
  // Managed Postgres providers (Render, Heroku, etc.) require SSL and commonly
  // use a self-signed chain, so we accept-but-encrypt by default. Set DB_SSL=false
  // to disable (e.g. for a local/self-hosted Postgres with no TLS configured).
  const useSsl = process.env.DB_SSL !== 'false';
  const dialectOptions = useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {};

  if (process.env.DATABASE_URL) {
    // Single connection string, as provided by Render/Heroku-style hosts.
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions,
      define: { underscored: true },
    });
  } else {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'cmms',
      process.env.DB_USER || 'cmms_user',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        dialectOptions,
        define: {
          underscored: true,
        },
      }
    );
  }
} else {
  // SQLite - zero-config mode for local development / evaluation.
  const storage = process.env.SQLITE_STORAGE || './data/cmms.sqlite';
  const dir = path.dirname(storage);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
    define: {
      underscored: true,
    },
  });
}

module.exports = sequelize;
