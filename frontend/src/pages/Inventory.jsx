import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Wallet, Search, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios'; 

const API_URL = 'http://127.0.0.1:8000/api/stock-entries/';

const Inventory = () => {
  const navigate = useNavigate();
  const [stockEntries, setStockEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(API_URL);
      setStockEntries(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  // Calculate Total Inventory Value across all stock entries
  const totalInventoryValue = stockEntries.reduce((sum, entry) => {
    return sum + (parseFloat(entry.quantity) * parseFloat(entry.price));
  }, 0);

  // Grouping Logic (Level 1 & Level 2)
  const aggregatedStock = stockEntries.reduce((acc, entry) => {
    const itemName = entry.item.name;
    const vendorName = entry.vendor.name;
    const qty = parseFloat(entry.quantity);
    const price = parseFloat(entry.price);

    // Level 1: Initialize Item
    if (!acc[itemName]) {
      acc[itemName] = { name: itemName, unit: entry.item.unit, totalQty: 0, vendors: {} };
    }
    acc[itemName].totalQty += qty;

    // Level 2: Initialize Vendor under Item
    if (!acc[itemName].vendors[vendorName]) {
      acc[itemName].vendors[vendorName] = { name: vendorName, stock: 0, prices: new Set() };
    }
    acc[itemName].vendors[vendorName].stock += qty;
    acc[itemName].vendors[vendorName].prices.add(price);

    return acc;
  }, {});

  // Convert objects to arrays for rendering
  let summaryList = Object.values(aggregatedStock).map(item => ({
    ...item,
    vendors: Object.values(item.vendors).map(v => {
      const priceArray = Array.from(v.prices);
      const priceDisplay = priceArray.length > 1 
        ? `${Math.min(...priceArray)} - ${Math.max(...priceArray)}` 
        : priceArray[0];
      return { ...v, priceDisplay };
    })
  }));

  // Search filter (searches Item Name or Vendor Name)
  if (searchTerm) {
    const lowerSearch = searchTerm.toLowerCase();
    summaryList = summaryList.filter(item => 
      item.name.toLowerCase().includes(lowerSearch) || 
      item.vendors.some(v => v.name.toLowerCase().includes(lowerSearch))
    );
  }

  const toggleRow = (itemName) => {
    setExpandedRows(prev => ({ ...prev, [itemName]: !prev[itemName] }));
  };

  return (
    <div style={{ flex: 1, padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={28} color="#ff6b6b" />
          <h2 style={{ margin: 0, color: '#1e293b' }}>Inventory Dashboard</h2>
        </div>
        <button onClick={() => navigate('/manage-inventory')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <Settings size={18} /> Manage Stock
        </button>
      </div>

      {/* Summary Card */}
      <div style={{ background: '#3b82f6', color: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', width: 'fit-content' }}>
        <Wallet size={32} />
        <div>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Inventory Value</p>
          <h3 style={{ margin: 0, fontSize: '24px' }}>PKR {totalInventoryValue.toLocaleString()}</h3>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px', maxWidth: '400px' }}>
        <Search size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
        <input 
          type="text" placeholder="Search item or vendor..." 
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '15px' }}
        />
      </div>

      {/* Main Inventory Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '15px' }}>Item</th>
              <th style={{ padding: '15px' }}>Total Stock</th>
              <th style={{ padding: '15px' }}>Unit</th>
              <th style={{ padding: '15px' }}>Total Vendors</th>
            </tr>
          </thead>
          <tbody>
            {summaryList.map((item, idx) => (
              <React.Fragment key={idx}>
                {/* Level 1: Item Row */}
                <tr onClick={() => toggleRow(item.name)} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: expandedRows[item.name] ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                    {expandedRows[item.name] ? <ChevronDown size={18}/> : <ChevronRight size={18}/>} 
                    {item.name}
                  </td>
                  <td style={{ padding: '15px', color: '#0ea5e9', fontWeight: 'bold' }}>{item.totalQty}</td>
                  <td style={{ padding: '15px', color: '#64748b' }}>{item.unit}</td>
                  <td style={{ padding: '15px', color: '#64748b' }}>{item.vendors.length} Vendors</td>
                </tr>

                {/* Level 2: Vendor Breakdown */}
                {expandedRows[item.name] && (
                  <tr>
                    <td colSpan="4" style={{ padding: '0', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ padding: '15px 40px', background: '#fcfcfc' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                          <thead>
                            <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ paddingBottom: '8px', textAlign: 'left' }}>Vendor</th>
                              <th style={{ paddingBottom: '8px', textAlign: 'left' }}>Stock Provided</th>
                              <th style={{ paddingBottom: '8px', textAlign: 'left' }}>Price (PKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.vendors.map((vendor, vIdx) => (
                              <tr key={vIdx}>
                                <td style={{ padding: '8px 0', fontWeight: '500' }}>{vendor.name}</td>
                                <td style={{ padding: '8px 0' }}>{vendor.stock} {item.unit}</td>
                                <td style={{ padding: '8px 0' }}>{vendor.priceDisplay}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {summaryList.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No inventory found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Inventory;