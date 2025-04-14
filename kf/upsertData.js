// upsertdata.js
const fs = require('fs');
const path = require('path');
const logger = require('./loggerService');

const PLACEHOLDER_DATES = [
  "0001-01-01T00:00:00.000Z",
  "2001-01-01T00:01:15.000Z",
  "0001-01-01T00:01:15.000Z"
];

function isPlaceholderDate(value) {
  return PLACEHOLDER_DATES.includes(value);
}

async function appendLogEntry(logFilePath, logEntry) {
  try {
    const logData = `${new Date().toISOString()} - ${JSON.stringify(logEntry, null, 2)}\n`;
    await fs.promises.appendFile(logFilePath, logData, 'utf8');
  } catch (error) {
    logger.error(`Error writing to log file: ${error.message}`);
  }
}

async function upsertData(model, data, uniqueKey, metaModel, logDetails, logFilePath, sendUpdate = () => {}, startfetch = Date.now()) {
  try {
    logger.info(`Upserting data into ${model.name}...`);
    sendUpdate(`📥 Upserting into ${model.name}...`);
    const startupsertData = Date.now();

    let createdCount = 0;
    let updatedCount = 0;
    let checkedCount = 0;

    for (const item of data) {
      const whereClause = { [uniqueKey]: item[uniqueKey] };
      const existing = await model.findOne({ where: whereClause, raw: true });

      if (existing) {
        checkedCount++;
        const changes = {};
        let hasRealChange = false;

        for (const key of Object.keys(item)) {
          const currentValue = existing[key];
          const newValue = item[key];

          if (isPlaceholderDate(currentValue) || isPlaceholderDate(newValue)) continue;

          if (key.toLowerCase().includes('created') || key.toLowerCase().includes('updated')) {
            const normalizedCurrent = currentValue ? new Date(currentValue).toISOString().split('.')[0] : null;
            const normalizedNew = newValue ? new Date(newValue).toISOString().split('.')[0] : null;
            if (normalizedCurrent !== normalizedNew) {
              changes[key] = { from: currentValue, to: newValue };
              hasRealChange = true;
            }
            continue;
          }

          if (
            typeof currentValue === typeof newValue &&
            JSON.stringify(currentValue) !== JSON.stringify(newValue)
          ) {
            changes[key] = { from: currentValue, to: newValue };
            hasRealChange = true;
          }
        }

        if (hasRealChange) {
          logger.info(`Updating record with changes: ${JSON.stringify(changes)}`);
          await model.update(item, { where: whereClause });
          updatedCount++;
          const logEntry = {
            model: model.name,
            action: 'updated',
            uniqueKey: item[uniqueKey],
            changes,
          };
          logDetails.push(logEntry);
          await appendLogEntry(logFilePath, logEntry);
        }
      } else {
        logger.info(`Creating new record: ${JSON.stringify(item)}`);
        await model.create(item);
        createdCount++;
        const logEntry = {
          model: model.name,
          action: 'created',
          uniqueKey: item[uniqueKey],
          item,
        };
        logDetails.push(logEntry);
        await appendLogEntry(logFilePath, logEntry);
      }
    }

    await metaModel.upsert({
      model: model.name,
      createdCount,
      updatedCount,
      checkedCount,
      lastFetchedAt: new Date(),
    });

    const summary = `Created ${createdCount}, Updated ${updatedCount}, Checked ${checkedCount}`;
    logger.info(`✅ ${model.name} Done: ${summary}`);
    sendUpdate(`✅ ${model.name} Done: ${summary}`);
    const ms = Date.now() - startupsertData;
    sendUpdate(`⏱ ${model.name} took ${ms}ms`);
    const msf = Date.now() - startfetch;
    sendUpdate(`⏱ Fetch has taken ${msf}ms`);
    return { model: model.name, createdCount, updatedCount, checkedCount, summary };

  } catch (error) {
    logger.error(`Error upserting into ${model.name}: ${error.message}`);
  }
}

module.exports = upsertData;
