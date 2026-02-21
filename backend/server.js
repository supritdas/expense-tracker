const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Ensure these files exist in a 'models' folder
const Student = require('./models/Student');
const Expense = require('./models/Expense');
const SplitBill = require('./models/SplitBill');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// --- ROUTES ---

// Login Route (FIXED with Debugging)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { regNo } = req.body;
    
    console.log(`🔍 Login Attempt for RegNo: "${regNo}"`); // Debug log

    // 1. Ensure regNo is treated as a string and trimmed of whitespace
    const cleanRegNo = String(regNo).trim();

    // 2. Find student (Case-insensitive search just in case)
    const student = await Student.findOne({ 
        regNo: cleanRegNo 
    });
    
    if (!student) {
      console.log('❌ Student NOT found in database');
      return res.status(404).json({ error: 'Registration number not found' });
    }
    
    console.log('✅ Student found:', student.name);
    res.json({ student });

  } catch (error) {
    console.error('❌ Server Error during login:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student profile
app.get('/api/students/:regNo', async (req, res) => {
  try {
    const student = await Student.findOne({ regNo: req.params.regNo });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update budget
app.put('/api/students/:regNo/budget', async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { regNo: req.params.regNo },
      { budget: req.body.budget },
      { new: true }
    );
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update income
app.put('/api/students/:regNo/income', async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { regNo: req.params.regNo },
      { income: req.body.income },
      { new: true }
    );
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all expenses
app.get('/api/expenses/:regNo', async (req, res) => {
  try {
    const expenses = await Expense.find({ regNo: req.params.regNo });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add expense
app.post('/api/expenses', async (req, res) => {
  try {
    console.log('📝 Adding Expense:', req.body); // Debug log

    // Create the expense directly using the data sent from frontend
    // req.body includes: { name, amount, category, date, regNo }
    const expense = new Expense(req.body);
    
    await expense.save();
    
    console.log('✅ Expense Saved!');
    res.json(expense);
  } catch (error) {
    console.error('❌ Error saving expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search students
app.get('/api/students/search/:term', async (req, res) => {
  try {
    const term = req.params.term;
    const students = await Student.find({
      $or: [
        { regNo: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } }
      ]
    }).limit(10);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get split bills
app.get('/api/splits/:regNo', async (req, res) => {
  try {
    const splits = await SplitBill.find({
      $or: [
        { createdBy: req.params.regNo },
        { 'participants.regNo': req.params.regNo }
      ]
    });
    res.json(splits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create split bill
app.post('/api/splits', async (req, res) => {
  try {
    const split = new SplitBill(req.body);
    await split.save();
    res.json(split);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contact form
app.post('/api/contact', async (req, res) => {
  try {
    console.log('📧 Contact form received:', req.body);
    res.json({ message: 'Message received' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});