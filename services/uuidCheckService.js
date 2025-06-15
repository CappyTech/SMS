const { v4: uuidv4 } = require('uuid');
const logger = require('./loggerService');
const db = require('./mongooseDatabaseService'); // assuming this exports all models

async function ensureUUIDs() {
  for (const [modelName, model] of Object.entries(db)) {
    if (!model.schema.path('uuid')) {
      logger.warn(`Model ${modelName} has no uuid field – skipping.`);
      continue;
    }

    const docs = await model.find({ uuid: { $exists: false } });
    if (docs.length === 0) {
      logger.info(`✅ ${modelName}: all records already have UUIDs.`);
      continue;
    }

    logger.info(`🛠️ ${modelName}: Found ${docs.length} records missing UUIDs.`);

    for (const doc of docs) {
      doc.uuid = uuidv4();
      await doc.save();
    }

    logger.info(`✅ ${modelName}: Added UUIDs to ${docs.length} records.`);
  }
}

module.exports = { ensureUUIDs };