import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/components/FirebaseProvider";
import { motion, AnimatePresence } from "motion/react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  LayoutDashboard,
  Users,
  Award,
  BarChart,
  Settings,
  Bell,
  Fingerprint,
  Sparkles,
  Plug
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  className?: string;
}

export function Sidebar({ className, activeView, setActiveView }: SidebarProps) {
  const { user, systemUser } = useFirebase();
  const [isHovered, setIsHovered] = useState(false);

  const isAdmin = systemUser?.role === "Admin" || user?.email?.toLowerCase() === "hungthai84@gmail.com";

  const allMenuItems = [
    { name: "Tổng quan", view: "dashboard", icon: LayoutDashboard },
    { name: "Khách hàng", view: "customers", icon: Users },
    { name: "Ưu đãi", view: "loyalty", icon: Award },
    { name: "Tiếp thị", view: "marketing", icon: Bell },
    { name: "Phân tích", view: "analysis", icon: Sparkles },
    { name: "Báo cáo", view: "analytics", icon: BarChart },
    { name: "Tích hợp", view: "integrations", icon: Plug },
    { name: "Cài đặt", view: "settings", icon: Settings, isSecondary: true },
  ];

  const menuItems = allMenuItems;

  return (
    <motion.div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{ 
        width: isHovered ? "auto" : 80,
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
          <BrandLogo className="w-9 h-9 shrink-0 hover:scale-105 transition-transform duration-300" />
          <AnimatePresence>
            {isHovered && (
              <motion.h2 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-lg font-extrabold tracking-tight font-heading ml-2 whitespace-nowrap bg-gradient-to-r from-[#fa1b6c] via-[#7c3aed] to-[#131924] bg-clip-text text-transparent"
              >
                iuPayme
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
                  "w-full flex items-center rounded-2xl py-3 text-sm font-semibold transition-all group relative",
                  activeView === item.view
                    ? "bg-[#131924] text-white shadow-lg shadow-[#131924]/10 dark:bg-white dark:text-[#131924]"
                    : "text-muted-foreground hover:bg-[#F3F5F8] hover:text-foreground",
                  !isHovered ? "px-0 justify-center" : "px-4 space-x-3",
                  item.isSecondary && isHovered && "mt-8 border border-border/50",
                  item.isSecondary && !isHovered && "mt-8"
                )}
                title={!isHovered ? item.name : undefined}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-300",
                  activeView === item.view ? "text-white dark:text-[#131924]" : "text-slate-400 group-hover:text-[#131924] group-hover:scale-105"
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
        "px-3 py-4 border-t border-border/50 transition-all",
        !isHovered && "px-2 flex justify-center"
      )}>
        <button
          onClick={() => setActiveView("portal")}
          className={cn(
            "w-full flex items-center rounded-2xl py-3 text-sm font-semibold transition-all group relative justify-center",
            activeView === "portal"
              ? "bg-[#131924] text-white shadow-lg shadow-[#131924]/10 dark:bg-white dark:text-[#131924]"
              : "text-muted-foreground hover:bg-[#F3F5F8] hover:text-foreground",
            !isHovered ? "px-0" : "px-4 space-x-3 justify-start"
          )}
          title={!isHovered ? "Cổng Loyalty" : undefined}
        >
          <Fingerprint className={cn(
            "h-5 w-5 shrink-0 transition-transform duration-300",
            activeView === "portal" ? "text-white dark:text-[#131924]" : "text-slate-400 group-hover:text-[#131924] group-hover:scale-105"
          )} />
          
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="whitespace-nowrap overflow-hidden text-sm"
              >
                Cổng Loyalty
              </motion.span>
            )}
          </AnimatePresence>

          {isHovered && activeView === "portal" && (
            <motion.div 
              layoutId="activeIndicator"
              className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground/50" 
            />
          )}
        </button>
      </div>
    </motion.div>
  );
}
