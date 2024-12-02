const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
logger = require('../services/loggerService.js');
const mongoUri = "mongodb://localhost:27017/kashflowdb";

async function connectToMongo() {
  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Error connecting to MongoDB: '+ error);
    throw error;
  }
}

module.exports = connectToMongo;
