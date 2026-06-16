import { useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  Crown, 
  Gem, 
  CheckCircle2, 
  X, 
  Zap,
} from "lucide-react";

interface FeatureRow {
  category: string;
  name: string;
  description: string;
  member: string | boolean;
  essential: string | boolean;
  icon: string | boolean;
  atelier: string | boolean;
}

export function TierComparisonTable() {
  const [currentSimPoints, setCurrentSimPoints] = useState<number>(1420);

  const COMPARISON_FEATURES: FeatureRow[] = [
    {
      category: "Tỉ lệ điểm thưởng",
      name: "Hệ số tích điểm (Multiplier)",
      description: "Hệ số nhân điểm trên mỗi hóa đơn thanh toán",
      member: "1.0x (Cơ bản)",
      essential: "1.25x (Ưu đãi)",
      icon: "1.5x",
      atelier: "2.0x (Đặc quyền tối đa)"
    },
    {
      category: "Đặc quyền Thăng hạng",
      name: "Quà tặng chào mừng",
      description: "Bộ quà tặng đặc biệt được trao ngay khi thăng hạng",
      member: "Thiệp tay Seva Heritage",
      essential: "Voucher 500k",
      icon: "Voucher 1.5M + Nến thơm",
      atelier: "Tráp quà lụa thượng hạng VIP"
    },
    {
      category: "Dành riêng cho Ngày sinh nhật",
      name: "Sinh nhật hoàng gia",
      description: "Quà tặng gửi trực tiếp trong tháng sinh nhật",
      member: "Quà lưu niệm",
      essential: "Voucher 1M",
      icon: "Hộp quà hoa di sản",
      atelier: "Set trang sức độc bản đính đá quý"
    },
    {
      category: "Chế tác & Bảo trì",
      name: "Spa & Vệ sinh trang sức",
      description: "Dịch vụ làm sạch, khảm đá gãy",
      member: "Giảm 20%",
      essential: "Miễn phí đánh bóng",
      icon: "Miễn phí đánh bóng trọn đời",
      atelier: "Đặc trị khuyết tật & Xi mạ cao cấp"
    },
    {
      category: "Ủy thác Không gian",
      name: "Sử dụng Private Lounge",
      description: "Trải nghiệm phòng tiếp khách riêng tư",
      member: false,
      essential: false,
      icon: "Giảm 50% phí dịch vụ",
      atelier: "Miễn phí 100% kèm trà bánh"
    },
    {
      category: "Nhân sự hỗ trợ",
      name: "Chuyên viên tư vấn riêng",
      description: "Đội ngũ phục vụ độc quyền",
      member: "Hotline CSKH",
      essential: "Hotline VIP",
      icon: "Chuyên viên riêng",
      atelier: "Quản lý Showroom phụ trách 24/7"
    }
  ];

  return (
    <Card id="tier-comparison-matrix" className="p-6 md:p-8 border border-border/80 bg-background/50 dark:bg-zinc-950/40 backdrop-blur-md rounded-3xl shadow-xl text-left overflow-hidden relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/5 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-border/10 pb-6 relative z-10">
        <div>
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-amber-500 px-3 py-1 rounded-full bg-amber-500/10 mb-2 inline-block">
            Độc Quyền Thượng Lưu
          </span>
          <h3 className="text-xl md:text-2xl font-black font-heading text-foreground tracking-tight flex items-center gap-2 mt-1">
            <Crown className="w-6 h-6 text-amber-500 fill-amber-500/10" /> Bảng So Sánh Quyền Lợi Hạng VIP
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Hệ thống phân chia 4 cấp bậc đặc quyền vàng: Member, Essential, Icon và Atelier.
          </p>
        </div>

        <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 max-w-xs w-full lg:w-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Giả lập điểm tích:
            </span>
            <span className="text-xs font-extrabold text-foreground">{currentSimPoints.toLocaleString()} pts</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="10000" 
            step="50"
            value={currentSimPoints} 
            onChange={(e) => setCurrentSimPoints(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-muted-foreground/25 rounded-lg"
          />
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto relative z-10 border border-border/50 rounded-2xl bg-card/60 backdrop-blur-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-sidebar/55">
              <th className="p-4 text-left font-bold text-muted-foreground text-xs uppercase tracking-wider w-1/4">
                Đỉnh cao Đặc Quyền
              </th>
              
              <th className="p-4 text-center w-[18%] relative border-l border-border/10">
                <div className="flex flex-col items-center gap-1">
                  <span className="p-1 px-2 text-[9px] font-black uppercase text-zinc-500 bg-zinc-500/10 rounded-md">
                    CƠ BẢN
                  </span>
                  <div className="flex items-center gap-1 text-zinc-500 mt-1">
                    <span className="font-extrabold text-sm tracking-tight">Member</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5">Từ 0 pts</span>
                </div>
              </th>

              <th className={`p-4 text-center w-[18%] relative border-l border-border/10`}>
                <div className="flex flex-col items-center gap-1">
                  <span className="p-1 px-2 text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 rounded-md">
                    PHỔ BIẾN
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 mt-1">
                    <span className="font-extrabold text-sm tracking-tight">Essential</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-500 mt-0.5">Từ 500 pts</span>
                </div>
              </th>

              <th className={`p-4 text-center w-[18%] relative border-l border-border/10`}>
                <div className="flex flex-col items-center gap-1">
                  <span className="p-1 px-2 text-[9px] font-black uppercase text-sky-400 bg-sky-400/10 rounded-md">
                    CAO CẤP
                  </span>
                  <div className="flex items-center gap-1 text-sky-400 mt-1">
                    <span className="font-extrabold text-sm tracking-tight">Icon</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 mt-0.5">Từ 2000 pts</span>
                </div>
              </th>
              
              <th className={`p-4 text-center w-[18%] relative border-l border-border/10`}>
                <div className="flex flex-col items-center gap-1">
                  <span className="p-1 px-2 text-[9px] font-black uppercase text-indigo-500 bg-indigo-500/10 rounded-md">
                    TỐI THƯỢNG
                  </span>
                  <div className="flex items-center gap-1 text-indigo-500 mt-1">
                    <Gem className="w-3.5 h-3.5 fill-indigo-400/20" />
                    <span className="font-extrabold text-sm tracking-tight">Atelier</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-500 mt-0.5">Từ 5000 pts</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_FEATURES.map((row, idx) => (
              <tr 
                key={idx} 
                className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}
              >
                <td className="p-4 align-top text-left">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/60 block mb-0.5">{row.category}</span>
                  <strong className="text-xs font-bold text-foreground block">{row.name}</strong>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block font-normal leading-relaxed">{row.description}</span>
                </td>

                <td className="p-4 text-center align-middle border-l border-border/10">
                  {typeof row.member === "boolean" ? (
                    row.member ? <CheckCircle2 className="w-4 h-4 text-zinc-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                  ) : (
                    <span className="text-xs font-medium text-foreground">{row.member}</span>
                  )}
                </td>

                <td className={`p-4 text-center align-middle border-l border-border/10`}>
                  {typeof row.essential === "boolean" ? (
                    row.essential ? <CheckCircle2 className="w-4 h-4 text-amber-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                  ) : (
                    <span className="text-xs font-bold text-amber-500">{row.essential}</span>
                  )}
                </td>

                <td className={`p-4 text-center align-middle border-l border-border/10`}>
                  {typeof row.icon === "boolean" ? (
                    row.icon ? <CheckCircle2 className="w-4 h-4 text-sky-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                  ) : (
                    <span className="text-xs font-bold text-sky-500">{row.icon}</span>
                  )}
                </td>

                <td className={`p-4 text-center align-middle border-l border-border/10`}>
                  {typeof row.atelier === "boolean" ? (
                    row.atelier ? <CheckCircle2 className="w-4 h-4 text-indigo-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                  ) : (
                    <span className="text-xs font-black text-indigo-500">{row.atelier}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
