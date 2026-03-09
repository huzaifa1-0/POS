import React, { useState, useEffect } from 'react';
import './App.css';
import { FileText, X, ChefHat, Receipt, Package, Plus, Printer, CreditCard, Banknote, LogOut, Home, BarChart2 } from 'lucide-react';
import axios from 'axios';
import { usePDF } from 'react-to-pdf';

function App() {
  // --- 1. UPDATED AUTHENTICATION STATES ---
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  
  // New state variables for the advanced form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- EXISTING STATES ---
  const [activeView, setActiveView] = useState('pos');
  const [activeOrder, setActiveOrder] = useState('Table 1');
  const [menuItems, setMenuItems] = useState([]);
  
  const [dailyIncome, setDailyIncome] = useState(0);
  const [cashIncome, setCashIncome] = useState(0);
  const [onlineIncome, setOnlineIncome] = useState(0);
  
  const [completedOrders, setCompletedOrders] = useState([]);
  const [itemToDelete, setItemToDelete] = useState(null); 
  const [showReceiptModal, setShowReceiptModal] = useState(false); /* NEW: Controls the receipt modal */
  const { toPDF, targetRef } = usePDF({ filename: `${activeOrder}_Receipt.pdf` });

  // Replace your existing orders state with this
  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem('nashta_pos_orders');
    return savedOrders ? JSON.parse(savedOrders) : {
      'Table 1': { type: 'Dine-In', items: [], status: 'Draft', paymentMethod: 'Cash' },
    };
  });

  // Add this useEffect to sync changes automatically
  useEffect(() => {
    localStorage.setItem('nashta_pos_orders', JSON.stringify(orders));
  }, [orders]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE_URL}/menu-items/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          const liveItems = response.data.map(item => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            icon: item.image || null
          }));
          setMenuItems(liveItems);
        })
        .catch(error => {
          console.error("Backend Error:", error);
          if(error.response?.status === 401) handleLogout(); 
        });
    }
  }, [token]);

  // --- 2. UPDATED AUTHENTICATION HANDLER ---
  // --- UPDATED AUTHENTICATION HANDLER ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (authMode === 'signup') {
      // Prevent XSS in username
      if (/<[^>]*>?/gm.test(name)) {
        return setAuthError("Invalid characters in name. Scripts are not allowed.");
      }

      if (password !== confirmPassword) {
        return setAuthError("Passwords do not match!");
      }
      
      // Updated Regex: Allows any special characters, minimum 8 chars, 1 upper, 1 number
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!passwordRegex.test(password)) {
        return setAuthError("Password must be at least 8 characters, with 1 uppercase, 1 number, and 1 special character.");
      }
    }

    try {
      if (authMode === 'login') {
        const res = await axios.post(`${API_BASE_URL}/auth/login/`, { 
          username: email, 
          password: password 
        });
        localStorage.setItem('access_token', res.data.access);
        setToken(res.data.access);
      } else {
        await axios.post(`${API_BASE_URL}/auth/register/`, { 
          name: name,
          email: email, 
          password: password 
        });
        setAuthMode('login');
        setAuthError('Registration successful. Please log in.');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || err.response?.data?.detail || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setEmail('');
    setPassword('');
  };

  // --- EXISTING HANDLERS ---
  const handleTabClick = (tabName) => {
    if (tabName === activeOrder) return;
    setOrders(prev => {
      const newOrders = { ...prev };
      Object.keys(newOrders).forEach(key => {
        if (newOrders[key].items.length === 0 && key !== tabName) {
          delete newOrders[key];
        }
      });
      return newOrders;
    });
    setActiveOrder(tabName);
  };

  const handleAddTable = () => {
    setOrders(prev => {
      const newOrders = { ...prev };
      Object.keys(newOrders).forEach(key => {
        if (newOrders[key].items.length === 0) delete newOrders[key];
      });
      let nextNum = 1;
      while(newOrders[`Table ${nextNum}`]) nextNum++;
      const newName = `Table ${nextNum}`;
      newOrders[newName] = { type: 'Dine-In', items: [], status: 'Draft', paymentMethod: 'Cash' };
      setActiveOrder(newName);
      return newOrders;
    });
  };

  const handleAddTakeaway = () => {
    setOrders(prev => {
      const newOrders = { ...prev };
      Object.keys(newOrders).forEach(key => {
        if (newOrders[key].items.length === 0) delete newOrders[key];
      });
      let nextNum = 1;
      while(newOrders[`Takeaway ${nextNum}`]) nextNum++;
      const newName = `Takeaway ${nextNum}`;
      newOrders[newName] = { type: 'Takeaway', items: [], status: 'Draft', paymentMethod: 'Cash' };
      setActiveOrder(newName);
      return newOrders;
    });
  };

  const handleAddItem = (item) => {
    setOrders(prev => {
      const currentOrder = prev[activeOrder] || { type: 'Dine-In', items: [], status: 'Draft', paymentMethod: 'Cash' };
      const existingItem = currentOrder.items.find(i => i.id === item.id);
      
      let newItems = existingItem 
        ? currentOrder.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...currentOrder.items, { ...item, qty: 1 }];

      const newStatus = currentOrder.status === 'Sent' ? 'Sent' : 'Running';
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: newStatus } };
    });
  };

  const handleRemoveClick = (itemId) => setItemToDelete(itemId);

  const handleQuantityChange = (itemId, delta) => {
    setOrders(prev => {
      const currentOrder = prev[activeOrder];
      let newItems = currentOrder.items.map(item => {
        if (item.id === itemId) {
          return { ...item, qty: item.qty + delta };
        }
        return item;
      }).filter(item => item.qty > 0);

      if (newItems.length === 0) {
         return { ...prev, [activeOrder]: { ...currentOrder, items: [], status: 'Draft' } };
      }

      const newStatus = currentOrder.status === 'Sent' ? 'Running' : currentOrder.status;
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: newStatus } };
    });
  };

  const executeRemoveItem = () => {
    if (!itemToDelete) return;
    setOrders(prev => {
      const currentOrder = prev[activeOrder];
      const newItems = currentOrder.items.filter(i => i.id !== itemToDelete);
      
      if (newItems.length === 0) {
        const remainingOrders = { ...prev };
        delete remainingOrders[activeOrder]; 
        const remainingKeys = Object.keys(remainingOrders);
        const nextActive = remainingKeys.length > 0 ? remainingKeys[0] : 'Table 1';
        if (!remainingOrders[nextActive]) remainingOrders['Table 1'] = { type: 'Dine-In', items: [], status: 'Draft', paymentMethod: 'Cash' };
        setActiveOrder(nextActive);
        return remainingOrders;
      }
      const newStatus = currentOrder.status === 'Sent' ? 'Sent' : 'Running';
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: newStatus } };
    });
    setItemToDelete(null); 
  };

  const handleFinalizeBill = () => {
    if (currentOrderData.items.length === 0) {
      alert("Cart is empty! Please add items before finalizing.");
      return;
    }
    
    if (currentOrderData.status !== 'Sent') {
      alert("Error: Order must be sent to the kitchen before generating a bill.");
      return;
    }

    toPDF();
    setShowReceiptModal(false); // Closes the receipt pop-up after printing
    
    const method = currentOrderData.paymentMethod || 'Cash';
    if (method === 'Cash') {
      setCashIncome(prev => prev + total);
    } else {
      setOnlineIncome(prev => prev + total);
    }
    setDailyIncome(prev => prev + total);

    setCompletedOrders(prev => [
      { id: Date.now(), name: activeOrder, type: currentOrderData.type, total: total, method: method },
      ...prev
    ]);

    setOrders(prev => {
        const remainingOrders = { ...prev };
        delete remainingOrders[activeOrder];
        const remainingKeys = Object.keys(remainingOrders);
        const nextActive = remainingKeys.length > 0 ? remainingKeys[0] : 'Table 1';
        if (!remainingOrders[nextActive]) remainingOrders['Table 1'] = { type: 'Dine-In', items: [], status: 'Draft', paymentMethod: 'Cash' };
        setActiveOrder(nextActive);
        return remainingOrders;
    });
  };

  // --- 3. CONDITIONAL RENDERING: DYNAMIC LOGIN/SIGNUP FORM ---
  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>{authMode === 'login' ? 'Login to POS' : 'Register POS Admin'}</h2>
          
          {authError && (
            <p className="auth-error" style={{color: authError.includes('successful') ? 'green' : '#ff4d4f'}}>
              {authError}
            </p>
          )}
          
          <form onSubmit={handleAuth}>
            
            {/* CONDITIONAL: ONLY SHOW NAME IF SIGNUP */}
            {authMode === 'signup' && (
              <input 
                type="text" 
                placeholder="Full Name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            )}

            {/* ALWAYS SHOW EMAIL & PASSWORD */}
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />

            {/* --- NEW: PASSWORD REQUIREMENTS HELPER TEXT --- */}
            {authMode === 'signup' && (
              <div style={{ textAlign: 'left', fontSize: '12px', color: '#666', marginBottom: '15px', padding: '0 5px' }}>
                <strong style={{ color: '#333' }}>Password must contain:</strong>
                <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                  <li>At least 8 characters long</li>
                  <li>One uppercase and one lowercase letter</li>
                  <li>One number & one special character (!@#$%^&*)</li>
                </ul>
              </div>
            )}

            {/* CONDITIONAL: ONLY SHOW CONFIRM PASSWORD IF SIGNUP */}
            {authMode === 'signup' && (
              <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
              />
            )}

            <button type="submit" className="auth-btn">
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>
          
          <p 
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              setAuthError(''); // Clear errors when flipping views
            }} 
            className="auth-switch"
          >
            {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  // --- EXISTING UI RENDER FOR LOGGED IN USERS ---
  const currentOrderData = orders[activeOrder] || { items: [], status: 'Draft', type: 'Dine-In', paymentMethod: 'Cash' };
  const subtotal = currentOrderData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const visibleDineIn = Object.keys(orders).filter(k => orders[k].type === 'Dine-In' && (orders[k].items.length > 0 || activeOrder === k));
  const visibleTakeaway = Object.keys(orders).filter(k => orders[k].type === 'Takeaway' && (orders[k].items.length > 0 || activeOrder === k));

  const getBadgeStyle = (status, isActive) => {
    if (status === 'Sent') {
      return { background: isActive ? 'rgba(255,255,255,0.4)' : '#dcfce3', color: isActive ? 'white' : '#16a34a' }; 
    }
    return { background: isActive ? 'rgba(255,255,255,0.4)' : '#ffe0e0', color: isActive ? 'white' : '#ff6b6b' }; 
  };

  return (
    <div className="app-container">
      
      {itemToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Remove Item</h3>
            <p>Are you sure you want to remove this item from the order?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setItemToDelete(null)}>Cancel</button>
              <button className="btn-confirm" onClick={executeRemoveItem}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
      {showReceiptModal && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content receipt-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Receipt size={20} /> Bill View</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowReceiptModal(false)}><X size={20}/></button>
            </div>
            
            <div style={{ overflowY: 'auto', maxHeight: '50vh', paddingRight: '5px', marginBottom: '15px' }}>
              <div className="bill-receipt" ref={targetRef} style={{ background: 'white', padding: '20px', color: '#000', borderRadius: '8px', border: '1px dashed #ccc' }}>
                <div className="bill-header" style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '15px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>NASHTA POS</h2>
                  <p style={{ fontSize: '12px', color: '#555', margin: '5px 0' }}>123 Food Street, Lahore</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginTop: '10px' }}>
                      <span>Order: {activeOrder}</span>
                      <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="bill-items">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px', paddingBottom: '5px', borderBottom: '1px solid #eee' }}>
                      <span>Item</span>
                      <span>Amount</span>
                  </div>
                  {currentOrderData.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '8px 0', color: '#333' }}>
                      <span>{item.qty}x {item.name}</span>
                      <span>PKR {(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="bill-totals" style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px dashed #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span>Subtotal</span><span>PKR {subtotal.toFixed(2)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', margin: '5px 0' }}><span>Tax (5%)</span><span>PKR {tax.toFixed(2)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '900', margin: '12px 0', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                    <span>TOTAL</span><span>PKR {total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '12px' }}>
                    <span>Method</span><span style={{ fontWeight: 'bold', color: '#333' }}>{currentOrderData.paymentMethod || 'Cash'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '10px', textAlign: 'left' }}>Select Payment:</span>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#334155' }}>
                  <input type="radio" name="payment" value="Cash" checked={(currentOrderData.paymentMethod || 'Cash') === 'Cash'} onChange={() => setOrders(prev => ({...prev, [activeOrder]: {...prev[activeOrder], paymentMethod: 'Cash'}}))} /> 💵 Cash
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#334155' }}>
                  <input type="radio" name="payment" value="Online" checked={currentOrderData.paymentMethod === 'Online'} onChange={() => setOrders(prev => ({...prev, [activeOrder]: {...prev[activeOrder], paymentMethod: 'Online'}}))} /> 💳 Online
                </label>
              </div>
            </div>

            <button 
              className="print-btn" 
              onClick={handleFinalizeBill}
              disabled={currentOrderData.items.length === 0 || currentOrderData.status !== 'Sent'}
              style={{ marginTop: 0, opacity: (currentOrderData.items.length === 0 || currentOrderData.status !== 'Sent') ? 0.5 : 1, cursor: (currentOrderData.items.length === 0 || currentOrderData.status !== 'Sent') ? 'not-allowed' : 'pointer' }}
            >
              <Printer size={18} /> Finalize & Print Bill (PDF)
            </button>
          </div>
        </div>
      )}

      {/* --- NEW LEFT NAVIGATION RAIL --- */}
      <div className="nav-rail">
        <div className="nav-rail-top">
          <div className="rail-logo">🍳</div>
          <button 
            className={`rail-btn ${activeView === 'pos' ? 'active' : ''}`} 
            onClick={() => setActiveView('pos')}
            title="POS Home"
          >
            <Home size={24} />
          </button>
          <button 
            className={`rail-btn ${activeView === 'reports' ? 'active' : ''}`} 
            onClick={() => setActiveView('reports')}
            title="Reports"
          >
            <BarChart2 size={24} />
          </button>
        </div>
        <div className="nav-rail-bottom">
          <button 
            className="rail-btn logout-btn" 
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* --- CONDITIONAL RENDER: Show POS or Reports --- */}
      {activeView === 'pos' ? (
        <>
          {/* LEFT SIDEBAR (Orders) */}
          <div className="left-sidebar">
        <div className="logo-area" style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '25px',    /* Adds breathing room from the top */
          marginBottom: '25px', /* Adds space before the Dine-In section */
          padding: '0 5px'
        }}>
          
          {/* Beautiful Gradient Shop Name */}
          <span style={{
            fontSize: '24px', 
            fontWeight: '900', 
            background: 'linear-gradient(45deg, #ff6b6b, #f97316)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px',
            textShadow: '0px 2px 4px rgba(0,0,0,0.05)'
          }}>
            Nashta POS
          </span>

          
        </div>
        
        <div className="nav-section">
          <div className="section-header">
            <h3>Dine-In</h3>
            <button className="add-btn" onClick={handleAddTable}><Plus size={16}/></button>
          </div>
          <div className="scrollable-list">
            {visibleDineIn.map(table => (
              <button key={table} className={`nav-btn ${activeOrder === table ? 'active' : ''}`} onClick={() => handleTabClick(table)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{table}</span>
                  {orders[table].items.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', ...getBadgeStyle(orders[table].status, activeOrder === table) }}>
                      {orders[table].status}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="nav-section">
          <div className="section-header">
            <h3>Takeaway</h3>
            <button className="add-btn" onClick={handleAddTakeaway}><Plus size={16}/></button>
          </div>
          <div className="scrollable-list">
            {visibleTakeaway.map(ta => (
              <button key={ta} className={`nav-btn ${activeOrder === ta ? 'active' : ''}`} onClick={() => handleTabClick(ta)}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{ta}</span>
                  {orders[ta].items.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', ...getBadgeStyle(orders[ta].status, activeOrder === ta) }}>
                      {orders[ta].status}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="nav-section">
          <div className="section-header">
            <h3>Completed</h3>
            <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#e0e7ff', color: '#4f46e5', padding: '3px 8px', borderRadius: '12px' }}>
              {completedOrders.length}
            </span>
          </div>
          <div className="scrollable-list">
            {completedOrders.length === 0 ? (
              <p style={{ color: '#888', fontSize: '12px', padding: '5px 15px', fontStyle: 'italic' }}>No completed orders.</p>
            ) : (
              completedOrders.map(order => (
                <div key={order.id} style={{ padding: '10px 15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>{order.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{order.type} • {order.method}</div>
                  </div>
                  <strong style={{ fontSize: '13px', color: '#10b981' }}>PKR {order.total.toFixed(0)}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="middle-section">
        <div className="middle-content">
          <div className="current-order-area">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {activeOrder} - 
              <span className="status-badge" style={{ 
                fontSize: '14px', textTransform: 'uppercase', 
                background: currentOrderData.status === 'Sent' ? '#dcfce3' : currentOrderData.status === 'Running' ? '#ffe0e0' : '#e0e7ff', 
                color: currentOrderData.status === 'Sent' ? '#16a34a' : currentOrderData.status === 'Running' ? '#ff6b6b' : '#4f46e5' 
              }}>
                {currentOrderData.status}
              </span>
            </h2>
            
            <div className="order-item-list">
              {currentOrderData.items.length === 0 ? (
                 <p style={{color: '#888', fontStyle: 'italic', padding: '10px 0'}}>Empty. Add items below.</p>
              ) : (
                currentOrderData.items.map(item => (
                  <div className="order-item-row redesigned-cart-row" key={item.id}>
                    <div className="item-left-block">
                      <span className="item-name">{item.name}</span>
                    </div>
                    <div className="item-right-group">
                      <div className="item-controls-block">
                        <div className="cancel-wrapper">
                          <button className="small-cancel-icon-btn" onClick={() => handleRemoveClick(item.id)} title="Delete Completely"><X size={12}/></button>
                        </div>
                        <div className="qty-controls-row">
                          <button className="qty-btn" onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                          <span className="qty-val">{item.qty}</span>
                          <button className="qty-btn" onClick={() => handleQuantityChange(item.id, 1)}>+</button>
                        </div>
                      </div>
                      <div className="item-price-block">
                        <strong className="item-total-price">PKR {(item.price * item.qty).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* NEW: View Receipt Button */}
            {currentOrderData.items.length > 0 && (
              <button 
                style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px' }}
                onClick={() => setShowReceiptModal(true)}
              >
                <Receipt size={18} /> View Receipt
              </button>
            )}

            {currentOrderData.items.length > 0 && currentOrderData.status !== 'Sent' && (
              <button 
                style={{ width: '100%', padding: '12px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px' }}
                onClick={() => setOrders(prev => ({...prev, [activeOrder]: { ...prev[activeOrder], status: 'Sent' }}))}
              >
                <ChefHat size={18} /> Send to Kitchen (KOT)
              </button>
            )}

            {currentOrderData.status === 'Sent' && (
              <div style={{ width: '100%', padding: '12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce3', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
                ✅ Sent to Kitchen (Completed)
              </div>
            )}
          </div>

          <div className="menu-grid">
            {menuItems.map(item => (
              <div className="menu-card" key={item.id} onClick={() => handleAddItem(item)}>
                {item.icon ? (
                  <img src={item.icon} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                ) : (
                  <div style={{fontSize: '40px', marginBottom: '10px'}}>🍽️</div>
                )}
                <div>{item.name}</div>
                <div style={{color:'#ff6b6b'}}>PKR {item.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="running-orders-bar">
          <div style={{marginLeft:'auto', display: 'flex', alignItems: 'center', gap: '20px'}}>
            <div style={{ display: 'flex', gap: '20px', fontSize: '15px', fontWeight: '600', color: '#64748b', borderRight: '2px solid #e2e8f0', paddingRight: '20px' }}>
              <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><Banknote size={18} color="#22c55e"/> Cash: PKR {cashIncome.toFixed(0)}</span>
              <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><CreditCard size={18} color="#3b82f6"/> Online: PKR {onlineIncome.toFixed(0)}</span>
            </div>
            <div style={{color:'#10b981', fontWeight: 'bold', fontSize: '20px'}}>
              Total Income: PKR {dailyIncome.toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      
      </>
      ) : (
        /* --- REPORTS VIEW PLACEHOLDER --- */
        <div className="reports-view" style={{ flex: 1, padding: '40px', background: '#fff', overflowY: 'auto' }}>
          <h2>📊 Reports Dashboard</h2>
          <p style={{ color: '#64748b', marginTop: '10px' }}>Your daily sales, top items, and income analytics will appear here soon.</p>
        </div>
      )}
    </div>
  );
}

export default App;