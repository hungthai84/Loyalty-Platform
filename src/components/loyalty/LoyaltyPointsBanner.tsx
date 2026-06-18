import React from "react";
import { Award, Plus } from "lucide-react";

interface LoyaltyPointsBannerProps {
  onAddRule: () => void;
}

export const LoyaltyPointsBanner: React.FC<LoyaltyPointsBannerProps> = ({ onAddRule }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-5 p-6 md:p-8 bg-amber-500/5 dark:bg-amber-500/[0.03] border border-amber-500/10 rounded-[10px] relative overflow-hidden group mb-6 text-left">
      <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-background to-background pointer-events-none" />
      
      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 text-center md:text-left">
        <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
          <Award className="w-10 h-10" />
        </div>
        <div className="space-y-1.5 text-left">
          <h3 className="text-2xl font-black font-heading text-foreground tracking-tight">
            Quy tắc Tích lũy Điểm thưởng
          </h3>
          <p className="text-sm text-muted-foreground font-medium max-w-xl">
            Thiết lập các kịch bản tích điểm từ giao dịch, hành động tương tác và các chiến dịch 
            tri ân đặc biệt cho khách hàng hội viên.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
        <button
          onClick={onAddRule}
          className="w-full md:w-auto px-6 py-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-[10px] text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thiết lập quy tắc mới
        </button>
      </div>
    </div>
  );
};
