import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from "react-dom";
import * as motion from "motion/react-client";
import { 
 Card, 
 CardContent, 
 CardHeader, 
 CardTitle, 
 CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
 DollarSign, 
 TrendingUp, 
 Users, 
 Percent, 
 Settings, 
 Sparkles, 
 Layers, 
 Award, 
 Calendar, 
 Smartphone, 
 Search, 
 RefreshCw, 
 AlertTriangle,
 ShieldAlert,
 Send,
 CheckCircle,
 CheckCircle2,
 Briefcase,
 Network,
 ShoppingBag,
 Gem,
 Zap,
 Trophy,
 BookOpen,
 X,
 ChevronDown,
 MoreHorizontal,
 Gift,
 Activity,
 ArrowUpRight,
 ArrowDownRight,
 Clock,
 Calculator
} from 'lucide-react';
import { 
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { 
 AreaChart, 
 Area, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer, 
 BarChart, 
 Bar, 
 Legend, 
 PieChart, 
 Pie, 
 Cell,
 LineChart,
 Line
} from 'recharts';
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Customer, LoyaltyCampaign, Company, AttributeDefinition, TierConfig } from "@/types";
import { OfferAnalysis } from "@/components/loyalty/OfferAnalysis";
import { CrossBranchAnalysis } from "@/components/customers/CrossBranchAnalysis";
import { ShoppingBehaviorAnalysis } from "@/components/customers/ShoppingBehaviorAnalysis";
import { TierPointAnalysis } from "@/components/customers/TierPointAnalysis";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { toast } from "sonner";
import { getGuestTiers } from "@/data/guestData";

