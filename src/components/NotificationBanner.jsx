import React, { useState, useEffect } from 'react';
import { 
  X, Zap, Sparkles, AlertTriangle, Gift, ArrowUpRight, Bell
} from 'lucide-react';

const TYPE_CONFIG = {
  announcement: {
    badge: 'Announcement',
    icon: Zap,
    bgGradient: 'from-sky-500 to-blue-600',
    cardBg: 'bg-white',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    btnBg: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20'
  },
  feature: {
    badge: 'New Feature',
    icon: Sparkles,
    bgGradient: 'from-emerald-500 to-teal-600',
    cardBg: 'bg-white',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
  },
  alert: {
    badge: 'Important Alert',
    icon: AlertTriangle,
    bgGradient: 'from-amber-500 to-orange-600',
    cardBg: 'bg-white',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
  },
  promo: {
    badge: 'Special Offer',
    icon: Gift,
    bgGradient: 'from-purple-500 to-pink-600',
    cardBg: 'bg-white',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    btnBg: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
  }
};

export default function NotificationBanner({ notification }) {
  const [isDismissed, setIsDismissed] = useState(false);

  // If notification changes (e.g. updated by admin), un-dismiss
  useEffect(() => {
    if (notification && notification.enabled) {
      const dismissKey = `pdfbolt_dismiss_${notification.id || notification.updatedAt || 'active'}`;
      try {
        const wasDismissed = sessionStorage.getItem(dismissKey);
        setIsDismissed(wasDismissed === 'true');
      } catch (e) {
        setIsDismissed(false);
      }
    }
  }, [notification]);

  if (!notification || !notification.enabled || isDismissed) {
    return null;
  }

  const type = notification.type || 'announcement';
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.announcement;
  const IconComp = config.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      const dismissKey = `pdfbolt_dismiss_${notification.id || notification.updatedAt || 'active'}`;
      sessionStorage.setItem(dismissKey, 'true');
    } catch (e) {}
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-md w-[calc(100vw-2.5rem)] animate-slideUp">
      <div className="relative p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 overflow-hidden">
        
        {/* Top color bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.bgGradient}`} />

        <div className="flex items-start justify-between gap-3">
          
          <div className="flex items-start space-x-3.5">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${config.bgGradient} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
              <IconComp className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
                  {config.badge}
                </span>
                <span className="text-[10px] font-extrabold text-slate-400">PDFBolt Broadcast</span>
              </div>

              <h4 className="text-sm font-black text-slate-900 leading-tight">
                {notification.title || 'Broadcast Notification'}
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                {notification.message}
              </p>

              {/* Action Link Button */}
              {notification.linkUrl && (
                <div className="pt-2.5">
                  <a
                    href={notification.linkUrl}
                    target={notification.openInNewTab !== false ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${config.btnBg}`}
                  >
                    <span>{notification.linkText || 'Open Link'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

      </div>
    </div>
  );
}
