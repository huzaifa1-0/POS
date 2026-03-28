import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Coffee, Tags, Search } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function MenuManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Forms
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: '', stock_available: 100, image: null });
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const getConfig = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/menu-items/`, getConfig()),
        axios.get(`${API_BASE_URL}/categories/`, getConfig())
      ]);
      setMenuItems(itemsRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load menu data', err);
    } finally {
      setLoading(false);
    }
  };

  // --- ITEM HANDLERS ---
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('price', formData.price);
    submitData.append('category', formData.category);
    submitData.append('stock_available', formData.stock_available);
    if (formData.image instanceof File) {
      submitData.append('image', formData.image);
    }

    try {
      if (editingItem) {
        await axios.put(`${API_BASE_URL}/menu-items/${editingItem.id}/`, submitData, {
            headers: { ...getConfig().headers, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API_BASE_URL}/menu-items/`, submitData, {
            headers: { ...getConfig().headers, 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchData();
      closeItemModal();
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save item. Make sure all fields are filled.');
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      await axios.delete(`${API_BASE_URL}/menu-items/${id}/`, getConfig());
      fetchData();
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, price: item.price, category: item.category, stock_available: item.stock_available, image: null });
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditingItem(null);
    setFormData({ name: '', price: '', category: '', stock_available: 100, image: null });
  };

  // --- CATEGORY HANDLERS ---
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/categories/`, { name: categoryName }, getConfig());
      setCategoryName('');
      setShowCategoryModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to save category');
    }
  };

  // Filter Data
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <style>{`
        /* --- PREMIUM MINI-CARD UI (100% FULL WIDTH EDITION) --- */
        .modern-wrapper {
          padding: 30px 40px; /* Gives it nice breathing room on the edges */
          width: 100%;
          max-width: 100%; /* 🚨 THIS IS THE MAGIC FIX: Removes the width limit */
          box-sizing: border-box;
          margin: 0;
          padding-bottom: 100px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
        }
        
        .modern-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 20px;
        }
        .modern-title { margin: 0; display: flex; align-items: center; gap: 12px; font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #1e293b; }
        
        .header-actions { display: flex; gap: 12px; }
        .btn-modern { padding: 10px 18px; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 13px; border: none; }
        .btn-modern:active { transform: scale(0.96); }
        .btn-primary { background: #10b981; color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
        .btn-primary:hover { background: #059669; box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35); transform: translateY(-2px); }
        .btn-secondary { background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; }
        .btn-secondary:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-2px); }

        .modern-controls {
          display: flex;
          align-items: center;
          gap: 20px;
          background: white;
          padding: 12px 18px;
          border-radius: 14px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.03);
          border: 1px solid #f1f5f9;
          margin-bottom: 25px;
        }

        .modern-search { position: relative; min-width: 500px; }
        .modern-search input {
          width: 100%;
          padding: 10px 15px 10px 40px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .modern-search input:focus { background: white; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .modern-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }

        .category-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          flex: 1;
          scrollbar-width: none; 
        }
        .category-scroll::-webkit-scrollbar { display: none; } 
        
        .pill-tab {
          padding: 8px 16px;
          border-radius: 99px;
          background: transparent;
          border: 1px solid transparent;
          color: #64748b;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .pill-tab:hover { background: #f1f5f9; color: #0f172a; }
        .pill-tab.active { background: #0f172a; color: white; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2); }

        /* 🚨 FULL WIDTH GRID SYSTEM 🚨 */
        .modern-grid {
          display: grid;
          /* Automatically fits as many 180px cards as possible across the ENTIRE width */
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 15px; 
        }
        
        .modern-card {
          background: white;
          border-radius: 16px; 
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          border: 1px solid #f1f5f9;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .modern-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          border-color: #e2e8f0;
        }
        
        .card-img-wrapper {
          height: 120px; 
          background: #f8fafc;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        
        .badge-price {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          padding: 4px 10px;
          border-radius: 99px;
          font-weight: 800;
          color: #0f172a;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .badge-category {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(4px);
          color: white;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-content { padding: 12px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .card-title { margin: 0 0 12px 0; font-size: 15px; color: #1e293b; font-weight: 800; line-height: 1.2; }
        
        .card-actions { display: flex; gap: 6px; }
        .btn-card-action { flex: 1; padding: 6px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 4px; font-size: 12px; transition: all 0.2s; border: none; }
        .btn-edit { background: #f1f5f9; color: #475569; }
        .btn-edit:hover { background: #e2e8f0; color: #0f172a; }
        .btn-delete { background: #fff1f2; color: #ef4444; }
        .btn-delete:hover { background: #fecdd3; color: #dc2626; }

        /* 📱 PERFECT MOBILE VIEW 📱 */
        @media (max-width: 768px) {
          .modern-wrapper { padding: 15px; }
          .modern-controls { flex-direction: column; padding: 12px; align-items: stretch; gap: 12px; }
          
          /* Search bar stretches full width */
          .modern-search { min-width: 100%; width: 100%; }
          
          /* Action buttons sit side-by-side perfectly */
          .header-actions { width: 100%; display: flex; gap: 10px; }
          .btn-modern { flex: 1; justify-content: center; padding: 12px; }
          
          /* Forces exactly 2 mini-cards side-by-side on mobile phones! */
          .modern-grid { grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 12px; }
        }
      `}</style>

      <div className="modern-wrapper">
        
        {/* HEADER */}
        <div className="modern-header">
          <h1 className="modern-title"><Coffee size={28} color="#3b82f6" /> Menu Setup</h1>
          
          <div className="header-actions">
            <button className="btn-modern btn-secondary" onClick={() => setShowCategoryModal(true)}>
              <Tags size={16} /> Add Category
            </button>
            <button className="btn-modern btn-primary" onClick={() => setShowItemModal(true)}>
              <Plus size={16} /> Add New Dish
            </button>
          </div>
        </div>

        {/* CONTROLS (Search & Categories) */}
        <div className="modern-controls">
          <div className="modern-search">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Horizontal Swiping Category Pills */}
          <div className="category-scroll">
            <button 
              className={`pill-tab ${selectedCategory === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('All')}
            >
              All Items
            </button>

            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`pill-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN GRID */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontWeight: 'bold' }}>Loading amazing food...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
            <Coffee size={40} style={{ opacity: 0.3, margin: '0 auto 15px' }}/>
            <h3 style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '18px' }}>No dishes found</h3>
            <p style={{ margin: 0, fontSize: '13px' }}>Try adjusting your search or add a new item.</p>
          </div>
        ) : (
          <div className="modern-grid">
            {filteredItems.map(item => {
              const cat = categories.find(c => c.id === item.category);
              return (
                <div key={item.id} className="modern-card">
                  <div className="card-img-wrapper">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <ImageIcon size={30} color="#cbd5e1" />
                    )}
                    <div className="badge-category">{cat ? cat.name : 'No Cat'}</div>
                    <div className="badge-price">Rs. {item.price}</div>
                  </div>
                  
                  <div className="card-content">
                    <h3 className="card-title">{item.name}</h3>
                    
                    <div className="card-actions">
                      <button className="btn-card-action btn-edit" onClick={() => openEditModal(item)}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button className="btn-card-action btn-delete" onClick={() => deleteItem(item.id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* --- MODALS --- */}
        
        {/* ITEM MODAL */}
        {showItemModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
            <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <button onClick={closeItemModal} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.background='#f1f5f9'}><X size={18}/></button>
              
              <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                {editingItem ? 'Update Dish' : 'Create New Dish'}
              </h2>
              
              <form onSubmit={handleItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Dish Name</label>
                  <input type="text" placeholder="e.g. Chicken Karahi" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '14px', background: '#f8fafc', transition: '0.2s' }} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#cbd5e1'} />
                </div>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Price (PKR)</label>
                    <input type="number" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '14px', background: '#f8fafc', transition: '0.2s' }} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#cbd5e1'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '14px', background: '#f8fafc', cursor: 'pointer' }}>
                      <option value="">Select...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Dish Photo</label>
                  <div style={{ border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '12px', background: '#f8fafc', textAlign: 'center' }}>
                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} style={{ width: '100%', fontSize: '13px', color: '#64748b' }} />
                  </div>
                </div>

                <button type="submit" style={{ marginTop: '5px', width: '100%', padding: '14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#1e293b'} onMouseOut={e=>e.currentTarget.style.background='#0f172a'}>
                  {editingItem ? 'Save Changes' : 'Publish to Menu'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CATEGORY MODAL */}
        {showCategoryModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
            <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '350px', padding: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <button onClick={() => setShowCategoryModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#64748b', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.background='#f1f5f9'}><X size={18}/></button>
              
              <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>New Category</h2>
              
              <form onSubmit={handleCategorySubmit}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Category Name</label>
                <input type="text" placeholder="e.g. Refreshments" value={categoryName} onChange={e => setCategoryName(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '20px', outline: 'none', fontSize: '14px', background: '#f8fafc', transition: '0.2s' }} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#cbd5e1'} />
                
                <button type="submit" style={{ width: '100%', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#059669'} onMouseOut={e=>e.currentTarget.style.background='#10b981'}>
                  Add Category
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default MenuManager;