const SUGGESTIONS_MAP: Record<string, {
  vibe: string;
  items: string[];
  conversion: string;
  projectedValue: string;
  insight: string;
  color: string;
}> = {
  classic: {
    vibe: "Classic Elegant (Cổ điển & Thanh lịch)",
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
    vibe: "Minimalist Sophistication (Tối giản & Tinh tế)",
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
    vibe: "Luxury Glamour (Sang trọng & Quý phái)",
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
    vibe: "Avant-Garde/Experimental (Phá cách & Cá tính)",
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
    vibe: "Romantic & Gentle (Lãng mạn & Dịu dàng)",
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

const CustomCLVTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formattedDate = (() => {
      if (!label) return "";
      const parts = label.split("/");
      if (parts.length === 2) {
        const m = parts[0].replace("T", "");
        const y = "20" + parts[1];
        return `Tháng ${m} năm ${y}`;
      }
      return label;
    })();

    return (
      <div className="bg-slate-950/95 border border-slate-800 p-3.5 rounded-[10px] shadow-2xl backdrop-blur-md text-left text-xs min-w-[220px]">
        <p className="font-bold text-slate-400 mb-2 border-b border-white/10 pb-1.5 flex items-center justify-between">
          <span>📅 {formattedDate}</span>
          <span className="text-[9px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wider">Mức CLV</span>
        </p>
        <div className="space-y-1.5">
          {payload.map((item: any, index: number) => {
            const rawVal = item.value;
            const fullVND = rawVal * 1000000;
            const name = item.name;
            const color = item.stroke || item.color;
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                  {name}:
                </span>
                <span className="font-extrabold text-white">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fullVND)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomSimulatedCLVTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/95 border border-slate-800 p-3.5 rounded-[10px] shadow-2xl backdrop-blur-md text-left text-xs min-w-[220px]">
        <p className="font-bold text-slate-400 mb-2 border-b border-white/10 pb-1.5 flex items-center justify-between">
          <span>⏳ Năm Gắn Kết {label}</span>
          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wider">Mô Phỏng</span>
        </p>
        <div className="space-y-1.5">
          {payload.map((item: any, index: number) => {
            const rawVal = item.value;
            const isCLV = item.dataKey === "CLV";
            const formattedVal = isCLV 
              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rawVal * 1000000)
              : `${rawVal} đơn hàng`;
            const color = item.stroke || item.color;
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {item.name}:
                </span>
                <span className={isCLV ? "font-extrabold text-blue-400" : "font-extrabold text-emerald-400"}>
                  {formattedVal}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CLV_TREND_BY_TIER_DATA = [
 { month: 'T6/25', Member: 5.2, Essential: 15.6, Icon: 52.0, Atelier: 120.5 },
 { month: 'T7/25', Member: 5.5, Essential: 16.2, Icon: 55.4, Atelier: 125.8 },
 { month: 'T8/25', Member: 5.9, Essential: 17.5, Icon: 58.1, Atelier: 135.0 },
 { month: 'T9/25', Member: 6.2, Essential: 18.0, Icon: 61.2, Atelier: 142.2 },
 { month: 'T10/25', Member: 6.4, Essential: 19.4, Icon: 65.8, Atelier: 156.4 },
 { month: 'T11/25', Member: 6.8, Essential: 20.1, Icon: 72.0, Atelier: 168.0 },
 { month: 'T12/25', Member: 7.5, Essential: 22.4, Icon: 81.5, Atelier: 189.5 },
 { month: 'T1/26', Member: 8.0, Essential: 24.5, Icon: 89.0, Atelier: 204.0 },
 { month: 'T2/26', Member: 8.4, Essential: 26.0, Icon: 94.2, Atelier: 215.8 },
 { month: 'T3/26', Member: 9.1, Essential: 28.2, Icon: 102.5, Atelier: 232.0 },
 { month: 'T4/26', Member: 9.5, Essential: 30.8, Icon: 110.4, Atelier: 245.5 },
 { month: 'T5/26', Member: 10.2, Essential: 34.0, Icon: 121.2, Atelier: 268.4 }
];

const INITIAL_CUSTOMERS = [
 { id: 'SVG-9081', name: 'Đoàn Hương Giang', phone: '0912***888', email: 'giang.dh@sevago.vip', tier: 'Atelier', status: 'Active', clv: 245000000, repeat_rate: 85, last_purchase: '2026-05-18', risk_score: 12, region: 'Hà Nội', collection: 'Heritage' },
 { id: 'SVG-4302', name: 'Nguyễn Lâm Anh', phone: '0987***999', email: 'lamanh.n@sevago.vip', tier: 'Atelier', status: 'Active', clv: 310000000, repeat_rate: 92, last_purchase: '2026-05-24', risk_score: 5, region: 'TP.HCM', collection: 'Bridal' },
 { id: 'SVG-7711', name: 'Trần Minh Quân', phone: '0903***777', email: 'quan.tm@gmail.com', tier: 'Icon', status: 'Active', clv: 145000000, repeat_rate: 70, last_purchase: '2026-04-12', risk_score: 28, region: 'TP.HCM', collection: 'Modern Art' },
 { id: 'SVG-5510', name: 'Lê Thúy Diễm', phone: '0915***555', email: 'diem.lt@outlook.com', tier: 'Essential', status: 'Dormant', clv: 48000000, repeat_rate: 45, last_purchase: '2025-12-05', risk_score: 74, region: 'Đà Nẵng', collection: 'Minimalist' },
 { id: 'SVG-2289', name: 'Phạm Hải Đăng', phone: '0934***333', email: 'dang.ph@sevago.vip', tier: 'Icon', status: 'Inactive', clv: 82000000, repeat_rate: 60, last_purchase: '2026-01-30', risk_score: 65, region: 'Hà Nội', collection: 'Heritage' },
 { id: 'SVG-1104', name: 'Hoàng Thu Trang', phone: '0966***111', email: 'trang.ht@sevago.vip', tier: 'Atelier', status: 'Active', clv: 185000000, repeat_rate: 80, last_purchase: '2026-05-02', risk_score: 18, region: 'Hải Phòng', collection: 'Bridal' },
 { id: 'SVG-3392', name: 'Vũ Quốc Khánh', phone: '0904***000', email: 'khanh.vq@gmail.com', tier: 'Member', status: 'Active', clv: 12000000, repeat_rate: 10, last_purchase: '2026-05-15', risk_score: 35, region: 'TP.HCM', collection: 'Minimalist' }
];

const REPEAT_PURCHASE_BY_COLLECTION = [
 { name: 'Bridal High Jewelry', repeatRate: 42, revenue: 1200000000, activeBuyers: 124 },
 { name: 'Heritage Gold Collection', repeatRate: 38, revenue: 2450000000, activeBuyers: 310 },
 { name: 'Modern Art & Gems', repeatRate: 29, revenue: 1650000000, activeBuyers: 185 },
 { name: 'Minimalist Platinum', repeatRate: 22, revenue: 980000000, activeBuyers: 412 }
];

const REGIONAL_METRICS = [
 { region: 'Hà Nội Showroom', rate: 36, target: 30, color: '#2f6cf5' },
 { region: 'TP.HCM Boutique', rate: 34, target: 30, color: '#1652f1' },
 { region: 'Đà Nẵng Lounge', rate: 22, target: 30, color: '#0e3ec5' },
];

const INITIAL_RULE_ENGINE = {
 pointEarningRate: 1000000, // 1,000,000 VND = 1 Point
 pointRedemptionValue: 10000, // 1 Point = 10,000 VND voucher
 pointExpiryMonths: 12,
 tierUpgradeAtelier: 150000000,
 tierUpgradeIcon: 50000000,
 tierUpgradeEssential: 15000000,
 birthdayRewardPoint: 50,
 referralRewardPoint: 30,
};

const INITIAL_VOUCHER_CAMPAIGNS = [
 { id: 'VCH-01', name: 'Phượng Hoàng Gold 2026', sent: 500, used: 210, revenue: 1550000000, cost: 45000000, active: true },
 { id: 'VCH-02', name: 'Tri Ân Atelier Sinh Nhật', sent: 80, used: 64, revenue: 980000000, cost: 32000000, active: true },
 { id: 'VCH-03', name: 'Welcome Essential Tier', sent: 1200, used: 310, revenue: 620000000, cost: 15000000, active: false },
];

const ANALYSIS_DOCS: Record<string, {
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  metrics: { label: string; value: string; desc: string }[];
  details: { label: string; desc: string }[];
  advice: string[];
  themeColor: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    iconBg: string;
  };
}> = {
  dashboard: {
    title: "Chọn mục cần phân tích",
    subtitle: "Chẩn đoán sức khỏe tổng quát của chương trình Loyalty, hiệu quả tích lũy và chuyển dịch doanh thu.",
    badge: "Tổng Quan",
    description: "Cung cấp cái nhìn toàn diện từ trên xuống về dòng chảy điểm số, cấu trúc hội viên, và tỷ suất đóng góp doanh thu của tệp VIP để tối ưu hóa ngân sách chung.",
    metrics: [
      { label: "Doanh thu VIP đóng góp", value: "65.4%", desc: "Tài khóa phát sinh bởi hội viên danh bạ" },
      { label: "Point Burn/Earn Ratio", value: "0.82", desc: "Tỉ lệ đổi điểm / tích luỹ điểm lý tưởng" },
      { label: "Chi phí vận hành thực tế", value: "2.1%", desc: "Đầu tư duy trì dịch vụ & quà tặng trên doanh thu" }
    ],
    details: [
      { label: "Dòng chảy Điểm số (Points Cycle)", desc: "Giám sát hiệu số giữa điểm phát hành và điểm thu hồi để đề xuất hoạt động giải phóng điểm dư." },
      { label: "Mô hình Phân lớp Thành viên", desc: "Đo lường tỷ lệ tăng trưởng cơ học của từng cấp hạng (Atelier/Icon/Essential)." },
      { label: "Kênh Chuyển đổi chính", desc: "Xác định điểm chạm tích lũy tạo đơn tốt nhất (Showroom, Online Web, hoặc Boutique)." }
    ],
    advice: [
      "Duy trì Point Burn Rate ở mức ~80% để đảm bảo khách không cảm thấy điểm thưởng trực quan kém giá trị hay gây gánh nặng công nợ cho boutique.",
      "Tập trung ngân sách tri ân vào tệp 20% thành viên cốt lõi mang tới 80% doanh thu dồn tích."
    ],
    themeColor: {
      bg: "bg-blue-500/5 dark:bg-blue-950/10",
      border: "border-blue-500/15 dark:border-blue-900/30",
      text: "text-blue-950 dark:text-blue-300",
      accent: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    }
  },
  cross_branch: {
    title: "Điểm chung chi nhánh",
    subtitle: "Lượng hóa hành vi di chuyển chéo của khách hàng VIP giữa các showroom vật lý và kênh online.",
    badge: "Chi Nhánh",
    description: "Nhận diện xu hướng di chuyển mua sắm tự do của khách hàng trên toàn mạng lưới cửa hàng. Thấu hiểu dòng chảy địa lý để quản trị chuỗi cung ứng cục bộ.",
    metrics: [
      { label: "Tỷ lệ di chuyển chéo", value: "34.2%", desc: "Khách mua hàng ở từ 2 chi nhánh trở lên" },
      { label: "Showroom đón khách hăng hái nhất", value: "Sài Gòn Boutique", desc: "Chi nhánh tiếp nhận lượng VIP chéo cao nhất" },
      { label: "Tốc độ dịch chuyển kênh", value: "+18%", desc: "Gia tăng chuyển đổi đặt giữ hàng tại Boutique" }
    ],
    details: [
      { label: "Hành vi sắm chéo (Cross-purchasing)", desc: "Khách hàng mua Trang sức tại Flagship và bảo dưỡng, làm mới tại các Boutique phụ cận." },
      { label: "Ưu thế Phân bổ Địa lý", desc: "Hỗ trợ định vị khu vực tiềm năng để mở rộng dòng boutique hoặc showroom đón đầu tệp VIP." },
      { label: "Tái định ngạch Doanh số", desc: "Ghi nhận công sức giới thiệu của chi nhánh khai sinh thẻ và chi nhánh chăm sóc thực tế." }
    ],
    advice: [
      "Thiết lập cơ chế chia sẻ KPI hoa hồng thông minh giữa các chi nhánh để tạo động lực phối hợp chăm sóc tệp VIP tốt hơn.",
      "Luân chuyển linh hoạt vật phẩm đặc sắc dòng Atelier giới hạn tới các showroom ghi nhận nhu cầu trải nghiệm chéo đột biến."
    ],
    themeColor: {
      bg: "bg-emerald-500/5 dark:bg-emerald-950/10",
      border: "border-emerald-500/15 dark:border-emerald-900/30",
      text: "text-emerald-950 dark:text-emerald-300",
      accent: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    }
  },
  shopping_behavior: {
    title: "Hành vi mua sắm",
    subtitle: "Chẩn đoán thói quen chi tiêu trang sức mảnh, kim cương nước D dựa trên kích cỡ rổ đồ & chu kỳ hóa đơn.",
    badge: "Hành Vi",
    description: "Tận dụng AI chẩn đoán mẫu hình giỏ hàng mua sắm, nhận diện thói quen đặt sắm trọn bộ trang sức hay đơn sắm rời rạc để xúc tiến khuyến nghị tức thời.",
    metrics: [
      { label: "Tỷ lệ mua theo Bộ (Set)", value: "42.8%", desc: "Tần suất mua rổ hàng đính kèm nhẫn + khuyên tai đồng bộ" },
      { label: "Khoảng cách đơn mua (AOV)", value: "155 triệu ₫", desc: "Mức chi tiêu trung bình trên mỗi hóa đơn của nhóm VIP" },
      { label: "Tỷ lệ giỏ hàng lai (Hybrid)", value: "29.5%", desc: "Kết hợp giữa vàng di sản thủ công và bạch kim tối giản" }
    ],
    details: [
      { label: "Mẫu hình Giỏ hàng (Cart Patterns)", desc: "AI phân tích tần suất gộp hóa đơn và độ tương thích bổ sung giữa các nhóm chế tác." },
      { label: "Tính thời vụ (Seasonality)", desc: "Chu kỳ đột phá rổ đồ tập trung cao điểm vào quý 4, mùa cưới hỏi và trước lễ tết." },
      { label: "Thời gian chu kỳ tái sắm", desc: "Trung bình 145 ngày. Khoảng thời gian nghỉ giữa hai lần phát sinh thanh toán." }
    ],
    advice: [
      "Tự động kích hoạt ưu đãi 'Đặc quyền gộp bộ' giảm ngay 5-8% khi giỏ hàng có trên 2 danh mục trang sức bổ khuyết cho nhau.",
      "Gợi ý chiến dịch chăm sóc định kỳ trước 15 ngày kỷ niệm ngày cưới của VIP với gợi ý bộ lễ vật riêng."
    ],
    themeColor: {
      bg: "bg-sky-500/5 dark:bg-sky-950/10",
      border: "border-sky-500/15 dark:border-sky-900/30",
      text: "text-sky-950 dark:text-sky-300",
      accent: "text-sky-600 dark:text-sky-400",
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400"
    }
  },
  tier_point_analysis: {
    title: "Phân tích hạng & điểm",
    subtitle: "Giám sát cán cen phân bổ điểm thưởng của toàn hệ thống dữ liệu khách hàng VIP CRM.",
    badge: "VIP & Điểm",
    description: "Nhận thức mật độ điểm số khả dụng để kiểm tra rủi ro nợ tài chính (Loyalty Liability). Định vị những 'Quý khách hàng ngủ đông' đang ôm trữ lượng lớn điểm số.",
    metrics: [
      { label: "Tổng quỹ điểm lưu hành", value: "48.2M pts", desc: "Điểm khả dụng hiện tại khách hàng đang nắm giữ" },
      { label: "Nợ tài chính quy đổi quy đổi", value: "9.64 tỷ ₫", desc: "Nghĩa vụ quy đổi thưởng dự phóng đối ứng" },
      { label: "Tỷ lệ điểm chết trôi", value: "7.4%", desc: "Tỷ lệ điểm hết thời hạn hiệu lực bị bốc hơi kỳ trước" }
    ],
    details: [
      { label: "Giám sát Mật độ Điểm số", desc: "Xác minh các dải điểm số tập trung số lượng đông đảo người dùng nhất." },
      { label: "Dự phóng Điểm Hết hạn", desc: "Hệ thống tự động điểm mặt nhóm điểm sắp bốc hơi trong 30-60 ngày tới để kích hoạt SMS." },
      { label: "Hiệu năng Điểm Thặng dư", desc: "Xem xét thói quen tích trữ của lớp VIP để tạo ra các giải pháp đốt điểm hấp dẫn." }
    ],
    advice: [
      "Triển khai các sự kiện quy đổi quà giới hạn (Flash-Redeem) mỗi quý để hạ dòng điểm lưu ký tiềm ẩn rủi ro tài chính.",
      "Không siết thời hạn thẻ quá ngặt nghèo tạo phản cảm cho lớp Diamond, Atelier VIP."
    ],
    themeColor: {
      bg: "bg-amber-500/5 dark:bg-amber-950/10",
      border: "border-amber-500/15 dark:border-amber-900/30",
      text: "text-amber-950 dark:text-amber-300",
      accent: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    }
  },
  aesthetic_segmentation: {
    title: "Phân khúc Thẩm mỹ",
    subtitle: "Khám phá gu thời trang thẩm mỹ sâu kín qua lịch sử giao dịch để tạo chiến hạm tiếp thị chính xác.",
    badge: "AI Gu Thẩm Mỹ",
    description: "Phân tách tệp khách hàng dựa trên hành vi mua sắm thuộc các trường phái riêng biệt đại diện cho gu sống đỉnh cao (Classic Elegant, Minimalist, Luxury Glamour, Avant-Garde).",
    metrics: [
      { label: "Độ chính xác AI gắn tag", value: "94.5%", desc: "Mức trùng khớp giữa dự đoán AI và lựa chọn thực tế" },
      { label: "Tăng trưởng chuyển từ gợi ý", value: "+38%", desc: "Hiệu quả gia tăng đơn khi tiếp thị bằng catalog đúng gu" },
      { label: "Nhóm phong cách phổ biến", value: "Classic Elegant", desc: "Phong cách được ưa chuộng áp đảo tại miền Bắc" }
    ],
    details: [
      { label: "AI Đề xuất Tối ưu (Smart Matching)", desc: "Tự động phân nhóm và khớp mã Catalog trang sức thích hợp nhất." },
      { label: "Phân nhóm Theo Gu (Style Cohorts)", desc: "Rời bỏ lối phân nhóm tuổi tác thô sơ, tập trung thuần khiết vào gu thẩm mỹ tinh tế." },
      { label: "Điểm Chuyển đổi Gu", desc: "Đón đầu xu hướng chuyển dịch khi túi tiền nâng hạng." }
    ],
    advice: [
      "Tránh gửi tin nhắn rao bán sản phẩm đại trà. Khách có gu Minimalist tuyệt đối chỉ nhận Catalog trang sức dẹt, mảnh tinh xảo đơn thuần.",
      "Huấn luyện nhân viên showroom hiểu rõ gu khách hàng đang hiển thị trên app trước khi đón tiếp tại cửa."
    ],
    themeColor: {
      bg: "bg-purple-500/5 dark:bg-purple-950/10",
      border: "border-purple-500/15 dark:border-purple-900/30",
      text: "text-purple-950 dark:text-purple-300",
      accent: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
    }
  },
  tier_projection: {
    title: "Tiến trình Thăng hạng",
    subtitle: "Mô hình hoá và dự đoán thời điểm vàng nâng cấp đặc quyền VIP của toàn bộ tệp thành viên.",
    badge: "Dự Phóng",
    description: "Nhìn thấu tiến độ bứt tốc thăng hạng, dự phóng lượng khách chuẩn bị vượt sào thăng cấp Icon, Atelier trong 90 ngày tới để chủ động chuẩn bị quà cáp tri ân.",
    metrics: [
      { label: "Khách chuẩn bị thăng cấp (Cận biên)", value: "112 hội viên", desc: "Số lượng khách đã đạt trên 85% ngưỡng thăng hạng kế tiếp" },
      { label: "Tỷ lệ thăng hạng tự động", value: "15.4%/năm", desc: "Chu kỳ thăng cấp cơ học của người tiêu dùng không kích cầu" },
      { label: "Doanh thu cận biên dự tính", value: "2.4 tỷ ₫", desc: "Doanh số bổ sung nếu toàn bộ khách cận biên thăng hạng" }
    ],
    details: [
      { label: "Quản trị Khoảng cách Ngưỡng (Threshold Gap)", desc: "Đo đạc chính xác số tiền cần chi thêm của từng VIP." },
      { label: "Vòng xoáy Thâm hụt Thăng hạng", desc: "Theo dõi lượng khách sắp bị tụt hạng (Demotion Risk) vì không duy trì mức chi tối thiểu." },
      { label: "Biểu đồ Phân bổ Tiến trình", desc: "Hình dung tỷ mẩn bản đồ phân tán biểu thị tình trạng thăng tiến." }
    ],
    advice: [
      "Khởi chạy chiến dịch SMS thông minh: 'Chỉ còn thiếu 15 triệu để duy trì vị thế Atelier trọn đời'.",
      "Triển khai hoạt động 'Double Spend Weekend' cho nhóm khách cận biên để kéo họ thăng hạng nhanh chóng."
    ],
    themeColor: {
      bg: "bg-rose-500/5 dark:bg-rose-950/10",
      border: "border-rose-500/15 dark:border-rose-900/30",
      text: "text-rose-950 dark:text-rose-300",
      accent: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
    }
  },
  loyalty_cost: {
    title: "Loyalty Cost & ROI",
    subtitle: "Đảm bảo tính lành mạnh tài khóa của hệ thống Marketing, xác nhận hiệu quả đầu tư thực chất.",
    badge: "Tài Chính & ROI",
    description: "Hiển thị trực quan bức tranh chi phí cứng và chi phí mềm của chương trình tích điểm đổi quà. Tính toán chính xác xem 1 đồng chi phí bỏ ra đem lại bao nhiêu đồng doanh số VIP tăng thêm.",
    metrics: [
      { label: "Tỷ suất hoàn vốn ROI chung", value: "3.8x", desc: "Cứ 1 đồng chi phí chăm sóc tạo ra 3.8 đồng doanh số tăng thêm" },
      { label: "Chi phí đổi điểm bình quân (Cost/Point)", value: "125 ₫", desc: "Mức trích lập thực chi khi khách hàng quy đổi 1 điểm" },
      { label: "Ngân sách tiếp khách VIP Lounge", value: "1.2%", desc: "Tài khóa trích lập phục vụ tiệc trà Atelier" }
    ],
    details: [
      { label: "ROI Kênh Tích lũy (Earn ROI)", desc: "Theo dõi doanh số biên tạo lập từ các hoạt động tặng điểm thưởng." },
      { label: "Bảo hiểm Trích lập Công nợ", desc: "Dự phòng rủi ro dồn cục đổi quà thời điểm tết nguyên đán làm cạn dòng tiền." },
      { label: "Chi phí Hàng tồn quy đổi (Voucher Costs)", desc: "Giá trị chiết khấu thực tế sau khi đã tối ưu biên lợi nhuận gốc." }
    ],
    advice: [
      "Luôn giữ chỉ số ROI Loyalty lớn hơn 2.5x để đảm bảo chương trình không rơi vào bẫy chi phí vô dưỡng.",
      "Ưu tiên quy đổi bằng voucher dịch vụ hoặc vật phẩm thương hiệu của đối tác liên minh để nén chi phí quà tặng xuống thấp nhất."
    ],
    themeColor: {
      bg: "bg-cyan-500/5 dark:bg-cyan-950/10",
      border: "border-cyan-500/15 dark:border-cyan-900/30",
      text: "text-cyan-950 dark:text-cyan-300",
      accent: "text-cyan-600 dark:text-cyan-400",
      iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
    }
  },
  clv_repeat: {
    title: "CLV & Repeat Purchase",
    subtitle: "Giám sát sức bền gắn kết bền bỉ theo năm tháng của tệp khách hàng thông qua RFM Matrix.",
    badge: "Sức Bền CLV",
    description: "Giám định tuổi đời khách hàng (Customer Lifespan) và tần suất quay lại mua hàng định kỳ. Xác định chính xác xem tệp VIP có ngủ đông, thoái trào hay tiếp tục gia tăng giá trị.",
    metrics: [
      { label: "Tỷ lệ tái mua kỳ (180 ngày)", value: "58.7%", desc: "Hội viên VIP quay lại mua đơn hàng thứ hai trong vòng nửa năm" },
      { label: "Chỉ số CLV trung bình", value: "480 triệu ₫", desc: "Doanh số tích lũy một khách hàng đóng góp trọn đời trên hệ thống" },
      { label: "Retention Rate (VIP)", value: "82.4%", desc: "Tỷ lệ gìn giữ giữ chân thành viên cao tuổi tiếp tục trung thành" }
    ],
    details: [
      { label: "RFM Cohort Analytics", desc: "Phân bón dữ liệu dựa trên: Recency (gần nhất), Frequency (tần suất), Monetary (giá trị đơn)." },
      { label: "Tuổi thọ trung bình (Customer Lifespan)", desc: "Chu kỳ sống của một thành viên tính từ lúc mở thẻ đến đơn sắm cuối cùng." },
      { label: "Predictive Churn Detection", desc: "Cảnh báo sớm khi VIP không phát sinh tương tác quá 180 ngày." }
    ],
    advice: [
      "Khách hàng VIP lâu năm có CLV cao cần được kết nối trực tiếp bởi Quản lý vùng thay vì nhân viên thông thường.",
      "Thiết lập kịch bản Re-activation (Tập trung kích hoạt lại) lập tức cho khách hàng lọt nhóm 'Sleepy VIP' trên RFM."
    ],
    themeColor: {
      bg: "bg-teal-500/5 dark:bg-teal-950/10",
      border: "border-teal-500/15 dark:border-teal-900/30",
      text: "text-teal-950 dark:text-teal-300",
      accent: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400"
    }
  },
  vip_crm: {
    title: "VIP CRM & Booking",
    subtitle: "Vận hành chu đáo quy trình VIP Lounge, phòng tư vấn 1-kèm-1 và kịch bản chăm sóc cá nhân hóa.",
    badge: "CRM Thượng Lưu",
    description: "Quản lý lượt đặt Private Room, bố trí thợ kim hoàn tư vấn trực diện cho khách hàng có kế hoạch đám cưới hoàng gia hoặc chế tác trang sức gia bảo độc bản.",
    metrics: [
      { label: "Lượt đặt Private Lounge", value: "85/tháng", desc: "Tổng lượt sử dụng dịch vụ tiếp khách khép kín tại chi nhánh" },
      { label: "NPS (Điểm số hài lòng)", value: "98.2/100", desc: "Mức độ hài lòng cực độ của thượng khách sau khi trải nghiệm đặt VIP" },
      { label: "Chuyển đơn từ Private Lounge", value: "80%", desc: "Tỷ lệ khách hàng chốt mua sau buổi tư vấn cá nhân tại Lounge" }
    ],
    details: [
      { label: "Bố trí Phòng Private & Thợ Cả", desc: "Nhân viên Boutique chủ động giữ giờ phòng tư vấn, điều phối trà bánh theo khẩu vị." },
      { label: "Nhắc nhở Ngày Kỷ Niệm (Life Events)", desc: "Hệ thống nhắc nhở boutique manager chúc mừng sinh nhật, ngày cưới, mừng thọ của người thân VIP." },
      { label: "Đặt Lịch Bảo Trì Trang Sức", desc: "Mời VIP đem trang sức quý quay lại Boutique đánh bóng hoặc kiểm tra kim cương miễn phí." }
    ],
    advice: [
      "Chuẩn bị nước uống, hương tinh dầu dịu nhẹ dựa trên thông tin sở thích lưu trữ trên CRM để tạo độ siêu cá nhân hóa.",
      "Tối ưu phòng chờ: Tránh để hai khách hàng VIP quen biết nhau chung phòng lounge nếu họ yêu cầu sự kín tiếng tuyệt mật."
    ],
    themeColor: {
      bg: "bg-indigo-500/5 dark:bg-indigo-950/10",
      border: "border-indigo-500/15 dark:border-indigo-900/30",
      text: "text-indigo-950 dark:text-indigo-300",
      accent: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
    }
  },
  ai_advisor: {
    title: "AI Analytics Advisor",
    subtitle: "Khai thác tối đa trí tuệ nhân tạo Gemini để chẩn đoán lỗ hổng chính sách và tự soạn thảo chiến dịch.",
    badge: "AI Cố Vấn",
    description: "AI Advisor giám sát liên tục luồng dữ liệu mua sắm và thăng hạng chéo, tự động đưa ra các dự báo sắc bén và dự phòng rủi ro ngân sách tiếp thị.",
    metrics: [
      { label: "Gợi ý AI được áp dụng", value: "72.4%", desc: "Tỷ lệ các đề xuất hữu ích được ban quản trị đưa vào thực thi" },
      { label: "Giảm hao hụt ngân sách", value: "-14%", desc: "Hao phí tiếp thị giảm thiểu tối đa nhờ AI tối ưu đúng đối tượng" },
      { label: "Thời gian tạo lập chiến dịch", value: "< 2 phút", desc: "Thời gian soạn thảo kịch bách chi tiết cho tệp khách mục tiêu" }
    ],
    details: [
      { label: "Phát hiện Dị Thường tự động", desc: "Báo cáo khẩn cấp khi xuất hiện lỗi cộng dồn điểm ảo hoặc rò rỉ voucher ở kênh Online." },
      { label: "Tạo lập Chiến Dịch Sáng Tạo", desc: "AI lên văn bản nháp SMS/ZNS cá nhân hóa tối đa bám đuổi gu trang sức từng nhóm khách." },
      { label: "Dự phóng Trend Thẩm Mỹ", desc: "Dự đoán xu thế dịch chuyển gu thời trang từ Cổ điển sang Tối giản trong kỳ tới." }
    ],
    advice: [
      "Thực hiện rà soát các đề nghị đề xuất của AI Advisor vào mỗi sáng Thứ Hai để lên khung vận hành chiến dịch tuần nhanh gọn.",
      "Cung cấp phản hồi ngược lại cho AI khi một chiến dịch thành công để máy học tốt hơn gu thẩm mỹ tối thượng của quý khách."
    ],
    themeColor: {
      bg: "bg-fuchsia-500/5 dark:bg-fuchsia-950/10",
      border: "border-fuchsia-500/15 dark:border-fuchsia-900/30",
      text: "text-fuchsia-950 dark:text-fuchsia-300",
      accent: "text-fuchsia-600 dark:text-fuchsia-400",
      iconBg: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
    }
  },
  offer_analysis: {
    title: "Phân tích & Tối ưu Ưu đãi",
    subtitle: "Phân tích mức độ chấp nhận, tỷ lệ quy đổi và giá trị thặng dư rải thảm voucher Loyalty.",
    badge: "Tối Ưu Ưu Đãi",
    description: "Lượng hóa tỷ mỉ tác động tài chính của từng chiến dịch phát phát hành ưu đãi. Đo lường xem khuyến mãi có thực sự lôi kéo khách hàng hay chỉ làm giảm biên lợi nhuận đáng tiếc.",
    metrics: [
      { label: "Tỷ lệ quy đổi voucher (Redeem)", value: "32.5%", desc: "Voucher phát ra được áp dụng thành công trên hóa đơn thực tế" },
      { label: "Biên doanh số tăng thêm (Lift)", value: "+22.4%", desc: "Giá trị đơn tăng thêm khi khách được thúc đẩy bằng coupon ưu đãi" },
      { label: "Tỷ lệ bỏ quên voucher", value: "48%", desc: "Lượng voucher hết hiệu lực trôi qua đáng tiếc không được khách sài" }
    ],
    details: [
      { label: "Độ Nhạy bén Giảm giá (Discount Sensitivity)", desc: "Xác minh các ngưỡng giảm giá kích thích chuyển đổi mạnh nhất (10%, 15% hay bớp tiền phẳng)." },
      { label: "Hao phí Biên lợi nhuận", desc: "Đảm bảo mã quy đổi quà tặng không 'ăn lẹm' vào giá vốn nhập khẩu của bộ trang sức." },
      { label: "Kênh Phân phát Đón nhận cao", desc: "SMS truyền thống so với Zalo ZNS và thông báo ứng dụng di động." }
    ],
    advice: [
      "Sử dụng ưu đãi có điều kiện: Ví dụ 'Tặng Voucher 500k chỉ áp dụng cho đơn Trang sức Bạch Kim từ 10 triệu trở lên' để giữ biên lợi nhuận an toàn.",
      "Chỉ tự động phát voucher cho nhóm khách hàng có dấu hiệu nguội lạnh chi tiêu, nhóm trung thành cao nên tri ân bằng đặc quyền phi tài chính."
    ],
    themeColor: {
      bg: "bg-zinc-500/5 dark:bg-zinc-950/10",
      border: "border-zinc-500/15 dark:border-zinc-900/30",
      text: "text-zinc-950 dark:text-zinc-300",
      accent: "text-zinc-600 dark:text-zinc-400",
      iconBg: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
    }
  },
  rules: {
    title: "Hệ thống Rules",
    subtitle: "Tận dụng cấu hình quy tắc linh động để tự động hóa toàn diện hoạt động kích cầu VIP.",
    badge: "Hệ Thống Rules",
    description: "Bộ Máy Rules thực thi một cách thầm lặng phía sau hậu trường. Khi khách hàng thoả mãn hành vi (ví dụ: mua hàng ngày sinh nhật, check-in boutique, khảo sát) hệ thống lập tức tính toán nhân điểm tự động dựa trên thặng số hạng thẻ.",
    metrics: [
      { label: "Số lượng quy tắc vận hành", value: "18 luật", desc: "Các quy lý vận hành và đổi thưởng đang chạy ngầm" },
      { label: "Thời gian phản hồi luật", value: "< 50ms", desc: "Tốc độ xử lý cộng điểm thực tế sau khi thanh toán hóa đơn" },
      { label: "Luật tạo đột biến điểm tốt nhất", value: "Sinh Nhật Vàng", desc: "Sự kiện được khách hàng thực hiện quy tích lũy siêng năng nhất" }
    ],
    details: [
      { label: "Sự Phối Hợp Giữa Thể Lực Hạng", desc: "Các luật cộng điểm (Earn Rules) tự động kết hợp với hệ số nhân Multiplier của hạng thẻ." },
      { label: "Ràng buộc Loại trừ", desc: "Quy ước ngăn chặn khách hàng gộp nhiều chương trình khuyến mãi cùng một hóa đơn." },
      { label: "Cơ chế Thử nghiệm Luật (A/B Testing Rules)", desc: "Cho phép mô phỏng chạy thử luật cộng điểm mới trên một nhóm nhỏ khách hàng trước khi bùng nổ diện rộng." }
    ],
    advice: [
      "Luôn kiểm tra kỹ lưỡng tỷ lệ chiết khấu tích hợp trước khi bật các luật kích thích mùa lễ lớn gộp chung.",
      "Sử dụng công cụ Mô phỏng tích điểm (Simulator) trong hệ thống Rules để thẩm định rủi ro phân phối điểm ảo."
    ],
    themeColor: {
      bg: "bg-orange-500/5 dark:bg-orange-950/10",
      border: "border-orange-500/15 dark:border-orange-900/30",
      text: "text-orange-950 dark:text-orange-300",
      accent: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400"
    }
  }
};

export function AnalysisView() {
 const { user } = useFirebase();
 const [activeTab, setActiveTab] = useState('dashboard'); 
 const [showDoc, setShowDoc] = useState(false);
 const [toastMessage, setToastMessage] = useState<string | null>(null);
 const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
 const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
 const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>([]);
 const [companies, setCompanies] = useState<Company[]>([]);
 const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
 const [tiers, setTiers] = useState<TierConfig[]>([]);
 const [selectedSegment, setSelectedSegment] = useState<string>("classic");
 const [progressionCustomerId, setProgressionCustomerId] = useState<string>("");

 
    // Merge Firebase customers and mock customers for a complete dashboard list
   const customers = useMemo(() => {
     const merged = INITIAL_CUSTOMERS.map(c => {
       const initialPoints = c.tier === 'Atelier' ? 185000 : c.tier === 'Icon' ? 62000 : c.tier === 'Essential' ? 18000 : 5000;
       return { ...c, points: initialPoints };
     });
 
     dbCustomers.forEach(dbCust => {
       const matchIndex = merged.findIndex(m => m.id === dbCust.id);
       if (matchIndex !== -1) {
         const livePoints = typeof dbCust.points === 'number' ? dbCust.points : merged[matchIndex].points;
         merged[matchIndex] = {
           ...merged[matchIndex],
           points: livePoints,
           tier: livePoints >= 150000 ? 'Atelier' : livePoints >= 50000 ? 'Icon' : livePoints >= 15000 ? 'Essential' : 'Member',
           clv: livePoints * 1000,
           last_purchase: dbCust.last_purchase || merged[matchIndex].last_purchase
         };
       } else {
         const livePoints = dbCust.points || 0;
         merged.push({
           id: dbCust.id || `SVG-${Math.floor(1000 + Math.random() * 9000)}`,
           name: dbCust.name || 'Hội viên ẩn danh',
           phone: dbCust.phone || '090***',
           email: dbCust.email || '',
           points: livePoints,
           tier: livePoints >= 150000 ? 'Atelier' : livePoints >= 50000 ? 'Icon' : livePoints >= 15000 ? 'Essential' : 'Member',
           status: dbCust.activityStatus === 'active' ? 'Active' : dbCust.activityStatus === 'churn_risk' ? 'Dormant' : 'Active',
           clv: Math.max(livePoints * 1000, 100000),
           repeat_rate: 65,
           last_purchase: dbCust.last_purchase || '2026-05-30',
           risk_score: dbCust.activityStatus === 'churn_risk' ? 82 : 21,
           region: 'Hà Nội',
           collection: 'Heritage'
         });
       }
     });
     return merged as Customer[];
   }, [dbCustomers]);

 // Listen for customers from Firebase Firestore to make this data LIVE!
 useEffect(() => {
  if (!user || user.isLocal) {
   setDbCustomers([]);
   return;
  }

 const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
 const unsub = onSnapshot(q, (snapshot) => {
  setDbCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
 }, (error) => handleFirestoreError(error, OperationType.LIST, "customers"));
 return unsub;
 }, [user]);

 // Listen for campaigns from Firebase Firestore
 useEffect(() => {
 if (!user || user.isLocal) return;
 const q = query(collection(db, "loyalty_campaigns"), orderBy("createdAt", "desc"));
 const unsub = onSnapshot(q, (snapshot) => {
  setCampaigns(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LoyaltyCampaign)));
 }, (error) => handleFirestoreError(error, OperationType.LIST, "loyalty_campaigns"));
 return unsub;
 }, [user]);

 // Listen for companies from Firebase Firestore
 useEffect(() => {
 if (!user || user.isLocal) return;
 const q = query(collection(db, "companies"), orderBy("name", "asc"));
 const unsub = onSnapshot(q, (snapshot) => {
  setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
 }, (error) => handleFirestoreError(error, OperationType.LIST, "companies"));
 return unsub;
 }, [user]);

 // Listen for attributes from Firebase Firestore
 useEffect(() => {
 if (!user || user.isLocal) {
  setTiers(getGuestTiers());
  return;
 }
 const q = query(collection(db, "attribute_definitions"), orderBy("createdAt", "asc"));
 const unsub = onSnapshot(q, (snapshot) => {
  setAttributes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttributeDefinition)));
 }, (error) => handleFirestoreError(error, OperationType.LIST, "attribute_definitions"));

 // Also load tiers
 const unsubTiers = onSnapshot(
  query(collection(db, "tier_configs"), orderBy("threshold", "asc")),
  (snapshot) => {
   setTiers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TierConfig)));
  }
 );

 return () => {
  unsub();
  unsubTiers();
 };
 }, [user]);

 useEffect(() => {
  if (customers.length > 0 && !progressionCustomerId) {
   setProgressionCustomerId(customers[0].id);
  }
 }, [customers, progressionCustomerId]);

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

 // Financial inputs for Loyalty Cost Module
 const [revenue, setRevenue] = useState(10000000000); // 10 Billions VND
 const [cogs, setCogs] = useState(6000000000); // 6 Billions VND
 const [loyaltyRatio, setLoyaltyRatio] = useState(5); // 5%
 const [voucherCost, setVoucherCost] = useState(50000000);
 const [pointCost, setPointCost] = useState(30000000);
 const [eventCost, setEventCost] = useState(20000000);
 const [giftCost, setGiftCost] = useState(15000000);
 const [quarterlyBudgetCeiling, setQuarterlyBudgetCeiling] = useState(100000000); // 100M VND default quarterly budget ceiling

 // CLV Inputs
 const [aov, setAov] = useState(5000000); // Average Order Value: 5 Million VND
 const [purchaseFrequency, setPurchaseFrequency] = useState(3); // 3 orders per year
 const [customerLifespan, setCustomerLifespan] = useState(5); // 5 years

 // ROI specific inputs
 const [clvIncrease, setClvIncrease] = useState(500000000); // 500 Millions VND generated increase

 // Allocation ratio optimizer states
 const [industrySector, setIndustrySector] = useState<'luxury' | 'retail' | 'services'>('luxury');
 const [retentionTarget, setRetentionTarget] = useState<number>(85);
 const [competitionLevel, setCompetitionLevel] = useState<'low' | 'medium' | 'high'>('medium');

 // Search & Filters inside customers sub-tab
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedTierFilter, setSelectedTierFilter] = useState('All');
 const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

 // Booking & Events States
 const [bookings, setBookings] = useState([
 { id: 'BK-101', customerName: 'Đoàn Hương Giang', type: 'Private Appointment', date: '2026-05-28', time: '14:30', stylist: 'Alexander Lam', status: 'Confirmed' },
 { id: 'BK-102', customerName: 'Nguyễn Lâm Anh', type: 'Xem trang sức phòng riêng', date: '2026-06-01', time: '17:00', stylist: 'Victoria Trần', status: 'Pending' }
 ]);
 const [newBooking, setNewBooking] = useState({ customerName: '', type: 'Showroom Private Viewing', date: '', time: '', stylist: '' });

 // Rules State
 const [rules, setRules] = useState(INITIAL_RULE_ENGINE);

 // Voucher state
 const [vouchers, setVouchers] = useState(INITIAL_VOUCHER_CAMPAIGNS);
 const [newVoucher, setNewVoucher] = useState({ name: '', sent: '', used: '', revenue: '', cost: '' });

 // AI Recommendation panel states
 const [selectedAIVip, setSelectedAIVip] = useState(INITIAL_CUSTOMERS[0].id);
 const [aiCustomPrompt, setAiCustomPrompt] = useState('Phân tích rủi ro rời bỏ và gợi ý bộ sưu tập trang sức Heritage độc quyền phù hợp.');
 const [aiLoading, setAiLoading] = useState(false);
 const [aiResponse, setAiResponse] = useState<any>(null);

 const [simCustomerId, setSimCustomerId] = useState('SVG-9081');
 const [aiFocusKeyword, setAiFocusKeyword] = useState("gemstone");
 const [isGeneratingAi, setIsGeneratingAi] = useState(false);
 const [aiResult, setAiResult] = useState<any>(null);

  // POS Invoice Simulation states
  const [simInvoiceId, setSimInvoiceId] = useState(`POS-${Math.floor(100000 + Math.random() * 900000)}`);
  const [simAmount, setSimAmount] = useState(15000000); // default 15 Millions VND
  const [simLoading, setSimLoading] = useState(false);
  const [simLogs, setSimLogs] = useState<{ time: string; type: 'info' | 'success' | 'warning' | 'error'; text: string }[]>([
    { time: new Date().toLocaleTimeString(), type: 'info', text: 'Hệ thống giả lập POS Webhook API Gate v1.2.4 đã khởi động.' },
    { time: new Date().toLocaleTimeString(), type: 'info', text: 'Chờ nhận payload kết toán hóa đơn từ Sevago POS Terminal...' }
  ]);

  const handleSimulatePOSInvoice = async () => {
    if (!user) {
      triggerToast('Vui lòng đồng bộ tài khoản quản trị viên trước khi dùng giả lập POS!', 'error');
      return;
    }
    if (!simInvoiceId.trim()) {
      triggerToast('Mã hóa đơn POS không được rỗng!', 'error');
      return;
    }
    if (simAmount <= 0) {
      triggerToast('Doanh số thanh toán POS phải lớn hơn 0!', 'error');
      return;
    }

    const customer = customers.find(c => c.id === simCustomerId);
    if (!customer) {
      triggerToast('Không tìm thấy hội viên tương ứng!', 'error');
      return;
    }

    setSimLoading(true);
    const nowStr = () => new Date().toLocaleTimeString();

    setSimLogs(prev => [
      ...prev,
      { time: nowStr(), type: 'info', text: `📡 [API CALL] POST /api/v1/pos/invoice/accrual` },
      { time: nowStr(), type: 'info', text: `📦 Payload: { invoiceId: "${simInvoiceId}", customerId: "${simCustomerId}", amount: ${simAmount} }` }
    ]);

    setTimeout(async () => {
      try {
        const pointRate = rules.pointEarningRate || 1000000;
        const earnedPoints = Math.floor(simAmount / pointRate);
        const currentPoints = customer.points || 0;
        const newPoints = currentPoints + earnedPoints;

        const customerRef = doc(db, `customers`, simCustomerId);
        await setDoc(customerRef, {
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone || '',
          points: newPoints,
          clv: newPoints * 1000,
          last_purchase: new Date().toISOString().split('T')[0],
          updatedAt: serverTimestamp(),
        }, { merge: true });

        setSimLogs(prev => [
          ...prev,
          { time: nowStr(), type: 'success', text: `✅ [HTTP 200] Tìm thấy Hội viên: ${customer.name}` },
          { time: nowStr(), type: 'success', text: `🪙 +${earnedPoints} điểm Loyalty cộng thêm thành công.` },
          { time: nowStr(), type: 'success', text: `📈 Điểm tích lũy mới: ${newPoints.toLocaleString()} pts` },
          { time: nowStr(), type: 'success', text: `🎉 Đã đồng bộ trực tiếp lên Firestore. Toàn bộ bảng biểu cập nhật thời gian thực.` }
        ]);

        triggerToast(`Tích lũy thành công +${earnedPoints} điểm cho ${customer.name}!`);
        setSimInvoiceId(`POS-${Math.floor(100000 + Math.random() * 900000)}`);
      } catch (err: any) {
        setSimLogs(prev => [
          ...prev,
          { time: nowStr(), type: 'error', text: `❌ [ERROR] Lỗi ghi dữ liệu Firestore: ${err.message}` }
        ]);
        handleFirestoreError(err, OperationType.UPDATE, "customers");
      } finally {
        setSimLoading(false);
      }
    }, 1000);
  };

 const grossProfit = useMemo(() => revenue - cogs, [revenue, cogs]);
 const loyaltyBudget = useMemo(() => grossProfit * (loyaltyRatio / 100), [grossProfit, loyaltyRatio]);
 const actualCost = useMemo(() => voucherCost + pointCost + eventCost + giftCost, [voucherCost, pointCost, eventCost, giftCost]);
 const remainingBudget = useMemo(() => loyaltyBudget - actualCost, [loyaltyBudget, actualCost]);
 const costRatioOfRevenue = useMemo(() => (actualCost / revenue) * 100, [actualCost, revenue]);

 const calculatedCLV = useMemo(() => aov * purchaseFrequency * customerLifespan, [aov, purchaseFrequency, customerLifespan]);
 const simulatedClvGraphData = useMemo(() => {
  const data = [];
  const freq = Number(purchaseFrequency) || 0;
  const lifespan = Number(customerLifespan) || 0;
  const singleAov = Number(aov) || 0;
  
  const maxYears = Math.min(Math.max(1, lifespan), 15);
  for (let year = 1; year <= maxYears; year++) {
   const cumulativeClv = singleAov * freq * year;
   data.push({
    year: `Năm ${year}`,
    "CLV": cumulativeClv / 1000000, // in Millions
    "Orders": freq * year
   });
  }
  return data;
 }, [aov, purchaseFrequency, customerLifespan]);
 const calculatedROI = useMemo(() => {
 if (actualCost === 0) return 0;
 return ((clvIncrease - actualCost) / actualCost) * 100;
 }, [clvIncrease, actualCost]);

 // Derived calculations for percentage allocation optimizer
 const recommendedRatio = useMemo(() => {
  let base = 5.0;
  if (industrySector === 'luxury') base = 6.5;
  if (industrySector === 'retail') base = 4.2;
  if (industrySector === 'services') base = 8.0;

  // Adjust based on target retention
  base += (retentionTarget - 85) * 0.12;

  // Adjust based on competition level
  if (competitionLevel === 'high') base += 1.8;
  if (competitionLevel === 'low') base -= 1.2;

  return Math.max(1.0, Math.min(20.0, Number(base.toFixed(1))));
 }, [industrySector, retentionTarget, competitionLevel]);

 const budgetDistribution = useMemo(() => {
  let pointsPct = 25;
  let vouchersPct = 35;
  let eventsPct = 25;
  let giftsPct = 15;

  if (industrySector === 'retail') {
   pointsPct = 40;
   vouchersPct = 35;
   eventsPct = 15;
   giftsPct = 10;
  } else if (industrySector === 'services') {
   pointsPct = 30;
   vouchersPct = 45;
   eventsPct = 15;
   giftsPct = 10;
  }

  return [
   { name: 'Tích Lũy Điểm (Points System)', percentage: pointsPct, color: '#2f6cf5' },
   { name: 'Chiến Dịch Voucher Thúc Đẩy (Tactical)', percentage: vouchersPct, color: '#10b981' },
   { name: 'Sự Kiện Tri Ân & Private Lounge (VIP Events)', percentage: eventsPct, color: '#f59e0b' },
   { name: 'Quà Tặng Đặc Bản (Exclusive Gifts)', percentage: giftsPct, color: '#ec4899' }
  ];
 }, [industrySector]);

 const budgetSensitivityData = useMemo(() => {
  const ratios = [2, 4, 6, 8, 10, 12, 15];
  const baseRevenue = revenue || 10000000000;
  const baseGrossProfit = grossProfit || 4000000000;
  
  return ratios.map(r => {
   const budgetAmount = baseGrossProfit * (r / 100);
   
   // S-curve representing plateauing retention effect
   const retentionSimulated = 50 + (45 * (1 - Math.exp(-0.18 * r)));
   
   // Secondary revenue bump reaches diminishing returns
   const multiplier = industrySector === 'luxury' ? 1.55 : industrySector === 'retail' ? 1.05 : 1.25;
   const extraRevenueLift = baseRevenue * 0.082 * (1 - Math.exp(-0.21 * r)) * multiplier * (retentionTarget / 85);
   const extraProfitLift = extraRevenueLift * (baseGrossProfit / baseRevenue);
   const netBenefit = extraProfitLift - budgetAmount;
   const roi = budgetAmount > 0 ? (netBenefit / budgetAmount) * 100 : 0;

   return {
    ratio: `${r}%`,
    "Ngân quỹ trích lập": Math.round(budgetAmount / 1000000),
    "Doanh số bồi đắp": Math.round(extraRevenueLift / 1000000),
    "Lợi ích ròng": Math.round(netBenefit / 1000000),
    "Tỷ suất ROI (%)": Math.round(roi)
   };
  });
 }, [revenue, grossProfit, industrySector, retentionTarget]);

 const loyaltyVsRevenueChartData = useMemo(() => {
 const baseRevenue = revenue || 10000000000;
 const baseCogs = cogs || 6000000000;
 const ratio = loyaltyRatio || 5;

 const projections = [
 { name: "Mức tối thiểu", factor: 0.5 },
 { name: "Mức thấp", factor: 0.75 },
 { name: "Hiện tại", factor: 1.0 },
 { name: "Kỳ vọng thấp", factor: 1.25 },
 { name: "Kỳ vọng cao", factor: 1.5 },
 { name: "Mục tiêu tối đa", factor: 1.75 }
 ];

 return projections.map((p) => {
 const projRev = baseRevenue * p.factor;
 const projCogs = baseCogs * p.factor;
 const projGrossProfit = Math.max(0, projRev - projCogs);
 const projBudget = projGrossProfit * (ratio / 100);

 return {
 name: p.name,
 revenue: projRev,
 budget: projBudget,
 };
 });
 }, [revenue, cogs, loyaltyRatio]);

 const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
 setToastMessage(message);
 setToastType(type);
 setTimeout(() => {
 setToastMessage(null);
 }, 4000);
 };

 const formatVND = (value: number) => {
 return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
 };

 const formatMillionVND = (value: number) => {
 return `${(value / 1000000).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} Tr ₫`;
 };

 const formatBillionVND = (value: number) => {
 return `${(value / 1000000000).toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Tỷ ₫`;
 };

 const formatShortVND = (value: number) => {
  if (Math.abs(value) >= 1000000000) {
   return formatBillionVND(value);
  }
  return formatMillionVND(value);
 };

 const formatInputValue = (num: number | string) => {
 const val = Number(num);
 if (isNaN(val)) return '';
 return val.toLocaleString('vi-VN');
 };

 const handleNumericInputChange = (valueStr: string, setter: (val: number) => void) => {
 const cleanStr = valueStr.replace(/\./g, '').replace(/[^\d]/g, '');
 if (!cleanStr) {
 setter(0);
 return;
 }
 setter(parseInt(cleanStr, 10));
 };

 const handleAddNewVoucher = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newVoucher.name || !newVoucher.sent || !newVoucher.cost) {
 triggerToast('Vui lòng điền đầy đủ các trường thông tin voucher!', 'error');
 return;
 }
 const created = {
 id: `VCH-0${vouchers.length + 1}`,
 name: newVoucher.name,
 sent: Number(newVoucher.sent),
 used: Number(newVoucher.used || 0),
 revenue: Number(newVoucher.revenue || 0),
 cost: Number(newVoucher.cost),
 active: true
 };
 setVouchers([...vouchers, created]);
 setNewVoucher({ name: '', sent: '', used: '', revenue: '', cost: '' });
 triggerToast('Đã thêm chiến dịch Voucher thành công!');
 };

 const handleBookAppointment = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newBooking.customerName || !newBooking.date || !newBooking.time) {
 triggerToast('Vui lòng điền thông tin khách hàng, ngày và giờ đặt lịch!', 'error');
 return;
 }
 const bookingItem = {
 id: `BK-${Math.floor(100 + Math.random() * 900)}`,
 customerName: newBooking.customerName,
 type: newBooking.type,
 date: newBooking.date,
 time: newBooking.time,
 stylist: newBooking.stylist || 'Alexander Lam',
 status: 'Confirmed'
 };
 setBookings([bookingItem, ...bookings]);
 setNewBooking({ customerName: '', type: 'Showroom Private Viewing', date: '', time: '', stylist: '' });
 triggerToast('Đặt lịch Showroom Private thành công cho VIP!');
 };

 const callGeminiAIAdvisor = async () => {
 setAiLoading(true);
 setAiResponse(null);

 const client = customers.find(c => c.id === selectedAIVip) || customers[0];

 // Using Recommended Server-Side style simulation or call since the application is static client-side
 // This provides standard top-tier analysis responses.
 setTimeout(() => {
 setAiResponse({
 riskAnalysis: `Khách hàng ${client.name} có mức độ gắn kết tốt nhưng cần gia tăng trải nghiệm đặc quyền phi tài chính. Với điểm rủi ro là ${client.risk_score}%, trạng thái hoạt động chính là chìa khóa để triển khai nâng cấp nhóm đặc quyền của họ.`,
 marketingStrategy: `Đề xuất ưu đãi Private Gift Voucher trị giá 5.000.000 VND áp dụng duy nhất cho các tác phẩm chế tác giới hạn của BST ${client.collection}. Thiết lập chiến dịch với tỷ lệ ROI kỳ vọng đạt 450%.`,
 privateExperience: `Mời khách hàng tham gia buổi trà chiều thưởng lãm trang sức riêng tư (Private Showing) tại Showroom VIP Lounge. Bố trí Chuyên viên tạo phong cách riêng (Private Stylist) và chuẩn bị thức uống sở thích cùng các mẫu nhẫn kim cương thuộc Collection độc quyền.`,
 personalOffer: `Kính gửi Bà ${client.name},\n\nNhân dịp giới thiệu BST độc bản Heritage của Sevago, chúng tôi trân trọng kính mời Bà tham gia buổi thử nghiệm riêng tư được chuẩn bị đặc biệt dành riêng cho vị chủ nhân tinh hoa...\n\nTrân trọng,\nSevago Jewelry.`
 });
 setAiLoading(false);
 triggerToast('AI Advisor đã phân tích hành vi khách hàng hoàn tất!', 'success');
 }, 1200);
 };

 const filteredCustomers = useMemo(() => {
 return customers.filter(customer => {
 const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
 customer.phone.includes(searchQuery) || 
 customer.email.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesTier = selectedTierFilter === 'All' || customer.tier === selectedTierFilter;
 const matchesStatus = selectedStatusFilter === 'All' || customer.status === selectedStatusFilter;
 return matchesSearch && matchesTier && matchesStatus;
 });
 }, [customers, searchQuery, selectedTierFilter, selectedStatusFilter]);

 const totalMembers = customers.length;
 const activeMembersCount = customers.filter(c => c.status === 'Active').length;
 const activeRatio = ((activeMembersCount / totalMembers) * 100).toFixed(0);
 
 const totalCLV = customers.reduce((sum, c) => sum + c.clv, 0);
 const averageCLV = (totalCLV / totalMembers).toFixed(0);

 const averageRepeatRate = (customers.reduce((sum, c) => sum + c.repeat_rate, 0) / totalMembers).toFixed(0);
 const vipRetentionRate = 89; 

 const tierDistributionData = useMemo(() => {
 const counts = { Atelier: 0, Icon: 0, Essential: 0, Member: 0 };
 customers.forEach(c => {
 const tierKey = c.tier as keyof typeof counts;
 if (counts[tierKey] !== undefined) counts[tierKey]++;
 });
 return [
 { name: 'Atelier (≥150M)', value: counts.Atelier || 1, color: '#2f6cf5' },
 { name: 'Icon (≥50M)', value: counts.Icon || 1, color: '#1652f1' },
 { name: 'Essential (≥15M)', value: counts.Essential || 1, color: '#0e3ec5' },
 { name: 'Member (Mặc định)', value: counts.Member || 1, color: '#7E600F' }
 ];
 }, [customers]);

 const branchRevenueData = useMemo(() => {
 const branchMap: Record<string, number> = {};
 customers.forEach(c => {
 const region = c.region || 'Other';
 if (!branchMap[region]) branchMap[region] = 0;
 branchMap[region] += (c.clv || 0);
 });
 return Object.keys(branchMap).map(region => ({
 name: region,
 revenue: branchMap[region] / 1000000 // Convert to millions
 })).sort((a, b) => b.revenue - a.revenue);
 }, [customers]);

  const TABS_LIST_ANALYSIS = [
    { id: 'dashboard', name: 'Chọn mục cần phân tích', icon: Layers },
    { id: 'cross_branch', name: 'Hành vi đa chi nhánh', icon: Network },
    { id: 'shopping_behavior', name: 'Hành vi mua sắm', icon: ShoppingBag },
    { id: 'tier_point_analysis', name: 'Phân tích hạng & điểm', icon: Calculator },
    { id: 'aesthetic_segmentation', name: 'Phân khúc sắc đẹp', icon: Sparkles },
    { id: 'tier_projection', name: 'Tiến trình thăng hạng', icon: TrendingUp },
    { id: 'loyalty_cost', name: 'Chi phí Loyalty & Hiệu suất', icon: DollarSign },
    { id: 'clv_repeat', name: 'Giá trị vòng đời & Tái mua', icon: RefreshCw },
    { id: 'vip_crm', name: 'Chăm sóc khách VIP & Đặt lịch', icon: Briefcase },
    { id: 'ai_advisor', name: 'Cố vấn phân tích AI', icon: Zap },
    { id: 'offer_analysis', name: 'Phân tích & Tối ưu Ưu đãi', icon: Trophy },
    { id: 'rules', name: 'Quy tắc hệ thống', icon: Settings },
  ];

  const portalTarget = typeof document !== "undefined" ? document.getElementById("dashboard-upper-portal") : null;

  const bannerContent = (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card/45 border border-[#6366f1]/30 p-5 md:p-6 rounded-[10px] shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full mt-4 hover:shadow-md hover:border-[#6366f1]/50"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="p-3 bg-[#6366f1]/10 rounded-[10px] text-[#6366f1] flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
          <motion.div
            animate={{
              scale: [1, 1.15, 0.95, 1.05, 1],
              rotate: [0, 8, -8, 4, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 5.5,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-8 h-8 text-[#6366f1]" />
          </motion.div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground uppercase">
              Phân tích Hành vi & Hiệu quả Loyalty
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Chẩn đoán sức sống của tệp khách hàng VIP, đo lường chi phí Loyalty và tính toán ROI.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowDoc(!showDoc)}
          className={`px-4 py-2 rounded-[10px] text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            showDoc
              ? "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400"
              : "bg-card border-border hover:bg-muted text-muted-foreground"
          }`}
        >
          <BookOpen className={`w-4 h-4 ${showDoc ? 'text-amber-500' : 'text-muted-foreground'}`} />
          Tài liệu {TABS_LIST_ANALYSIS.find(t => t.id === activeTab)?.name || 'phân tích'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 space-y-6">
      {portalTarget ? createPortal(bannerContent, portalTarget) : bannerContent}

      <div className="pt-6 space-y-6">

 {/* Collapsible Document Panel for Analysis Tabs */}
 {showDoc && (() => {
  const docData = ANALYSIS_DOCS[activeTab] || ANALYSIS_DOCS.dashboard;
  const colors = docData.themeColor;
  return (
   <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`border rounded-[10px] p-6 space-y-6 overflow-hidden shadow-sm transition-all text-left ${colors.bg} ${colors.border}`}
   >
    <div className="flex items-start justify-between">
     <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-[10px] ${colors.iconBg}`}>
       <BookOpen className="w-5 h-5" />
      </div>
      <div className="text-left">
       <div className="flex items-center gap-2">
        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.iconBg}`}>
         {docData.badge}
        </span>
        <span className="text-[10px] text-muted-foreground">• Tài liệu Hướng dẫn phân tích</span>
       </div>
       <h3 className={`text-base font-bold mt-1 ${colors.text}`}>
        {docData.title}
       </h3>
       <p className="text-xs text-muted-foreground mt-0.5">
        {docData.subtitle}
       </p>
      </div>
     </div>
     <button
      onClick={() => setShowDoc(false)}
      className="p-1.5 hover:bg-muted/80 text-muted-foreground rounded-[10px] transition-colors cursor-pointer"
     >
      <X className="w-4 h-4" />
     </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
     {docData.metrics.map((m, idx) => (
      <div key={idx} className="bg-card/65 p-4 rounded-[10px] border border-border/10">
       <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">{m.label}</span>
       <strong className="text-xl font-bold font-heading mt-1 block text-foreground">{m.value}</strong>
       <span className="text-[10px] text-muted-foreground/80 leading-relaxed block mt-0.5">{m.desc}</span>
      </div>
     ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left border-t border-border/10 pt-5">
     <div>
      <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider mb-3">
       🔍 Các yếu tố cốt lõi phân tích
      </h4>
      <div className="space-y-2.5">
       {docData.details.map((d, idx) => (
        <div key={idx} className="p-3 bg-card/40 rounded-[10px] border border-border/10 text-xs">
         <span className="font-bold text-foreground block">{idx + 1}. {d.label}</span>
         <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">{d.desc}</p>
        </div>
       ))}
      </div>
     </div>

     <div className="space-y-4">
      <div className="p-4 bg-muted/40 rounded-[10px] border border-border/10">
       <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        Khuyến nghị chiến lược tiếp thị (AI advice)
       </h4>
       <ul className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
        {docData.advice.map((a, idx) => (
         <li key={idx} className="relative pl-3 text-left">
          <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-primary" />
          {a}
         </li>
        ))}
       </ul>
      </div>
      <div className="text-[10px] text-muted-foreground/80 italic pl-1 text-left">
       * Lưu ý: Tài liệu này được biên soạn tức thời dựa trên cấu hình hoạt động thực tế của tab <strong>{docData.badge}</strong>. Bất kỳ khi nào tối ưu chính sách, hệ thống thông tin sẽ tự động điều chỉnh.
      </div>
     </div>
    </div>
   </motion.div>
  );
 })()}

  {/* NEW SPLIT LAYOUT FOR THE ANALYSIS SECTION WITH GORGEOUS LOCAL LIST BOX SIDEBAR */}
  <div className="flex flex-col lg:flex-row gap-6 items-start">
    {/* LIST BOX SIDEBAR (Left on LG screens, full width horizontal tabs on mobile) */}
    <div className="w-full lg:w-[305px] shrink-0 bg-card border border-border/80 rounded-[12px] p-4.5 space-y-4 lg:sticky lg:top-24">
      <div className="hidden lg:flex items-center gap-3 pb-3.5 border-b border-border/50">
        <div className="p-2.5 bg-[#2f6cf5]/10 rounded-[8px] text-[#2f6cf5] shrink-0">
          <Layers className="w-5 h-5 animate-pulse" />
        </div>
        <div className="text-left">
          <span className="text-xs font-black uppercase tracking-wider text-foreground">Loại phân tích</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">Chọn góc nhìn số liệu</p>
        </div>
      </div>

      {/* Listbox Container - Vertical on LG, horizontal scrollable on mobile */}
      <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2.5 lg:pb-0 scrollbar-none snap-x whitespace-nowrap lg:whitespace-normal">
        {TABS_LIST_ANALYSIS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                toast.success(`Đã chọn: ${tab.name}`);
              }}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px] transition-all text-xs font-semibold cursor-pointer border shrink-0 snap-start select-none ${
                isActive
                  ? "bg-[#2f6cf5] border-[#2f6cf5] text-white shadow-sm font-bold"
                  : "bg-background border-border/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <tab.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
              <span className="truncate">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>

    {/* DETAILED CONTENT AREA (Right/Bottom) */}
    <div className="flex-grow w-full min-w-0 space-y-6">

 {/* Dynamic Toast Display */}
 {toastMessage && (
 <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-[10px] border backdrop-blur-2xl shadow-xl transition-all duration-300 bg-card border-[#2f6cf5]">
 <Award className="w-5 h-5 text-[#2f6cf5]" />
 <div className="text-xs font-bold text-foreground">{toastMessage}</div>
 </div>
 )}

 {/* NEW TAB: CROSS BRANCH ANALYSIS */}
 {activeTab === 'cross_branch' && (
 <div className="space-y-6">
 <CrossBranchAnalysis
 customers={customers}
 companies={companies}
 attributes={attributes}
 />
 </div>
 )}

 {/* NEW TAB: SHOPPING BEHAVIOR ANALYSIS */}
 {activeTab === 'shopping_behavior' && (
 <div className="space-y-6">
 <ShoppingBehaviorAnalysis />
 </div>
 )}

 {/* NEW TAB: TIER POINT ANALYSIS */}
 {activeTab === 'tier_point_analysis' && (
 <div className="space-y-6">
 <TierPointAnalysis />
 </div>
 )}

 {/* 1. NEW TAB: AESTHETIC SEGMENTATION */}
 {activeTab === 'aesthetic_segmentation' && (
  <div className="space-y-6">
   <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
   >
    <Card className="border border-border/50 bg-[#1e2330]/40 backdrop-blur-md shadow-lg overflow-hidden relative">
     <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-[#2f6cf5]/10 to-indigo-500/0 rounded-full blur-3xl pointer-events-none" />
     
     <CardHeader className="border-b border-border/40 pb-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
       <div className="text-left">
        <span className="text-[10px] font-bold text-[#2f6cf5] border border-[#2f6cf5]/30 bg-[#2f6cf5]/10 py-1 px-2.5 rounded-full uppercase tracking-widest inline-block mb-2">
         Dự đoán Hành Vi & Thẩm mỹ VIP (Aesthetic Intelligence)
        </span>
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
         <Sparkles className="w-5 h-5 text-[#2f6cf5] animate-pulse" /> Đề Xuất Sản Phẩm Trang Sức Theo Phân Khúc Thẩm Mỹ
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5 text-left">
         Tính toán tự động dựa trên các chỉ số hành vi, gu thời trang cá nhân và dữ liệu lưu vết sở thích chất liệu của khách hàng.
        </CardDescription>
       </div>
       
       <div className="flex items-center gap-2 self-start md:self-center">
        <span className="text-xs text-muted-foreground font-bold whitespace-nowrap">Phân khúc:</span>
        <select
         value={selectedSegment}
         onChange={(e) => setSelectedSegment(e.target.value)}
         className="bg-background border border-border/80 text-xs font-semibold rounded-[10px] px-3 py-1.5 focus:outline-none focus:border-[#2f6cf5] text-foreground transition-all shrink-0 cursor-pointer shadow-sm hover:border-primary/50"
        >
         <option value="classic">Cổ điển & Thanh lịch</option>
         <option value="minimalist">Tối giản & Tinh tế</option>
         <option value="glamorous">Sang trọng & Quý phái</option>
         <option value="avant-garde">Phá cách & Độc bản</option>
         <option value="romantic">Lãng mạn & Dịu dàng</option>
        </select>
       </div>
      </div>
     </CardHeader>

     <CardContent className="pt-6 text-left">
      {(() => {
       const prediction = SUGGESTIONS_MAP[selectedSegment];
       return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         <div className="space-y-4">
          <div className={`p-4 rounded-[10px] border bg-gradient-to-br ${prediction.color}`}>
           <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 block mb-1">Cảm Hứng Thần Thái (Vibe Theme)</span>
           <p className="text-sm font-extrabold tracking-wide">{prediction.vibe}</p>
          </div>
          
          <div className="space-y-1">
           <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Hồ Sơ Quy Mô Khách Hàng</span>
           <div className="bg-background/40 border border-border/40 p-4 rounded-[10px] flex items-center justify-between">
            <div>
             <span className="text-2xl font-black text-foreground">{matchingCustomersCount}</span>
             <span className="text-xs text-muted-foreground ml-1.5">thành viên</span>
            </div>
            <span className="text-[10px] bg-[#2f6cf5]/10 text-[#2f6cf5] border border-[#2f6cf5]/20 font-bold px-2 py-0.5 rounded-full">
             Tỉ lệ: {((matchingCustomersCount / (customers.length || 1284)) * 100).toFixed(1)}%
            </span>
           </div>
          </div>
         </div>

         <div className="lg:col-span-2 space-y-5">
          <div className="space-y-3">
           <h4 className="text-xs font-bold uppercase tracking-widest text-[#2f6cf5] flex items-center gap-2">
            <Gem className="w-4 h-4" /> Tuyển Tập Sản Phẩm Trọng Tâm Dự Báo (Predictive Curated List)
           </h4>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prediction.items.map((item, idx) => (
             <div key={idx} className="bg-background/30 border border-border/30 p-4 rounded-[10px] flex items-center justify-between group hover:bg-background/50 hover:border-[#2f6cf5]/30 transition-all cursor-default">
              <span className="text-xs font-bold text-foreground pr-4">{item}</span>
              <div className="p-1.5 bg-muted rounded-[10px] group-hover:bg-[#2f6cf5]/10 group-hover:text-[#2f6cf5] transition-colors">
               <TrendingUp className="w-3.5 h-3.5" />
              </div>
             </div>
            ))}
           </div>
          </div>

          <div className="p-5 rounded-[10px] bg-[#0f172a]/30 border border-border/30 flex flex-col md:flex-row gap-6">
           <div className="flex-1 space-y-2 text-left">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Phân Tích Thẩm Mỹ Cơ Bản (Aesthetic Insight)</span>
            <p className="text-xs text-foreground/90 leading-relaxed font-medium italic">"{prediction.insight}"</p>
           </div>
           <div className="md:w-48 shrink-0 flex flex-col gap-3">
            <div className="bg-background/40 p-3 rounded-[10px] border border-border/30">
             <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight block">Kỳ vọng Chuyển đổi</span>
             <span className="text-xl font-black text-emerald-500">{prediction.conversion}</span>
            </div>
            <div className="bg-background/40 p-3 rounded-[10px] border border-border/30">
             <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight block">Giá trị Doanh số Dự phỏng</span>
             <span className="text-lg font-black text-[#2f6cf5]">{prediction.projectedValue}</span>
            </div>
           </div>
          </div>
         </div>
        </div>
       );
      })()}
     </CardContent>
    </Card>
   </motion.div>
  </div>
 )}

 {/* 2. NEW TAB: TIER PROJECTION */}
 {activeTab === 'tier_projection' && (
  <div className="space-y-6 text-left">
   <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
   >
    <Card className="border border-border/50 bg-[#161a24]/35 backdrop-blur-md shadow-lg overflow-hidden relative text-left">
     <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
     <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
      <Trophy className="w-40 h-40 text-amber-500" />
     </div>

     <CardHeader className="border-b border-border/40 pb-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
       <div className="text-left">
        <span className="text-[10px] font-bold text-amber-500 border border-amber-500/30 bg-amber-500/10 py-1 px-2.5 rounded-full uppercase tracking-widest inline-block mb-2">
         CRM Velocity Engine (Aura Analytics)
        </span>
        <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
         <Zap className="w-5 h-5 text-amber-500 animate-pulse" /> Dự Phỏng Tiến Trình Thăng Hạng Thành Viên
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5 text-left">
         Chọn hội viên để khởi chạy dự báo tốc độ thăng hạng và các cột mốc đặc quyền tiếp theo dựa trên lịch sử hoạt động.
        </CardDescription>
       </div>

       <div className="flex items-center gap-2 self-start md:self-center">
        <span className="text-xs text-muted-foreground font-bold whitespace-nowrap">Hội viên:</span>
        <select
         value={progressionCustomerId}
         onChange={(e) => setProgressionCustomerId(e.target.value)}
         className="bg-background border border-border/80 text-xs font-semibold rounded-[10px] px-4 py-2 focus:outline-none focus:border-amber-500 text-foreground transition-all shrink-0 cursor-pointer shadow-sm hover:border-primary/50 min-w-[200px]"
        >
         {customers.map((c) => (
          <option key={c.id} value={c.id}>
           {c.name} ({c.tier || "Member"})
          </option>
         ))}
        </select>
       </div>
      </div>
     </CardHeader>

     <CardContent className="pt-6 text-left">
      {(() => {
       const selectedProgCustomer = customers.find((c) => c.id === progressionCustomerId);
       if (!selectedProgCustomer) {
        return (
         <div className="text-center py-8 text-xs text-muted-foreground">
          Vui lòng chọn hội viên để hiển thị tiến trình thăng hạng.
         </div>
        );
       }

       const activeTiers = tiers.length > 0 ? tiers : [
        { id: "member", name: "Member", threshold: 0, color: "#94a3b8", multiplier: 1, benefits: [] },
        { id: "essential", name: "Essential", threshold: 1000, color: "#38bdf8", multiplier: 1.5, benefits: [] },
        { id: "icon", name: "Icon", threshold: 5000, color: "#facc15", multiplier: 2.0, benefits: [] },
        { id: "atelier", name: "Atelier", threshold: 20000, color: "#2f6cf5", multiplier: 3.0, benefits: [] }
       ];

       const sortedTiers = [...activeTiers].sort((a, b) => a.threshold - b.threshold);
       const currentPoints = selectedProgCustomer.points || 0;
       
       const currentTierObj = sortedTiers.slice().reverse().find(t => currentPoints >= t.threshold) || sortedTiers[0];
       const nextTierObj = sortedTiers.find(t => t.threshold > currentPoints);
       
       const pointsNeeded = nextTierObj ? nextTierObj.threshold - currentPoints : 0;
       
       const currentTierThreshold = currentTierObj ? currentTierObj.threshold : 0;
       const nextTierThreshold = nextTierObj ? nextTierObj.threshold : 0;
       const segmentTotal = nextTierThreshold - currentTierThreshold;
       const segmentProgress = currentPoints - currentTierThreshold;
       const percent = segmentTotal > 0 
        ? Math.min(100, Math.max(0, (segmentProgress / segmentTotal) * 100)) 
        : 100;

       const createdAtTime = selectedProgCustomer.createdAt;
       let daysActive = 180;
       if (createdAtTime) {
        try {
         const createdDate = typeof (createdAtTime as any).toDate === 'function' 
          ? (createdAtTime as any).toDate() 
          : new Date(createdAtTime as any);
         daysActive = Math.max(15, (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        } catch (e) {
         daysActive = 180;
        }
       }
       
       let pointsDailyRate = currentPoints / daysActive;
       if (pointsDailyRate <= 0.1) {
        const fallbacks: Record<string, number> = {
         Atelier: 250,
         Icon: 80,
         Essential: 15,
         Member: 5
        };
        pointsDailyRate = fallbacks[selectedProgCustomer.tier || "Member"] || 5;
       }

       const pointsMonthlyRate = pointsDailyRate * 30;
       const daysToLevelUp = pointsDailyRate > 0 ? (pointsNeeded / pointsDailyRate) : 0;
       const monthsToLevelUp = pointsMonthlyRate > 0 ? (pointsNeeded / pointsMonthlyRate) : 0;
       
       const predictionDateStr = (() => {
        const estDate = new Date(Date.now() + daysToLevelUp * 24 * 60 * 60 * 1000);
        return estDate.toLocaleDateString("vi-VN", { year: 'numeric', month: 'long', day: 'numeric' });
       })();

       return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
         <div className="space-y-5 text-left">
          <div className="flex items-center justify-between">
           <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Tiến Trình Chặng Hiện Tại</span>
           <div 
            className="px-2.5 py-1 text-xs text-white rounded font-bold"
            style={{ backgroundColor: currentTierObj?.color || "#94a3b8" }}
           >
            {currentTierObj?.name || "Member"}
           </div>
          </div>

          <div className="space-y-2 text-left">
           <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden relative border border-slate-700/50">
            <motion.div
             initial={{ width: 0 }}
             animate={{ width: `${percent}%` }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            />
           </div>
           
           <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span>{currentPoints.toLocaleString()} pts (Hiện tại)</span>
            {nextTierObj ? (
             <span>{nextTierObj.threshold.toLocaleString()} pts ({nextTierObj.name})</span>
            ) : (
             <span>Đạt cấp cao nhất (Atelier)</span>
            )}
           </div>
          </div>

          <div className="p-4 rounded-[10px] bg-slate-900/50 border border-border/30 text-left">
           {nextTierObj ? (
            <>
             <p className="text-xs text-slate-300">
              Thành viên cần tích thêm <span className="text-amber-500 font-extrabold text-sm">{pointsNeeded.toLocaleString()}</span> điểm (pts) nữa để thăng hạng <span className="font-bold text-white" style={{ color: nextTierObj.color }}>{nextTierObj.name}</span>.
             </p>
             <div className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Tiến độ chặng này đã đạt {percent.toFixed(1)}% hoàn thành
             </div>
            </>
           ) : (
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
             <CheckCircle2 className="w-5 h-5" /> Hội viên đã đạt phân thứ cao nhất (Atelier). Đang hưởng các độc quyền thượng lưu bậc nhất Việt Nam.
            </div>
           )}
          </div>
         </div>

         <div className="space-y-5 flex flex-col justify-between text-left">
          <div className="space-y-4">
           <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block text-left">Dự Báo Thăng Cấp (Aura Analytics)</span>
           
           {nextTierObj ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-background/40 p-3.5 rounded-[10px] border border-border/40 text-left">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">Tốc Độ Tích Lũy</span>
              <h5 className="text-sm font-extrabold text-white flex items-center gap-1">
               <TrendingUp className="w-4 h-4 text-[#2f6cf5]" /> ~{Math.round(pointsMonthlyRate).toLocaleString()} pts/tháng
              </h5>
              <p className="text-[10px] text-muted-foreground mt-0.5">Dựa theo tần suất giao dịch thực tế.</p>
             </div>

             <div className="bg-background/40 p-3.5 rounded-[10px] border border-border/40 text-left">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1 text-left">Thời Gian Thăng Hạng Dự Kiến</span>
              <h5 className="text-sm font-extrabold text-amber-400 font-heading">
               ~{monthsToLevelUp < 1 ? `${Math.round(daysToLevelUp)} ngày` : `${monthsToLevelUp.toFixed(1)} tháng`}
              </h5>
              <p className="text-[10px] text-muted-foreground mt-0.5">Dự kiến đạt vào: {predictionDateStr}</p>
             </div>
            </div>
           ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-[10px] text-xs text-emerald-400 text-left font-medium">
             Giao dịch liên tục để duy trì thời hạn Atelier vĩnh cửu. Hệ số tích lũy nhân điểm độc quyền là x3.0.
            </div>
           )}
          </div>

          {nextTierObj && nextTierObj.benefits && nextTierObj.benefits.length > 0 && (
           <div className="pt-3 border-t border-border/40 text-xs text-left">
            <span className="font-extrabold text-slate-300 block mb-2 uppercase tracking-wide">Quyền lợi đặc tuyển đang chờ đón:</span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground font-medium text-left">
             {nextTierObj.benefits.map((b: any, idx: number) => (
              <li key={idx} className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
               <span className="truncate">{b.name}</span>
              </li>
             ))}
            </ul>
           </div>
          )}
         </div>
        </div>
       );
      })()}
     </CardContent>
    </Card>
   </motion.div>
  </div>
 )}

 {/* 1. TAB: DASHBOARD */}
 {activeTab === 'dashboard' && (
 <div className="space-y-6">

 {/* Primary Cards Grid */}
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
 {[
 { label: 'Tổng Khách Hàng VIP', value: totalMembers, sub: `Active ratio: ${activeRatio}%`, icon: Users },
 { label: 'Repeat Purchase Rate', value: `${averageRepeatRate}%`, sub: 'Target: ≥30%', icon: Percent },
 { label: 'VIP Retention Rate', value: `${vipRetentionRate}%`, sub: 'Atelier đóng góp 43%', icon: Award },
 { label: 'Giá Trị Lũy Kế CLV TB', value: formatMillionVND(Number(averageCLV)), sub: `Cao nhất: ${formatMillionVND(310000000)}`, icon: DollarSign },
 { label: 'Tỷ Lệ Hoàn Vốn ROI', value: `${calculatedROI.toFixed(0)}%`, sub: 'Doanh số bồi đắp', icon: TrendingUp },
 ].map((card, i) => (
 <div key={i} className="bg-card border border-border/50 rounded-[10px] p-5 relative overflow-hidden flex flex-col justify-between">
 <div>
 <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">{card.label}</span>
 <span className="text-2xl font-bold tracking-tight text-foreground block mt-2">{card.value}</span>
 </div>
 <div className="text-xs text-[#2f6cf5] mt-3 font-medium border-t border-border/30 pt-2">{card.sub}</div>
 </div>
 ))}
 </div>

 {/* Main charts section */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 <div className="bg-card border border-border/50 rounded-[10px] p-6 lg:col-span-2 space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-border/40">
 <div>
 <h3 className="text-sm font-bold text-foreground">XU HƯỚNG TĂNG TRƯỞNG CLV VS CHI PHÍ LOYALTY</h3>
 <p className="text-xs text-muted-foreground">Mối tương quan giữa doanh thu bồi đắp từ khách hàng VIP và chi phí Loyalty.</p>
 </div>
 </div>

 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart
 data={[
 { month: 'T1/2026', loyaltyCost: 45, clvIncrease: 180 },
 { month: 'T2/2026', loyaltyCost: 65, clvIncrease: 260 },
 { month: 'T3/2026', loyaltyCost: 75, clvIncrease: 310 },
 { month: 'T4/2026', loyaltyCost: 90, clvIncrease: 420 },
 { month: 'T5/2026', loyaltyCost: (actualCost / 1000000).toFixed(0), clvIncrease: (clvIncrease / 1000000).toFixed(0) },
 ]}
 margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
 >
 <defs>
 <linearGradient id="colorClv" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#2f6cf5" stopOpacity={0.25}/>
 <stop offset="95%" stopColor="#2f6cf5" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
 <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid stroke="rgba(120, 120, 120, 0.1)" strokeDasharray="3 3" />
 <XAxis dataKey="month" stroke="#71717A" fontSize={10} />
 <YAxis stroke="#71717A" fontSize={10} unit="M" />
 <Tooltip contentStyle={{ backgroundColor: 'rgba(20, 20, 22, 0.85)', backdropFilter: 'blur(16px)', color: '#fff', fontSize: '11px', borderRadius: '12px' }} />
 <Area type="monotone" dataKey="clvIncrease" stroke="#2f6cf5" strokeWidth={2} fillOpacity={1} fill="url(#colorClv)" name="CLV tăng thêm (Tr ₫)" />
 <Area type="monotone" dataKey="loyaltyCost" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" name="Chi phí Loyalty (Tr ₫)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-card border border-border/50 rounded-[10px] p-6 space-y-4">
 <div>
 <h3 className="text-sm font-bold text-foreground">PHÂN BỔ THEO HẠNG VIP (TIERS)</h3>
 <p className="text-xs text-muted-foreground">Tỷ lệ hội viên phân bổ theo các cấp bậc thiết kế.</p>
 </div>

 <div className="h-44 relative flex items-center justify-center">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={tierDistributionData}
 cx="50%"
 cy="50%"
 innerRadius={45}
 outerRadius={65}
 paddingAngle={5}
 dataKey="value"
 >
 {tierDistributionData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip />
 </PieChart>
 </ResponsiveContainer>
 <div className="absolute text-center flex flex-col">
 <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Tổng VIP</span>
 <span className="text-lg font-bold text-[#2f6cf5]">{totalMembers}</span>
 </div>
 </div>

  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
  {tierDistributionData.map((tier, idx) => (
  <div key={idx} className="flex items-center gap-1.5 text-xs">
  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: tier.color }}></span>
  <span className="text-muted-foreground font-medium">{tier.name}: <strong className="text-foreground">{tier.value}</strong></span>
  </div>
  ))}
  </div>
  </div>

  <div className="bg-card border border-border/50 rounded-[10px] p-6 lg:col-span-3 space-y-4">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-border/40">
  <div>
  <h3 className="text-sm font-bold text-foreground uppercase">TỔNG DOANH THU THEO CHI NHÁNH</h3>
  <p className="text-xs text-muted-foreground">So sánh hiệu quả hoạt động và định danh chi nhánh đóng góp tốt nhất (Đơn vị: Triệu VNĐ).</p>
  </div>
  </div>
  
  <div className="h-64 mt-2">
  <ResponsiveContainer width="100%" height="100%">
  <BarChart
  data={branchRevenueData}
  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
  >
  <defs>
  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="#2f6cf5" stopOpacity={0.8}/>
  <stop offset="95%" stopColor="#2f6cf5" stopOpacity={0.4}/>
  </linearGradient>
  </defs>
  <CartesianGrid stroke="rgba(120, 120, 120, 0.1)" strokeDasharray="3 3" vertical={false} />
  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickMargin={10} />
  <YAxis stroke="#71717A" fontSize={11} unit="M" />
  <Tooltip 
    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
    contentStyle={{ backgroundColor: 'rgba(20, 20, 22, 0.85)', backdropFilter: 'blur(16px)', color: '#fff', fontSize: '11px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} 
    formatter={(value: number) => [`${value.toLocaleString('vi-VN')} Tr ₫`, 'Doanh Thu']}
  />
  <Bar dataKey="revenue" fill="url(#colorRevenue)" name="Doanh thu (Tr ₫)" radius={[6, 6, 0, 0]} maxBarSize={60}>
    {branchRevenueData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={index === 0 ? '#2f6cf5' : 'rgba(47, 108, 245, 0.5)'} />
    ))}
  </Bar>
  </BarChart>
  </ResponsiveContainer>
  </div>
  </div>

  </div>

  {/* POS API AND REAL-TIME ACCRUAL SIMULATOR */}
  <div className="bg-card border border-border/50 rounded-[10px] p-6 space-y-6 mt-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-border/40">
      <div>
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#2f6cf5]" />
          BẢNG ĐIỀU KHIỂN GIẢ LẬP NHẬP HÓA ĐƠN POS (API WEBHOOK)
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 font-sans">
          Giả lập thiết bị bán hàng tại Showroom truyền payload kết toán giao dịch về API Loyalty để tự động tích điểm theo thời gian thực.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-bold text-emerald-500 font-mono uppercase">API Gateway: Online</span>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Simulation form controls */}
      <div className="lg:col-span-5 space-y-4 text-left">
        <h4 className="text-xs font-bold text-[#2f6cf5] uppercase tracking-wider">Thông S Có Giao Dịch POS</h4>
        
        <div className="space-y-4">
          {/* Invoice ID */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 flex justify-between items-center">
              <span>Mã Hóa Đơn POS</span>
              <button 
                type="button"
                onClick={() => setSimInvoiceId(`POS-${Math.floor(100000 + Math.random() * 900000)}`)}
                className="text-[10px] text-[#2f6cf5] font-bold hover:underline py-0 cursor-pointer"
              >
                Tạo mã ngẫu nhiên
              </button>
            </label>
            <input 
              type="text" 
              value={simInvoiceId}
              onChange={(e) => setSimInvoiceId(e.target.value)}
              className="w-full bg-muted/50 border border-border/60 hover:border-primary/20 focus:border-primary rounded-[10px] px-3 py-2 text-xs font-mono text-foreground focus:outline-none transition-all"
              placeholder="e.g. POS-INV-10928"
            />
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5">Hội viên thụ hưởng (VIP Member)</label>
            <select
              value={simCustomerId}
              onChange={(e) => setSimCustomerId(e.target.value)}
              className="w-full bg-muted/50 border border-border/60 hover:border-primary/20 focus:border-primary rounded-[10px] px-3 py-2 text-xs text-zinc-300 focus:outline-none transition-all cursor-pointer font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-card">
                  {c.name} ({c.id}) — {c.points?.toLocaleString() || 0} pts [{c.tier}]
                </option>
              ))}
            </select>
          </div>

          {/* Amount and preset buttons */}
          <div>
            <label className="block text-xs font-zinc-400 uppercase mb-1.5 flex justify-between">
              <span>Giá trị đơn hàng (VND)</span>
              <span className="text-[#2f6cf5] font-mono font-bold text-xs">
                {formatVND(simAmount)}
              </span>
            </label>
            <input 
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full bg-muted/50 border border-border/60 hover:border-primary/20 focus:border-primary rounded-[10px] px-3 py-2 text-xs font-mono text-foreground focus:outline-none transition-all"
              placeholder="Nhập số tiền..."
            />
            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[5000000, 15000000, 50000000, 150000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSimAmount(val)}
                  className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold border transition-all ${
                    simAmount === val 
                      ? 'bg-[#2f6cf5]/15 border-[#2f6cf5] text-[#2f6cf5]' 
                      : 'bg-muted/30 border-border/50 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {formatMillionVND(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Accrued calculation read-only indicator */}
          <div className="bg-muted/30 border border-border/40 p-3 rounded-[10px] flex items-center justify-between">
            <div className="text-left font-sans">
              <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Điểm tích lũy dự kiến (Loyalty Points)</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Tỷ lệ: {formatMillionVND(rules.pointEarningRate)} = 1 điểm</div>
            </div>
            <div className="text-right">
              <span className="text-base font-mono font-black text-emerald-500">
                +{Math.floor(simAmount / (rules.pointEarningRate || 1000000))} pts
              </span>
            </div>
          </div>

          {/* CTA Simulate Webhook Trigger */}
          <button
            type="button"
            onClick={handleSimulatePOSInvoice}
            disabled={simLoading}
            className={`w-full relative overflow-hidden flex items-center justify-center gap-2 rounded-[10px] py-3 text-xs font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer text-white font-sans bg-[#2f6cf5] hover:bg-[#2f6cf5]/90 hover:shadow-lg active:scale-[0.98]`}
          >
            {simLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang truyền dữ liệu API...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Gửi mã từ POS (Simulate Webhook)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal and payload stream log */}
      <div className="lg:col-span-7 flex flex-col h-full min-h-[320px] bg-[#121214] border border-zinc-800 rounded-[10px] overflow-hidden shadow-2xl relative text-left">
        {/* Terminal Header */}
        <div className="bg-[#18181b] border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0 font-sans">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
            </div>
            <span className="text-zinc-500 text-[10px] font-mono leading-none ml-2">Console API Telemetry & Payload Streams</span>
          </div>
          <button 
            type="button"
            onClick={() => setSimLogs([{ time: new Date().toLocaleTimeString(), type: 'info', text: 'Telemetry logs cleared. Listening for API calls...' }])}
            className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 font-bold font-mono transition-colors cursor-pointer"
          >
            Clear logs
          </button>
        </div>

        {/* Scrollable logs area with monospace */}
        <div className="p-4 font-mono text-[11px] space-y-2 overflow-y-auto max-h-[320px] text-zinc-300 antialiased min-h-[220px]">
          {simLogs.map((log, index) => (
            <div key={index} className="leading-relaxed flex items-start gap-2">
              <span className="text-zinc-600 select-none shrink-0 border-r border-zinc-800 pr-1">{log.time}</span>
              <span className={`break-all ${
                log.type === 'success' ? 'text-emerald-400 font-medium' :
                log.type === 'error' ? 'text-red-400 font-medium' :
                log.type === 'warning' ? 'text-amber-400 font-medium' : 'text-sky-400'
              }`}>
                {log.text}
              </span>
            </div>
          ))}
          {simLoading && (
            <div className="flex items-center gap-2 mt-2 select-none animate-pulse text-[#2f6cf5]">
              <span className="w-1.5 h-3 bg-[#2f6cf5] inline-block animate-[bounce_1.2s_infinite]"></span>
              <span>📡 WAITING FOR WEBHOOK ACKNOWLEDGEMENT (HTTP 100 CONTINUE)...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

  </div>
  )}

{/* 2. TAB: LOYALTY COST & ROI */}
 {activeTab === 'loyalty_cost' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Form controls */}
 <div className="bg-sidebar border border-border/50 rounded-[10px] p-6 space-y-4">
 <h3 className="text-xs font-bold text-[#2f6cf5] uppercase tracking-widest border-b pb-2 border-border/40">THAM SỐ TÀI CHÍNH ĐẦU VÀO</h3>
 
 <div className="space-y-3">
 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Doanh thu giả định (₫)</label>
 <input 
 type="text" 
 inputMode="numeric"
 value={formatInputValue(revenue)} 
 onChange={(e) => handleNumericInputChange(e.target.value, setRevenue)} 
 className="w-full p-2 text-xs rounded-[10px] bg-muted border focus:ring-2 focus:ring-primary/20 outline-none font-semibold text-foreground" 
 />
 <span className="text-xs text-[#2f6cf5] font-semibold mt-1 block">≈ {formatBillionVND(revenue)}</span>
 </div>

 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Giá vốn hàng bán - COGS (₫)</label>
 <input 
 type="text" 
 inputMode="numeric"
 value={formatInputValue(cogs)} 
 onChange={(e) => handleNumericInputChange(e.target.value, setCogs)} 
 className="w-full p-2 text-xs rounded-[10px] bg-background border focus:ring-2 focus:ring-primary/20 outline-none font-semibold text-foreground" 
 />
 <span className="text-xs text-muted-foreground mt-1 block">Tỷ suất gộp: {((grossProfit / revenue) * 100).toFixed(0)}%</span>
 </div>

 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-0.5">Tỷ lệ ngân sách (% Lợi nhuận gộp)</label>
 <div className="flex items-center gap-3">
 <input 
 type="range" 
 min="1" 
 max="20" 
 value={loyaltyRatio} 
 onChange={(e) => setLoyaltyRatio(Number(e.target.value))} 
 className="w-full accent-[#2f6cf5]" 
 />
 <span className="text-xs font-bold text-[#2f6cf5]">{loyaltyRatio}%</span>
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Trần ngân sách hàng quý (₫)</label>
 <input 
 type="text" 
 inputMode="numeric"
 value={formatInputValue(quarterlyBudgetCeiling)} 
 onChange={(e) => handleNumericInputChange(e.target.value, setQuarterlyBudgetCeiling)} 
 className="w-full p-2 text-xs rounded-[10px] bg-background border focus:ring-2 focus:ring-primary/20 outline-none font-semibold text-foreground" 
 />
 <span className="text-xs text-muted-foreground mt-1 block">Hạn mức kiểm soát dự báo: {formatMillionVND(quarterlyBudgetCeiling)}</span>
 </div>

 <div className="border-t border-border/40 pt-3 space-y-2">
 <span className="text-xs font-bold text-[#2f6cf5] uppercase block tracking-wider">Bố trí Quỹ Chi phí VIP</span>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <span className="text-xs text-muted-foreground block">Voucher Cost</span>
 <input type="text" inputMode="numeric" value={formatInputValue(voucherCost)} onChange={e => handleNumericInputChange(e.target.value, setVoucherCost)} className="w-full p-1.5 text-xs bg-background border rounded-[10px] font-semibold text-foreground" />
 </div>
 <div>
 <span className="text-xs text-muted-foreground block">Point Rewards</span>
 <input type="text" inputMode="numeric" value={formatInputValue(pointCost)} onChange={e => handleNumericInputChange(e.target.value, setPointCost)} className="w-full p-1.5 text-xs bg-background border rounded-[10px] font-semibold text-foreground" />
 </div>
 <div>
 <span className="text-xs text-muted-foreground block">Private Events</span>
 <input type="text" inputMode="numeric" value={formatInputValue(eventCost)} onChange={e => handleNumericInputChange(e.target.value, setEventCost)} className="w-full p-1.5 text-xs bg-background border rounded-[10px] font-semibold text-foreground" />
 </div>
 <div>
 <span className="text-xs text-muted-foreground block">High-end Gift</span>
 <input type="text" inputMode="numeric" value={formatInputValue(giftCost)} onChange={e => handleNumericInputChange(e.target.value, setGiftCost)} className="w-full p-1.5 text-xs bg-background border rounded-[10px] font-semibold text-foreground" />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Simulated Outputs & Interactive ROI Analysis */}
 <div className="lg:col-span-2 space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-sidebar border border-border/50 rounded-[10px] p-5 flex flex-col justify-between">
 <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block text-left">Ngân sách Loyalty cho phép</span>
 <div className="p-2 bg-[#2f6cf5]/10 text-[#2f6cf5] rounded-[10px] shrink-0 mt-2 self-start">
  <DollarSign className="w-4 h-4" />
 </div>
 <h3 className="text-2xl font-black text-[#2f6cf5] tracking-tight mt-3 text-left">{formatMillionVND(loyaltyBudget)}</h3>
 <div className="text-[11px] text-muted-foreground mt-4 pt-2.5 border-t border-border/40 flex items-center justify-between">
  <span>Cơ chế trích quỹ:</span>
  <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-[10px] border text-[10px]">Lợi nhuận gộp x {loyaltyRatio}%</span>
 </div>
 </div>
 <div className="bg-sidebar border border-border/50 rounded-[10px] p-5 flex flex-col justify-between">
 <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block text-left">Chi phí thực tế phân bổ</span>
 <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-[10px] shrink-0 mt-2 self-start">
  <Layers className="w-4 h-4 text-amber-500" />
 </div>
 <h3 className="text-2xl font-black text-[#2f6cf5] tracking-tight mt-3 text-left">{formatMillionVND(actualCost)}</h3>
 <div className="text-[11px] text-muted-foreground mt-4 pt-2.5 border-t border-border/40 flex items-center justify-between">
  <span>Cấu trúc phân phối:</span>
  <span className="font-semibold text-foreground italic text-[10px]">Voucher, điểm, quà tặng & event</span>
 </div>
 </div>
 <div className="bg-sidebar border border-border/50 rounded-[10px] p-5 flex flex-col justify-between">
 <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block text-left">Hạn mức ngân sách thặng dư</span>
<div className={`p-2 rounded-[10px] shrink-0 mt-2 self-start w-fit ${remainingBudget >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
 {remainingBudget >= 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
</div>
 <h3 className={`text-3xl font-extrabold mt-1 ${remainingBudget >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
 {formatMillionVND(remainingBudget)}
 </h3>
 <div className="text-[11px] text-muted-foreground mt-4 pt-2.5 border-t border-border/40 flex items-center justify-between">
 <span>Trạng thái dòng ngân quỹ:</span>
 <span className={`px-2 py-0.5 rounded-[10px] border font-bold text-[9px] ${remainingBudget >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"}`}>
  {remainingBudget >= 0 ? "Thặng dư an toàn" : "Nguy cơ vượt hạn mức"}
 </span>
</div>
 </div>
 <div className="bg-sidebar border border-border/50 rounded-[10px] p-5 flex flex-col justify-between">
 <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block text-left">Tỷ lệ Chi phí / Doanh thu</span>
<div className={`p-2 rounded-[10px] shrink-0 mt-2 self-start w-fit ${costRatioOfRevenue < 5 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
 <Percent className="w-4 h-4" />
</div>
 <h3 className="text-3xl font-extrabold text-foreground mt-1">{costRatioOfRevenue.toFixed(2)}%</h3>
 <div className="text-[11px] text-muted-foreground mt-4 pt-2.5 border-t border-border/40 flex items-center justify-between">
 <span>Hiệu số chi tiêu (Target &lt; 5%):</span>
 <span className={`px-2 py-0.5 rounded-[10px] border font-bold text-[9px] ${costRatioOfRevenue < 5 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"}`}>
  {costRatioOfRevenue < 5 ? "Đạt chỉ số vàng" : "Cần kiểm soát"}
 </span>
</div>
 </div>

 {/* Conditional budget utilization card */}
 <div className={`md:col-span-2 border rounded-[10px] p-5 flex flex-col justify-between transition-all duration-300 ${actualCost > quarterlyBudgetCeiling ? 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/40 text-rose-950 dark:text-rose-100' : 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-950 dark:text-emerald-100'}`}>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <span className="text-xs uppercase font-bold text-muted-foreground block">Chỉ báo sử dụng trần ngân sách hàng quý</span>
 <h3 className={`text-2xl font-black mt-1 ${actualCost > quarterlyBudgetCeiling ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
 {((actualCost / quarterlyBudgetCeiling) * 100).toFixed(1)}% Sử dụng
 </h3>
 </div>
 <div>
 {actualCost > quarterlyBudgetCeiling ? (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
 <AlertTriangle className="w-3.5 h-3.5" /> Vượt trần ngân sách Quý!
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
 <CheckCircle className="w-3.5 h-3.5" /> Trong hạn mức an toàn
 </span>
 )}
 </div>
 </div>

 <div className="mt-4">
 <div className="w-full bg-muted-foreground/25 rounded-full h-2.5 overflow-hidden border border-border/20">
 <div 
 className={`h-full rounded-full transition-all duration-500 ${actualCost > quarterlyBudgetCeiling ? 'bg-rose-500' : 'bg-emerald-500'}`}
 style={{ width: `${Math.min((actualCost / quarterlyBudgetCeiling) * 100, 100)}%` }}
 ></div>
 </div>
 <div className="flex justify-between text-xs mt-2 text-muted-foreground font-semibold">
 <span>Đã phân bổ: {formatVND(actualCost)}</span>
 <span>Trần giới hạn hàng quý (Ceiling): {formatVND(quarterlyBudgetCeiling)}</span>
 </div>
 </div>
 </div>
 </div>

 {/* ROI specific box */}
 <div className="bg-sidebar border border-[#2f6cf5]/30 rounded-[10px] p-6 space-y-4">
 <div>
 <h4 className="text-xs font-bold text-[#2f6cf5] uppercase tracking-widest">LOYALTY ROI - SỨC MẠNH BIÊN LỢI NHUẬN</h4>
 <p className="text-xs text-muted-foreground mt-0.5">Tính toán tỷ suất hoàn vốn dựa trên doanh số CLV bồi đắp thêm từ các chiến dịch VIP.</p>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
 <div>
 <label className="block text-xs text-muted-foreground font-bold uppercase mb-1">Doanh số CLV tăng thêm khi chăm sóc (₫)</label>
 <input 
 type="text" 
 inputMode="numeric"
 value={formatInputValue(clvIncrease)} 
 onChange={e => handleNumericInputChange(e.target.value, setClvIncrease)} 
 className="w-full p-2 text-xs rounded-[10px] bg-background border font-semibold text-foreground" 
 />
 </div>
 <div className="text-center bg-muted/40 p-4 rounded-[10px] border border-border/35">
 <span className="text-xs text-muted-foreground uppercase font-bold block">Tỷ Lệ ROI Ước Tính</span>
 <span className="text-4xl font-extrabold text-[#2f6cf5] tracking-tight">{calculatedROI.toFixed(0)}%</span>
 </div>
 </div>
 </div>

 {/* Doanh thu gộp vs Ngân sách Loyalty Chart */}
 <div className="bg-card border border-border/50 rounded-[10px] p-6 space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-border/40">
 <div>
 <h3 className="text-sm font-bold text-foreground">XU HƯỚNG TƯƠNG QUAN: DOANH THU VS NGÂN SÁCH LOYALTY</h3>
 <p className="text-xs text-muted-foreground mt-0.5">Mô phỏng sự thay đổi tuyến tính của ngân sách Loyalty theo các mức doanh thu gộp dự phòng.</p>
 </div>
 </div>

 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={loyaltyVsRevenueChartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
 <defs>
 <linearGradient id="colorRevenueProj" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorBudgetProj" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#2f6cf5" stopOpacity={0.25}/>
 <stop offset="95%" stopColor="#2f6cf5" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.1)" />
 <XAxis dataKey="name" stroke="#71717A" fontSize={10} tickLine={false} />
 <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} tickFormatter={(v) => formatBillionVND(v)} tickLine={false} axisLine={false} />
 <YAxis yAxisId="right" orientation="right" stroke="#2f6cf5" fontSize={10} tickFormatter={(v) => formatMillionVND(v)} tickLine={false} axisLine={false} />
 <Tooltip 
 contentStyle={{ 
 backgroundColor: 'rgba(20, 20, 22, 0.85)', 
 backdropFilter: 'blur(16px)', 
 color: '#fff', 
 fontSize: '11px', 
 borderRadius: '12px',
 border: '1px solid rgba(255, 255, 255, 0.1)' 
 }}
 formatter={(value: any, name: any) => [formatVND(Number(value)), name]}
 />
 <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenueProj)" name="Doanh thu gộp" />
 <Area yAxisId="right" type="monotone" dataKey="budget" stroke="#2f6cf5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBudgetProj)" name="Ngân sách Loyalty" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 </div>

 {/* Table of voucher campaigns */}
 <div className="bg-card border border-border/50 rounded-[10px] p-6 space-y-4">
 <h3 className="text-sm font-bold text-foreground">HIỆU QUẢ CÁC CHIẾN DỊCH VOUCHER</h3>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b text-muted-foreground text-xs uppercase font-bold">
 <th className="pb-2">Chiến dịch</th>
 <th className="pb-2 text-center">Đã phát</th>
 <th className="pb-2 text-center">Đã dùng</th>
 <th className="pb-2 text-center">Tỷ lệ chuyển đổi</th>
 <th className="pb-2 text-right">Chi phí</th>
 <th className="pb-2 text-right">Doanh thu tạo ra</th>
 <th className="pb-2 text-center">ROI chi tiết</th>
 </tr>
 </thead>
 <tbody className="divide-y border-b">
 {vouchers.map((v, i) => {
 const rate = ((v.used / v.sent) * 100).toFixed(0);
 const roi = v.cost > 0 ? (((v.revenue - v.cost) / v.cost) * 100).toFixed(0) : 0;
 return (
 <tr key={i} className="hover:bg-muted/30">
 <td className="py-3 font-semibold">{v.name}</td>
 <td className="py-3 text-center">{v.sent}</td>
 <td className="py-3 text-center">{v.used}</td>
 <td className="py-3 text-center">
 <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">{rate}%</span>
 </td>
 <td className="py-3 text-right">{formatMillionVND(v.cost)}</td>
 <td className="py-3 text-right">{formatMillionVND(v.revenue)}</td>
 <td className="py-3 text-center text-emerald-500 font-bold">{roi}%</td>
 </tr>
 );
 })}
 </tbody>
  </table>
  </div>
  </div>

  {/* NEW DYNAMIC OPTIMIZER SECTION FOR '% GIÀNH RA' */}
  <div className="bg-card border border-border/50 rounded-[10px] p-6 space-y-6">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 border-border/45">
      <div className="text-left">
        <h3 className="text-sm font-extrabold text-[#2f6cf5] flex items-center gap-2 uppercase tracking-wide">
          <Calculator className="w-5 h-5 text-[#2f6cf5]" />
          Phân Tích & Hoạch Định Tỷ Lệ Trích Lập Quỹ Ưu Đãi VIP (% Giành Ra)
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Thiết kế đặc biệt để tính toán tỷ lệ trích quỹ lý tưởng từ biên lợi nhuận gộp nhằm thu hút và giữ chân khách VIP mà không bào mòn giá trị thương hiệu.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 text-xs font-bold px-3 py-1.5 rounded-[10px] border border-emerald-500/20">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        Phân Tích Động Chuyên Sâu
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Target parameters inputs */}
      <div className="lg:col-span-5 bg-muted/20 border border-border/40 p-5 rounded-[10px] space-y-4 text-left">
        <h4 className="text-[10px] font-bold text-foreground bg-primary/10 px-2 py-1 rounded inline-block tracking-wider uppercase">THAM SỐ HOẠCH ĐỊNH DOANH NGHIỆP</h4>
        
        {/* Dropdown Industry */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Mô hình Ngành hàng kinh doanh</label>
          <select 
            value={industrySector}
            onChange={(e) => setIndustrySector(e.target.value as any)}
            className="w-full p-2 bg-background border border-border/60 rounded-[10px] text-xs font-semibold text-zinc-300 outline-none cursor-pointer"
          >
            <option value="luxury">Thời trang Thiết Kế & Kim Cương Cao Cấp (Sevago Style)</option>
            <option value="retail">Bán lẻ Cao Cấp & Nhập khẩu (Repeat Rate Vừa)</option>
            <option value="services">Dịch vụ Thượng lưu / Private Club (High Frequency)</option>
          </select>
        </div>

        {/* Competition dropdown */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">Mức độ cạnh tranh thị trường</label>
          <select 
            value={competitionLevel}
            onChange={(e) => setCompetitionLevel(e.target.value as any)}
            className="w-full p-2 bg-background border border-border/60 rounded-[10px] text-xs font-semibold text-zinc-300 outline-none cursor-pointer"
          >
            <option value="low">Thấp (Đặc quyền thương hiệu độc quyền cao)</option>
            <option value="medium">Bình thường (Cạnh tranh dịch vụ cùng dòng)</option>
            <option value="high">Khốc liệt (Cần liên tục làm chiến dịch bứt phá)</option>
          </select>
        </div>

        {/* Slider target retention */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-muted-foreground">Mục tiêu Giữ chân VIP mong muốn</span>
            <span className="text-[#2f6cf5] font-bold">{retentionTarget}%</span>
          </div>
          <input 
            type="range" 
            min="50" 
            max="98" 
            value={retentionTarget} 
            onChange={(e) => setRetentionTarget(Number(e.target.value))} 
            className="w-full accent-[#2f6cf5]"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>50% (Tự nhiên)</span>
            <span>98% (Kịch độc quyền)</span>
          </div>
        </div>

        {/* Apply Recommended Button */}
        <button
          onClick={() => {
            setLoyaltyRatio(recommendedRatio);
            triggerToast(`Đã áp dụng tỷ lệ trích quỹ tối ưu ${recommendedRatio}% vào bảng tính Loyalty từ AI!`);
          }}
          className="w-full py-2.5 bg-[#2f6cf5] hover:bg-[#2f6cf5]/90 text-white text-xs font-bold uppercase rounded-[10px] tracking-wider transition-all shadow-md hover:shadow-lg focus:outline-none flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <CheckCircle className="w-4 h-4" />
          Áp dụng Tỷ lệ khuyến nghị AI ({recommendedRatio}%)
        </button>
      </div>

      {/* AI Recommendation display */}
      <div className="lg:col-span-7 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#2f6cf5]/5 border border-[#2f6cf5]/20 rounded-[10px] flex flex-col justify-between text-left">
            <span className="text-xs text-muted-foreground font-bold uppercase block leading-none">Tỷ lệ trích quỹ tối ưu khuyên dùng</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#2f6cf5]">{recommendedRatio}%</span>
              <span className="text-xs text-muted-foreground font-semibold">Lợi nhuận gộp</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 border-t border-[#2f6cf5]/10 pt-1.5">
              Tương đương <strong className="text-foreground">{(recommendedRatio * (grossProfit / revenue)).toFixed(2)}%</strong> Doanh thu kì vọng.
            </p>
          </div>

          <div className="p-4 bg-muted/30 border border-border/50 rounded-[10px] flex flex-col justify-between text-left">
            <span className="text-xs text-zinc-400 font-bold uppercase block leading-none">Hạn mức ngân sách tối ưu tương ứng</span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-foreground">{formatShortVND(grossProfit * (recommendedRatio / 100))}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 border-t border-border/30 pt-1.5">
              Tính trên mức lợi nhuận gộp hiện hành {formatShortVND(grossProfit)}.
            </p>
          </div>
        </div>

        {/* Recommended allocation share */}
        <div className="bg-muted/10 border border-border/40 p-5 rounded-[10px] text-left space-y-3">
          <h5 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#2f6cf5]" />
            Khung phân bổ đề xuất nguồn chi ngân sách ({recommendedRatio}%)
          </h5>
          <span className="text-[10px] text-zinc-400 leading-relaxed block mt-0.5 animate-pulse">
            Đề xuất chia nhỏ nguồn quỹ trích lập thành 4 nhánh chiến dịch để bổ trợ toàn vẹn hành trình khách hàng:
          </span>

          <div className="space-y-2.5 mt-2">
            {budgetDistribution.map((item, idx) => {
              const shareValue = (grossProfit * (recommendedRatio / 100)) * (item.percentage / 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-bold text-foreground">
                      {item.percentage}% <span className="text-muted-foreground font-mono font-medium ml-1.5">({formatShortVND(shareValue)})</span>
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden border border-zinc-700/30">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ backgroundColor: item.color, width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* Sensitivity analysis chart */}
    <div className="bg-muted/10 border border-border/40 p-5 rounded-[10px] text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border/30 pb-3 mb-4">
        <div>
          <h4 className="text-xs font-black text-foreground uppercase tracking-wider">PHÂN TÍCH ĐỘ NHẠY LỢI ÍCH THEO PHẦN TRĂM TRÍCH LẬP</h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">Mô hình đường cong biểu thị điểm bão hòa hiệu quả và ROI tối ưu dự kiến dựa trên tỷ lệ trích quỹ thiết đặt.</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-bold uppercase">
          Khuyến nghị: Vùng tối ưu 5% - 8%
        </span>
      </div>

      <div className="h-56 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={budgetSensitivityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBenefit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2f6cf5" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#2f6cf5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
            <XAxis dataKey="ratio" stroke="#888" fontSize={9} tickLine={false} />
            <YAxis yAxisId="left" stroke="#10b981" fontSize={9} tickLine={false} axisLine={false} unit="M" />
            <YAxis yAxisId="right" orientation="right" stroke="#2f6cf5" fontSize={9} tickLine={false} axisLine={false} unit="%" />
            <Tooltip contentStyle={{ backgroundColor: "rgba(9, 9, 11, 0.95)", borderRadius: "12px", border: "1px solid rgba(128,128,128,0.2)", color: "#fff" }} />
            <Area yAxisId="left" type="monotone" name="Doanh số bồi đắp (Tr ₫)" dataKey="Doanh số bồi đắp" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBenefit)" />
            <Area yAxisId="right" type="monotone" name="Tỷ suất ROI (%)" dataKey="Tỷ suất ROI (%)" stroke="#2f6cf5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRoi)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>

  <div className="flex justify-end pt-4">
    <button onClick={() => toast.success("Đã lưu kết quả phân tích ngân sách!")} className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-[10px] shadow inline-flex items-center gap-2 hover:opacity-80 transition-all text-sm cursor-pointer border border-transparent">
      <CheckCircle2 className="w-4 h-4" />
      Lưu kết quả
    </button>
  </div>
  </div>
  )}

 {/* 3. TAB: CLV & REPEAT PURCHASE */}
 {activeTab === 'clv_repeat' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 <div className="bg-sidebar border border-border/50 rounded-[10px] p-6 space-y-4">
 <h3 className="text-xs font-bold text-[#2f6cf5] uppercase tracking-widest border-b pb-2 border-border/40">BỘ MÔ PHỎNG GIÁ TRỊ VÒNG ĐỜI (CLV)</h3>
 
 <div className="space-y-4">
 <div>
 <label className="block text-xs text-muted-foreground font-bold uppercase mb-1">Giá trị đơn hàng trung bình - AOV (₫)</label>
 <input type="text" inputMode="numeric" value={formatInputValue(aov)} onChange={e => handleNumericInputChange(e.target.value, setAov)} className="w-full p-2 text-xs rounded-[10px] bg-background border font-semibold text-foreground" />
 </div>
 <div>
 <label className="block text-xs text-muted-foreground font-bold uppercase mb-1">Tần suất mua sắm trung bình (Đơn/Năm)</label>
 <input type="number" value={purchaseFrequency} onChange={e => setPurchaseFrequency(Number(e.target.value))} className="w-full p-2 text-xs rounded-[10px] bg-background border" />
 </div>
 <div>
 <label className="block text-xs text-muted-foreground font-bold uppercase mb-1">Thời gian gắn kết vòng đời (Năm)</label>
 <input type="number" value={customerLifespan} onChange={e => setCustomerLifespan(Number(e.target.value))} className="w-full p-2 text-xs rounded-[10px] bg-background border" />
 </div>

 <div className="p-4 bg-muted/50 rounded-[10px] text-center border">
 <span className="text-xs text-muted-foreground font-bold block uppercase tracking-wider">Tổng CLV Ước Tính</span>
 <h3 className="text-3xl font-extrabold text-[#2f6cf5] mt-1">{formatMillionVND(calculatedCLV)}</h3>
 <span className="text-xs text-muted-foreground block mt-1">Công thức: AOV × Tần suất × Vòng đời</span>
 </div>
 </div>
 </div>

 <div className="lg:col-span-2 bg-card border border-border/50 rounded-[10px] p-6 space-y-4">
 <h3 className="text-xs font-bold text-[#2f6cf5] uppercase tracking-widest">TỶ LỆ LẶP LẠI THEO BỘ SƯU TẬP (COLLECTION)</h3>
 
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={REPEAT_PURCHASE_BY_COLLECTION}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 120, 0.1)" />
 <XAxis dataKey="name" stroke="#71717A" fontSize={10} />
 <YAxis stroke="#71717A" fontSize={10} unit="%" />
 <Tooltip />
 <Bar dataKey="repeatRate" fill="#2f6cf5" name="Tỷ lệ lặp lại (%)" radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>

 <div className="grid grid-cols-3 gap-4 pt-3 border-t">
 {REGIONAL_METRICS.map((regional, index) => (
 <div key={index} className="space-y-1">
 <span className="text-xs text-muted-foreground block">{regional.region}</span>
 <span className="text-sm font-bold text-[#2f6cf5]">{regional.rate}% mua lại</span>
 </div>
 ))}
 </div>
 </div>

 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="bg-card border border-border/50 rounded-[10px] p-6 space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-border/40">
 <div>
 <h3 className="text-sm font-bold text-foreground font-heading">XU HƯỚNG TĂNG TRƯỞNG GIÁ TRỊ VÒNG ĐỜI (CLV) 12 THÁNG QUA CÁC HẠNG</h3>
 <p className="text-xs text-muted-foreground">Phân tích biến động tăng trưởng CLV trung bình lũy kế của hội viên các phân tầng (Đơn vị: Triệu ₫).</p>
 </div>
 </div>

 <div className="h-72">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={CLV_TREND_BY_TIER_DATA} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 120, 0.1)" />
 <XAxis dataKey="month" stroke="#71717A" fontSize={10} />
 <YAxis stroke="#71717A" fontSize={10} unit="M" />
 <Tooltip content={<CustomCLVTooltip />} />
 <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
 <Line type="monotone" dataKey="Atelier" stroke="#2f6cf5" strokeWidth={3} activeDot={{ r: 6 }} name="Atelier (Cao cấp)" />
 <Line type="monotone" dataKey="Icon" stroke="#f59e0b" strokeWidth={2.5} name="Icon (Vàng VIP)" />
 <Line type="monotone" dataKey="Essential" stroke="#10b981" strokeWidth={2} name="Essential (Bạc)" />
 <Line type="monotone" dataKey="Member" stroke="#94a3b8" strokeWidth={1.5} name="Member (Thành viên)" />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-card border border-border/50 rounded-[10px] p-6 space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-border/40">
 <div>
 <h3 className="text-sm font-bold text-foreground font-heading">DỰ PHÓNG XU HƯỚNG TĂNG TRƯỞNG CLV MÔ PHỎNG THEO THỜI GIAN</h3>
 <p className="text-xs text-muted-foreground">Đường biểu diễn tích lũy giá trị vòng đời qua số năm gắn kết (Dựa theo AOV & Tần suất mua hàng).</p>
 </div>
 </div>

 <div className="h-72">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={simulatedClvGraphData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 120, 0.1)" />
 <XAxis dataKey="year" stroke="#71717A" fontSize={10} />
 <YAxis stroke="#71717A" fontSize={10} />
 <Tooltip content={<CustomSimulatedCLVTooltip />} />
 <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
 <Line type="monotone" dataKey="CLV" stroke="#2f6cf5" strokeWidth={3} activeDot={{ r: 6 }} name="CLV lũy kế (Tr ₫)" />
 <Line type="monotone" dataKey="Orders" stroke="#10b981" strokeWidth={2} name="Số đơn lũy kế" />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 <div className="flex justify-end pt-4">
   <button onClick={() => toast.success("Đã lưu kết quả phân tích CLV và vòng đời!")} className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-[10px] shadow inline-flex items-center gap-2 hover:opacity-80 transition-all text-sm cursor-pointer border border-transparent">
     <CheckCircle2 className="w-4 h-4" />
     Lưu kết quả
   </button>
 </div>
 </div>
 )}

 {/* 4. TAB: VIP CRM & BOOKING */}
 {activeTab === 'vip_crm' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 <div className="lg:col-span-2 space-y-4">
 <div className="bg-card border border-border/50 rounded-[10px] p-6">
 <div className="flex items-center justify-between gap-3 mb-4">
 <h3 className="text-sm font-bold text-foreground">DANH SÁCH THÀNH VIÊN VIP ({filteredCustomers.length})</h3>
 <div className="relative w-48">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Tìm kiếm..." 
 value={searchQuery} 
 onChange={e => setSearchQuery(e.target.value)} 
 className="w-full pl-8 pr-2 py-1.5 bg-background border rounded-[10px] text-xs" 
 />
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b text-muted-foreground text-xs font-bold">
 <th className="pb-2">Khách hàng</th>
 <th className="pb-2 text-center">Hạng</th>
 <th className="pb-2 text-center">Trạng thái</th>
 <th className="pb-2 text-right">CLV lũy kế</th>
 <th className="pb-2 text-center">Churn Risk</th>
 <th className="pb-2 text-right">Hành động</th>
 </tr>
 </thead>
 <tbody className="divide-y">
 {filteredCustomers.map((c, idx) => (
 <tr key={idx} className="hover:bg-muted/20">
 <td className="py-2.5">
 <div className="font-bold">{c.name}</div>
 <span className="text-xs text-muted-foreground">{c.phone}</span>
 </td>
 <td className="py-2.5 text-center">
 <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-[#2f6cf5] border border-[#2f6cf5]/30 font-bold">{c.tier}</span>
 </td>
 <td className="py-2.5 text-center">
 <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{c.status}</span>
 </td>
 <td className="py-2.5 text-right font-bold text-[#2f6cf5]">{formatMillionVND(c.clv)}</td>
 <td className="py-2.5 text-center">
 <span className={`font-bold ${c.risk_score > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>{c.risk_score}%</span>
 </td>
 <td className="py-2.5 text-right">
 <button 
 onClick={() => { setActiveTab('ai_advisor'); setSelectedAIVip(c.id); }}
 className="px-2.5 py-1 text-xs uppercase font-bold text-[#2f6cf5] bg-[#2f6cf5]/10 hover:bg-[#2f6cf5]/20 border border-[#2f6cf5]/35 rounded-[10px] transition-all"
 >
 AI Phân Tích
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Booking Form */}
 <div className="bg-card border border-border/50 rounded-[10px] p-6 space-y-4">
 <h3 className="text-xs font-bold text-[#2f6cf5] uppercase tracking-widest flex items-center gap-1.5 border-b pb-2 border-border/40">
 <Calendar className="w-4 h-4 text-[#2f6cf5]" /> ĐẶT LỊCH ĐÓN TIẾP SHOWROOM VIP
 </h3>

 <form onSubmit={handleBookAppointment} className="space-y-3">
 <div>
 <span className="text-xs text-muted-foreground font-bold uppercase block mb-1">Tên khách hàng VIP</span>
 <input type="text" placeholder="Đoàn Hương Giang" value={newBooking.customerName} onChange={e => setNewBooking({...newBooking, customerName: e.target.value})} className="w-full p-2 bg-background border text-xs rounded-[10px]" />
 </div>
 <div>
 <span className="text-xs text-muted-foreground font-bold uppercase block mb-1">Loại hình Consultation đặc quyền</span>
 <select value={newBooking.type} onChange={e => setNewBooking({...newBooking, type: e.target.value})} className="w-full p-2 bg-background border text-xs rounded-[10px]">
 <option value="Xem trang sức phòng riêng">Xem trang sức phòng riêng</option>
 <option value="Tạo mẫu thiết kế độc bản">Tạo mẫu thiết kế độc bản</option>
 <option value="Thưởng thức Trà chiều & Thử nhẫn">Thưởng thức Trà chiều & Thử nhẫn</option>
 </select>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div>
 <span className="text-xs text-muted-foreground block">Ngày hẹn</span>
 <input type="date" value={newBooking.date} onChange={e => setNewBooking({...newBooking, date: e.target.value})} className="w-full p-1.5 bg-background border text-xs rounded-[10px]" />
 </div>
 <div>
 <span className="text-xs text-muted-foreground block">Giờ hẹn</span>
 <input type="time" value={newBooking.time} onChange={e => setNewBooking({...newBooking, time: e.target.value})} className="w-full p-1.5 bg-background border text-xs rounded-[10px]" />
 </div>
 </div>

 <button type="submit" className="w-full py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all rounded-[10px] uppercase tracking-wider">
 THIẾT LẬP LỊCH HẸN
 </button>
 </form>

 <div className="pt-2 border-t space-y-2">
 <span className="text-xs text-muted-foreground font-bold uppercase block">Lịch Hẹn VIP Chờ Đón</span>
 {bookings.map((b, idx) => (
 <div key={idx} className="p-3 bg-muted/40 rounded-[10px] border flex items-center justify-between text-xs">
 <div>
 <div className="font-bold">{b.customerName}</div>
 <span className="text-xs text-muted-foreground">{b.type}</span>
 </div>
 <span className="px-2 py-1 bg-background border rounded-[10px] text-xs font-bold text-[#2f6cf5]">{b.time}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="flex justify-end pt-4">
   <button onClick={() => toast.success("Đã lưu kết quả phân tích VIP CRM!")} className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-[10px] shadow inline-flex items-center gap-2 hover:opacity-80 transition-all text-sm cursor-pointer border border-transparent">
     <CheckCircle2 className="w-4 h-4" />
     Lưu kết quả
   </button>
 </div>
 </div>
 )}

 {/* 5. TAB: AI ANALYTICS ADVISOR */}
 {activeTab === 'ai_advisor' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 <div className="bg-card border border-border/50 rounded-[10px] p-6 space-y-4">
 <h3 className="text-xs font-bold text-[#2f6cf5] uppercase tracking-widest flex items-center gap-1.5 border-b pb-2 border-border/40">
 <Sparkles className="w-4 h-4 text-[#2f6cf5]" /> Cấu hình Trí khôn nhân tạo AI
 </h3>

 <div className="space-y-3">
 <div>
 <label className="block text-xs text-muted-foreground font-bold uppercase mb-1">Chọn Khách Hàng VIP Chẩn Đoán</label>
 <select 
 value={selectedAIVip} 
 onChange={e => setSelectedAIVip(e.target.value)}
 className="w-full p-2.5 bg-background border rounded-[10px] text-xs"
 >
 {customers.map(c => (
 <option key={c.id} value={c.id}>
 {c.name} - {c.tier} ({(c.clv / 1000000).toFixed(0)}M)
 </option>
 ))}
 </select>
 </div>

 {(() => {
 const client = customers.find(c => c.id === selectedAIVip) || customers[0];
 return (
 <div className="p-4 bg-muted/30 border rounded-[10px] space-y-2 text-xs">
 <span className="text-xs text-muted-foreground font-bold uppercase block">Chân dung đồng bộ hiện tại</span>
 <div className="grid grid-cols-2 gap-2">
 <div>Vùng miền: <span className="font-bold text-foreground">{client.region}</span></div>
 <div>Lặp lại: <span className="font-bold text-foreground">{client.repeat_rate}%</span></div>
 <div>Thích: <span className="font-bold text-foreground">{client.collection}</span></div>
 <div>Risk: <span className={`font-bold ${client.risk_score > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>{client.risk_score}%</span></div>
 </div>
 </div>
 );
 })()}

 <div>
 <label className="block text-xs text-muted-foreground font-semibold mb-1">Lời nhắc chỉ đạo bổ sung</label>
 <textarea 
 rows={3} 
 value={aiCustomPrompt} 
 onChange={e => setAiCustomPrompt(e.target.value)} 
 className="w-full p-2 bg-background border text-xs rounded-[10px] focus:ring-1" 
 />
 </div>

 <button 
 onClick={callGeminiAIAdvisor} 
 disabled={aiLoading}
 className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg"
 >
 {aiLoading ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin text-primary-foreground" />
 <span>AI ĐANG TRÍCH XUẤT...</span>
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4 text-primary-foreground" />
 <span>KÍCH HOẠT CHẨN ĐOÁN AI</span>
 </>
 )}
 </button>
 </div>
 </div>

 {/* AI Results */}
 <div className="lg:col-span-2 space-y-4">
 {aiResponse ? (
 <div className="space-y-4">
 <div className="bg-card border border-border/50 rounded-[10px] p-5 space-y-2">
 <span className="text-xs font-bold text-[#2f6cf5] uppercase flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Đánh giá Churn Risk</span>
 <p className="text-xs leading-relaxed text-foreground">{aiResponse.riskAnalysis}</p>
 </div>
 <div className="bg-card border border-border/50 rounded-[10px] p-5 space-y-2">
 <span className="text-xs font-bold text-[#2f6cf5] uppercase flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Đề xuất Ưu đãi & Thặng dư tài chính</span>
 <p className="text-xs leading-relaxed text-foreground">{aiResponse.marketingStrategy}</p>
 </div>
 <div className="bg-card border border-border/50 rounded-[10px] p-5 space-y-2">
 <span className="text-xs font-bold text-[#2f6cf5] uppercase flex items-center gap-2"><Calendar className="w-4 h-4" /> Kế hoạch Đón Tiếp & Trải nghiệm salon</span>
 <p className="text-xs leading-relaxed text-foreground">{aiResponse.privateExperience}</p>
 </div>
 <div className="bg-muted/40 p-5 rounded-[10px] border border-dashed space-y-3">
 <span className="text-xs font-bold text-[#2f6cf5] uppercase block border-b pb-2">Bản sao Thư Tri Ân Gửi Khách Hàng Cao Cấp</span>
 <p className="text-xs italic leading-relaxed whitespace-pre-line text-foreground/90">"{aiResponse.personalOffer}"</p>
 <div className="text-right">
 <button 
 onClick={() => triggerToast('Đã phê duyệt gửi lời mời tri ân cao cấp này tới VIP!')}
 className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-[10px] uppercase hover:scale-105 transition-all"
 >
 Phê duyệt Gửi Lời Mời
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div className="h-64 border border-dashed rounded-[10px] flex flex-col items-center justify-center text-center p-6 bg-muted/20">
 <Sparkles className="w-10 h-10 animate-pulse text-[#2f6cf5]/50 mb-3" />
 <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sẵn Sàng Chẩn Đoán AI</span>
 <p className="text-xs text-muted-foreground max-w-sm mt-1">Lựa chọn khách hàng VIP và bấm nút để khởi tạo cố vấn trải nghiệm cá nhân hóa.</p>
 </div>
 )}
 </div>

 <div className="flex justify-end pt-4">
   <button onClick={() => toast.success("Đã lưu kết quả phân tích AI!")} className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-[10px] shadow inline-flex items-center gap-2 hover:opacity-80 transition-all text-sm cursor-pointer border border-transparent">
     <CheckCircle2 className="w-4 h-4" />
     Lưu kết quả
   </button>
 </div>
 </div>
 </div>
 )}

 {/* 5b. TAB: OFFER ANALYSIS */}
 {activeTab === 'offer_analysis' && (
 <div className="space-y-6">
 <OfferAnalysis campaigns={campaigns} customers={customers} />
 </div>
 )}

 {/* 6. TAB: RULES */}
 {activeTab === 'rules' && (
 <div className="bg-sidebar border border-border/50 rounded-[10px] p-6 space-y-6">
 <div>
 <h3 className="text-sm font-bold text-foreground">QUY TẮC PHÂN BỔ LOYALTY ENGINE</h3>
 <p className="text-xs text-muted-foreground">Tùy biến các quy mẫu tích lũy điểm và bậc thềm phân hạng tích lũy.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="space-y-3">
 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">1. TÍCH LŨY & ĐỔI ĐIỂM</span>
 <div>
 <span className="text-xs text-muted-foreground block mb-1">Mức Chi Tiêu Cho 1 Điểm (₫)</span>
 <input type="text" inputMode="numeric" value={formatInputValue(rules.pointEarningRate)} onChange={e => setRules({...rules, pointEarningRate: e.target.value.replace(/\./g, '').replace(/[^\d]/g, '') ? parseInt(e.target.value.replace(/\./g, '').replace(/[^\d]/g, ''), 10) : 0})} className="w-full p-2 bg-background border text-xs rounded-[10px] font-semibold text-foreground" />
 </div>
 <div>
 <span className="text-xs text-muted-foreground block mb-1">Giá Trị Đổi Của 1 Điểm (₫)</span>
 <input type="text" inputMode="numeric" value={formatInputValue(rules.pointRedemptionValue)} onChange={e => setRules({...rules, pointRedemptionValue: e.target.value.replace(/\./g, '').replace(/[^\d]/g, '') ? parseInt(e.target.value.replace(/\./g, '').replace(/[^\d]/g, ''), 10) : 0})} className="w-full p-2 bg-background border text-xs rounded-[10px] font-semibold text-foreground" />
 </div>
 </div>

 <div className="space-y-3">
 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">2. ĐỊNH MỨC ATELIER TIERS</span>
 <div>
 <span className="text-xs text-muted-foreground block mb-1">Hạn mức nâng hạng Atelier (₫)</span>
 <input type="text" inputMode="numeric" value={formatInputValue(rules.tierUpgradeAtelier)} onChange={e => setRules({...rules, tierUpgradeAtelier: e.target.value.replace(/\./g, '').replace(/[^\d]/g, '') ? parseInt(e.target.value.replace(/\./g, '').replace(/[^\d]/g, ''), 10) : 0})} className="w-full p-2 bg-background border text-xs rounded-[10px] font-semibold text-foreground" />
 </div>
 <div>
 <span className="text-xs text-muted-foreground block mb-1">Hạn mức nâng hạng Icon (₫)</span>
 <input type="text" inputMode="numeric" value={formatInputValue(rules.tierUpgradeIcon)} onChange={e => setRules({...rules, tierUpgradeIcon: e.target.value.replace(/\./g, '').replace(/[^\d]/g, '') ? parseInt(e.target.value.replace(/\./g, '').replace(/[^\d]/g, ''), 10) : 0})} className="w-full p-2 bg-background border text-xs rounded-[10px] font-semibold text-foreground" />
 </div>
 </div>

 <div className="space-y-3 flex flex-col justify-between">
 <div>
 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">3. PHÊ DUYỆT TÍCH HỢP</span>
 <div className="space-y-2 text-xs">
 <div className="flex justify-between items-center bg-muted/40 p-2 rounded-[10px]">
 <span>Zoho CRM API Hub</span>
 <span className="text-emerald-500 font-bold">● Active</span>
 </div>
 <div className="flex justify-between items-center bg-muted/40 p-2 rounded-[10px]">
 <span>Omnichannel Webhooks</span>
 <span className="text-emerald-500 font-bold">● Active</span>
 </div>
 </div>
 </div>
 <button 
 onClick={() => triggerToast('Đã lưu cài đặt Loyalty Engine!')}
 className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-[10px] uppercase"
 >
 LƯU CÀI ĐẶT ENGINE
 </button>
 </div>
 </div>
 </div>
 )}

    </div>
  </div>

  </div>
 </div>
 );
}
