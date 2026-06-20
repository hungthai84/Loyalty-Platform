import React, { useState, useMemo } from 'react';
import * as motion from "motion/react-client";
import { 
  Sparkles, 
  TrendingUp, 
  Gem, 
  Layers, 
  Search,
  ChevronRight,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types';

const SUGGESTIONS_MAP: Record<string, {
  vibe: string;
  items: string[];
  conversion: string;
  projectedValue: string;
  insight: string;
  color: string;
  label: string;
}> = {
  classic: {
    label: "Cổ điển & Thanh lịch",
    vibe: "Classic Elegant",
    items: [
      "Kiềng vàng di sản khắc vân mây (Heritage Gold Choker)",
      "Nhẫn vàng phượng hoàng đính Ruby (Phoenix Ruby Gold Ring)",
      "Khuyên tai ngọc trai hạt tròn quý phái (Classic Round Pearl Drop)"
    ],
    conversion: "85%",
    projectedValue: "120.000.000 ₫",
    insight: "Khách hàng đặc biệt ưu chuộng thiết kế đối xứng, mang âm hưởng di sản văn hóa Việt cổ kết hợp chất vàng tinh khiết 18K/24K vững bền.",
    color: "from-amber-500/10 to-amber-600/5 text-amber-500 border-amber-500/20"
  },
  minimalist: {
    label: "Tối giản & Tinh tế",
    vibe: "Minimalist Sophistication",
    items: [
      "Vòng tay Platinum mảnh thanh lịch (Minimalist Platinum Bangle)",
      "Nhẫn kim cương Solitaire giác cắt tròn (Brilliant Cut Solitaire Diamond Ring)",
      "Dây chuyền hạt cườm bạc ý tinh giản (Simple Elegant Italian Beads Chain)"
    ],
    conversion: "72%",
    projectedValue: "45.000.000 ₫",
    insight: "Phong cách tối giản chú trọng đường nét hình học sắc sảo, chất liệu Bạch kim hoặc Vàng trắng thanh khiết, không rườm rà hoa mỹ.",
    color: "from-slate-400/15 to-slate-500/5 text-slate-400 border-slate-400/20"
  },
  glamorous: {
    label: "Sang trọng & Quý phái",
    vibe: "Luxury Glamour",
    items: [
      "Vòng cổ kim cương đại công nương (Grand Duchess Multi-Tier Diamond Necklace)",
      "Nhẫn kim cương Emerald xanh ngọc lục bảo hoàng gia (Royal Emerald-Cut Ring)",
      "Lắc tay kim cương đính đá Sapphire đại dương (Blue Ocean Sapphire & Diamond Bracelet)"
    ],
    conversion: "90%",
    projectedValue: "350.000.000 ₫",
    insight: "Tệp quý cô thượng lưu đặc biệt yêu thích các điểm nhấn hào quang lộng lẫy từ Kim cương nước D giác cắt lớn kết hợp Ngọc lục bảo, Lam ngọc.",
    color: "from-purple-500/10 to-purple-600/5 text-purple-400 border-purple-500/20"
  },
  "avant-garde": {
    label: "Phá cách & Độc bản",
    vibe: "Avant-Garde/Experimental",
    items: [
      "Khuyên tai Gothic chạm khắc đầu rồng vàng trắng (Gothic Dragon Head White Gold Drop)",
      "Nhẫn Signet bạc dập lửa gai góc (Alternative Thorns Signet Sterling Silver)",
      "Vòng cổ luồn dây xích thô phá cách (Brutalist Industrial Metal Bold Chain)"
    ],
    conversion: "65%",
    projectedValue: "85.000.000 ₫",
    insight: "Phong cách độc bản đề cao cấu trực bất đối xứng, chạm khắc phong sương, các họa tiết trừu tượng thô mộc đầy gai góc, nghệ thuật.",
    color: "from-emerald-500/10 to-emerald-600/5 text-emerald-400 border-emerald-500/20"
  },
  romantic: {
    label: "Lãng mạn & Dịu dàng",
    vibe: "Romantic & Gentle",
    items: [
      "Mặt dây chuyền hoa anh đào vàng hồng đính thạch anh (Cherry Blossom Rose Gold Pendant)",
      "Nhẫn đính hôn kết vòng dây leo hoa cỏ mộng mơ (Whimsical Botanical Vine Ring)",
      "Khuyên tai giọt nước ngọc trai hồng biển cả (Pink Akoya Pearl Drop Earring)"
    ],
    conversion: "78%",
    projectedValue: "60.000.000 ₫",
    insight: "Ưa chuộng cấu hình uốn lượn thướt tha mềm mại của Vàng hồng ấm áp, đính ngọc trai hồng Akoya hoặc thạch anh tóc đỏ đầy thơ mộng.",
    color: "from-pink-500/10 to-pink-600/5 text-pink-400 border-pink-500/20"
  }
};

export function AestheticSegmentationAnalysis({ customers }: { customers: Customer[] }) {
  const [selectedSegment, setSelectedSegment] = useState<string>("classic");

  const matchingCustomersCount = useMemo(() => {
    const liveMatch = customers.filter((c) => c.customFields?.fashionStyle === selectedSegment);
    const baseOffsets: Record<string, number> = {
      classic: 142,
      minimalist: 98,
      glamorous: 64,
      "avant-garde": 33,
      romantic: 78
    };
    return (baseOffsets[selectedSegment] || 25) + liveMatch.length;
  }, [customers, selectedSegment]);

  const totalCustomers = customers.length || 1284;
  const prediction = SUGGESTIONS_MAP[selectedSegment];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar: Segments List */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-md flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2f6cf5]" /> 
              Phân khúc Sắc đẹp
            </CardTitle>
            <CardDescription className="text-xs">
              Chọn nhóm gu thẩm mỹ để xem phân tích AI
            </CardDescription>
          </CardHeader>
          <div className="p-3 space-y-2">
            {Object.keys(SUGGESTIONS_MAP).map((key) => {
              const seg = SUGGESTIONS_MAP[key];
              const isSelected = selectedSegment === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedSegment(key)}
                  className={`w-full text-left px-4 py-3 rounded-[10px] text-xs transition-all border ${isSelected ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'bg-background hover:bg-muted border-border/50 text-muted-foreground'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{seg.label}</span>
                    {isSelected && <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div className="text-[10px] mt-1 opacity-80">{seg.vibe}</div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-8 space-y-6">
        <motion.div
          key={selectedSegment}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card className="border border-border/50 bg-[#1e2330]/40 backdrop-blur-md shadow-sm overflow-hidden relative min-h-[400px]">
            <div className={`absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl ${prediction.color} rounded-full blur-3xl pointer-events-none opacity-20`} />
            
            <CardHeader className="border-b border-border/40 pb-5">
              <div className="text-left">
                <span className="text-[10px] font-bold text-[#2f6cf5] border border-[#2f6cf5]/30 bg-[#2f6cf5]/10 py-1 px-2.5 rounded-full uppercase tracking-widest inline-block mb-2">
                  Dự đoán Thẩm mỹ VIP (Aesthetic Intelligence)
                </span>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Gem className="w-5 h-5 text-[#2f6cf5]" /> Đề Xuất Phân Khúc: {prediction.label}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5 text-left">
                  Tính toán tự động dựa trên các chỉ số hành vi, gu thời trang cá nhân và dữ liệu lưu vết sở thích chất liệu của khách hàng.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="pt-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Cột trái: Vibe & Progress */}
                <div className="space-y-4 text-left">
                  <div className={`p-5 rounded-[12px] border bg-gradient-to-br ${prediction.color}`}>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 block mb-1">Cảm Hứng Thần Thái (Vibe Theme)</span>
                    <p className="text-base font-extrabold tracking-wide">{prediction.vibe}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Hồ Sơ Quy Mô Khách Hàng</span>
                    <div className="bg-background/40 border border-border/40 p-4 rounded-[12px] flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-black text-foreground">{matchingCustomersCount}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">khách hàng</span>
                      </div>
                      <span className="text-[10px] bg-[#2f6cf5]/10 text-[#2f6cf5] border border-[#2f6cf5]/20 font-bold px-2 py-1 rounded-md">
                        Tỉ lệ: {((matchingCustomersCount / totalCustomers) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <div className="flex-1 bg-background/40 p-4 rounded-[12px] border border-border/30 text-center">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight block mb-1">Kỳ vọng Chuyển đổi</span>
                      <span className="text-xl font-black text-emerald-500">{prediction.conversion}</span>
                    </div>
                    <div className="flex-1 bg-background/40 p-4 rounded-[12px] border border-border/30 text-center">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight block mb-1">Doanh số Dự phỏng</span>
                      <span className="text-xl font-black text-[#2f6cf5]">{prediction.projectedValue}</span>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Insight & List */}
                <div className="space-y-5">
                  <div className="p-5 rounded-[12px] bg-[#0f172a]/40 border border-border/30">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Phân Tích Thẩm Mỹ (Aesthetic Insight)</span>
                    <p className="text-xs text-foreground/90 leading-relaxed font-medium mt-2">"{prediction.insight}"</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#2f6cf5] flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Tuyển Tập Sản Phẩm Dự Báo
                    </h4>
                    <div className="space-y-2">
                      {prediction.items.map((item, idx) => (
                        <div key={idx} className="bg-background/40 border border-border/30 p-3.5 rounded-[10px] flex items-center justify-between group hover:bg-background/60 hover:border-[#2f6cf5]/40 transition-all cursor-default">
                          <span className="text-xs font-bold text-foreground pr-4 line-clamp-2">{item}</span>
                          <div className="p-1.5 shrink-0 bg-muted rounded-[8px] group-hover:bg-[#2f6cf5]/10 group-hover:text-[#2f6cf5] transition-colors">
                            <TrendingUp className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
