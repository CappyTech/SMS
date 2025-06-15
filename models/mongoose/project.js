const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  uuid: { type: String, unique: true, required: true },
  ID: Number,
  Number: Number,
  Name: String,
  Reference: String,
  Description: String,
  Date1: Date,
  Date2: Date,
  CustomerID: Number,
  Status: Number,
});

const Project = mongoose.model('project', projectSchema);
module.exports = Project;
