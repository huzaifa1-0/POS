// frontend/src/pages/Expenses.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({
    category: 'Utility',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // 1. Fetch Expenses
  const fetchExpenses = async () => {
    const res = await axios.get('http://localhost:8000/api/expenses/');
    setExpenses(res.data);
  };

  useEffect(() => { fetchExpenses(); }, []);

  // 2. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:8000/api/expenses/', formData);
    fetchExpenses(); // Refresh list
    setFormData({ ...formData, amount: '', description: '' });
  };

  return (
    <div style={{ flex: 1, padding: '30px', background: '#f8fafc', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <FileText size={28} color="#f59e0b" />
        <h2 style={{ margin: 0, color: '#1e293b' }}>Shop Expenses</h2>
      </div>

      {/* Expense Form */}
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select 
          value={formData.category} 
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        >
          <option value="Utility">Utility Bill</option>
          <option value="Staff">Staff Payment</option>
          <option value="Misc">Miscellaneous</option>
        </select>
        <input 
          type="number" placeholder="Amount" required
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />
        <input 
          type="text" placeholder="Description (e.g. March Electricity)" required
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1 }}
        />
        <input 
          type="date" required
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />
        <button type="submit" style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>
          Add Expense
        </button>
      </form>

      {/* Expenses Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f1f5f9' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Category</th>
              <th style={{ textAlign: 'left', padding: '12px' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => (
              <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px' }}>{exp.date}</td>
                <td style={{ padding: '12px' }}>{exp.category}</td>
                <td style={{ padding: '12px' }}>{exp.description}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Rs. {exp.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expenses;