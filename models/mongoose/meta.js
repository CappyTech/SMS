const mongoose = require('mongoose');

const KF_MetaSchema = new mongoose.Schema({
  uuid: { type: String, unique: true, required: true },
  model: {
    type: String,
    required: true,
    unique: true,
  },
  createdCount: {
    type: Number,
    default: 0,
  },
  updatedCount: {
    type: Number,
    default: 0,
  },
  checkedCount: {
    type: Number,
    default: 0,
  },
  lastFetchedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('meta', KF_MetaSchema);