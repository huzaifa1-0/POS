import React, { useState, useEffect } from 'react';
import './App.css';
import { FileText, X, ChefHat, Receipt, Package, Plus, Printer, CreditCard, Banknote, LogOut, Home, BarChart2, BookOpen, Settings, MapPin, PieChart, Building } from 'lucide-react';
import {Navigate, Routes, Route, NavLink } from 'react-router-dom'; 
import Inventory from './pages/Inventory'; 
import Reports from './pages/Reports'; 
import Expenses from './pages/Expenses'; 
import ManageInventory from './pages/ManageInventory';
import Vendors from './pages/Vendors';
import RecipeBuilder from './pages/RecipeBuilder';
import BranchManagement from './pages/BranchManagement';
import BranchReports from './pages/BranchReports';
import axios from 'axios';
import { usePDF } from 'react-to-pdf';
import { PermissionsProvider } from './context/PermissionsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Can from './components/Can';
import SettingsPage from './pages/Settings';
import { jwtDecode } from "jwt-decode";
// ... your other imports ...

// 🚨 NEW: Global Axios Interceptor
// This secretly attaches the selected Branch ID to EVERY request sent to Django
// 🚨 NEW: Global Axios Interceptor
// This secretly attaches the Branch ID & Simulated Role to EVERY request
// 🚨 NEW: Global Axios Interceptor
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  const branchId = sessionStorage.getItem('branch_id');
  const activeRole = sessionStorage.getItem('active_role'); // 🚨 Get active role
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // 2. Always attach the Branch ID so Django filters data correctly
  if (branchId) {
    config.headers['X-Branch-Id'] = branchId;
  }

  // 3. Always attach the Simulated Role (so Admins can pretend to be Cashiers properly)
  if (activeRole) {
    config.headers['X-Simulated-Role'] = activeRole;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

function App() {
  // --- 1. UPDATED AUTHENTICATION STATES ---
  const [token, setToken] = useState(sessionStorage.getItem('access_token'));
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  
  // --- NEW: ADMIN SETUP STATES ---
  let realRole = null;
  if (token) {
    try { realRole = jwtDecode(token).role; } catch(e) {}
  }
  const isPendingSetup = realRole === 'Admin' && !sessionStorage.getItem('active_role');
  
  {/* 🚨 FIX: Pass isPendingSetup here instead of false! */}
  const [showAdminSetup, setShowAdminSetup] = useState(isPendingSetup); 
  
  const [adminBranches, setAdminBranches] = useState([]);
  const [selectedSimBranch, setSelectedSimBranch] = useState('');
// 🚨 NEW: Popup Controllers
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [pendingSimRole, setPendingSimRole] = useState('');

  // 🚨 Fetch branches for the admin simulation modal
  useEffect(() => {
    if (realRole === 'Admin' && token) {
      axios.get(`${API_BASE_URL}/branches/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setAdminBranches(res.data))
      .catch(err => console.error(err));
    }
  }, [realRole, token]);

  // 🚨 DEFAULT TO CASHIER SINCE WE ARE REMOVING ADMIN
  const [selectedSimRole, setSelectedSimRole] = useState('Cashier');

  // --- NEW: STATE FOR THE DROPDOWN ---
  const [selectedRole, setSelectedRole] = useState('Cashier');
  // New state variables for the advanced form
  const activeRole = sessionStorage.getItem('active_role');
  const effectiveRole = activeRole || realRole; // 🚨 NEW: Defaults to realRole immediately upon login
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
  const [toastMessage, setToastMessage] = useState('');


// 🚨 NEW: State to hold the current branch's name and address
  const [currentBranch, setCurrentBranch] = useState({ name: '', address: '123 Food Street, Lahore' });

  // 🚨 NEW: Fetch the branch details when the app loads
  useEffect(() => {
    const branchId = sessionStorage.getItem('branch_id');
    if (token && branchId) {
      axios.get(`${API_BASE_URL}/branches/`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const branch = res.data.find(b => b.id.toString() === branchId.toString());
          if (branch) {
            setCurrentBranch({ name: branch.name, address: branch.address });
          }
        })
        .catch(err => console.error("Could not fetch branch details", err));
    }
  }, [token]);
  // Replace your existing orders state with this
  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem('nashta_pos_orders');
    return savedOrders ? JSON.parse(savedOrders) : {
      'Table 1': { type: 'Dine-In', items: [], status: 'Draft', paymentMethod: 'Cash' },
    };
  });

  // Add this useEffect to sync changes automatically
  useEffect(() => {
    if (showAdminSetup && token) {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      axios.get(`${API_BASE}/branches/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setAdminBranches(res.data))
      .catch(err => console.error("Could not fetch branches on refresh", err));
    }
  }, [showAdminSetup, token]);

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
    setAuthError(''); // Clear old errors

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
        
        const newToken = res.data.access;
        const decodedToken = jwtDecode(newToken);

        if (decodedToken.role === 'Pending') {
           setAuthError('Your account is pending Admin approval. Please wait.');
           return; 
        }

        // Save tokens immediately
        sessionStorage.setItem('access_token', newToken);
        if (res.data.refresh) {
            sessionStorage.setItem('refresh_token', res.data.refresh);
        }

        // --- NEW LOGIC: CHECK IF ADMIN ---
        if (decodedToken.role === 'Admin') {
          setToken(newToken);
          setShowAdminSetup(true);

          try {
             // Fetch branches for the lobby dropdown
             const branchRes = await axios.get(`${API_BASE_URL}/branches/`, {
                headers: { Authorization: `Bearer ${newToken}` }
             });
             setAdminBranches(branchRes.data);
          } catch (err) {
             console.error("Could not fetch branches", err);
          }
        } else {
          // Normal Cashier/Manager: Bypass lobby
          sessionStorage.setItem('active_role', decodedToken.role);
          if (decodedToken.branch_id) {
            sessionStorage.setItem('branch_id', decodedToken.branch_id);
          }
          setToken(newToken);
        }

      } else {
        // SIGN UP
        await axios.post(`${API_BASE_URL}/auth/register/`, { 
          name: name,
          email: email, 
          password: password,
          role: selectedRole
        });
        
        setAuthMode('login');
        setAuthError(`Sign up successful! You can now log in.`);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || err.response?.data?.detail || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('active_role');
    sessionStorage.removeItem('branch_id');
    setToken(null);
    setEmail('');
    setPassword('');
    setShowAdminSetup(false);
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

//   const handleAddItem = (item) => {
//     setOrders(prev => {
//       const currentOrder = prev[activeOrder] || { type: 'Dine-In', items: [], status: 'Draft', paymentMethod: 'Cash' };
//       const existingItem = currentOrder.items.find(i => i.id === item.id);
//       
//       let newItems = existingItem 
//         ? currentOrder.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
//         : [...currentOrder.items, { ...item, qty: 1 }];

//       const newStatus = currentOrder.status === 'Sent' ? 'Sent' : 'Running';
//       return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: newStatus } };
//     });
    
//     // 🚨 NEW: Trigger the notification and clear it after 1 second
//     setToastMessage(`Added ${item.name}!`);
//     setTimeout(() => setToastMessage(''), 1000);
//   };

//   const handleRemoveClick = (itemId) => setItemToDelete(itemId);

//   const handleQuantityChange = (itemId, delta) => {
//     setOrders(prev => {
//       const currentOrder = prev[activeOrder];
//       let newItems = currentOrder.items.map(item => {
//         if (item.id === itemId) {
//           return { ...item, qty: item.qty + delta };
//         }
//         return item;
//       }).filter(item => item.qty > 0);

//       if (newItems.length === 0) {
//          return { ...prev, [activeOrder]: { ...currentOrder, items: [], status: 'Draft' } };
//       }

//       const newStatus = currentOrder.status === 'Sent' ? 'Running' : currentOrder.status;
//       return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: newStatus } };
//     });
//   };

//   const executeRemoveItem = () => {
//     if (!itemToDelete) return;
//     setOrders(prev => {
//       const currentOrder = prev[activeOrder];
//       const newItems = currentOrder.items.filter(i => i.id !== itemToDelete);
      
//       if (newItems.length === 0) {
//         const remainingOrders = { ...prev };
//         delete remainingOrders[activeOrder]; 
//         const remainingKeys = Object.keys(remainingOrders);
//         const nextActive = remainingKeys.length > 0 ? remainingKeys[0] : 'Table 1';
//         if (!remainingOrders[nextActive]) remainingOrders['Table 1'] = { type: 'Dine-In', items: [], status: 'Draft', paymentMethod: 'Cash' };
//         setActiveOrder(nextActive);
//         return remainingOrders;
//       }
//       const newStatus = currentOrder.status === 'Sent' ? 'Sent' : 'Running';
//       return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: newStatus } };
//     });
//     setItemToDelete(null); 
//   };

const handleAddItem = (item) => {
    setOrders(prev => {
      const currentOrder = prev[activeOrder] || { type: 'Dine-In', items: [], status: 'Draft', paymentMethod: 'Cash' };
      const existingItem = currentOrder.items.find(i => i.id === item.id);
      
      let newItems = existingItem 
        ? currentOrder.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...currentOrder.items, { ...item, qty: 1 }];

      // 🚨 FIX: Any addition resets status to Running so you can send to kitchen again!
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: 'Running' } };
    });
    
    setToastMessage(`Added ${item.name} successfully!`);
    setTimeout(() => setToastMessage(''), 1500);
  };

  const handleRemoveClick = (itemId) => setItemToDelete(itemId);

  const handleQuantityChange = (itemId, delta) => {
    setOrders(prev => {
      const currentOrder = prev[activeOrder];
      let newItems = currentOrder.items.map(item => {
        if (item.id === itemId) return { ...item, qty: item.qty + delta };
        return item;
      }).filter(item => item.qty > 0);

      if (newItems.length === 0) {
         return { ...prev, [activeOrder]: { ...currentOrder, items: [], status: 'Draft' } };
      }
      // 🚨 FIX: Changing qty resets status to Running
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: 'Running' } };
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
      // 🚨 FIX: Removing an item resets status to Running
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: 'Running' } };
    });
    setItemToDelete(null); 
    setToastMessage('Item removed successfully!');
    setTimeout(() => setToastMessage(''), 1500);
  };

  // Change to an async function
  const handleFinalizeBill = async () => {
    if (currentOrderData.items.length === 0) {
      alert("Cart is empty! Please add items before finalizing.");
      return;
    }
    
    if (currentOrderData.status !== 'Sent') {
      alert("Error: Order must be sent to the kitchen before generating a bill.");
      return;
    }

    const method = currentOrderData.paymentMethod || 'Cash';

    try {
      // 1. Build the payload to send to Django
      const payload = {
        table_number: activeOrder,
        type: currentOrderData.type,
        paymentMethod: method,
        total: total,
        items: currentOrderData.items.map(item => ({
          id: item.id,
          qty: item.qty,
          price: item.price
        }))
      };

      // 2. Send the POST request to our endpoint using the 'payload' variable AND the token!
      const res = await axios.post(`${API_BASE_URL}/orders/`, payload, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });

      // 3. If successful, trigger the PDF download and close modal
      toPDF();
      setShowReceiptModal(false); 
      
      // 4. Update the local UI stats
      if (method === 'Cash') {
        setCashIncome(prev => prev + total);
      } else {
        setOnlineIncome(prev => prev + total);
      }
      setDailyIncome(prev => prev + total);

      setCompletedOrders(prev => [
        { id: res.data.id || Date.now(), name: activeOrder, type: currentOrderData.type, total: total, method: method },
        ...prev
      ]);

      // 5. Clear the current table/order
      setOrders(prev => {
          const remainingOrders = { ...prev };
          delete remainingOrders[activeOrder];
          const remainingKeys = Object.keys(remainingOrders);
          const nextActive = remainingKeys.length > 0 ? remainingKeys[0] : 'Table 1';
          if (!remainingOrders[nextActive]) remainingOrders['Table 1'] = { type: 'Dine-In', items: [], status: 'Draft', paymentMethod: 'Cash' };
          setActiveOrder(nextActive);
          return remainingOrders;
      });

    } catch (error) {
      // 6. Detailed Error Catching!
      const backendError = error.response?.data;
      console.error("Backend Rejected Order:", backendError || error);
      alert(`Checkout Failed: ${JSON.stringify(backendError) || error.message}`);
    }
  };

  // --- 3. CONDITIONAL RENDERING: DYNAMIC LOGIN/SIGNUP FORM ---
  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
          
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

            <select 
              value={selectedRole} 
              onChange={e => setSelectedRole(e.target.value)} 
              style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px', background: 'white' }}
            >
              <option value="Cashier">Login as Cashier</option>
              <option value="Manager">Login as Manager</option>
            </select>

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

           
            {/* {authMode === 'signup' && (
              <div style={{ textAlign: 'left', fontSize: '12px', color: '#666', marginBottom: '15px', padding: '0 5px' }}>
                <strong style={{ color: '#333' }}>Password must contain:</strong>
                <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                  <li>At least 8 characters long</li>
                  <li>One uppercase and one lowercase letter</li>
                  <li>One number & one special character (!@#$%^&*)</li>
                </ul>
              </div>
            )} */}

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
            {/* {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"} */}
          </p>
        </div>
      </div>
    );
  }

  // --- NEW: ADMIN WORKSPACE LOBBY ---
  

  // --- EXISTING UI RENDER FOR LOGGED IN USERS ---
  // --- EXISTING UI RENDER FOR LOGGED IN USERS ---
  const currentOrderData = orders[activeOrder] || { items: [], status: 'Draft', type: 'Dine-In', paymentMethod: 'Cash' };
  const total = currentOrderData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const visibleDineIn = Object.keys(orders).filter(k => orders[k].type === 'Dine-In' && (orders[k].items.length > 0 || activeOrder === k));
  const visibleTakeaway = Object.keys(orders).filter(k => orders[k].type === 'Takeaway' && (orders[k].items.length > 0 || activeOrder === k));

  const getBadgeStyle = (status, isActive) => {
    if (status === 'Sent') {
      return { background: isActive ? 'rgba(255,255,255,0.4)' : '#dcfce3', color: isActive ? 'white' : '#16a34a' }; 
    }
    return { background: isActive ? 'rgba(255,255,255,0.4)' : '#ffe0e0', color: isActive ? 'white' : '#ff6b6b' }; 
  };

  return (
    <PermissionsProvider> {/* <-- ADD THIS WRAPPER */}
      <div className="app-container">

        {/* 🚨 THE NEW BRANCH SELECTION POPUP FOR ADMINS */}
        {showBranchModal && (
          <div className="modal-overlay" onClick={() => setShowBranchModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px', textAlign: 'center' }}>
              <h3 style={{ marginTop: 0, color: '#0f172a' }}>Select Target Branch</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Where do you want to simulate the <b>{pendingSimRole}</b> role?</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                {adminBranches.map(b => (
                  <button 
                    key={b.id}
                    onClick={() => {
                      sessionStorage.setItem('active_role', pendingSimRole);
                      sessionStorage.setItem('branch_id', b.id);
                      window.location.reload();
                    }}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#334155', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.target.style.borderColor = '#3b82f6'}
                    onMouseOut={(e) => e.target.style.borderColor = '#cbd5e1'}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
              <button className="btn-cancel" onClick={() => setShowBranchModal(false)} style={{ marginTop: '20px', width: '100%' }}>Cancel</button>
            </div>
          </div>
        )}
        
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
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)} style={{ backdropFilter: 'blur(5px)' }}>
          <div className="modal-content receipt-modal" onClick={e => e.stopPropagation()} style={{ padding: 0, borderRadius: '16px', maxWidth: '420px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* --- PREMIUM HEADER --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>
                <Receipt size={22} color="#3b82f6" /> Checkout & Bill
              </h3>
              <button 
                style={{ background: '#e2e8f0', border: 'none', cursor: 'pointer', color: '#64748b', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} 
                onClick={() => setShowReceiptModal(false)}
              >
                <X size={18}/>
              </button>
            </div>
            
            {/* --- SCROLLABLE BODY --- */}
            <div style={{ overflowY: 'auto', padding: '25px', background: '#f1f5f9' }}>
              
              {/* THE "PAPER" RECEIPT */}
              <div className="bill-receipt" ref={targetRef} style={{ background: '#ffffff', padding: '30px 20px', color: '#0f172a', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)' }}>
                <div className="bill-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: '#eff6ff', color: '#3b82f6', borderRadius: '50%', marginBottom: '12px' }}>
                    <Building size={24}/>
                  </div>
                  <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', fontWeight: '900', letterSpacing: '1px' }}>NASHTA POS</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 15px 0' }}>123 Food Street, Lahore</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '10px 0', fontFamily: 'monospace' }}>
                      <span><b>ORD:</b> {activeOrder}</span>
                      <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>

                {/* ITEMS: Using Monospace font for perfect receipt alignment */}
                <div className="bill-items" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>
                      <span>ITEM</span>
                      <span>AMT</span>
                  </div>
                  {currentOrderData.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', margin: '10px 0', color: '#334155' }}>
                      <span>{item.qty}x {item.name}</span>
                      <span>{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="bill-totals" style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '900', margin: '5px 0', color: '#0f172a' }}>
                    <span>TOTAL</span><span>PKR {total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <span>Method</span><span style={{ fontWeight: '800', color: '#3b82f6' }}>{currentOrderData.paymentMethod || 'Cash'}</span>
                  </div>
                </div>
              </div>

              {/* --- MODERN PAYMENT SELECTOR CARDS --- */}
              <div style={{ marginTop: '25px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '12px' }}>Select Payment Method</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  
                  {/* Cash Card */}
                  <div 
                    onClick={() => setOrders(prev => ({...prev, [activeOrder]: {...prev[activeOrder], paymentMethod: 'Cash'}}))}
                    style={{ padding: '14px', borderRadius: '10px', border: (currentOrderData.paymentMethod || 'Cash') === 'Cash' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: (currentOrderData.paymentMethod || 'Cash') === 'Cash' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', color: (currentOrderData.paymentMethod || 'Cash') === 'Cash' ? '#1e293b' : '#64748b', transition: 'all 0.2s ease', boxShadow: (currentOrderData.paymentMethod || 'Cash') === 'Cash' ? '0 4px 6px -1px rgba(59, 130, 246, 0.1)' : 'none' }}
                  >
                    <Banknote size={18} color={(currentOrderData.paymentMethod || 'Cash') === 'Cash' ? '#10b981' : '#94a3b8'} /> Cash
                  </div>
                  
                  {/* Online Card */}
                  <div 
                    onClick={() => setOrders(prev => ({...prev, [activeOrder]: {...prev[activeOrder], paymentMethod: 'Online'}}))}
                    style={{ padding: '14px', borderRadius: '10px', border: currentOrderData.paymentMethod === 'Online' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: currentOrderData.paymentMethod === 'Online' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', color: currentOrderData.paymentMethod === 'Online' ? '#1e293b' : '#64748b', transition: 'all 0.2s ease', boxShadow: currentOrderData.paymentMethod === 'Online' ? '0 4px 6px -1px rgba(59, 130, 246, 0.1)' : 'none' }}
                  >
                    <CreditCard size={18} color={currentOrderData.paymentMethod === 'Online' ? '#3b82f6' : '#94a3b8'} /> Online
                  </div>

                </div>
              </div>
            </div>

            {/* --- STICKY FOOTER ACTION --- */}
            <div style={{ padding: '20px 25px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
              <button 
                className="print-btn" 
                onClick={handleFinalizeBill}
                disabled={currentOrderData.items.length === 0 || currentOrderData.status !== 'Sent'}
                style={{ 
                  width: '100%', padding: '16px', background: (currentOrderData.items.length === 0 || currentOrderData.status !== 'Sent') ? '#cbd5e1' : '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s', 
                  cursor: (currentOrderData.items.length === 0 || currentOrderData.status !== 'Sent') ? 'not-allowed' : 'pointer', 
                  boxShadow: (currentOrderData.items.length === 0 || currentOrderData.status !== 'Sent') ? 'none' : '0 4px 6px -1px rgba(59, 130, 246, 0.4)' 
                }}
              >
                <Printer size={20} /> Complete Checkout & Print
              </button>
            </div>

          </div>
        </div>
      )}
      <div className="nav-rail">
        <div className="nav-rail-top">
          <div className="rail-logo">🍳</div>
          
          {/* 1. REMOVED THE <Can> WRAPPER SO HOME IS ALWAYS VISIBLE */}
          <NavLink to="/" className={({ isActive }) => `rail-btn ${isActive ? 'active' : ''}`} title="POS Home">
            <Home size={24} />
          </NavLink>
          
          {/* 2. HIDE THESE ICONS UNTIL ADMIN FINISHES SETUP */}
          {effectiveRole !== 'Admin' && (
            <>
                <Can permission="view:reports">
                  <NavLink to="/reports" className={({ isActive }) => `rail-btn ${isActive ? 'active' : ''}`} title="Reports">
                    <BarChart2 size={24} />
                  </NavLink>
                </Can>

                <Can permission="view:inventory">
                  <NavLink to="/inventory" className={({ isActive }) => `rail-btn ${isActive ? 'active' : ''}`} title="Inventory">
                    <Package size={24} />
                  </NavLink>
                </Can>

                <Can permission="view:expenses">
                  <NavLink to="/expenses" className={({ isActive }) => `rail-btn ${isActive ? 'active' : ''}`} title="Expenses">
                    <FileText size={24} />
                  </NavLink>
                </Can>

                <Can permission="view:recipes">
                  <NavLink to="/recipes" className={({ isActive }) => `rail-btn ${isActive ? 'active' : ''}`} title="Recipe Builder">
                    <BookOpen size={24} />
                  </NavLink>
                </Can>
            </>
          )}
        </div>

        <div className="nav-rail-bottom">
          {realRole === 'Admin' && (
            <NavLink to="/branch-management" className={({ isActive }) => `rail-btn ${isActive ? 'active' : ''}`} title="Network Management">
              <MapPin size={24} />
            </NavLink>
          )}
          {realRole === 'Admin' ? (
            <NavLink
              to="/settings"
              className={({ isActive }) => `rail-btn settings-nav-btn ${isActive ? 'active' : ''}`}
              title="Settings"
            >
              <Settings size={24} />
            </NavLink>
          ) : (
            <Can permission="view:settings">
              <NavLink
                to="/settings"
                className={({ isActive }) => `rail-btn settings-nav-btn ${isActive ? 'active' : ''}`}
                title="Settings"
              >
                <Settings size={24} />
              </NavLink>
            </Can>
          )}
          <button className="rail-btn logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={24} />
          </button>
          {/* 🚨 THE NEW CLICKABLE ROLE BADGE & DROPDOWN */}
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div 
            className="role-badge-container" 
            title={`Current Session: ${effectiveRole}`}
            onClick={() => { if (realRole === 'Admin') setShowRoleDropdown(!showRoleDropdown); }}
            style={{ cursor: realRole === 'Admin' ? 'pointer' : 'default' }}
          >
            <div className="role-avatar" style={{ background: effectiveRole === 'Admin' ? '#8b5cf6' : effectiveRole === 'Manager' ? '#f59e0b' : '#10b981' }}>
              {effectiveRole ? effectiveRole.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="role-text">{effectiveRole}</span>
          </div>

          {/* ADMIN SIMULATION DROPDOWN */}
          {showRoleDropdown && realRole === 'Admin' && (
            <div className="role-dropdown-menu">
               {/* Show this 'Return' button if they are currently simulating a branch */}
               {effectiveRole !== 'Admin' && (
                  <button onClick={() => {
                     sessionStorage.removeItem('active_role');
                     sessionStorage.removeItem('branch_id');
                     window.location.reload();
                  }} style={{ color: '#ef4444' }}>Return to Admin</button>
               )}
               <button onClick={() => { setPendingSimRole('Manager'); setShowBranchModal(true); setShowRoleDropdown(false); }}>Manager</button>
               <button onClick={() => { setPendingSimRole('Cashier'); setShowBranchModal(true); setShowRoleDropdown(false); }}>Cashier</button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* --- MULTI-PAGE ROUTING --- */}
      <Routes>
        <Route path="/" element={
          // showAdminSetup ? (
            
          //   /* --- RENDER ADMIN LOBBY ON THE HOME PAGE --- */
          //   <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', width: '100%' }}>
          //     <div className="auth-card" style={{ maxWidth: '400px', width: '100%' }}>
          //       <h2>Admin Workspace Setup</h2>
          //       <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
          //         Please select the physical branch and the role you wish to simulate for this session.
          //       </p>

          //       {/* 🚨 MODERN RADIO BUTTON BRANCH LIST */}
          //       <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          //         <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '10px' }}>
          //           Select Target Location:
          //         </label>
                  
          //         {/* Scrollable container in case you have many branches */}
          //         <div style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          //           {adminBranches.length === 0 ? (
          //             <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Loading branches...</p>
          //           ) : (
          //             adminBranches.map(b => (
          //               <label 
          //                 key={b.id} 
          //                 style={{ 
          //                   display: 'flex', 
          //                   alignItems: 'center', 
          //                   justifyContent: 'space-between',
          //                   padding: '14px 16px', 
          //                   borderRadius: '10px', 
          //                   border: selectedSimBranch == b.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
          //                   backgroundColor: selectedSimBranch == b.id ? '#eff6ff' : '#ffffff',
          //                   cursor: 'pointer',
          //                   transition: 'all 0.2s ease',
          //                   boxShadow: selectedSimBranch == b.id ? '0 2px 4px rgba(59, 130, 246, 0.1)' : 'none'
          //                 }}
          //               >
          //                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          //                   <div style={{ 
          //                     background: selectedSimBranch == b.id ? '#3b82f6' : '#f1f5f9', 
          //                     color: selectedSimBranch == b.id ? 'white' : '#64748b', 
          //                     padding: '8px', 
          //                     borderRadius: '8px', 
          //                     display: 'flex', 
          //                     justifyContent: 'center', 
          //                     alignItems: 'center',
          //                     transition: 'all 0.2s ease'
          //                   }}>
          //                     <Building size={16} />
          //                   </div>
          //                   <span style={{ fontWeight: '600', color: selectedSimBranch == b.id ? '#1e293b' : '#475569', fontSize: '15px' }}>
          //                     {b.name}
          //                   </span>
          //                 </div>
                          
          //                 {/* The actual Radio Button */}
          //                 <input 
          //                   type="radio" 
          //                   name="simBranch" 
          //                   value={b.id} 
          //                   checked={selectedSimBranch == b.id} 
          //                   onChange={(e) => setSelectedSimBranch(e.target.value)} 
          //                   style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }}
          //                 />
          //               </label>
          //             ))
          //           )}
          //         </div>
          //       </div>

          //       <select 
          //         value={selectedSimRole} 
          //         onChange={(e) => setSelectedSimRole(e.target.value)} 
          //         style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
          //       >
          //         <option value="Cashier">Login as Cashier</option>
          //         <option value="Manager">Login as Manager</option>
          //       </select>

          //       <button 
          //         className="auth-btn" 
          //         onClick={() => {
          //           if (!selectedSimBranch) return alert("You must select a branch to continue!");
                    
          //           sessionStorage.setItem('active_role', selectedSimRole);
          //           sessionStorage.setItem('branch_id', selectedSimBranch);
                    
          //           setShowAdminSetup(false);
          //           window.location.reload(); 
          //         }}
          //       >
          //         Enter Workspace
          //       </button>
          //     </div>
          //   </div>

          // ) : (
          effectiveRole === 'Admin' ? (
            <BranchReports />
          ) : (

            <>
              {/* LEFT SIDEBAR (Orders) */}
            <div className="left-sidebar">
              <div className="logo-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '25px', marginBottom: '25px', padding: '0 15px' }}>
                <span style={{ fontSize: '25px', fontWeight: '900', color: '#233e69', letterSpacing: '0.5px' }}>
                  Nashta POS
                </span>
                
                {/* 🚨 NEW: Dynamically show the assigned branch name! */}
                {currentBranch.name && (
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#3b82f6" /> {currentBranch.name}
                  </span>
                )}
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
      {/* MIDDLE SECTION */}
      <div className="middle-section">
        <div className="middle-content">
          {/* 🚨 ADDED position: 'relative' to contain the notification popup */}
          <div className="current-order-area" style={{ position: 'relative' }}>
            
            {/* 🚨 NEW: TOAST NOTIFICATION UI */}
            {/* {toastMessage && (
              <div style={{ position: 'absolute', top: '20px', right: '20px', background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 100 }}>
                ✅ {toastMessage}
              </div>
            )}
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {activeOrder} - 
              <span className="status-badge" style={{ 
                fontSize: '14px', textTransform: 'uppercase', 
                background: currentOrderData.status === 'Sent' ? '#dcfce3' : currentOrderData.status === 'Running' ? '#ffe0e0' : '#e0e7ff', 
                color: currentOrderData.status === 'Sent' ? '#16a34a' : currentOrderData.status === 'Running' ? '#ff6b6b' : '#4f46e5' 
              }}>
                {currentOrderData.status}
              </span>
            </h2> */
            
            }
            {toastMessage && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: toastMessage.includes('removed') ? '#ef4444' : '#10b981', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 100 }}>
                {toastMessage.includes('removed') ? '🗑️' : '✅'} {toastMessage}
              </div>
            )}

            <h2 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* 🚨 FIX: Theme Color for Active Order (e.g. Table 1) */}
              <span style={{ color: '#1d2c46' }}>{activeOrder}</span> - 
              <span className="status-badge" style={{ 
                fontSize: '14px', textTransform: 'uppercase', 
                background: currentOrderData.status === 'Sent' ? '#dcfce3' : currentOrderData.status === 'Running' ? '#ffe0e0' : '#e0e7ff', 
                color: currentOrderData.status === 'Sent' ? '#16a34a' : currentOrderData.status === 'Running' ? '#ff6b6b' : '#272461' 
              }}>
                {currentOrderData.status}
              </span>
            </h2>

            
            <div className="order-item-list">
              {/* --- Replace the content inside order-item-list in App.jsx --- */}
{currentOrderData.items.map(item => (
  <div className="cart-item-row" key={item.id}>
    <div className="cart-item-info">
      <span className="cart-item-name">{item.name}</span>
      <span className="cart-item-details">PKR {item.price.toFixed(0)}</span>
    </div>
    
    <div className="cart-item-controls">
      <div className="qty-pill">
        <button className="qty-pill-btn" onClick={() => handleQuantityChange(item.id, -1)}>-</button>
        <span className="qty-pill-val">{item.qty}</span>
        <button className="qty-pill-btn" onClick={() => handleQuantityChange(item.id, 1)}>+</button>
      </div>
      
      <div className="cart-item-total">
        <strong>PKR {(item.price * item.qty).toFixed(0)}</strong>
      </div>

      <button className="cart-item-delete" onClick={() => handleRemoveClick(item.id)}>
        <X size={16} />
      </button>
    </div>
  </div>
))}
            </div>
            
            {/* --- NEW: TOTAL BILL SUMMARY --- */}
            {currentOrderData.items.length > 0 && (
              <div style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '18px', color: '#0f172a' }}>
                  <span>Total Bill:</span>
                  <span>PKR {total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* --- ACTION BUTTONS ROW --- */}
            {/* --- ACTION BUTTONS ROW (SMALL & RIGHT-ALIGNED) --- */}
          
            {currentOrderData.items.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end', alignItems: 'center' }}>
                {/* Send to Kitchen Button OR Sent Badge */}
                {currentOrderData.status !== 'Sent' ? (
                  <button 
                    style={{ padding: '8px 16px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}
                    onClick={() => setOrders(prev => ({...prev, [activeOrder]: { ...prev[activeOrder], status: 'Sent' }}))}
                  >
                    <ChefHat size={16} /> Send to Kitchen
                  </button>
                ) : (
                  <div style={{ padding: '8px 16px', background: '#dcfce3', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    ✅ Sent
                  </div>
                )}
                {/* View Receipt Button */}
{/*                 <button 
                  style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}
                  onClick={() => setShowReceiptModal(true)}
                >
                  <Receipt size={16} /> View Receipt
                </button> */}

                
              </div>
            )}
          </div>

          <div className="menu-grid">
            {menuItems.map(item => (
              <div className="menu-card" key={item.id} onClick={() => handleAddItem(item)}>
                {item.icon ? (
                  <img src={item.icon} alt={item.name} style={{ width: '80px', height: '75px', objectFit: 'cover', borderRadius: '8px', marginBottom: '5px' }} />
                ) : (
                  <div style={{fontSize: '40px', marginBottom: '10px'}}>🍽️</div>
                )}
                <div>{item.name}</div>
                <div style={{color:'#f0331a', fontSize: '15px'}}>PKR {item.price}</div>
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
      {/* 🚨 NEW RIGHT SIDEBAR: PERMANENT LIVE RECEIPT */}
            <div className="right-sidebar" style={{ width: '360px', background: '#f8fafc', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}><Receipt size={20} color="#3b82f6" /> Live Receipt</h3>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div className="bill-receipt" ref={targetRef} style={{ background: 'white', padding: '20px', color: '#000', borderRadius: '12px', border: '1px dashed #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div className="bill-header" style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '1px dashed #ccc', paddingBottom: '15px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: 'black' }}>NASHTA POS</h2>
                    {currentBranch.name && (
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'black', margin: '0 0 4px 0' }}>
                        {currentBranch.name}
                      </p>
                    )}
                    <p style={{ fontSize: '12px', color: 'black', margin: '0 0 15px 0' }}>
                      {currentBranch.address}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginTop: '10px' }}>
                        
                        <span>{new Date().toLocaleDateString()}</span>
                        <span>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                        </span>

                    </div>
                  </div>

                  <div className="bill-items">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px', paddingBottom: '5px', borderBottom: '1px solid #eee' }}>
                        <span>Item</span><span>Amount</span>
                    </div>
                    {currentOrderData.items.length === 0 ? (
                       <p style={{textAlign: 'center', fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: '20px 0'}}>Cart is empty.</p>
                    ) : currentOrderData.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', margin: '6px 0', color: '#1e293b' }}>
                        <span>{item.qty} × {item.name}</span>
                        <span style={{ fontWeight: '600' }}>
                           PKR {(item.price * item.qty).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bill-totals" style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px dashed #ddd' }}>
                    <div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  fontSize: '20px', 
  fontWeight: '900', 
  margin: '10px 0', 
  color: 'black' 
}}>
  <span>TOTAL</span>
  <span>PKR {total.toFixed(0)}</span>
</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '13px', marginTop: '10px' }}>
                      <span>Method</span><span style={{ fontWeight: 'bold', color: '#333' }}>{currentOrderData.paymentMethod || 'Cash'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
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
                  style={{ width: '100%', padding: '15px', fontSize: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: (currentOrderData.items.length === 0 || currentOrderData.status !== 'Sent') ? 0.5 : 1, cursor: (currentOrderData.items.length === 0 || currentOrderData.status !== 'Sent') ? 'not-allowed' : 'pointer' }}
                >
                  <Printer size={18} /> Finalize & Print Bill
                </button>
              </div>
            </div>

      
      </>
      )} />
        <Route 
          path="/branch-management" 
          element={ realRole === 'Admin' ? <BranchManagement /> : <Navigate to="/" /> } 
        />
        
        <Route 
          path="/branch-reports" 
          element={ realRole === 'Admin' ? <BranchReports /> : <Navigate to="/" /> } 
        />
        {/* PROTECTED SEPARATE PAGES */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute permission="view:reports">
              <Reports dailyIncome={dailyIncome} cashIncome={cashIncome} onlineIncome={onlineIncome} completedOrders={completedOrders} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/inventory" 
          element={
            <ProtectedRoute permission="view:inventory">
              <Inventory />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/expenses" 
          element={
            <ProtectedRoute permission="view:expenses">
              <Expenses />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/manage-inventory" 
          element={
            <ProtectedRoute permission="edit:inventory"> {/* Notice I used 'edit' here, not just 'view' */}
              <ManageInventory />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/vendors" 
          element={
            <ProtectedRoute permission="view:vendors">
              <Vendors />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/recipes" 
          element={
            <ProtectedRoute permission="view:recipes">
              <RecipeBuilder />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/settings"
          element={
            realRole === 'Admin' ? (
              <SettingsPage />
            ) : (
              <ProtectedRoute permission="view:settings">
                <SettingsPage />
              </ProtectedRoute>
            )
          }
        />
        
      </Routes>

    </div>
    </PermissionsProvider>
  );
}

export default App;