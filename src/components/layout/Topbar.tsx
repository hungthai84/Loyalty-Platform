import { Bell, Search, Menu, Sun, Moon, Monitor, Check, X, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebase } from "@/components/FirebaseProvider";
import { useTheme } from "next-themes";
import React, { useState, useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SystemNotification {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export function Topbar() {
  const { user } = useFirebase();
  const { setTheme, theme } = useTheme();
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
      type: "warning",
      title: "Cảnh báo hạn mức ngân sách",
      description: "Ngân sách đổi quà của chiến dịch chăm sóc quý 2 sắp chạm ngưỡng giới hạn (đạt 92.5%).",
      time: "2 giờ trước",
      read: false
    },
    {
      id: "alert-3",
      type: "info",
      title: "Giao diện SendGrid kích hoạt",
      description: "Cấu hình gửi email tự động mừng sinh nhật qua SendGrid đã sẵn sàng.",
      time: "1 ngày trước",
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/60 px-6">
      <button className="md:hidden">
        <Menu className="h-6 w-6 text-muted-foreground" />
      </button>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm mọi thứ..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-muted/30 border-none focus-visible:ring-1"
            />
          </div>
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full flex h-8 w-8 items-center justify-center bg-muted/30 text-muted-foreground hover:text-foreground transition-all">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Chuyển đổi giao diện</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass">
            <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2">
              <Sun className="h-4 w-4" /> Sáng
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2">
              <Moon className="h-4 w-4" /> Tối
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2">
              <Monitor className="h-4 w-4" /> Hệ thống
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full flex h-8 w-8 items-center justify-center bg-muted/30 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-rose-500 text-[9px] font-black text-white px-1 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 sm:w-96 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl p-4 z-50 text-xs text-foreground animate-fadeIn">
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
                      className={`pt-2 flex gap-3 transition-colors cursor-pointer group rounded-lg p-1.5 ${
                        notif.read ? "opacity-60 hover:opacity-100" : "bg-primary/5 hover:bg-primary/10"
                      }`}
                    >
                      <div className="mt-0.5 animate-pulse">
                        {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {notif.type === 'info' && <Sparkles className="w-4 h-4 text-[#2f6cf5]" />}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold transition-transform ${!notif.read ? "text-[#2f6cf5]" : ""}`}>{notif.title}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">{notif.description}</p>
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
            </div>
          )}
        </div>

        <Avatar className="h-8 w-8 border">
          <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
          <AvatarFallback>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
