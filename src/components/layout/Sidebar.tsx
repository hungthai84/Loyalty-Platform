import React from "react";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/components/FirebaseProvider";
import { motion, AnimatePresence } from "motion/react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import {
  LayoutDashboard,
  Users,
  Award,
  BarChart,
  Settings,
  Megaphone,
  Fingerprint,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  className?: string;
}

export function Sidebar({ className, activeView, setActiveView }: SidebarProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const allMenuItems: { name: string; view: string; icon: any; isSecondary?: boolean }[] = [
    { name: "Tổng quan", view: "dashboard", icon: LayoutDashboard },
    { name: "Khách hàng", view: "customers", icon: Users },
    { name: "Đặc quyền", view: "loyalty", icon: Award },
    { name: "Tương tác", view: "marketing", icon: Megaphone },
    { name: "Điểm chạm", view: "portal", icon: Fingerprint },
  ];

  const menuItems = allMenuItems;

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isExpanded ? 240 : 72,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "h-full border-r bg-sidebar backdrop-blur-xl flex flex-col relative z-50 shadow-xl", 
        className
      )}
    >
      {/* Collapse toggle button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sidebar border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-primary transition-all z-[60] cursor-pointer"
      >
        {isExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Top: Logo */}
      <div className={cn(
        "h-16 flex items-center transition-all duration-300 shrink-0 relative px-4",
        isExpanded ? "justify-between" : "justify-center px-0"
      )}>
       <div className="flex items-center">
         <BrandLogo className="w-9 h-9 shrink-0 hover:scale-105 transition-transform duration-300" />
         <div className="flex flex-col ml-3">
           <AnimatePresence>
             {isExpanded && (
               <>
                 <motion.h2 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -10 }}
                   className="text-lg font-bold tracking-tight font-heading whitespace-nowrap text-primary"
                 >
                   Power Service
                 </motion.h2>
                 <motion.p
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-[10px] font-extrabold tracking-[0.2em] text-black uppercase -mt-1"
                 >
                   CLP Platfrom
                 </motion.p>
               </>
             )}
           </AnimatePresence>
         </div>
       </div>
      </div>

      {/* Global Search */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 mb-2 overflow-hidden"
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm"
                className="pl-9 bg-muted/40 border-border/50 h-9 text-xs focus-visible:ring-1"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Middle: Centered Menu Items */}
      <div className="flex-1 flex flex-col justify-center px-3 py-4 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="space-y-1.5 py-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveView(item.view)}
              className={cn(
                "flex items-center rounded-[10px] text-sm font-semibold transition-all group relative",
                activeView === item.view
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/15"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !isExpanded ? "w-11 h-11 mx-auto justify-center px-0" : "w-full py-2.5 px-4 space-x-3 justify-start",
                item.isSecondary && "mt-8"
              )}
              title={!isExpanded ? item.name : undefined}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-300",
                activeView === item.view ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/45 group-hover:text-sidebar-accent-foreground group-hover:scale-105"
              )} />
              
              {isExpanded && (
                <AnimatePresence>
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.name}
                  </motion.span>
                </AnimatePresence>
              )}

              {isExpanded && activeView === item.view && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground/50" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: Settings */}
      <div className={cn(
        "px-3 py-6 border-t border-border/50 transition-all shrink-0 flex flex-col items-center gap-3",
        isExpanded && "items-stretch"
      )}>
        <NotificationBell isSidebar collapsed={!isExpanded} />

        <button
          onClick={() => setActiveView("settings")}
          className={cn(
            "flex items-center rounded-[10px] text-sm font-semibold transition-all group relative",
            activeView === "settings"
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/15"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            !isExpanded ? "w-11 h-11 mx-auto justify-center px-0" : "w-full py-3 px-4 space-x-3 justify-start"
          )}
          title={!isExpanded ? "Cài đặt" : undefined}
        >
          <Settings className={cn(
            "h-5 w-5 shrink-0 transition-transform duration-300",
            activeView === "settings" ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/45 group-hover:text-sidebar-accent-foreground group-hover:scale-105"
          )} />
          
          {isExpanded && (
            <AnimatePresence>
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="whitespace-nowrap overflow-hidden text-sm"
              >
                Cài đặt
              </motion.span>
            </AnimatePresence>
          )}

          {isExpanded && activeView === "settings" && (
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
