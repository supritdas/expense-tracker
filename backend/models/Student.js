// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  regNo: { type: String, required: true, unique: true }, // Saved as String to match frontend
  name: { type: String, required: true },
  email: { type: String },
  section: { type: String },
  // Add other fields from your JSON as needed
  budget: {
    type: { type: String, default: 'monthly' },
    amount: { type: Number, default: 5000 }
  },
  income: { type: Number, default: 0 }
});

module.exports = mongoose.model('Student', studentSchema);