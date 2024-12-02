const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  CustomerID: Number,
  Code: String,
  Name: String,
  Contact: String,
  Telephone: String,
  Mobile: String,
  Email: String,
  Address1: String,
  Address2: String,
  Address3: String,
  Postcode: String,
  CountryName: String,
  Website: String,
  Notes: String,
  Discount: Number,
  Created: Date,
  Updated: Date,
});

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
