import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Wallet, Search, Settings, ChevronDown, ChevronRight, Users } from 'lucide-react';
import axios from 'axios'; 

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// --- NEW MAGIC FORMATTER FUNCTION ---
const formatStockDisplay = (qty, unit) => {
    if (!qty || !unit) return '0';
    const upperUnit = unit.toUpperCase();
    
    // Convert decimal Dozens to Dozens & Pieces (if you ever use it)
    if (upperUnit === 'DOZEN') {
        const totalPieces = Math.round(qty * 12);
        const dozens = Math.floor(totalPieces / 12);
        const pieces = totalPieces % 12;
        if (dozens === 0) return `${pieces} Piece(s)`;
        if (pieces === 0) return `${dozens} Dozen`;
        return `${dozens} Doz & ${pieces} pc(s)`;
    }
    
    // Convert decimal KG to KG & Grams
    if (upperUnit === 'KG') {
        const kg = Math.floor(qty);
        const grams = Math.round((qty - kg) * 1000);
        if (kg === 0) return `${grams} Grams`;
        if (grams === 0) return `${kg} KG`;
        return `${kg} KG & ${grams} g`;
    }

    // Convert decimal Litre to Litre & ml
    if (upperUnit === 'LITRE' || upperUnit === 'LITER') {
        const l = Math.floor(qty);
        const ml = Math.round((qty - l) * 1000);
        if (l === 0) return `${ml} ml`;
        if (ml === 0) return `${l} Litre`;
        return `${l} L & ${ml} ml`;
    }
    
    // --- NEW: Clean display for Pieces (Removes the .00 decimal) ---
    if (upperUnit === 'PIECES' || upperUnit === 'PIECE' || upperUnit === 'PCS') {
         return `${Math.round(qty)} ${unit}`; 
    }
    
    // Default fallback for Packets, Bottles, etc.
    return `${qty.toFixed(2)} ${unit}`;
};

const Inventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [itemsRes, entriesRes] = await Promise.all([
        axios.get(`${BASE_URL}/items/`, config),
        axios.get(`${BASE_URL}/stock-entries/`, config)
      ]);
      
      setItems(itemsRes.data);
      setStockEntries(entriesRes.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  let summaryList = items.map(item => {
    const itemEntries = stockEntries.filter(entry => entry.item.id === item.id);
    
    const vendorsObj = itemEntries.reduce((acc, entry) => {
        const vendorName = entry.vendor.name;
        if (!acc[vendorName]) acc[vendorName] = { name: vendorName, stockProvided: 0, prices: new Set(), lastUpdated: new Date(entry.created_at) };
        acc[vendorName].stockProvided += parseFloat(entry.quantity);
        acc[vendorName].prices.add(parseFloat(entry.price));
        if (new Date(entry.created_at) > acc[vendorName].lastUpdated) acc[vendorName].lastUpdated = new Date(entry.created_at);
        return acc;
    }, {});

    return {
        id: item.id,
        name: item.name,
        totalQty: parseFloat(item.quantity_on_hand), 
        costPerUnit: parseFloat(item.cost_per_unit),
        unit: item.unit,
        lastUpdated: itemEntries.length > 0 ? new Date(Math.max(...itemEntries.map(e => new Date(e.created_at)))) : new Date(),
        vendors: Object.values(vendorsObj).map(v => {
            const priceArray = Array.from(v.prices);
            return { ...v, priceDisplay: priceArray.length > 1 ? `${Math.min(...priceArray)} - ${Math.max(...priceArray)}` : priceArray[0] }
        })
    };
  });

  const totalInventoryValue = summaryList.reduce((sum, item) => sum + (item.totalQty * item.costPerUnit), 0);

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
    <div className="inv-page-container" style={{ padding: '30px' }}>
      
      <div className="inv-header-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={28} color="#ff6b6b" />
          <h2 style={{ margin: 0, color: '#1e293b' }}>Inventory Dashboard</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/vendors')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Users size={18} /> Manage Vendors
          </button>
          
          <button onClick={() => navigate('/manage-inventory')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Settings size={18} /> Manage Stock
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ background: '#10b981', color: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', flex: '1', minWidth: '250px', maxWidth: '350px' }}>
          <Wallet size={32} />
          <div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Current Inventory Value</p>
            <h3 style={{ margin: 0, fontSize: '24px' }}>PKR {totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '350px', display: 'flex', alignItems: 'center', background: '#fff', padding: '0 15px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <Search size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
          <input 
            type="text" placeholder="Search item or vendor..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', padding: '14px 0', background: 'transparent' }}
          />
        </div>
      </div>

      <div className="inventory-table-container" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
        <table className="custom-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '15px' }}>Item</th>
              <th style={{ padding: '15px' }}>Current Stock</th>
              <th style={{ padding: '15px' }}>Avg Cost/Unit</th>
              <th style={{ padding: '15px' }}>Vendor History</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Last Updated</th> 
            </tr>
          </thead>
          <tbody>
            {summaryList.map((item, idx) => (
              <React.Fragment key={idx}>
                <tr onClick={() => toggleRow(item.name)} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: expandedRows[item.name] ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                    {expandedRows[item.name] ? <ChevronDown size={18}/> : <ChevronRight size={18}/>} 
                    {item.name}
                  </td>
                  {/* --- APPLIED FORMATTER HERE --- */}
                  <td style={{ padding: '15px', color: item.totalQty <= 5 ? '#ef4444' : '#0ea5e9', fontWeight: 'bold' }}>
                    {formatStockDisplay(item.totalQty, item.unit)}
                  </td>
                  <td style={{ padding: '15px', color: '#64748b' }}>PKR {item.costPerUnit.toFixed(2)}</td>
                  <td style={{ padding: '15px', color: '#64748b' }}>{item.vendors.length} Vendors</td>
                  <td style={{ padding: '15px', color: '#64748b', textAlign: 'right' }}>
                    {item.lastUpdated.toLocaleDateString() !== 'Invalid Date' ? item.lastUpdated.toLocaleDateString() : 'Never'}
                  </td>
                </tr>

                {expandedRows[item.name] && (
                  <tr>
                    <td colSpan="5" style={{ padding: '0', borderBottom: '1px solid #e2e8f0' }}> 
                      <div style={{ padding: '15px 20px', background: '#fcfcfc' }}>
                        <table className="custom-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                          <thead>
                            <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ paddingBottom: '8px', textAlign: 'left' }}>Vendor</th>
                              <th style={{ paddingBottom: '8px', textAlign: 'left' }}>Lifetime Stock Provided</th>
                              <th style={{ paddingBottom: '8px', textAlign: 'left' }}>Price History (PKR)</th>
                              <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Last Restocked</th> 
                            </tr>
                          </thead>
                          <tbody>
                            {item.vendors.map((vendor, vIdx) => (
                              <tr key={vIdx}>
                                <td style={{ padding: '8px 0', fontWeight: '500' }}>{vendor.name}</td>
                                {/* --- APPLIED FORMATTER HERE AS WELL --- */}
                                <td style={{ padding: '8px 0' }}>{formatStockDisplay(vendor.stockProvided, item.unit)}</td>
                                <td style={{ padding: '8px 0' }}>{vendor.priceDisplay}</td>
                                <td style={{ padding: '8px 0', textAlign: 'right', color: '#64748b' }}>
                                  {vendor.lastUpdated.toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                            {item.vendors.length === 0 && (
                                <tr><td colSpan="4" style={{ padding: '8px 0', color: '#94a3b8', fontStyle: 'italic' }}>No vendor history. Stock added manually.</td></tr>
                            )}
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
                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No inventory found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Inventory;