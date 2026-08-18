// One-time import of a customer's real data exported from a previous CMMS
// (currently: assets + locations + parts converted from a GetMaintainX export -
// see seed/data/import_data.json). Triggered by setting IMPORT_REAL_DATA=true.
//
// Safety: this WIPES existing operational data (assets, locations, parts, work
// orders, PM schedules, purchase orders, meters, downtime logs) before importing,
// but leaves Users, Roles, and API Keys untouched so nobody gets logged out.
// It refuses to run a second time if the data already looks imported, so it's
// safe even if the env var is left set across a restart.
const fs = require('fs');
const path = require('path');

async function importRealData() {
  const {
    sequelize, Location, Asset, Part, Vendor, WorkOrder, WorkOrderTask,
    PreventiveMaintenance, InventoryTransaction, PurchaseOrder, PurchaseOrderItem,
    Meter, MeterReading, DowntimeLog,
  } = require('../src/models');

  const dataPath = path.join(__dirname, 'data', 'import_data.json');
  if (!fs.existsSync(dataPath)) {
    console.log('importRealData: no data file found at seed/data/import_data.json - skipping.');
    return;
  }
  const { locations, assets, parts } = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Idempotency guard: if the first asset from the import already exists, assume this already ran.
  if (assets.length) {
    const already = await Asset.findOne({ where: { assetTag: assets[0].assetTag } });
    if (already) {
      console.log('importRealData: data already imported (found existing asset), skipping.');
      return;
    }
  }

  console.log(`importRealData: wiping demo/operational data and importing ${locations.length} locations, ${assets.length} assets, ${parts.length} parts...`);

  await sequelize.transaction(async (t) => {
    // Clear existing operational data (children first) - leaves Users/Roles/ApiKeys/AuditLogs intact.
    await WorkOrderTask.destroy({ where: {}, transaction: t });
    await InventoryTransaction.destroy({ where: {}, transaction: t });
    await DowntimeLog.destroy({ where: {}, transaction: t });
    await MeterReading.destroy({ where: {}, transaction: t });
    await Meter.destroy({ where: {}, transaction: t });
    await WorkOrder.destroy({ where: {}, transaction: t });
    await PreventiveMaintenance.destroy({ where: {}, transaction: t });
    await PurchaseOrderItem.destroy({ where: {}, transaction: t });
    await PurchaseOrder.destroy({ where: {}, transaction: t });
    await Asset.destroy({ where: {}, transaction: t });
    await Part.destroy({ where: {}, transaction: t });
    await Vendor.destroy({ where: {}, transaction: t });
    await Location.destroy({ where: {}, transaction: t });

    // Locations: create parent-less ones first, then children (only one level deep in this dataset,
    // but this loop handles arbitrary depth by repeating until nothing new can be created).
    const codeToId = {};
    let remaining = [...locations];
    let guard = 0;
    while (remaining.length && guard < 10) {
      guard += 1;
      const next = [];
      for (const loc of remaining) {
        if (!loc.parentCode || codeToId[loc.parentCode]) {
          const created = await Location.create({
            name: loc.name,
            code: loc.code,
            parentId: loc.parentCode ? codeToId[loc.parentCode] : null,
          }, { transaction: t });
          codeToId[loc.code] = created.id;
        } else {
          next.push(loc);
        }
      }
      remaining = next;
    }

    // Assets: first pass creates records, second pass wires up parent/child asset relationships.
    const tagToId = {};
    for (const a of assets) {
      const created = await Asset.create({
        assetTag: a.assetTag,
        name: a.name,
        description: a.description || null,
        category: a.category || null,
        manufacturer: a.manufacturer || null,
        modelNumber: a.modelNumber || null,
        serialNumber: a.serialNumber || null,
        status: a.status,
        locationId: a.locationCode ? (codeToId[a.locationCode] || null) : null,
        purchaseDate: a.purchaseDate || null,
        purchaseCost: a.purchaseCost || null,
      }, { transaction: t });
      tagToId[a.assetTag] = created.id;
    }
    for (const a of assets) {
      if (a.parentTag && tagToId[a.parentTag]) {
        await Asset.update(
          { parentId: tagToId[a.parentTag] },
          { where: { id: tagToId[a.assetTag] }, transaction: t }
        );
      }
    }

    // Parts
    for (const p of parts) {
      await Part.create({
        partNumber: p.partNumber,
        name: p.name,
        description: p.description || null,
        category: p.category || null,
        binLocation: p.binLocation || null,
        quantityOnHand: p.quantityOnHand || 0,
        reorderPoint: p.reorderPoint || 0,
        unitCost: p.unitCost || 0,
      }, { transaction: t });
    }
  });

  console.log(`importRealData: done. Imported ${locations.length} locations, ${assets.length} assets, ${parts.length} parts.`);
}

module.exports = { importRealData };
