//
import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit, Search, IndianRupee, Lightbulb, Users, Package, X } from 'lucide-react';
import axios from 'axios';
import Can from '../components/Can';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [formData, setFormData] = useState({
    category: 'Utility',
    amount: '',
    description: '',
    staff_member: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const [expenseRes, staffRes] = await Promise.all([
        axios.get('http://localhost:8000/api/expenses/'),
        axios.get('http://localhost:8000/api/auth/users/') // Uses your existing staff API
      ]);
      setExpenses(expenseRes.data);
      setStaff(staffRes.data.users || []); //
      setLoading(false);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:8000/api/expenses/${currentId}/`, formData);
      } else {
        await axios.post('http://localhost:8000/api/expenses/', formData);
      }
      closeModal();
      fetchData();
    } catch (err) { alert("Error saving expense"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await axios.delete(`http://localhost:8000/api/expenses/${id}/`);
      fetchData();
    }
  };

  const openEdit = (exp) => {
    setIsEditing(true);
    setCurrentId(exp.id);
    setFormData({
      category: exp.category,
      amount: exp.amount,
      description: exp.description,
      staff_member: exp.staff_member || '',
      date: exp.date
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({ category: 'Utility', amount: '', description: '', staff_member: '', date: new Date().toISOString().split('T')[0] });
  };

  const totals = {
    all: expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0),
    utility: expenses.filter(e => e.category === 'Utility').reduce((acc, curr) => acc + parseFloat(curr.amount), 0),
    staff: expenses.filter(e => e.category === 'Staff').reduce((acc, curr) => acc + parseFloat(curr.amount), 0),
    misc: expenses.filter(e => e.category === 'Misc').reduce((acc, curr) => acc + parseFloat(curr.amount), 0),
  };

  return (
    <div style={{ flex: 1, padding: '20px', background: '#f8fafc', height: '100vh', overflowY: 'auto' }}>
      {/* Responsive Header */}
      <div style={{ display: 'flex', flexDirection: window.innerWidth < 600 ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '10px' }}><FileText size={28} color="#f59e0b" /></div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '22px' }}>Shop Expenses</h2>
        </div>
        <Can perform="add:expenses">
          <button onClick={() => setShowModal(true)} style={addBtnStyle}><Plus size={18} /> Add Expense</button>
        </Can>
      </div>

      {/* Responsive Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <StatCard title="Total" value={totals.all} icon={<IndianRupee color="#f59e0b"/>} />
        <StatCard title="Utility" value={totals.utility} icon={<Lightbulb color="#3b82f6"/>} />
        <StatCard title="Staff" value={totals.staff} icon={<Users color="#10b981"/>} />
        <StatCard title="Misc" value={totals.misc} icon={<Package color="#8b5cf6"/>} />
      </div>

      {/* Main Container */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #f1f5f9' }}>
           <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={searchStyle} />
        </div>

        {/* Scrollable Table Wrapper for Mobile */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={thStyle}>DATE</th>
                <th style={thStyle}>CATEGORY</th>
                <th style={thStyle}>DETAILS</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>AMOUNT</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {expenses.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase())).map((exp) => (
                <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>{exp.date}</td>
                  <td style={tdStyle}><span style={getBadgeStyle(exp.category)}>{exp.category}</span></td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '500' }}>{exp.description}</div>
                    {exp.category === 'Staff' && <div style={{ fontSize: '12px', color: '#64748b' }}>Paid to: {exp.staff_name}</div>}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '700' }}>Rs. {parseFloat(exp.amount).toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Edit size={16} color="#3b82f6" style={{ cursor: 'pointer' }} onClick={() => openEdit(exp)} />
                      <Trash2 size={16} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => handleDelete(exp.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsive Modal */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, width: window.innerWidth < 500 ? '90%' : '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>{isEditing ? 'Edit Expense' : 'Add Expense'}</h3>
              <X style={{ cursor: 'pointer' }} onClick={closeModal} />
            </div>
            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Utility">Utility Bill</option>
                <option value="Staff">Staff Payment</option>
                <option value="Misc">Miscellaneous</option>
              </select>

              {formData.category === 'Staff' && (
                <div style={{ marginTop: '15px' }}>
                  <label style={labelStyle}>Select Staff Member</label>
                  <select style={inputStyle} required value={formData.staff_member} onChange={e => setFormData({...formData, staff_member: e.target.value})}>
                    <option value="">-- Choose Name --</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.first_name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ marginTop: '15px' }}>
                <label style={labelStyle}>Amount (PKR)</label>
                <input type="number" style={inputStyle} required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={labelStyle}>Description</label>
                <input type="text" style={inputStyle} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div style={{ marginTop: '15px', marginBottom: '20px' }}>
                <label style={labelStyle}>Date</label>
                <input type="date" style={inputStyle} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>

              <button type="submit" style={submitBtnStyle}>{isEditing ? 'Update Changes' : 'Save Expense'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles for components
const StatCard = ({ title, value, icon }) => (
  <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>{icon}</div>
    <div>
      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{title}</p>
      <h3 style={{ margin: 0, fontSize: '16px' }}>Rs. {parseFloat(value).toLocaleString()}</h3>
    </div>
  </div>
);

const thStyle = { padding: '12px 15px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: '700' };
const tdStyle = { padding: '15px', fontSize: '13px', color: '#1e293b' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#475569' };
const addBtnStyle = { background: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' };
const submitBtnStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: '600', cursor: 'pointer' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const searchStyle = { width: '100%', maxWidth: '300px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' };

const getBadgeStyle = (cat) => {
  const colors = { Utility: '#dbeafe', Staff: '#d1fae5', Misc: '#f3e8ff' };
  const text = { Utility: '#1e40af', Staff: '#065f46', Misc: '#6b21a8' };
  return { background: colors[cat], color: text[cat], padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' };
};

export default Expenses;