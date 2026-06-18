import React from "react";
import { Star, Plus } from "lucide-react";

interface LoyaltyTiersBannerProps {
  onAddTier: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const LoyaltyTiersBanner: React.FC<LoyaltyTiersBannerProps> = ({ 
  onAddTier
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-5 p-6 md:p-8 bg-[#2f6cf5]/5 dark:bg-[#2f6cf5]/[0.03] border border-[#2f6cf5]/10 rounded-[10px] relative overflow-hidden group mb-6 text-left">
      <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#2f6cf5] via-background to-background pointer-events-none" />
      
      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 text-center md:text-left">
        <div className="p-4 bg-[#2f6cf5] text-white rounded-2xl shadow-xl shadow-[#2f6cf5]/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
          <Star className="w-10 h-10" />
        </div>
        <div className="space-y-1.5 text-left">
          <h3 className="text-2xl font-black font-heading text-foreground tracking-tight">
            Chương Trình Phân Hạng Hội Viên
          </h3>
          <p className="text-sm text-muted-foreground font-medium max-w-xl">
            Cấu hình ngưỡng điểm và đặc quyền riêng biệt 
            để tối ưu hóa giá trị vòng đời khách hàng.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
        <button
          onClick={onAddTier}
          className="w-full md:w-auto px-6 py-2.5 bg-[#2f6cf5] text-white hover:bg-[#2f6cf5]/90 rounded-[10px] text-xs font-bold transition-all shadow-lg shadow-[#2f6cf5]/20 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thiết lập hạng mới
        </button>
      </div>
    </div>
  );
};
