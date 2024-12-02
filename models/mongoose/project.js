const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
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

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
