import { Bell, X, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface SystemNotification {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

interface NotificationBellProps {
  isSidebar?: boolean;
  collapsed?: boolean;
}

export function NotificationBell({ isSidebar, collapsed }: NotificationBellProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: "alert-1",
      type: "success",
      title: "Mục tiêu chiến dịch đạt 100%",
      description: "Chiến dịch Private BST Heritage đạt chuẩn 100% mục tiêu phản hồi khách hàng hạng Atelier!",
      time: "10 phút trước",
      read: false
    },
    {
      id: "alert-2",
      type: "info",
      title: "Khách hàng thăng hạng mới!",
      description: "Hội viên Nguyễn Văn A vừa đạt đủ điểm thăng lên hạng VIP (Icon).",
      time: "30 phút trước",
      read: false
    },
    {
      id: "alert-3",
      type: "info",
      title: "Đăng ký sự kiện thành công",
      description: "Có 5 khách hàng VIP vừa đăng ký tham gia sự kiện ra mắt BST Mùa Hè.",
      time: "1 giờ trước",
      read: false
    },
    {
      id: "alert-4",
      type: "warning",
      title: "Cảnh báo hạn mức ngân sách",
      description: "Ngân sách đổi quà của chiến dịch chăm sóc quý 2 sắp chạm ngưỡng giới hạn (đạt 92.5%).",
      time: "2 giờ trước",
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className={cn(
          "relative rounded-[10px] flex items-center transition-all group cursor-pointer",
          isSidebar 
            ? collapsed 
              ? "w-11 h-11 mx-auto justify-center px-0 bg-sidebar-accent/50 text-sidebar-foreground/75" 
              : "w-full py-3 px-4 space-x-3 justify-start bg-sidebar-accent/50 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            : "h-8 w-8 items-center justify-center bg-muted/30 text-muted-foreground hover:text-foreground"
        )}
      >
        <Bell className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-105",
          !isSidebar && "h-4 w-4"
        )} />
        
        {isSidebar && !collapsed && (
          <span className="whitespace-nowrap overflow-hidden text-sm font-semibold">
            Thông báo
          </span>
        )}

        {unreadCount > 0 && (
          <span className={cn(
            "absolute rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center animate-pulse shadow-sm",
            isSidebar 
              ? collapsed 
                ? "top-1.5 right-1.5 w-4 h-4" 
                : "right-3 w-5 h-5 text-xs"
              : "-top-1.5 -right-1.5 min-w-[16px] h-4 px-1"
          )}>
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, y: isSidebar ? 10 : 10, x: isSidebar ? 0 : 0, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={cn(
              "absolute z-[200] w-80 sm:w-96 rounded-[10px] border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl p-4 text-xs text-foreground",
              isSidebar 
                ? "left-full ml-4 bottom-0 origin-bottom-left" 
                : "right-0 top-11 origin-top-right"
            )}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
              <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">Thông báo hệ thống</span>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead} 
                  className="text-[10px] text-primary hover:underline font-bold"
                >
                  Đánh dấu tất cả là đã đọc
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1 divide-y divide-border/45">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground italic">Chưa có thông báo mới nào.</div>
              ) : (
                notifications.map((notif, i) => (
                  <div 
                    key={notif.id} 
                    onClick={() => toggleRead(notif.id)}
                    className={cn(
                      "pt-2 flex gap-3 transition-colors cursor-pointer group rounded-[10px] p-1.5",
                      notif.read ? "opacity-60 hover:opacity-100" : "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <div className="mt-0.5">
                      {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" />}
                      {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />}
                      {notif.type === 'info' && <Sparkles className="w-4 h-4 text-[#2f6cf5] animate-pulse" />}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cn("font-bold", !notif.read && "text-[#2f6cf5]")}>{notif.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-muted-foreground text-[10px] leading-relaxed">{notif.description}</p>
                    </div>

                    <button 
                      onClick={(e) => removeNotification(notif.id, e)}
                      className="text-muted-foreground/30 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
