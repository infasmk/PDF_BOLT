import React, { useState } from 'react';
import { 
  Layers, Split, Minimize2, FileType, Presentation, Sheet, 
  FileText, PenTool, FileImage, Image, CheckSquare, Stamp, 
  RotateCw, Code2, Unlock, ShieldCheck, LayoutGrid, FileCheck, 
  Wrench, Hash, Search as SearchIcon, Columns2, EyeOff, Crop,
  ArrowUpRight, Zap, Infinity as InfinityIcon
} from 'lucide-react';
import { PDF_TOOLS, CATEGORIES } from '../data/toolsData';

const ICON_MAP = {
  Layers, Split, Minimize2, FileType, Presentation, Sheet,
  FileText, PenTool, FileImage, Image, CheckSquare, Stamp,
  RotateCw, Code2, Unlock, ShieldCheck, LayoutGrid, FileCheck,
  Wrench, Hash, Search: SearchIcon, Columns2, EyeOff, Crop
};

export default function ToolsGrid({ onSelectTool, toolStatuses = {} }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [disabledNotice, setDisabledNotice] = useState(null);

  const handleToolClick = (tool) => {
    const isEnabled = toolStatuses[tool.id] !== false;
    if (!isEnabled) {
      setDisabledNotice(`"${tool.title}" is temporarily turned OFF in the Admin Dashboard.`);
      setTimeout(() => setDisabledNotice(null), 3500);
      return;
    }

    // Record tool click for analytics
    try {
      const usage = JSON.parse(localStorage.getItem('pdfbolt_analytics_tools_usage') || '{}');
      usage[tool.id] = (usage[tool.id] || 0) + 1;
      localStorage.setItem('pdfbolt_analytics_tools_usage', JSON.stringify(usage));
    } catch (e) {}

    onSelectTool(tool.id);
  };

  const filteredTools = PDF_TOOLS.filter((tool) => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    const matchesSearch = 
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      
      {/* Temporary Disabled Notice Banner */}
      {disabledNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between shadow-md">
          <span>⚠️ {disabledNotice}</span>
          <button onClick={() => setDisabledNotice(null)} className="text-amber-700 hover:text-amber-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* Category Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-8 border-b border-slate-200">
        
        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all 24+ PDF tools..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Spacious Grid of Tools */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-7">
        {filteredTools.map((tool) => {
          const IconComp = ICON_MAP[tool.icon] || Layers;
          const isEnabled = toolStatuses[tool.id] !== false;
          
          return (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`group relative flex flex-col justify-between p-7 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                isEnabled
                  ? 'bg-white border-slate-200/90 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1'
                  : 'bg-slate-100/80 border-dashed border-slate-300 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Top gradient highlight bar */}
              {isEnabled && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}

              <div>
                {/* Header: Large Icon & Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-transform duration-300 group-hover:scale-110 shadow-sm ${tool.iconColor}`}>
                    {tool.officeType === 'word' ? (
                      <span className="text-blue-600 text-2xl font-black tracking-tighter">W</span>
                    ) : tool.officeType === 'excel' ? (
                      <span className="text-emerald-700 text-2xl font-black tracking-tighter">X</span>
                    ) : tool.officeType === 'ppt' ? (
                      <span className="text-orange-600 text-2xl font-black tracking-tighter">P</span>
                    ) : (
                      <IconComp className="w-7 h-7" />
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {!isEnabled ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300">
                        OFFLINE
                      </span>
                    ) : tool.badge ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                        {tool.badge}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Title */}
                <h3 className={`text-lg font-black transition-colors flex items-center justify-between ${
                  isEnabled ? 'text-slate-900 group-hover:text-sky-600' : 'text-slate-500'
                }`}>
                  <span>{tool.title}</span>
                  {isEnabled && (
                    <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-sky-500" />
                  )}
                </h3>

                {/* Description */}
                <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3">
                  {tool.description}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-sky-600 transition-colors">
                <span className="flex items-center space-x-1 text-emerald-600">
                  <InfinityIcon className="w-3.5 h-3.5" />
                  <span>{isEnabled ? 'No Limit' : 'Offline'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{isEnabled ? 'Instant' : 'Disabled'}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <p className="text-slate-500 text-sm">No PDF tools found matching "{searchQuery}".</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="mt-3 text-xs font-bold text-sky-600 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
