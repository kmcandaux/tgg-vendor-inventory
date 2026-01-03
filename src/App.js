import React, { useState } from 'react';

const API_URL = 'https://script.google.com/macros/s/AKfycbxsuDbWxVrO82PvWAfdxK49hkLUYfelSh_aEj1MmNk_Jc4SX_DYYawZeZJ9HSkKfrwB/exec';
const VENDOR_PASSWORD = 'twogirlsvendor';
const ADMIN_PASSWORD = 'twogirlsadmin';

const CATEGORIES = [
  'Jewelry', 'Candles', 'Wax Melts', 'Soaps & Bath Products', 'Skincare & Balms',
  'Art Prints & Paintings', 'Photography', 'Pottery & Ceramics', 'Wood Crafts',
  'Metalwork & Forged Items', 'Glass Art', 'Textiles & Sewing', 'Knit & Crochet',
  'Paper Crafts & Cards', 'Stickers & Decals', 'Home Decor', 'Kitchen Items',
  'Pet Products', 'Baby & Kids', 'Seasonal & Holiday', 'Bags & Purses',
  'Hair Accessories', 'Nail Polish & Beauty', 'Baked Goods', 'Candy & Sweets',
  'Jams & Preserves', 'Beverages', 'Flags & Outdoor', 'Reiki & Spiritual',
  'Custom & Personalized', 'Other'
];

const api = async (action, params = {}) => {
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : v);
  });
  const res = await fetch(url.toString());
  return res.json();
};

