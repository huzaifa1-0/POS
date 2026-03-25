import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // Form State
  const [category, setCategory] = useState('Misc');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/expenses/`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setExpenses(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load expenses", err);
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/expenses/`, {
        category,
        amount,
        description,
        date
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });

      setMessage('Expense recorded successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      // Reset form and hide it
      setAmount('');
      setDescription('');
      setIsFormVisible(false);
      
      // Refresh the list
      fetchExpenses();
    } catch (err) {
      alert("Failed to add expense. Please check your inputs.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/expenses/${id}/`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      fetchExpenses();
    } catch (err) {
      alert("Failed to delete expense.");
    }
  };

  // Calculate total expenses for a quick summary
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

  return (
    <div className="settings-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div className="expense-header-wrapper">
  <h1 className="settings-header">Business Expenses</h1>
  <button 
    className="btn-primary" 
    onClick={() => setIsFormVisible(!isFormVisible)}
    style={{ backgroundColor: '#3b82f6', border: 'none' }}
  >
    {isFormVisible ? '✕ Cancel' : '+ Add New Expense'}
  </button>
</div>

      {message && <div className="settings-success-alert" style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>✓ {message}</div>}

      {/* --- ADD EXPENSE FORM (Collapsible) --- */}
      {isFormVisible && (
        <div className="settings-card form-card" style={{ marginBottom: '30px', animation: 'fadeIn 0.3s ease-in-out' }}>
          <div className="settings-card-header">
            <h2>Record an Expense</h2>
          </div>
          <div className="card-body">
            <form className="settings-form" onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>Date</label>
                <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>Category</label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}>
                  <option value="Utility">Utility Bill (Electricity, Water, Gas)</option>
                  <option value="Staff">Staff Payment / Salary</option>
                  <option value="Misc">Miscellaneous</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>Amount (Rs.)</label>
                <input type="number" step="0.01" className="form-input" placeholder="e.g., 5000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' }}>Description</label>
                <input type="text" className="form-input" placeholder="What was this expense for?" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '16px', backgroundColor: '#10b981', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EXPENSE SUMMARY WIDGET --- */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="settings-card" style={{ flex: 1, minWidth: '250px', padding: '20px', borderLeft: '5px solid #ef4444' }}>
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '14px', textTransform: 'uppercase' }}>Total Expenses Logged</h3>
          <p style={{ margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>Rs. {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* --- EXPENSES TABLE --- */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h2>Expense History</h2>
        </div>
        
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading expenses...</p>
        ) : (
          <div className="table-responsive-wrapper scrollable-table">
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="center-text">Amount</th>
                  <th className="center-text">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{exp.date}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: exp.category === 'Utility' ? '#e0f2fe' : exp.category === 'Staff' ? '#fef3c7' : '#f1f5f9',
                          color: exp.category === 'Utility' ? '#0369a1' : exp.category === 'Staff' ? '#b45309' : '#475569',
                        }}>
                          {exp.category}
                        </span>
                      </td>
                      <td>{exp.description}</td>
                      <td className="center-text" style={{ fontWeight: 'bold', color: '#ef4444' }}>
                        Rs. {Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="center-text">
                        <button 
                          onClick={() => handleDelete(exp.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="center-text" style={{ padding: '30px', color: '#64748b' }}>
                      No expenses recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default Expenses;