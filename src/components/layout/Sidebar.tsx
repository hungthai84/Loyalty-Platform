import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/components/FirebaseProvider";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  Award,
  BarChart,
  Settings,
  Bell,
  Fingerprint,
  LogOut,
  ChevronRight,
  Building2
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  className?: string;
}

export function Sidebar({ className, activeView, setActiveView }: SidebarProps) {
  const { user, logout } = useFirebase();
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { name: "Tổng quan", view: "dashboard", icon: LayoutDashboard },
    { name: "Khách hàng", view: "customers", icon: Users },
    { name: "Ưu đãi", view: "loyalty", icon: Award },
    { name: "Tiếp thị", view: "marketing", icon: Bell },
    { name: "Phân tích", view: "analytics", icon: BarChart },
    { name: "Cài đặt", view: "settings", icon: Settings, isSecondary: true },
    { name: "Cổng Khách hàng", view: "portal", icon: Fingerprint, isSecondary: true },
  ];

  return (
    <motion.div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{ 
        width: isHovered ? 280 : 80,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "pb-12 h-full border-r bg-sidebar backdrop-blur-xl flex flex-col relative z-50 shadow-xl", 
        className
      )}
    >
      <div className="space-y-4 py-4 flex-1 overflow-x-hidden">
        <div className={cn(
          "px-6 py-2 flex items-center transition-all duration-300",
          !isHovered && "px-[22px]"
        )}>
          <div className="w-9 h-9 shrink-0 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold font-heading text-lg">S</span>
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.h2 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xl font-bold tracking-tight font-heading ml-3 whitespace-nowrap"
              >
                SEVA
              </motion.h2>
            )}
          </AnimatePresence>
        </div>

        <div className="px-3 mt-6">
          <div className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveView(item.view)}
                className={cn(
                  "w-full flex items-center rounded-xl py-2.5 text-sm font-medium transition-all group relative",
                  activeView === item.view
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  !isHovered ? "px-0 justify-center" : "px-3 space-x-3",
                  item.isSecondary && isHovered && "mt-8 border border-border/50",
                  item.isSecondary && !isHovered && "mt-8"
                )}
                title={!isHovered ? item.name : undefined}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-300",
                  activeView === item.view ? "text-primary-foreground" : "text-muted-foreground group-hover:scale-110"
                )} />
                
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isHovered && activeView === item.view && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground/50" 
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cn(
        "px-4 py-4 border-t border-border/50 bg-muted/5 transition-all",
        !isHovered && "px-2"
      )}>
        {user ? (
          <div className={cn(
            "flex items-center gap-3 transition-all",
            !isHovered ? "justify-center" : "justify-between"
          )}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-muted border border-border/50 flex items-center justify-center text-xs font-medium shrink-0 shadow-sm">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex flex-col text-sm truncate"
                  >
                    <span className="font-semibold truncate leading-none mb-1">{user.displayName || 'Người dùng'}</span>
                    <span className="text-[10px] text-muted-foreground truncate opacity-70 uppercase tracking-tighter">{user.email}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isHovered && (
              <button 
                onClick={logout}
                className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg text-muted-foreground transition-all"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          isHovered && <div className="text-xs text-muted-foreground text-center">Chưa đăng nhập</div>
        )}
      </div>
    </motion.div>
  );
}
