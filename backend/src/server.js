require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
const { startPmScheduler } = require('./services/pmScheduler');

const PORT = process.env.PORT || 4000;

// On a completely empty database (a fresh deploy with nothing seeded yet), automatically
// create the default roles, an admin login, and sample data - so a live deployment is usable
// immediately without needing shell/CLI access to run `npm run seed` by hand. This never runs
// again once any Role exists, so it will not touch real data on subsequent restarts/deploys.
async function autoBootstrapIfEmpty() {
  const { Role } = require('./models');
  const { createDemoData } = require('../seed/bootstrap');
  const existing = await Role.count();
  if (existing > 0) return;

  console.log('Empty database detected - creating default roles, admin login, and demo data...');
  const { adminEmail, adminPassword, demoApiKey } = await createDemoData();
  console.log('Bootstrap complete. Login with:');
  console.log(`  Admin:      ${adminEmail} / ${adminPassword}`);
  console.log('  Manager:    manager@cmms.local / Manager123!');
  console.log('  Technician: tech@cmms.local / Tech123!');
  console.log(`Demo external-system API key: ${demoApiKey}`);
}

// One-time import of a customer's real data (see seed/importRealData.js for details and safety
// notes). Only runs when IMPORT_REAL_DATA=true is set, and refuses to run twice.
async function importRealDataIfRequested() {
  if (process.env.IMPORT_REAL_DATA !== 'true') return;
  const { importRealData } = require('../seed/importRealData');
  await importRealData();
}

async function start() {
  try {
    await sequelize.authenticate();
    // In production against Postgres, prefer migrations. For this project we
    // use safe auto-sync (no data loss) so the app "just works" out of the box.
    await sequelize.sync();
    console.log(`Database connected (${process.env.DB_DIALECT || 'sqlite'})`);

    await autoBootstrapIfEmpty();
    await importRealDataIfRequested();

    startPmScheduler();

    app.listen(PORT, () => {
      console.log(`CMMS API listening on port ${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