export default function App() {
  const [screen, setScreen] = useState('login');
  const [isAdmin, setIsAdmin] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [skuCounters, setSkuCounters] = useState({});
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [items, setItems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [newVendor, setNewVendor] = useState({ name: '', code: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await api('getVendors');
      if (data.vendors) setVendors(data.vendors);
    } catch (e) {
      console.error('Failed to load vendors:', e);
    }
    setLoading(false);
  };

  const loadSkus = async () => {
    try {
      const data = await api('getSkus');
      if (data.skus) setSkuCounters(data.skus);
    } catch (e) {
      console.error('Failed to load SKUs:', e);
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await api('getSubmissions');
      if (data.submissions) setSubmissions(data.submissions);
    } catch (e) {
      console.error('Failed to load submissions:', e);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setScreen('admin');
      setError('');
      await Promise.all([loadVendors(), loadSkus(), loadSubmissions()]);
    } else if (password === VENDOR_PASSWORD) {
      setIsAdmin(false);
      setScreen('vendorSelect');
      setError('');
      await loadVendors();
    } else {
      setError('Incorrect password');
    }
    setPassword('');
  };

  const getNextSku = async (code) => {
    const data = await api('getNextSku', { code });
    return data.sku;
  };

  const addItem = () => {
    setItems([...items, { name: '', description: '', labelDesc: '', price: '', quantity: 1, category: '', sku: '' }]);
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const generateSkus = async () => {
    setSubmitting(true);
    const newItems = [...items];
    for (let i = 0; i < newItems.length; i++) {
      if (!newItems[i].sku && newItems[i].name) {
        newItems[i].sku = await getNextSku(selectedVendor.code);
      }
    }
    setItems(newItems);
    setSubmitting(false);
  };

  const generateLabels = () => {
    const labelItems = [];
    items.forEach(item => {
      if (item.sku) {
        for (let i = 0; i < item.quantity; i++) {
          labelItems.push(item);
        }
      }
    });

    const labelsPerPage = 80;
    let html = `<!DOCTYPE html><html><head><title>Labels - Two Girls Gift Shop</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
      @page {
        size: letter;
        margin: 0;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page {
        width: 8.5in;
        height: 11in;
        padding-top: 0.5in;
        padding-left: 0.28in;
        padding-right: 0.28in;
        page-break-after: always;
      }
      .row {
        display: flex;
        height: 0.5in;
        margin: 0;
      }
      .label {
        width: 1.75in;
        height: 0.5in;
        margin-right: 0.3in;
        padding: 2px 3px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        overflow: hidden;
      }
      .label:last-child {
        margin-right: 0;
      }
      .barcode {
        height: 26px;
        width: 100%;
      }
      .label-bottom {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
      .sku {
        font-size: 7px;
        line-height: 1;
      }
      .desc {
        font-size: 6px;
        text-align: center;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 0.7in;
        line-height: 1;
      }
      .price {
        font-size: 11px;
        font-weight: bold;
        line-height: 1;
        white-space: nowrap;
      }
      @media print {
        .page {
          page-break-after: always;
        }
        .page:last-child {
          page-break-after: avoid;
        }
      }
    </style></head><body>`;

    const totalPages = Math.ceil(labelItems.length / labelsPerPage);
    
    for (let p = 0; p < totalPages; p++) {
      html += '<div class="page">';
      
      for (let row = 0; row < 20; row++) {
        html += '<div class="row">';
        
        for (let col = 0; col < 4; col++) {
          const idx = p * labelsPerPage + row * 4 + col;
          const item = labelItems[idx];
          
          if (item) {
            html += `<div class="label">
              <svg class="barcode" id="bc${idx}"></svg>
              <div class="price">${parseFloat(item.price).toFixed(2)}</div>
              <div class="sku">${item.sku}</div>
              <div class="desc">${item.labelDesc || item.name}</div>
            </div>`;
          } else {
            html += '<div class="label"></div>';
          }
        }
        
        html += '</div>';
      }
      
      html += '</div>';
    }

    html += `<script>
      const labels = ${JSON.stringify(labelItems.map(it => it.sku))};
      document.querySelectorAll('.barcode').forEach((el) => {
        const idx = parseInt(el.id.replace('bc', ''));
        if(labels[idx]) JsBarcode(el, labels[idx], {format:'CODE128',height:24,width:1.5,displayValue:false,margin:0});
      });
      window.onload = () => window.print();
    </script></body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  const submitInventory = async () => {
    const validItems = items.filter(i => i.name && i.sku);
    if (!validItems.length) return;

    setSubmitting(true);
    try {
      const submitItems = validItems.map(item => ({
        vendorName: selectedVendor.name,
        vendorCode: selectedVendor.code,
        itemName: item.name,
        description: item.description,
        labelDesc: item.labelDesc,
        category: item.category,
        price: item.price,
        quantity: item.quantity,
        sku: item.sku
      }));

      await api('submitInventory', { items: submitItems });
      setItems([]);
      alert('Inventory submitted successfully!');
    } catch (e) {
      alert('Error submitting inventory. Please try again.');
    }
    setSubmitting(false);
  };

  const exportCSV = () => {
    const headers = ['Date Submitted', 'Vendor Name', 'Vendor Code', 'Item Name', 'Description', 'Label Description', 'Category', 'Price', 'Quantity', 'SKU', 'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Inventory Tracker', 'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode', 'Status', 'Added to Shopify'];
    const rows = submissions.map(s => [
      s.date, s.vendorName, s.vendorCode, s.itemName, s.description, s.labelDesc, s.category, s.price, s.quantity, s.sku,
      '', s.itemName, s.description, s.vendorName, s.category, '', '', '', '', '', s.sku, '', '', '', s.price, '', '', s.sku, '', s.addedToShopify ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tgg_inventory.csv'; a.click();
  };

  const toggleShopify = async (sub) => {
    try {
      await api('updateShopifyStatus', { row: sub.row, status: !sub.addedToShopify });
      await loadSubmissions();
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const addNewVendor = async () => {
    if (!newVendor.name || !newVendor.code || newVendor.code.length !== 3) {
      setError('Vendor name and 3-letter code required');
      return;
    }
    if (vendors.find(v => v.code === newVendor.code.toUpperCase())) {
      setError('Vendor code already exists');
      return;
    }
    setSubmitting(true);
    await api('addVendor', { name: newVendor.name, code: newVendor.code.toUpperCase() });
    await loadVendors();
    setNewVendor({ name: '', code: '' });
    setError('');
    setSubmitting(false);
  };

  const updateVendor = async () => {
    setSubmitting(true);
    await api('updateVendor', {
      oldCode: editingVendor.originalCode,
      name: editingVendor.name,
      code: editingVendor.code
    });
    await loadVendors();
    setEditingVendor(null);
    setSubmitting(false);
  };

  const inputStyle = "w-full p-2 border rounded text-sm";
  const btnStyle = "px-4 py-2 rounded font-medium transition ";
  const btnPrimary = btnStyle + "bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50";
  const btnSecondary = btnStyle + "bg-gray-200 hover:bg-gray-300";

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center text-purple-600 mb-2">Two Girls Gift Shop</h1>
          <p className="text-center text-gray-500 mb-6">Vendor Inventory System</p>
          <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className={inputStyle + " mb-4"} />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button onClick={handleLogin} disabled={loading} className={btnPrimary + " w-full"}>
            {loading ? 'Loading...' : 'Enter'}
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-600">Admin Dashboard</h1>
            <div className="flex gap-2">
              <button onClick={() => Promise.all([loadVendors(), loadSkus(), loadSubmissions()])} className={btnSecondary}>Refresh</button>
              <button onClick={() => { setScreen('login'); setIsAdmin(false); }} className={btnSecondary}>Logout</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-lg mb-4">Add New Vendor</h2>
              <input placeholder="Vendor Name" value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} className={inputStyle + " mb-2"} />
              <input placeholder="3-Letter Code" maxLength={3} value={newVendor.code} onChange={e => setNewVendor({ ...newVendor, code: e.target.value.toUpperCase() })} className={inputStyle + " mb-2"} />
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <button onClick={addNewVendor} disabled={submitting} className={btnPrimary}>{submitting ? 'Adding...' : 'Add Vendor'}</button>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-lg mb-4">SKU Counts</h2>
              <div className="max-h-48 overflow-y-auto text-sm">
                {vendors.filter(v => skuCounters[v.code]).map(v => (
                  <div key={v.code} className="flex justify-between py-1 border-b">
                    <span>{v.name}</span>
                    <span className="font-mono">{v.code}-{String(skuCounters[v.code] || 0).padStart(5, '0')}</span>
                  </div>
                ))}
                {!Object.keys(skuCounters).length && <p className="text-gray-400">No SKUs generated yet</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Vendors ({vendors.length})</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {vendors.map(v => (
                <div key={v.code} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>{v.name} <span className="text-gray-400">({v.code})</span></span>
                  <button onClick={() => setEditingVendor({ ...v, originalCode: v.code })} className="text-purple-500 text-xs">Edit</button>
                </div>
              ))}
            </div>
          </div>

          {editingVendor && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                <h3 className="font-bold mb-4">Edit Vendor</h3>
                <input value={editingVendor.name} onChange={e => setEditingVendor({ ...editingVendor, name: e.target.value })} className={inputStyle + " mb-2"} />
                <input value={editingVendor.code} onChange={e => setEditingVendor({ ...editingVendor, code: e.target.value.toUpperCase() })} maxLength={3} className={inputStyle + " mb-4"} />
                <div className="flex gap-2">
                  <button onClick={updateVendor} disabled={submitting} className={btnPrimary}>{submitting ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setEditingVendor(null)} className={btnSecondary}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Submissions ({submissions.length})</h2>
              <button onClick={exportCSV} className={btnPrimary}>Export CSV</button>
            </div>
            {loading ? (
              <p className="text-center py-4">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Added</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Vendor</th>
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-left">SKU</th>
                      <th className="p-2 text-left">Price</th>
                      <th className="p-2 text-left">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.slice(-50).reverse().map((s, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2"><input type="checkbox" checked={s.addedToShopify} onChange={() => toggleShopify(s)} /></td>
                        <td className="p-2">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="p-2">{s.vendorCode}</td>
                        <td className="p-2">{s.itemName}</td>
                        <td className="p-2 font-mono">{s.sku}</td>
                        <td className="p-2">${s.price}</td>
                        <td className="p-2">{s.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!submissions.length && <p className="text-center text-gray-400 py-4">No submissions yet</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'vendorSelect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-purple-600">Select Your Vendor</h1>
            <button onClick={() => setScreen('login')} className={btnSecondary}>Logout</button>
          </div>
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">Loading vendors...</div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4 max-h-96 overflow-y-auto">
              {vendors.map(v => (
                <button key={v.code} onClick={() => { setSelectedVendor(v); setScreen('entry'); setItems([]); }} className="w-full text-left p-3 hover:bg-purple-50 rounded transition border-b last:border-0">
                  {v.name} <span className="text-gray-400">({v.code})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'entry') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-bold text-purple-600">{selectedVendor.name}</h1>
              <p className="text-sm text-gray-500">Vendor Code: {selectedVendor.code}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setScreen('vendorSelect')} className={btnSecondary}>Change Vendor</button>
              <button onClick={() => { setScreen('login'); setSelectedVendor(null); }} className={btnSecondary}>Logout</button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">Inventory Items</h2>
              <button onClick={addItem} className={btnPrimary}>+ Add Item</button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="border rounded p-3 mb-3 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                  <input placeholder="Item Name *" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} className={inputStyle} />
                  <input placeholder="Price *" type="number" step="0.01" value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} className={inputStyle} />
                  <input placeholder="Quantity" type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className={inputStyle} />
                </div>
                <textarea placeholder="Full Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className={inputStyle + " mb-2"} rows={2} />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <input placeholder="Label Description (short)" maxLength={30} value={item.labelDesc} onChange={e => updateItem(idx, 'labelDesc', e.target.value)} className={inputStyle} />
                  <select value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)} className={inputStyle}>
                    <option value="">Select Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <input placeholder="SKU" value={item.sku} readOnly className={inputStyle + " bg-gray-100 font-mono"} />
                    <button onClick={() => removeItem(idx)} className="text-red-500 text-xl">&times;</button>
                  </div>
                </div>
              </div>
            ))}

            {!items.length && <p className="text-center text-gray-400 py-8">Click "+ Add Item" to start entering inventory</p>}
          </div>

          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={generateSkus} disabled={submitting} className={btnPrimary}>
                {submitting ? 'Generating...' : 'Generate SKUs'}
              </button>
              <button onClick={generateLabels} disabled={!items.some(i => i.sku)} className={btnPrimary}>Print Labels</button>
              <button onClick={submitInventory} disabled={!items.some(i => i.sku) || submitting} className={btnPrimary}>
                {submitting ? 'Submitting...' : 'Submit Inventory'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
