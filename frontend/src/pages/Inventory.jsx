import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Wallet, Search, Settings, ChevronDown, ChevronRight, Users } from 'lucide-react';
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

  const totalInventoryValue = stockEntries.reduce((sum, entry) => {
    return sum + (parseFloat(entry.quantity) * parseFloat(entry.price));
  }, 0);

  const aggregatedStock = stockEntries.reduce((acc, entry) => {
    const itemName = entry.item.name;
    const vendorName = entry.vendor.name;
    const qty = parseFloat(entry.quantity);
    const price = parseFloat(entry.price);
    
    // NEW: Extract the date from the backend response
    const entryDate = new Date(entry.created_at);

    if (!acc[itemName]) {
      acc[itemName] = { name: itemName, unit: entry.item.unit, totalQty: 0, vendors: {}, lastUpdated: entryDate };
    }
    acc[itemName].totalQty += qty;
    
    // NEW: If this entry's date is newer than the saved one, update it for the item
    if (entryDate > acc[itemName].lastUpdated) {
      acc[itemName].lastUpdated = entryDate;
    }

    if (!acc[itemName].vendors[vendorName]) {
      acc[itemName].vendors[vendorName] = { name: vendorName, stock: 0, prices: new Set(), lastUpdated: entryDate };
    }
    acc[itemName].vendors[vendorName].stock += qty;
    acc[itemName].vendors[vendorName].prices.add(price);
    
    // NEW: If this entry's date is newer, update it for the specific vendor too
    if (entryDate > acc[itemName].vendors[vendorName].lastUpdated) {
      acc[itemName].vendors[vendorName].lastUpdated = entryDate;
    }

    return acc;
  }, {});

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
    <div className="inv-page-container">
      
      {/* Header */}
      <div className="inv-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={28} color="#ff6b6b" />
          <h2 style={{ margin: 0, color: '#1e293b' }}>Inventory Dashboard</h2>
        </div>
        
        {/* We wrap the buttons in a div with gap to place them side by side */}
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
        
        {/* Summary Card */}
        <div style={{ background: '#10b981', color: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', flex: '1', minWidth: '250px', maxWidth: '350px' }}>
          <Wallet size={32} />
          <div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Inventory Value</p>
            <h3 style={{ margin: 0, fontSize: '24px' }}>PKR {totalInventoryValue.toLocaleString()}</h3>
          </div>
        </div>

        {/* Search Bar - FIXED SIZE */}
        <div style={{ width: '100%', maxWidth: '350px', display: 'flex', alignItems: 'center', background: '#fff', padding: '0 15px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <Search size={18} color="#94a3b8" style={{ marginRight: '10px' }} />
          <input 
            type="text" placeholder="Search item or vendor..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', padding: '14px 0', background: 'transparent' }}
          />
        </div>

      </div>

      {/* Main Inventory Table - Notice the classes added here */}
      {/* Main Inventory Table */}
      <div className="inventory-table-container" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
        <table className="custom-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          {/* ADDED: position: sticky, top: 0, zIndex: 10 so the header doesn't scroll away */}
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '15px' }}>Item</th>
              <th style={{ padding: '15px' }}>Total Stock</th>
              <th style={{ padding: '15px' }}>Unit</th>
              <th style={{ padding: '15px' }}>Total Vendors</th>
              {/* NEW COLUMN */}
              <th style={{ padding: '15px', textAlign: 'right' }}>Last Updated</th> 
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
                  {/* NEW DATA CELL */}
                  <td style={{ padding: '15px', color: '#64748b', textAlign: 'right' }}>
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </td>
                </tr>

                {/* Level 2: Vendor Breakdown */}
                {expandedRows[item.name] && (
                  <tr>
                    {/* CHANGED colSpan FROM 4 TO 5 */}
                    <td colSpan="5" style={{ padding: '0', borderBottom: '1px solid #e2e8f0' }}> 
                      <div style={{ padding: '15px 20px', background: '#fcfcfc' }}>
                        <table className="custom-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                          <thead>
                            <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ paddingBottom: '8px', textAlign: 'left' }}>Vendor</th>
                              <th style={{ paddingBottom: '8px', textAlign: 'left' }}>Stock Provided</th>
                              <th style={{ paddingBottom: '8px', textAlign: 'left' }}>Price (PKR)</th>
                              {/* NEW COLUMN FOR VENDORS */}
                              <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Last Restocked</th> 
                            </tr>
                          </thead>
                          <tbody>
                            {item.vendors.map((vendor, vIdx) => (
                              <tr key={vIdx}>
                                <td style={{ padding: '8px 0', fontWeight: '500' }}>{vendor.name}</td>
                                <td style={{ padding: '8px 0' }}>{vendor.stock} {item.unit}</td>
                                <td style={{ padding: '8px 0' }}>{vendor.priceDisplay}</td>
                                {/* NEW DATA CELL FOR VENDORS */}
                                <td style={{ padding: '8px 0', textAlign: 'right', color: '#64748b' }}>
                                  {new Date(vendor.lastUpdated).toLocaleDateString()}
                                </td>
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
                {/* CHANGED colSpan FROM 4 TO 5 */}
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