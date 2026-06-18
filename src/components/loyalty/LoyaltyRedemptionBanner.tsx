import React from "react";
import { Gem, Plus } from "lucide-react";

interface LoyaltyRedemptionBannerProps {
  onAddRule: () => void;
}

export const LoyaltyRedemptionBanner: React.FC<LoyaltyRedemptionBannerProps> = ({ onAddRule }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-5 p-6 md:p-8 bg-indigo-500/5 dark:bg-indigo-500/[0.03] border border-indigo-500/10 rounded-[10px] relative overflow-hidden group mb-6 text-left">
      <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-background to-background pointer-events-none" />
      
      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 text-center md:text-left">
        <div className="p-4 bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
          <Gem className="w-10 h-10" />
        </div>
        <div className="space-y-1.5 text-left">
          <h3 className="text-2xl font-black font-heading text-foreground tracking-tight">
            Kho Ưu Đãi & Đổi Thưởng
          </h3>
          <p className="text-sm text-muted-foreground font-medium max-w-xl">
            Quản lý các quy tắc đổi điểm lấy voucher, sản phẩm hoặc nâng cấp đặc quyền 
            giúp gia tăng trải nghiệm và lòng trung thành của khách hàng.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
        <button
          onClick={onAddRule}
          className="w-full md:w-auto px-6 py-2.5 bg-indigo-500 text-white hover:bg-indigo-600 rounded-[10px] text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo quy tắc đổi thưởng
        </button>
      </div>
    </div>
  );
};
