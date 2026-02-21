// seed.js
const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('./models/Student'); // Import the model we just created
require('dotenv').config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB for seeding'))
  .catch(err => console.error(err));

const importData = async () => {
  try {
    // Read the JSON file
    const data = JSON.parse(fs.readFileSync('./students.json', 'utf-8'));
    
    // IMPORTANT: Map the data to match your Schema
    // This ensures regNo is treated as a String
    const students = data.map(s => ({
      regNo: String(s.regNo), // Force String conversion
      name: s.Name,           // Map 'Name' from JSON to 'name' in Schema
      section: s.Section,
      // Map other fields if needed
    }));

    // Delete existing data to avoid duplicates
    await Student.deleteMany();
    console.log('🗑️  Old data cleared');

    // Insert new data
    await Student.insertMany(students);
    console.log('🌱 Data Imported Successfully!');

    process.exit();
  } catch (error) {
    console.error('❌ Error with data import:', error);
    process.exit(1);
  }
};

importData();