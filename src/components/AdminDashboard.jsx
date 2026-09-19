import React, { useState, useEffect } from 'react';
import { 
  X, Check, Power, BarChart3, Users, FileCheck2, Zap, 
  Search, RefreshCw, AlertTriangle, Shield, CheckCircle2,
  Filter, Layers, ArrowUpRight, Download, Trash2, Bell,
  Sparkles, Gift, LogOut, Cloud, ExternalLink, Globe
} from 'lucide-react';
import { PDF_TOOLS, CATEGORIES } from '../data/toolsData';
import { saveGlobalConfig, fetchGlobalConfig } from '../utils/syncService';

export default function AdminDashboard({ isOpen, onClose, onToolsChanged, onNotificationChanged, onLogout }) {
  const [activeTab, setActiveTab] = useState('tools'); // 'tools' | 'notifications' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [syncStatus, setSyncStatus] = useState(''); // 'saving' | 'synced' | 'local'
  
  // Tool enabled status state { [toolId]: boolean }
  const [toolStatuses, setToolStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('pdfbolt_tool_status');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const initial = {};
    PDF_TOOLS.forEach(t => { initial[t.id] = true; });
    return initial;
  });

  // Push Notification state
  const [notification, setNotification] = useState(() => {
    try {
      const saved = localStorage.getItem('pdfbolt_global_notification');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: false,
      type: 'announcement',
      title: '⚡ Welcome to PDFBolt 2.0!',
      message: 'All 24 tools are 100% free with zero file size limits and client-side privacy.',
      linkText: 'Explore Tools',
      linkUrl: 'https://github.com',
      openInNewTab: true
    };
  });

  // Analytics state
  const [analytics, setAnalytics] = useState({
    visits: 0,
    processed: 0,
    toolsUsage: {}
  });

  const loadData = async () => {
    try {
      const visits = parseInt(localStorage.getItem('pdfbolt_analytics_visits') || '1', 10);
      const processed = parseInt(localStorage.getItem('pdfbolt_analytics_processed') || '0', 10);
      const toolsUsage = JSON.parse(localStorage.getItem('pdfbolt_analytics_tools_usage') || '{}');
      setAnalytics({ visits, processed, toolsUsage });

      // Fetch global config
      const globalCfg = await fetchGlobalConfig();
      if (globalCfg) {
        if (globalCfg.toolStatuses && Object.keys(globalCfg.toolStatuses).length > 0) {
          setToolStatuses(globalCfg.toolStatuses);
        }
        if (globalCfg.notification) {
          setNotification(globalCfg.notification);
        }
      }
    } catch (e) {
      console.warn('Could not read admin data', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Synchronize changes globally
  const syncChanges = async (newStatuses, newNotification) => {
    setSyncStatus('saving');
    const result = await saveGlobalConfig({
      toolStatuses: newStatuses !== undefined ? newStatuses : toolStatuses,
      notification: newNotification !== undefined ? newNotification : notification
    });
    setSyncStatus(result.synced ? 'synced' : 'local');
    setTimeout(() => setSyncStatus(''), 4000);
  };

  const handleToggleTool = (toolId) => {
    const updated = { ...toolStatuses, [toolId]: !toolStatuses[toolId] };
    setToolStatuses(updated);
    if (onToolsChanged) onToolsChanged(updated);
    syncChanges(updated, notification);
  };

  const handleEnableAll = () => {
    const updated = {};
    PDF_TOOLS.forEach(t => { updated[t.id] = true; });
    setToolStatuses(updated);
    if (onToolsChanged) onToolsChanged(updated);
    syncChanges(updated, notification);
  };

  const handleDisableAll = () => {
    const updated = {};
    PDF_TOOLS.forEach(t => { updated[t.id] = false; });
    setToolStatuses(updated);
    if (onToolsChanged) onToolsChanged(updated);
    syncChanges(updated, notification);
  };

  const handleSaveNotification = () => {
    const updated = {
      ...notification,
      updatedAt: new Date().toISOString()
    };
    setNotification(updated);
    if (onNotificationChanged) onNotificationChanged(updated);
    syncChanges(toolStatuses, updated);
  };

  const handleResetAnalytics = () => {
    if (window.confirm('Are you sure you want to reset all visitor and tool usage analytics?')) {
      localStorage.setItem('pdfbolt_analytics_visits', '1');
      localStorage.setItem('pdfbolt_analytics_processed', '0');
      localStorage.setItem('pdfbolt_analytics_tools_usage', JSON.stringify({}));
      loadData();
    }
  };

  const handleExportStats = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      branding: 'PDFBolt powered by WEB⚡BITS',
      founder: 'infas.mk',
      metrics: analytics,
      toolStatuses,
      notification
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PDFBolt_Admin_Config_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const totalEnabled = Object.values(toolStatuses).filter(Boolean).length;
  const totalTools = PDF_TOOLS.length;

  const filteredTools = PDF_TOOLS.filter(t => {
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesQuery = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const leaderboard = PDF_TOOLS.map(t => ({
    ...t,
    count: analytics.toolsUsage[t.id] || 0
  })).sort((a, b) => b.count - a.count);

  const maxUsageCount = Math.max(...leaderboard.map(l => l.count), 1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Power className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-900">Admin & Control Center</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  WEB⚡BITS
                </span>
                {syncStatus === 'synced' && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                    <Cloud className="w-3 h-3" />
                    <span>Synced Globally</span>
                  </span>
                )}
                {syncStatus === 'local' && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 flex items-center space-x-1">
                    <span>Saved Locally</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">Manage global tool status, broadcast push notifications & analytics</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
              title="Logout from Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white flex-shrink-0">
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center space-x-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'tools'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tools Manager</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-700 font-bold">
              {totalEnabled} / {totalTools} Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Push Notifications</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              notification.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
            }`}>
              {notification.enabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Visitor & Usage Analytics</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* =========================================================================
              TAB 1: TOOLS MANAGER (GLOBAL ON / OFF SWITCHES)
          ========================================================================= */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tools to turn on / off..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Bulk Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEnableAll}
                    className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Enable All ({totalTools})
                  </button>
                  <button
                    onClick={handleDisableAll}
                    className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Disable All
                  </button>
                </div>
              </div>

              {/* Tools List with Toggle Switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTools.map((tool) => {
                  const isEnabled = toolStatuses[tool.id] !== false;

                  return (
                    <div
                      key={tool.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                        isEnabled
                          ? 'bg-white border-slate-200 shadow-sm hover:border-sky-300'
                          : 'bg-slate-100/70 border-dashed border-slate-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 pr-3 truncate">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 ${tool.iconColor}`}>
                          {tool.title.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm truncate">{tool.title}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isEnabled ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{tool.description}</p>
                        </div>
                      </div>

                      {/* Interactive Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        onClick={() => handleToggleTool(tool.id)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                          isEnabled ? 'bg-sky-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* =========================================================================
              TAB 2: PUSH NOTIFICATION & ANNOUNCEMENT BROADCAST
          ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              
              {/* Top Banner Control Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    notification.enabled ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-400'
                  }`}>
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-black text-slate-900">Broadcast Push Notification</h3>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        notification.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {notification.enabled ? 'ACTIVE ON SITE' : 'MUTED / DISABLED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      When enabled, all visitors worldwide will see this floating announcement banner with your custom link button.
                    </p>
                  </div>
                </div>

                {/* Master Switch */}
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-slate-700">Notification Status:</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notification.enabled}
                    onClick={() => {
                      const updated = { ...notification, enabled: !notification.enabled };
                      setNotification(updated);
                      if (onNotificationChanged) onNotificationChanged(updated);
                      syncChanges(toolStatuses, updated);
                    }}
                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                      notification.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        notification.enabled ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Notification Configuration Form & Live Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Form Controls (7 cols) */}
                <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Notification Content & Link
                  </h4>

                  {/* Notification Type */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Notification Type:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'announcement', label: 'Announcement', icon: Zap, color: 'text-sky-600 bg-sky-50 border-sky-300' },
                        { id: 'feature', label: 'New Feature', icon: Sparkles, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
                        { id: 'alert', label: 'Alert / Maintenance', icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-300' },
                        { id: 'promo', label: 'Special Promo', icon: Gift, color: 'text-purple-700 bg-purple-50 border-purple-300' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNotification({ ...notification, type: t.id })}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                            notification.type === t.id
                              ? `${t.color} font-black shadow-xs ring-1 ring-offset-1`
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <t.icon className="w-4 h-4" />
                          <span className="text-[11px]">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Notification Title:</label>
                    <input
                      type="text"
                      value={notification.title || ''}
                      onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                      placeholder="e.g. ⚡ Big Update: New PDF Tools Released!"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Message Content:</label>
                    <textarea
                      rows={3}
                      value={notification.message || ''}
                      onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                      placeholder="Enter the notification message for visitors..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>

                  {/* Link Button Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Button Label:</label>
                      <input
                        type="text"
                        value={notification.linkText || ''}
                        onChange={(e) => setNotification({ ...notification, linkText: e.target.value })}
                        placeholder="e.g. Open Link / Learn More"
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Target Link URL:</label>
                      <input
                        type="url"
                        value={notification.linkUrl || ''}
                        onChange={(e) => setNotification({ ...notification, linkUrl: e.target.value })}
                        placeholder="https://yourwebsite.com or #merge"
                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Open in new tab toggle */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="newTab"
                      checked={notification.openInNewTab !== false}
                      onChange={(e) => setNotification({ ...notification, openInNewTab: e.target.checked })}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <label htmlFor="newTab" className="text-xs font-medium text-slate-700 cursor-pointer">
                      Open link in new browser tab (`target="_blank"`)
                    </label>
                  </div>

                  {/* Save and Publish Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={handleSaveNotification}
                      className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-bold text-xs hover:opacity-95 shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 cursor-pointer transition-all"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Save & Broadcast to All Users</span>
                    </button>
                  </div>

                </div>

                {/* Live Visitor Preview (5 cols) */}
                <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center space-x-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                      <span>Live Visitor Preview</span>
                    </h4>

                    {/* Mock Notification Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-md relative overflow-hidden">
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                        notification.type === 'feature' ? 'from-emerald-500 to-teal-600' :
                        notification.type === 'alert' ? 'from-amber-500 to-orange-600' :
                        notification.type === 'promo' ? 'from-purple-500 to-pink-600' :
                        'from-sky-500 to-blue-600'
                      }`} />

                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                            {notification.type.toUpperCase()}
                          </span>
                          <h5 className="text-xs font-black text-slate-900 pt-1">
                            {notification.title || 'Notification Title'}
                          </h5>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {notification.message || 'Notification content appears here.'}
                          </p>

                          {notification.linkUrl && (
                            <div className="pt-2">
                              <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 text-white shadow-xs">
                                <span>{notification.linkText || 'Open Link'}</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </span>
                            </div>
                          )}
                        </div>

                        <span className="text-slate-400 text-xs">✕</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Instant push broadcast across desktop, mobile, and tablets.</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* =========================================================================
              TAB 3: VISITOR & USAGE ANALYTICS
          ========================================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3.5 rounded-2xl bg-sky-100 text-sky-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Visits</span>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{analytics.visits.toLocaleString()}</div>
                    <span className="text-[11px] text-emerald-600 font-bold">100% Client-Side Privacy</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-600">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Files Processed</span>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{analytics.processed.toLocaleString()}</div>
                    <span className="text-[11px] text-slate-500">Zero Server Storage</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3.5 rounded-2xl bg-indigo-100 text-indigo-600">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tools Enabled</span>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{totalEnabled} / {totalTools}</div>
                    <span className="text-[11px] text-indigo-600 font-bold">Available to Users</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3.5 rounded-2xl bg-amber-100 text-amber-600">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engine Status</span>
                    <div className="text-2xl font-black text-emerald-600 mt-0.5">100% OK</div>
                    <span className="text-[11px] text-slate-500">WEB⚡BITS Core</span>
                  </div>
                </div>
              </div>

              {/* Tool Popularity Leaderboard */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Tool Popularity Leaderboard</h3>
                    <p className="text-xs text-slate-500">Track which PDF tools are most frequently used by your visitors</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportStats}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                    <button
                      onClick={handleResetAnalytics}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {leaderboard.map((item, idx) => {
                    const pct = Math.round((item.count / maxUsageCount) * 100);

                    return (
                      <div key={item.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3 w-1/3">
                          <span className="w-5 text-center font-bold text-slate-400">#{idx + 1}</span>
                          <span className="font-bold text-slate-800">{item.title}</span>
                        </div>

                        <div className="flex-1 mx-4">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="w-20 text-right font-mono font-bold text-slate-700">
                          {item.count} {item.count === 1 ? 'use' : 'uses'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>PDFBolt 2.0 • WEB⚡BITS Admin System • Founder: infas.mk</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            Done & Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
