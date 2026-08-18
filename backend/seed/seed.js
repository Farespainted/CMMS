require('dotenv').config();
const { sequelize } = require('../src/models');
const { createDemoData } = require('./bootstrap');

async function run() {
  await sequelize.sync({ force: true });
  console.log('Database schema synced (force: true - all data reset).');

  const { adminEmail, adminPassword, demoApiKey } = await createDemoData();

  console.log('\nSeed complete.\n');
  console.log('Login credentials:');
  console.log(`  Admin:      ${adminEmail} / ${adminPassword}`);
  console.log('  Manager:    manager@cmms.local / Manager123!');
  console.log('  Technician: tech@cmms.local / Tech123!');
  console.log('\nDemo external-system API key (save this now, it will not be shown again):');
  console.log(`  ${demoApiKey}`);
  console.log('\nExample usage:');
  console.log(`  curl -H "X-API-Key: ${demoApiKey}" http://localhost:${process.env.PORT || 4000}/api/assets`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
