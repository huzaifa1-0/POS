// frontend/src/pages/Expenses.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Search, Edit, IndianRupee, Lightbulb, Users, Package } from 'lucide-react';
import axios from 'axios';
import { usePermissions } from '../context/PermissionsContext';
import Can from '../components/Can';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // Track if we are editing
  const [formData, setFormData] = useState({
    category: 'Utility',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/expenses/');
      setExpenses(res.data);
      setLoading(false);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setFormData({
      category: exp.category,
      amount: exp.amount,
      description: exp.description,
      date: exp.date
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await axios.delete(`http://localhost:8000/api/expenses/${id}/`);
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:8000/api/expenses/${editingId}/`, formData);
      } else {
        await axios.post('http://localhost:8000/api/expenses/', formData);
      }
      closeModal();
      fetchData();
    } catch (err) { console.error(err); }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ 
      category: 'Utility', 
      amount: '', 
      description: '', 
      date: new Date().toISOString().split('T')[0] 
    });
  };

  const totals = {
    all: expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0),
    utility: expenses.filter(e => e.category === 'Utility').reduce((acc, curr) => acc + parseFloat(curr.amount), 0),
    staff: expenses.filter(e => e.category === 'Staff').reduce((acc, curr) => acc + parseFloat(curr.amount), 0),
    misc: expenses.filter(e => e.category === 'Misc').reduce((acc, curr) => acc + parseFloat(curr.amount), 0),
  };

  return (
    <div className="expenses-container">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '12px' }}>
            <FileText size={32} color="#f59e0b" />
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px' }}>Shop Expenses</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Manage utilities, staff, and daily costs</p>
          </div>
        </div>
        <Can perform="add:expenses">
          <button 
            onClick={() => setShowModal(true)}
            className="add-expense-btn"
          >
            <Plus size={20} /> Add New Expense
          </button>
        </Can>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <StatCard title="Total Expenses" value={totals.all} icon={<IndianRupee color="#f59e0b"/>} bg="#fff" />
        <StatCard title="Utility Bills" value={totals.utility} icon={<Lightbulb color="#3b82f6"/>} bg="#fff" />
        <StatCard title="Staff Salaries" value={totals.staff} icon={<Users color="#10b981"/>} bg="#fff" />
        <StatCard title="Miscellaneous" value={totals.misc} icon={<Package color="#8b5cf6"/>} bg="#fff" />
      </div>

      {/* Main Table Container */}
      <div className="table-card">
        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', width: '300px' }} className="search-wrapper">
            <Search style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} size={18} />
            <input 
              type="text" placeholder="Search description..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th style={{ textAlign: 'right' }}>AMOUNT</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {expenses.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase())).map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.date}</td>
                  <td>
                    <span style={getBadgeStyle(exp.category)}>{exp.category}</span>
                  </td>
                  <td>{exp.description}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>Rs. {parseFloat(exp.amount).toLocaleString()}</td>
                  <td>
                    <div className="expense-actions">
                      <button onClick={() => handleEdit(exp)} className="action-btn edit"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(exp.id)} className="action-btn delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Utility">Utility Bill</option>
                  <option value="Staff">Staff Payment</option>
                  <option value="Misc">Miscellaneous</option>
                </select>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Amount (PKR)</label>
                <input type="number" style={inputStyle} required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Description</label>
                <input type="text" style={inputStyle} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Date</label>
                <input type="date" style={inputStyle} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                  {editingId ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, bg }) => (
  <div style={{ background: bg, padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>{icon}</div>
    <div>
      <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '600' }}>{title}</p>
      <h3 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>Rs. {parseFloat(value).toLocaleString()}</h3>
    </div>
  </div>
);

// Styles and modal configurations
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' };
const labelStyle = { fontSize: '14px', fontWeight: '600', color: '#475569' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'white', padding: '30px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };

const getBadgeStyle = (cat) => {
  const colors = { Utility: '#dbeafe', Staff: '#d1fae5', Misc: '#f3e8ff' };
  const text = { Utility: '#1e40af', Staff: '#065f46', Misc: '#6b21a8' };
  return { background: colors[cat], color: text[cat], padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
};

export default Expenses;