
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category, AnalysisResult, MarketingStrategy } from './types';
import { INITIAL_PRODUCTS, CATEGORIES } from './data/historicalData';
import { generateMarketingStrategies } from './services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';

const App: React.FC = () => {
  // State Management
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('retail_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  
  const [currentPage, setCurrentPage] = useState<'input' | 'overview' | 'inventory' | 'analytics'>('input');
  const [lastAnalyzedId, setLastAnalyzedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategies, setStrategies] = useState<MarketingStrategy[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalStrategies, setModalStrategies] = useState<MarketingStrategy[]>([]);
  const [isModalGenerating, setIsModalGenerating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food' as Category,
    costPrice: '',
    sellingPrice: '',
    expiryDate: '',
    currentStock: '',
  });

  // Sync to LocalStorage (Simulated Database)
  useEffect(() => {
    localStorage.setItem('retail_products', JSON.stringify(products));
  }, [products]);

  // Category Icon Mapping (Doodles)
  const getCategoryIcon = (category: Category) => {
    switch(category) {
      case 'Food': return <i className="fas fa-apple-whole text-red-400"></i>;
      case 'Beverages': return <i className="fas fa-mug-hot text-amber-500"></i>;
      case 'Home Essentials': return <i className="fas fa-broom text-sky-400"></i>;
      case 'Furniture': return <i className="fas fa-couch text-amber-700"></i>;
      case 'Appliances': return <i className="fas fa-blender text-slate-400"></i>;
      case 'Clothes': return <i className="fas fa-shirt text-indigo-400"></i>;
      case 'Toys': return <i className="fas fa-robot text-purple-400"></i>;
      case 'Electronics': return <i className="fas fa-microchip text-emerald-400"></i>;
      case 'Cosmetics': return <i className="fas fa-magic text-pink-400"></i>;
      case 'Stationery': return <i className="fas fa-pen-nib text-slate-500"></i>;
      default: return <i className="fas fa-box text-slate-400"></i>;
    }
  };

  // Decision Logic: Reorder Quantity
  const calculateDecision = (product: Product): AnalysisResult => {
    const LEAD_TIME = 7;
    const SAFETY_STOCK_DAYS = 3;
    const today = new Date();
    const expiry = new Date(product.expiryDate);
    const daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    const categoryAvgSales = products
      .filter(p => p.category === product.category)
      .reduce((acc, p) => acc + p.avgDailySales, 0) / (products.filter(p => p.category === product.category).length || 1);

    const dailySales = product.avgDailySales || categoryAvgSales;
    const demandWindow = dailySales * (LEAD_TIME + SAFETY_STOCK_DAYS);
    
    let reorder = false;
    let qty = 0;
    let reason = "Inventory levels are healthy.";
    let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (daysToExpiry < 14) {
      reorder = false;
      qty = 0;
      reason = `CRITICAL: Expiry in ${daysToExpiry} days. Reordering blocked to prevent wastage.`;
      risk = 'HIGH';
    } else if (product.currentStock <= demandWindow) {
      reorder = true;
      qty = Math.round((dailySales * 21) - product.currentStock);
      reason = `Demand Forecast: Daily velocity of ${dailySales.toFixed(1)} units. Stock will deplete in ${Math.round(product.currentStock / (dailySales || 1))} days.`;
      risk = product.currentStock < (dailySales * 2) ? 'HIGH' : 'MEDIUM';
    }

    return { productId: product.id, reorder, suggestedQuantity: qty, reason, riskLevel: risk };
  };

  const currentAnalysis = useMemo(() => {
    if (!lastAnalyzedId) return null;
    const p = products.find(x => x.id === lastAnalyzedId);
    return p ? calculateDecision(p) : null;
  }, [lastAnalyzedId, products]);

  // Actions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      category: formData.category,
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      expiryDate: formData.expiryDate,
      currentStock: parseInt(formData.currentStock),
      avgDailySales: products.filter(p => p.category === formData.category)[0]?.avgDailySales || 2,
      lastUpdated: new Date().toISOString()
    };

    setProducts(prev => [newProduct, ...prev]);
    setLastAnalyzedId(newProduct.id);
    
    setIsGenerating(true);
    const ideas = await generateMarketingStrategies(newProduct, "New Inventory Entry");
    setStrategies(ideas);
    setIsGenerating(false);
  };

  const openStrategyModal = async (product: Product) => {
    setModalProduct(product);
    setIsModalGenerating(true);
    const ideas = await generateMarketingStrategies(product, "Specific Inventory Review");
    setModalStrategies(ideas);
    setIsModalGenerating(false);
  };

  // UI Components
  const Sidebar = () => (
    <div className="w-64 bg-slate-900 h-screen sticky top-0 text-slate-300 p-6 flex flex-col z-20 shadow-2xl">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-900/50">
          <i className="fas fa-brain"></i>
        </div>
        <h1 className="font-bold text-lg text-white tracking-tight">RetailIQ Pro</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        <button onClick={() => setCurrentPage('input')} className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${currentPage === 'input' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'hover:bg-slate-800'}`}>
          <i className="fas fa-plus-circle"></i> New Entry
        </button>
        <button onClick={() => setCurrentPage('overview')} className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${currentPage === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'hover:bg-slate-800'}`}>
          <i className="fas fa-chart-pie"></i> Overview
        </button>
        <button onClick={() => setCurrentPage('inventory')} className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${currentPage === 'inventory' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'hover:bg-slate-800'}`}>
          <i className="fas fa-boxes"></i> Inventory
        </button>
        <button onClick={() => setCurrentPage('analytics')} className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${currentPage === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'hover:bg-slate-800'}`}>
          <i className="fas fa-microchip"></i> Analytics
        </button>
      </nav>

      <div className="pt-6 border-t border-slate-800">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">System Status</p>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>AI Decisions Active</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {currentPage === 'input' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-slate-800 relative overflow-hidden">
               <div className="absolute top-[-20px] right-[-20px] opacity-10 transform rotate-12 scale-150">
                  <i className="fas fa-store text-[120px] text-indigo-400"></i>
               </div>
              <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
                <span className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-cart-plus"></i>
                </span>
                Inventory Entry Point
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Product Name</label>
                  <input 
                    required 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-700 bg-slate-800 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-semibold placeholder:text-slate-500 shadow-sm" 
                    placeholder="e.g. Greek Yogurt 500g" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Category</label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleInputChange} 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-700 bg-slate-800 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-semibold appearance-none bg-no-repeat bg-[right_1.25rem_center] bg-[length:1em_1em] shadow-sm"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-2 relative group">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    Cost Price ($)
                    <div className="relative inline-block">
                      <i className="fas fa-info-circle text-indigo-400 cursor-help hover:text-indigo-600 transition-colors"></i>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white text-slate-900 text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl border border-slate-200 font-bold">
                        Wholesale purchase price per individual unit.
                      </div>
                    </div>
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    name="costPrice" 
                    value={formData.costPrice} 
                    onChange={handleInputChange} 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-700 bg-slate-800 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-semibold shadow-sm" 
                    placeholder="0.00" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Selling Price ($)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    name="sellingPrice" 
                    value={formData.sellingPrice} 
                    onChange={handleInputChange} 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-700 bg-slate-800 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-semibold shadow-sm" 
                    placeholder="0.00" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Expiry Date</label>
                  <input 
                    required 
                    type="date" 
                    name="expiryDate" 
                    value={formData.expiryDate} 
                    onChange={handleInputChange} 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-700 bg-slate-800 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-semibold shadow-sm" 
                  />
                </div>

                <div className="space-y-2 relative group">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    Stock Units
                    <i className="fas fa-boxes-stacked text-indigo-400"></i>
                  </label>
                  <input 
                    required 
                    type="number" 
                    name="currentStock" 
                    value={formData.currentStock} 
                    onChange={handleInputChange} 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-700 bg-slate-800 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-semibold shadow-sm" 
                    placeholder="Quantity" 
                  />
                </div>

                <div className="md:col-span-2 pt-6">
                  <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-900/50 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 border border-indigo-500">
                    <i className="fas fa-rocket"></i>
                    ACTIVATE AI ANALYSIS
                  </button>
                </div>
              </form>
            </div>

            {lastAnalyzedId && currentAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                {/* Decision Section */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col relative group">
                  <div className="absolute top-4 right-4 text-slate-100 text-6xl opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
                    <i className="fas fa-truck-fast"></i>
                  </div>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Ordering Verdict</h3>
                      <p className="text-sm text-slate-500 mt-2 font-medium italic border-l-4 border-indigo-200 pl-4">{currentAnalysis.reason}</p>
                    </div>
                    <div className={`px-8 py-3 rounded-[1.5rem] font-black text-2xl shadow-lg transform transition-all hover:scale-105 ${currentAnalysis.reorder ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {currentAnalysis.reorder ? 'REORDER' : 'HOLD'}
                    </div>
                  </div>
                  
                  {currentAnalysis.reorder && (
                    <div className="mt-auto bg-indigo-50 p-8 rounded-[2rem] border-2 border-indigo-100 text-center relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10">
                          <i className="fas fa-calculator text-4xl"></i>
                       </div>
                      <p className="text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] mb-2">Recommended SKU Count</p>
                      <p className="text-7xl font-black text-indigo-700 drop-shadow-sm">{currentAnalysis.suggestedQuantity}</p>
                      <p className="text-xs text-indigo-400 mt-4 font-bold flex items-center justify-center gap-2">
                        <i className="fas fa-shield-halved"></i>
                        Includes 3-day safety buffer
                      </p>
                    </div>
                  )}

                  {!currentAnalysis.reorder && currentAnalysis.riskLevel === 'HIGH' && (
                    <div className="mt-auto bg-red-50 p-8 rounded-[2rem] border-2 border-red-100 flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl shadow-lg animate-bounce">
                        <i className="fas fa-ban"></i>
                      </div>
                      <p className="text-red-700 font-black text-lg">System Lockdown</p>
                      <p className="text-sm text-red-600 font-medium">Reordering is prohibited due to critical wastage risk from impending expiry.</p>
                    </div>
                  )}
                </div>

                {/* Marketing Section */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative group overflow-hidden">
                   <div className="absolute top-[-20px] left-[-20px] opacity-5 text-indigo-900 text-8xl transform -rotate-12">
                      <i className="fas fa-lightbulb"></i>
                   </div>
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                      <span className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center">
                        <i className="fas fa-wand-sparkles"></i>
                      </span>
                      Market Pulse AI
                    </h3>
                    <button onClick={async () => {
                      setIsGenerating(true);
                      const p = products.find(x => x.id === lastAnalyzedId);
                      if(p) setStrategies(await generateMarketingStrategies(p, "Manual Overwrite"));
                      setIsGenerating(false);
                    }} className="bg-slate-50 hover:bg-indigo-50 p-2 rounded-xl text-indigo-600 transition-all border border-slate-200">
                      <i className={`fas fa-sync ${isGenerating ? 'animate-spin' : ''}`}></i>
                    </button>
                  </div>

                  <div className="space-y-6 relative z-10">
                    {isGenerating ? (
                      [1,2,3].map(i => <div key={i} className="h-28 bg-slate-50 rounded-3xl animate-pulse border border-slate-100"></div>)
                    ) : (
                      strategies.map((s, i) => (
                        <div key={i} className="p-6 border-2 border-slate-50 rounded-[1.5rem] hover:border-indigo-200 transition-all bg-slate-50/50 hover:bg-white hover:shadow-xl group/card">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-black uppercase bg-indigo-600 text-white px-3 py-1 rounded-lg shadow-sm">
                              {s.type}
                            </span>
                            <div className="text-indigo-300 opacity-0 group-hover/card:opacity-100 transition-opacity">
                               <i className="fas fa-check-circle"></i>
                            </div>
                          </div>
                          <h4 className="font-black text-slate-900 text-base mb-2">{s.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{s.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === 'overview' && (
          <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                 <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-slate-200 text-6xl group-hover:scale-125 transition-transform">
                   <i className="fas fa-layer-group"></i>
                 </div>
                 <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Total SKUs</p>
                 <p className="text-4xl font-black text-slate-900">{products.length}</p>
                 <div className="mt-4 flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-1 rounded">
                   <i className="fas fa-arrow-up mr-1"></i> ACTIVE
                 </div>
               </div>
               
               <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                 <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-orange-200 text-6xl group-hover:scale-125 transition-transform">
                   <i className="fas fa-battery-half"></i>
                 </div>
                 <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Low Stock</p>
                 <p className="text-4xl font-black text-orange-600">{products.filter(p => p.currentStock < 15).length}</p>
                 <p className="mt-4 text-[10px] text-orange-400 font-bold">Needs Attention</p>
               </div>

               <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                 <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-red-200 text-6xl group-hover:scale-125 transition-transform">
                   <i className="fas fa-skull-crossbones"></i>
                 </div>
                 <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Near Expiry</p>
                 <p className="text-4xl font-black text-red-600">{products.filter(p => {
                    const diff = (new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000*3600*24);
                    return diff < 15;
                 }).length}</p>
                 <p className="mt-4 text-[10px] text-red-400 font-bold">Wastage Risk</p>
               </div>

               <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                 <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-emerald-200 text-6xl group-hover:scale-125 transition-transform">
                   <i className="fas fa-chart-line"></i>
                 </div>
                 <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Store Margin</p>
                 <p className="text-4xl font-black text-emerald-600">
                   {(products.reduce((acc, p) => acc + ((p.sellingPrice-p.costPrice)/p.sellingPrice), 0) / (products.length || 1) * 100).toFixed(1)}%
                 </p>
                 <p className="mt-4 text-[10px] text-emerald-400 font-bold">Store-wide Avg</p>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 h-[500px]">
                  <h3 className="font-black text-xl mb-8 flex items-center gap-3">
                    <i className="fas fa-chart-bar text-indigo-500"></i>
                    Capital Investment by Category
                  </h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={CATEGORIES.map(cat => ({
                        name: cat,
                        value: Math.round(products.filter(p => p.category === cat).reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0))
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[12, 12, 0, 0]}>
                        {CATEGORIES.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col">
                  <h3 className="font-black text-xl mb-8 flex items-center gap-3">
                    <i className="fas fa-bell text-indigo-500"></i>
                    Priority Health Alerts
                  </h3>
                  <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {products.filter(p => {
                      const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000*3600*24));
                      return daysLeft < 30 || p.currentStock < 10;
                    }).sort((a,b) => a.currentStock - b.currentStock).slice(0, 10).map(p => {
                       const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000*3600*24));
                       const isLowStock = p.currentStock < 10;
                       return (
                        <div key={p.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${isLowStock ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                              {getCategoryIcon(p.category)}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-sm">{p.name}</p>
                              <div className="flex gap-2 mt-1">
                                {isLowStock && <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded">LOW STOCK</span>}
                                {daysLeft < 30 && <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded">EXPIRY {daysLeft}D</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400">STOCK</p>
                            <p className="text-lg font-black text-slate-900">{p.currentStock}</p>
                          </div>
                        </div>
                       );
                    })}
                  </div>
                </div>
             </div>
          </div>
        )}

        {currentPage === 'inventory' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                 <h2 className="text-3xl font-black text-slate-900">Live Inventory Matrix</h2>
                 <p className="text-slate-500 font-medium text-sm mt-1">Unified view of shelf availability and expiry status.</p>
               </div>
               <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3">
                 <i className="fas fa-search text-slate-400"></i>
                 <input className="outline-none bg-transparent text-sm font-semibold" placeholder="Filter stock..." />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-10 py-6">Product Insight</th>
                    <th className="px-8 py-6">Category</th>
                    <th className="px-8 py-6 text-center">In-Hand</th>
                    <th className="px-8 py-6">Status Marker</th>
                    <th className="px-8 py-6 text-right">Value</th>
                    <th className="px-10 py-6 text-center">AI Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => {
                    const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000*3600*24));
                    return (
                      <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                             <div className="text-xl opacity-80 group-hover:scale-125 transition-transform duration-300">
                               {getCategoryIcon(p.category)}
                             </div>
                             <div>
                               <p className="font-black text-slate-800 text-base">{p.name}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Updated: {new Date(p.lastUpdated).toLocaleDateString()}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-xs font-bold bg-slate-100 px-4 py-1.5 rounded-full text-slate-600 border border-slate-200">{p.category}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`font-black text-lg ${p.currentStock < 10 ? 'text-red-500' : 'text-slate-800'}`}>{p.currentStock}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                             <div className={`w-3 h-3 rounded-full shadow-sm ${daysLeft < 10 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                             <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">
                               {daysLeft < 10 ? 'CRITICAL RISK' : 'HEALTHY SHELF'}
                             </span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">
                          ${p.sellingPrice.toFixed(2)}
                        </td>
                        <td className="px-10 py-6 text-center">
                          <button 
                            onClick={() => openStrategyModal(p)}
                            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white p-3 rounded-2xl transition-all shadow-sm active:scale-95"
                            title="Generate Strategy"
                          >
                            <i className="fas fa-wand-magic-sparkles"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentPage === 'analytics' && (
          <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative group">
                  <div className="absolute top-4 right-4 text-6xl text-slate-50 opacity-10 group-hover:scale-125 transition-transform">
                    <i className="fas fa-chart-pie"></i>
                  </div>
                 <h3 className="font-black text-2xl mb-10 flex items-center gap-3">
                   <i className="fas fa-wind text-indigo-500"></i>
                   Category Sales Velocity
                 </h3>
                 <div className="h-[350px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                        data={CATEGORIES.map(cat => ({
                          name: cat,
                          value: products.filter(p => p.category === cat).reduce((acc, p) => acc + p.avgDailySales, 0)
                        }))}
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={8}
                        dataKey="value"
                       >
                         {CATEGORIES.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#64748b'][index % 5]} className="stroke-white stroke-2" />
                         ))}
                       </Pie>
                       <Tooltip 
                        contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                       />
                       <Legend verticalAlign="bottom" height={36} iconType="circle" />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
               </div>

               <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col relative group">
                  <div className="absolute top-4 right-4 text-6xl text-slate-50 opacity-10 group-hover:scale-125 transition-transform">
                    <i className="fas fa-crown"></i>
                  </div>
                 <h3 className="font-black text-2xl mb-8 flex items-center gap-3">
                   <i className="fas fa-bolt text-amber-500"></i>
                   Velocity Rankings
                 </h3>
                 <div className="space-y-4 flex-1">
                   {[...products].sort((a,b) => b.avgDailySales - a.avgDailySales).slice(0, 6).map((p, idx) => (
                     <div key={p.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100 hover:border-indigo-200 transition-all hover:bg-white hover:shadow-lg relative group/item overflow-hidden">
                       <div className="absolute left-0 top-0 h-full w-2 bg-indigo-600 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                       <div className="flex items-center gap-5">
                         <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-sm border border-slate-100 text-lg">
                           {idx + 1}
                         </div>
                         <div>
                           <p className="font-black text-slate-800 text-base">{p.name}</p>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.category}</p>
                         </div>
                       </div>
                       <div className="flex flex-col items-end">
                         <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full mb-1">FAST {p.avgDailySales}/D</span>
                         <p className="text-lg font-black text-slate-900">${p.sellingPrice}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Strategy Modal */}
      {modalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 bg-gradient-to-r from-indigo-600 to-indigo-800 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <i className="fas fa-wand-magic-sparkles text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-black">{modalProduct.name}</h2>
                  <p className="text-xs font-bold opacity-70 tracking-widest uppercase">AI Strategic Analysis</p>
                </div>
              </div>
              <button onClick={() => setModalProduct(null)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {isModalGenerating ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                       <i className="fas fa-brain animate-pulse"></i>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800">Synthesizing Market Data...</p>
                    <p className="text-slate-500 font-medium">Gemini is evaluating stock velocity vs. shelf life</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Current Stock</p>
                        <p className="text-2xl font-black text-slate-800">{modalProduct.currentStock}</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Avg Sales</p>
                        <p className="text-2xl font-black text-indigo-600">{modalProduct.avgDailySales}/d</p>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Unit Profit</p>
                        <p className="text-2xl font-black text-emerald-600">${(modalProduct.sellingPrice - modalProduct.costPrice).toFixed(2)}</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-1 rounded-full bg-indigo-600"></div>
                       <h3 className="font-black text-xl text-slate-900">Custom Growth Strategies</h3>
                    </div>
                    <div className="grid gap-6">
                      {modalStrategies.map((s, i) => (
                        <div key={i} className="p-8 border-2 border-slate-50 rounded-[2rem] bg-slate-50/30 hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all relative overflow-hidden group/strat">
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/strat:opacity-20 transition-opacity">
                             <i className="fas fa-lightbulb text-6xl"></i>
                          </div>
                          <span className="text-[10px] font-black uppercase bg-indigo-600 text-white px-4 py-1 rounded-full shadow-sm mb-4 inline-block">
                            {s.type}
                          </span>
                          <h4 className="font-black text-slate-900 text-lg mb-3">{s.title}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                    <button 
                      onClick={() => openStrategyModal(modalProduct!)} 
                      className="px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center gap-3"
                    >
                      <i className="fas fa-arrows-rotate"></i>
                      REFRESH AI
                    </button>
                    <button 
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
                      onClick={() => {
                        setModalProduct(null);
                        alert("Strategy applied and logged to marketing calendar.");
                      }}
                    >
                      IMPLEMENT NOW
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;
