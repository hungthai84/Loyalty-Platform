import React, { useState } from "react";
import { Coins, Crown, Sparkles, Shield, Award, Gem, Gift, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function BespokeSimulator() {
  const [simAovValue, setSimAovValue] = useState<number>(750000);
  const [selectedSimTierId, setSelectedSimTierId] = useState<string>("tier-member");
  // using fixed here, since we are moving it, or maybe just local state
  const isGlobalMultiplierActive = false;
  const globalMultiplier = 1.0;
  const globalMultiplierReason = "";

  return (
    <div className="relative overflow-hidden rounded-[10px] border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.02] to-amber-500/[0.05] p-6 md:p-8 shadow-xl mt-4 text-left">
      <div className="absolute top-0 right-0 p-8 opacity-5 text-amber-500 pointer-events-none">
        <Crown className="w-24 h-24 stroke-1" />
      </div>
      
      <div className="mb-6">
        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" /> Giả lập đặc quyền & Tích luỹ thông minh (Bespoke Simulator)
        </div>
        <h3 className="text-xl font-bold text-foreground font-heading">
          Trải nghiệm Đặc quyền VIP & Máy tính Điểm thưởng Seva Jewel
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
          Phân tích chiến lược khách hàng thân thiết bền vững dựa trên hành vi mua sắm ngành trang sức cao cấp. Đối soát giá trị giỏ hàng trung bình (AOV ~ 750.000đ) để phân hạng & nâng tầm trải nghiệm thượng lưu.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start mt-6">
        {/* LEFT PANEL: CONFIGURATOR AND POINT CONVERTER */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-background border border-border/80 rounded-[10px] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase">
                <Coins className="w-4 h-4 text-amber-500" /> Máy tính tích điểm Seva Club
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted hover:bg-muted/80 px-2.5 py-0.5 rounded-full uppercase">
                Công thức: 10.000đ = 1đ
              </span>
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left">
                Chọn giá trị giỏ hàng mẫu (Fast Presets)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Móng dạo phố (AOV)", value: 750000, desc: "Bạc S925 Phổ thông" },
                  { label: "Quà tặng sinh nhật", value: 1800000, desc: "Trang sức thiết yếu" },
                  { label: "Set Quý phái", value: 4500000, desc: "Vàng Ý / Đá phong thuỷ" },
                  { label: "Set Atelier VVIP", value: 12500000, desc: "Kiệt tác Kim Cương" }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSimAovValue(preset.value);
                      if (preset.value >= 8000000) {
                        setSelectedSimTierId("tier-atelier");
                      } else if (preset.value >= 3500000) {
                        setSelectedSimTierId("tier-icon");
                      } else if (preset.value >= 1500000) {
                        setSelectedSimTierId("tier-essential");
                      } else {
                        setSelectedSimTierId("tier-member");
                      }
                    }}
                    className={cn(
                      "p-2.5 rounded-[10px] border text-center transition-all cursor-pointer hover:border-amber-500/40 text-left flex flex-col justify-between active:scale-95",
                      simAovValue === preset.value
                        ? "bg-amber-500/10 border-amber-500/80 text-amber-700 dark:text-amber-400 font-bold"
                        : "bg-muted/30 border-border/60 hover:bg-muted/60"
                    )}
                  >
                    <span className="text-[9px] uppercase block truncate tracking-tight text-muted-foreground">{preset.label}</span>
                    <span className="text-xs mt-1 font-black leading-none block font-mono text-foreground">
                      {preset.value.toLocaleString()}đ
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom value entry slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Giá trị đơn hàng tuỳ chỉnh (VND)
                </label>
                <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {simAovValue.toLocaleString()} VNĐ
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="100000"
                  max="20000000"
                  step="50000"
                  value={simAovValue}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSimAovValue(val);
                    if (val >= 8000000) setSelectedSimTierId("tier-atelier");
                    else if (val >= 3500000) setSelectedSimTierId("tier-icon");
                    else if (val >= 1500000) setSelectedSimTierId("tier-essential");
                    else setSelectedSimTierId("tier-member");
                  }}
                  className="flex-1 accent-amber-500 h-1.5 bg-muted rounded-[10px] appearance-none cursor-pointer"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={simAovValue.toLocaleString("vi-VN")}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value.replace(/\./g, "").replace(/\D/g, "")) || 0;
                    setSimAovValue(raw);
                    if (raw >= 8000000) setSelectedSimTierId("tier-atelier");
                    else if (raw >= 3500000) setSelectedSimTierId("tier-icon");
                    else if (raw >= 1500000) setSelectedSimTierId("tier-essential");
                    else setSelectedSimTierId("tier-member");
                  }}
                  className="w-[120px] px-3 py-1.5 border border-border/80 rounded-[10px] text-right font-semibold font-mono text-xs focus:border-amber-500 outline-none text-foreground bg-background"
                />
              </div>
            </div>

            {/* Selector Segment for manual selection or override */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left">
                Cấu hình hạng thẻ đại diện (Click để so sánh chéo)
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-muted/40 p-1.5 rounded-[10px] border border-border/60">
                {[
                  { id: "tier-member", name: "Member", val: "0-1.5M", color: "#94a3b8" },
                  { id: "tier-essential", name: "Essential", val: "1.5M-3.5M", color: "#10b981" },
                  { id: "tier-icon", name: "Icon", val: "3.5M-8M", color: "#f59e0b" },
                  { id: "tier-atelier", name: "Atelier", val: "8M+", color: "#2f6cf5" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSimTierId(item.id)}
                    className={cn(
                      "py-2 rounded-[10px] text-center cursor-pointer transition-all flex flex-col items-center justify-center relative",
                      selectedSimTierId === item.id
                        ? "bg-background text-foreground font-extrabold shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:bg-background/20 hover:text-foreground"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full mb-1"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] tracking-tight uppercase block leading-none">{item.name}</span>
                    <span className="text-[8px] opacity-70 mt-0.5 leading-none block">{item.val}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live calculation mathematics representation */}
            {(() => {
              const multiplierMap: Record<string, number> = {
                "tier-member": 1.0, "tier-essential": 2.0, "tier-icon": 4.0, "tier-atelier": 6.0
              };
              const cashbackMap: Record<string, string> = {
                "tier-member": "1.0% hoàn tiền", "tier-essential": "2.0% hoàn tiền", "tier-icon": "4.0% hoàn tiền (VIP)", "tier-atelier": "6.0% hoàn tiền (VVIP)"
              };
              const actualCashbackMap: Record<string, string> = {
                "tier-member": "2.0% theo bảng tóm tắt", "tier-essential": "3.0% tối đa hành trình", "tier-icon": "5.0% đặc cách tri ân VIP", "tier-atelier": "7.0% độc bản xa xỉ bậc nhất"
              };
              const tierNames: Record<string, string> = {
                "tier-member": "MEMBER CLASS", "tier-essential": "ESSENTIAL CLASS", "tier-icon": "ICON (VIP) CLASS", "tier-atelier": "ATELIER (VVIP) CLASS"
              };

              const currentMult = multiplierMap[selectedSimTierId] || 1.0;
              const currentCashback = cashbackMap[selectedSimTierId] || "1.0%";
              const tableCashback = actualCashbackMap[selectedSimTierId] || "2.0%";
              
              const baseMultiplier = isGlobalMultiplierActive ? globalMultiplier : 1.0;
              const totalPoints = Math.round((simAovValue / 10000) * currentMult * baseMultiplier);
              const equivalentValue = totalPoints * 100;

              return (
                <div className="p-4 rounded-[10px] bg-zinc-950 text-slate-100 font-mono text-left relative overflow-hidden space-y-3">
                  <div className="absolute right-0 bottom-0 p-3 opacity-10 font-bold tracking-tighter text-[40px] pointer-events-none select-none text-zinc-700">
                    SEVA CLUB
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Hệ số tích luỹ: {tierNames[selectedSimTierId]}</span>
                    <span className="text-[9px] bg-amber-500 text-slate-950 font-bold rounded px-1.5 uppercase tracking-wide">
                      x{currentMult.toFixed(1)} Pts
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Tỷ suất cơ bản:</span>
                      <span>{simAovValue.toLocaleString()}đ / 10.000 = {Math.floor(simAovValue / 10000)} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Hệ số nhân  hạng:</span>
                      <span className="text-emerald-400 font-black">x{currentMult.toFixed(1)}</span>
                    </div>
                    <div className="h-px bg-zinc-900 my-1" />
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-black tracking-tight text-white uppercase">Tổng điểm thưởng sẽ nhận:</span>
                      <span className="text-base font-black font-sans text-amber-500">
                        +{totalPoints.toLocaleString()} Điểm
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-black tracking-tight text-white uppercase">Ví tích chi tiêu quy đổi:</span>
                      <span className="text-xs font-black text-emerald-400">
                        ~ {equivalentValue.toLocaleString()} VNĐ (1đ = 100đ)
                      </span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-zinc-900 flex justify-between text-slate-400 text-[10px]">
                      <span>Tỷ lệ cashback tiêu chuẩn:</span>
                      <span className="text-slate-100 font-bold">{currentCashback}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Tỷ lệ cashback tối đa biểu đồ:</span>
                      <span className="text-amber-500 font-bold">{tableCashback}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* RIGHT PANEL: RICH PERKS DISPLAY & CARD PREVIEW */}
        <div className="lg:col-span-6 space-y-6">
          {(() => {
            const tierDetailsMap: Record<string, any> = {
              "tier-member": {
                name: "SEVA Member Class", color: "#94a3b8", packaging: "Hộp giấy gia huy tiêu chuẩn thân thiện môi trường ép lụa.",
                birthday: "Tặng ngay Voucher trị giá 50.000 VNĐ mừng sinh nhật (đơn sau từ 500k VNĐ).",
                spa: "Miễn phí chăm sóc, đánh bóng cơ bản và làm sạch trang sức bằng sóng siêu âm trọn đời.", service: "Bản tin xu hướng trang sức, sản phẩm độc bản định kỳ hàng quý.",
                icon: Shield, badgeDesc: "Chi tiêu tích luỹ từ 0đ - 1.499.000 VNĐ", cardAccent: "from-slate-600 via-slate-800 to-zinc-900"
              },
              "tier-essential": {
                name: "SEVA Essential Class", color: "#10b981", packaging: "Hộp giấy tiêu chuẩn tinh gọn dập chìm bảo an thương hiệu.",
                birthday: "Tặng Voucher 100.000 VNĐ hoặc phiếu giảm giá trực tiếp 10% đặc cách mừng tháng tuổi mới.",
                spa: "Hưởng trọn vẹn đặc quyền Member và thêm 1 lần xi mạ trắng mới miễn phí mỗi năm.", service: "Nhận Early Access - Thông tin sản phẩm & quyền sở hữu trước 24h ngày mở bán BST.",
                icon: Award, badgeDesc: "Chi tiêu tích luỹ từ 1.500.000đ - 3.499.000 VNĐ", cardAccent: "from-emerald-700 via-teal-900 to-zinc-900"
              },
              "tier-icon": {
                name: "SEVA Icon VIP Class", color: "#f59e0b", packaging: "NÂNG CẤP hộp bọc nhung/da cao cấp, túi giấy dập nổi sợi dệt, ruy băng lụa ép kim nhũ vàng cát.",
                birthday: "Tặng Voucher giảm 20% (Tối đa 500.000đ) kết hợp phần quà đặc nhiệm (khăn mạ bạc / hộp mini).",
                spa: "Miễn phí gói làm sạch bóng lẫy cao cấp & xi mạ xi bạch kim 2 lần/năm.", service: "Miễn phí vận chuyển (Freeship) online không điều kiện, Khắc tên dập nổi thông điệp yêu cầu.",
                icon: Gem, badgeDesc: "Chi tiêu tích luỹ từ 3.500.000đ - 7.999.000 VNĐ", cardAccent: "from-amber-600 via-yellow-850 to-zinc-900"
              },
              "tier-atelier": {
                name: "SEVA Atelier Royal Class", color: "#2f6cf5", packaging: "Biệt phẩm hộp gỗ bọc da thêu nhung thủ công cao cấp nhất, thiệp sáp thủ bút chúc thư vàng kim.",
                birthday: "Tặng Voucher 30% [KHÔNG GIỚI HẠN TỐI ĐA MỨC GIẢM] + gửi quà tặng trang sức (500k-700k) tận tư dinh.",
                spa: "Atelier Care: Xi mạ vàng, sửa chữa, thay thế đá chấu nhỏ, làm mới cực đại vô hạn số lần.", service: "Hỗ trợ 1-1 chuyên trách qua Zalo, Vẽ rập 3D thủ công cùng Giám đốc, Xe đón VIP Lounge.",
                icon: Crown, badgeDesc: "Chi tiêu tinh tế từ 8.000.000 VNĐ trở lên", cardAccent: "from-blue-700 via-indigo-950 to-zinc-900"
              }
            };

            const selectedInfo = tierDetailsMap[selectedSimTierId] || tierDetailsMap["tier-member"];
            const IconComponent = selectedInfo.icon;

            return (
              <div className="space-y-6">
                {/* Visual Simulated VIP Card representation */}
                <div className={cn(
                  "relative overflow-hidden rounded-[10px] p-6 text-white shadow-2xl transition-all duration-300 transform hover:scale-[1.01] aspect-[1.58/1] flex flex-col justify-between bg-gradient-to-r",
                  selectedInfo.cardAccent
                )}>
                  <div className="absolute right-[-40px] top-[-30px] w-48 h-48 rounded-full bg-white/[0.03] blur-xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-white/50 block">Thẻ Hội Viên Điện Tử Seva Club</span>
                      <h4 className="text-base font-extrabold tracking-wide uppercase font-heading text-white">{selectedInfo.name}</h4>
                    </div>
                    <IconComponent className="w-8 h-8 opacity-90 text-amber-500 fill-amber-500/20 animate-pulse" />
                  </div>

                  <div className="space-y-2 mt-4 text-left">
                    <div className="flex gap-2.5 items-center">
                      <span className="text-[9px] uppercase text-white/60 tracking-widest font-mono">Hạn mức hạng:</span>
                      <span className="px-2 py-0.5 bg-white/10 text-white rounded-full text-[9px] font-black uppercase">
                        {selectedInfo.badgeDesc}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/70 leading-relaxed font-sans mt-1">
                      "Trải nghiệm sự phục vụ mang tinh thần bảo dưỡng xa xỉ độc bản của đá hộ mệnh & mỹ nghệ kim hoàn."
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/10 pt-2.5 text-[8px] font-mono tracking-wider text-slate-400 mt-2">
                    <span>REF ACCESS KEY: SEVA-{selectedSimTierId.split("-")[1]?.toUpperCase()}</span>
                    <span>VERIFIED LOYALTY PORTAL</span>
                  </div>
                </div>

                {/* Detailed List of VIP Perks specified in document */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block text-left">
                    Quyền lợi dịch vụ tra cứu theo chiến lược
                  </span>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Perk Item: Packaging */}
                    <div className="p-3 bg-background border border-border/60 hover:border-amber-500/10 rounded-[10px] transition-all text-left">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-900 dark:text-slate-100 font-bold">
                        <Gift className="w-3.5 h-3.5 text-pink-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Bao bì & Đóng gói</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {selectedInfo.packaging}
                      </p>
                    </div>

                    {/* Perk Item: Birthday */}
                    <div className="p-3 bg-background border border-border/60 hover:border-amber-500/10 rounded-[10px] transition-all text-left">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-900 dark:text-slate-100 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Sinh nhật vàng</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {selectedInfo.birthday}
                      </p>
                    </div>

                    {/* Perk Item: Spa */}
                    <div className="p-3 bg-background border border-border/60 hover:border-amber-500/10 rounded-[10px] transition-all text-left">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-900 dark:text-slate-100 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Spa trang sức & Bảo hảo</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {selectedInfo.spa}
                      </p>
                    </div>

                    {/* Perk Item: Service */}
                    <div className="p-3 bg-background border border-border/60 hover:border-amber-500/10 rounded-[10px] transition-all text-left">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-900 dark:text-slate-100 font-bold">
                        <Crown className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Trải nghiệm thượng hạng</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        {selectedInfo.service}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
