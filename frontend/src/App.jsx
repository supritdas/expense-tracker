import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit2, TrendingUp, TrendingDown, Users, DollarSign, PieChart as PieChartIcon, Mail, X, Check, LogOut, Search } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:5000/api';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [regNo, setRegNo] = useState('');
  const [isHuman, setIsHuman] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  

  const [activeTab, setActiveTab] = useState('dashboard');
  const [budget, setBudget] = useState({ type: 'monthly', amount: 5000 });
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState(0);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    name: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Split bill states
  const [splitBills, setSplitBills] = useState([]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitForm, setSplitForm] = useState({
    name: '',
    amount: '',
    participants: [],
    searchTerm: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Contact form
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const CATEGORIES = ['Food', 'Transport', 'Books', 'Entertainment', 'Utilities', 'Others'];
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    const stored = localStorage.getItem('expenseTrackerUser');
    if (stored) {
      const user = JSON.parse(stored);
      setCurrentUser(user);
      setIsLoggedIn(true);
      loadUserData(user.regNo);
    }
  }, []);

  const loadUserData = async (regNo) => {
    try {
      setLoading(true);
      
      // Get student profile
      const profileRes = await fetch(`${API_URL}/students/${regNo}`);
      const profile = await profileRes.json();
      
      if (profile) {
        setBudget(profile.budget || { type: 'monthly', amount: 5000 });
        setIncome(profile.income || 0);
      }
      
      // Get expenses
      const expensesRes = await fetch(`${API_URL}/expenses/${regNo}`);
      const expensesData = await expensesRes.json();
      setExpenses(expensesData.map(e => ({
        ...e,
        id: e._id,
        date: e.date.split('T')[0]
      })));
      
      // Get split bills
      const splitsRes = await fetch(`${API_URL}/splits/${regNo}`);
      const splitsData = await splitsRes.json();
      setSplitBills(splitsData.map(s => ({
        ...s,
        id: s._id,
        date: s.date.split('T')[0]
      })));
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!isHuman) {
      setError('Please verify you are human');
      setLoading(false);
      return;
    }
    
    if (!/^\d{8}$/.test(regNo)) {
      setError('Invalid registration number format. Must be 8 digits');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regNo })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      
      setCurrentUser(data.student);
      setIsLoggedIn(true);
      localStorage.setItem('expenseTrackerUser', JSON.stringify(data.student));
      await loadUserData(regNo);
      
    } catch (error) {
      setError('Server error. Please make sure backend is running on port 5000');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('expenseTrackerUser');
    setExpenses([]);
    setSplitBills([]);
    setRegNo('');
    setIsHuman(false);
  };

  const updateBudget = async (newBudget) => {
    try {
      const response = await fetch(`${API_URL}/students/${currentUser.regNo}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: newBudget })
      });
      
      if (response.ok) {
        setBudget(newBudget);
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const updateIncome = async (newIncome) => {
    try {
      const response = await fetch(`${API_URL}/students/${currentUser.regNo}/income`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ income: newIncome })
      });
      
      if (response.ok) {
        setIncome(newIncome);
      }
    } catch (error) {
      console.error('Error updating income:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.name || !expenseForm.amount) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        regNo: currentUser.regNo
      };
      
      if (editingExpense) {
        // Update existing expense
        const response = await fetch(`${API_URL}/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseData)
        });
        
        const updated = await response.json();
        setExpenses(expenses.map(e => e.id === editingExpense.id ? { ...updated, id: updated._id, date: updated.date.split('T')[0] } : e));
        
      } else {
        // Add new expense
        const response = await fetch(`${API_URL}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseData)
        });
        
        const newExpense = await response.json();
        setExpenses([...expenses, { ...newExpense, id: newExpense._id, date: newExpense.date.split('T')[0] }]);
      }
      
      setShowExpenseModal(false);
      setEditingExpense(null);
      setExpenseForm({ name: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] });
      
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE'
      });
      
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      name: expense.name,
      amount: expense.amount,
      category: expense.category,
      date: expense.date
    });
    setShowExpenseModal(true);
  };

  const searchStudents = async (term) => {
    if (term.length < 3) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      const response = await fetch(`${API_URL}/students/search/${term}`);
      const results = await response.json();
      setSearchResults(results.filter(s => s.regNo !== currentUser.regNo));
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const addParticipant = (student) => {
    if (!splitForm.participants.find(p => p.regNo === student.regNo)) {
      setSplitForm({
        ...splitForm,
        participants: [...splitForm.participants, student],
        searchTerm: ''
      });
      setSearchResults([]);
    }
  };

  const removeParticipant = (regNo) => {
    setSplitForm({
      ...splitForm,
      participants: splitForm.participants.filter(p => p.regNo !== regNo)
    });
  };

  const handleCreateSplit = async () => {
    if (!splitForm.name || !splitForm.amount || splitForm.participants.length === 0) {
      alert('Please fill all fields and add at least one participant');
      return;
    }
    
    try {
      const totalParticipants = splitForm.participants.length + 1;
      const amountPerPerson = parseFloat(splitForm.amount) / totalParticipants;
      
      const splitData = {
        name: splitForm.name,
        totalAmount: parseFloat(splitForm.amount),
        amountPerPerson,
        participants: [
          { ...currentUser, paid: true, amount: amountPerPerson },
          ...splitForm.participants.map(p => ({ ...p, paid: false, amount: amountPerPerson }))
        ],
        createdBy: currentUser.regNo,
        date: new Date().toISOString()
      };
      
      const response = await fetch(`${API_URL}/splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(splitData)
      });
      
      const newSplit = await response.json();
      setSplitBills([...splitBills, { ...newSplit, id: newSplit._id, date: newSplit.date.split('T')[0] }]);
      
      setShowSplitModal(false);
      setSplitForm({ name: '', amount: '', participants: [], searchTerm: '' });
      
    } catch (error) {
      console.error('Error creating split:', error);
      alert('Failed to create split bill');
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      
      const mailtoLink = `mailto:developers@university.edu?subject=Contact from ${contactForm.name}&body=${encodeURIComponent(contactForm.message)}%0D%0A%0D%0AFrom: ${contactForm.name} (${contactForm.email})`;
      window.location.href = mailtoLink;
      
      setContactForm({ name: '', email: '', message: '' });
      alert('Email client opened. Please send the email.');
      
    } catch (error) {
      console.error('Error submitting contact:', error);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSplitExpenses = splitBills.reduce((sum, s) => sum + s.amountPerPerson, 0);
  const combinedExpenses = totalExpenses + totalSplitExpenses;
  const savings = income - combinedExpenses;
  const budgetUsed = budget.amount > 0 ? (combinedExpenses / budget.amount) * 100 : 0;

  const categoryData = CATEGORIES.map(cat => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.value > 0);

  const monthlyData = expenses.reduce((acc, e) => {
    const month = e.date.substring(0, 7);
    if (!acc[month]) acc[month] = 0;
    acc[month] += e.amount;
    return acc;
  }, {});

  const barData = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount
  })).sort((a, b) => a.month.localeCompare(b.month));

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Student Expense Tracker</h1>
            <p className="text-gray-600 mt-2">Manage your finances smartly</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                placeholder="123XXXXX"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={8}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
              <input
                type="checkbox"
                id="human"
                checked={isHuman}
                onChange={(e) => setIsHuman(e.target.checked)}
                className="w-5 h-5 text-blue-600"
                disabled={loading}
              />
              <label htmlFor="human" className="text-sm text-gray-700">
                I am a human
              </label>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            
            <p className="text-xs text-gray-500 mt-2">Enter your 8-digit registration number (e.g., 123XXXXX)</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center">
              <DollarSign className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Expense Tracker</h1>
              <h1 className="text-xl font-bold text-gray-600">Welcome, {currentUser.name}</h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {['dashboard', 'expenses', 'split', 'contact'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Income</span>
                  <TrendingUp className="text-green-500" size={20} />
                </div>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => updateIncome(parseFloat(e.target.value) || 0)}
                  className="text-2xl font-bold text-gray-800 w-full border-b-2 border-gray-200 focus:border-green-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Expenses</span>
                  <TrendingDown className="text-red-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-800">₹{combinedExpenses.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Savings</span>
                  <DollarSign className="text-blue-500" size={20} />
                </div>
                <p className={`text-2xl font-bold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{savings.toFixed(2)}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">Budget Used</span>
                  <PieChartIcon className="text-purple-500" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{budgetUsed.toFixed(1)}%</p>
              </div>
            </div>

            {/* Budget Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Type</label>
                  <select
                    value={budget.type}
                    onChange={(e) => updateBudget({ ...budget, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Amount</label>
                  <input
                    type="number"
                    value={budget.amount}
                    onChange={(e) => updateBudget({ ...budget, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                  />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Budget Progress</span>
                  <span className="font-medium text-gray-800">₹{combinedExpenses.toFixed(2)} / ₹{budget.amount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${budgetUsed > 100 ? 'bg-red-500' : budgetUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Expenses by Category</h2>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-20">No expenses yet</p>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Spending</h2>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-20">No data yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Manage Expenses</h2>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseForm({ name: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] });
                  setShowExpenseModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusCircle size={20} />
                <span>Add Expense</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No expenses added yet. Click "Add Expense" to get started.
                      </td>
                    </tr>
                  ) : (
                    expenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-800">{expense.name}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">₹{expense.amount}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            expense.category === 'Food' ? 'bg-blue-100 text-blue-800' :
                            expense.category === 'Transport' ? 'bg-green-100 text-green-800' :
                            expense.category === 'Books' ? 'bg-yellow-100 text-yellow-800' :
                            expense.category === 'Entertainment' ? 'bg-red-100 text-red-800' :
                            expense.category === 'Utilities' ? 'bg-purple-100 text-purple-800' :
                            'bg-pink-100 text-pink-800'
                          }`}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{expense.date}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

                {activeTab === 'split' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-800">Split Bills</h2>
                      <button
                        onClick={() => {
                          setSplitForm({ name: '', amount: '', participants: [], searchTerm: '' });
                          setShowSplitModal(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <PlusCircle size={20} />
                        <span>Create Split</span>
                      </button>
                    </div>
        
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Share</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {splitBills.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                No split bills yet.
                              </td>
                            </tr>
                          ) : (
                            splitBills.map(split => (
                              <tr key={split.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-800">{split.name}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-800">₹{split.totalAmount}</td>
                                <td className="px-6 py-4 text-sm text-gray-800">₹{split.amountPerPerson.toFixed(2)}</td>
                                <td className="px-6 py-4 text-sm">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Settled
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
        
                {activeTab === 'contact' && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-8 rounded-xl shadow-sm">
                      <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Us</h2>
                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                          <input
                            type="text"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                          <textarea
                            value={contactForm.message}
                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                            required
                          ></textarea>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Send Message
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
        
              {/* Expense Modal */}
              {showExpenseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
                      <button onClick={() => setShowExpenseModal(false)} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={expenseForm.name}
                          onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Lunch"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="number"
                          value={expenseForm.amount}
                          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={expenseForm.category}
                          onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={expenseForm.date}
                          onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setShowExpenseModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddExpense}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {editingExpense ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
        
              {/* Split Modal */}
              {showSplitModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">Create Split Bill</h2>
                      <button onClick={() => setShowSplitModal(false)} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bill Name</label>
                        <input
                          type="text"
                          value={splitForm.name}
                          onChange={(e) => setSplitForm({ ...splitForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Dinner"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                        <input
                          type="number"
                          value={splitForm.amount}
                          onChange={(e) => setSplitForm({ ...splitForm, amount: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Add Participants</label>
                        <div className="relative mb-2">
                          <input
                            type="text"
                            value={splitForm.searchTerm}
                            onChange={(e) => {
                              setSplitForm({ ...splitForm, searchTerm: e.target.value });
                              searchStudents(e.target.value);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Search students..."
                          />
                          {searchLoading && <div className="absolute right-3 top-3 animate-spin">⌛</div>}
                        </div>
                        {searchResults.length > 0 && (
                          <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto mb-2">
                            {searchResults.map(student => (
                              <div
                                key={student.regNo}
                                onClick={() => addParticipant(student)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                              >
                                <p className="font-medium text-gray-800">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.regNo}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="space-y-2">
                          {splitForm.participants.map(participant => (
                            <div key={participant.regNo} className="flex justify-between items-center bg-blue-50 p-2 rounded">
                              <span className="text-sm text-gray-800">{participant.name}</span>
                              <button
                                onClick={() => removeParticipant(participant.regNo)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setShowSplitModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateSplit}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        };
        
        export default App;