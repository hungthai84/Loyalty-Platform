import React, { useState, useMemo, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Customer, Company, AttributeDefinition, TierConfig } from "@/types";
import { StatusService, CustomerActivityMetrics } from "@/services/StatusService";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  ArrowLeft,
  Phone,
  Mail,
  Facebook,
  Linkedin,
  Instagram,
  Landmark,
  Plus,
  Minus,
  Sparkles,
  Edit2,
  Award,
  ExternalLink,
  RefreshCw,
  Upload,
  TrendingUp,
  Zap,
  Trash2,
  AlertTriangle,
  Gem,
  Compass,
  Check,
  X,
  Calendar,
  Download,
  Smile,
  MessageSquare,
  Crown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, getCustomerCode } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as motion from "motion/react-client";
import { CUSTOMER_STATUSES } from "@/data/customerStatuses";

// Mock high-end transactions for demo purposes
const MOCK_CRM_ACTIVITIES = [
  {
    id: "1",
    type: "order",
    content: "Mua sắm bộ sưu tập Hè Atelier Premium",
    value: "+35.000.000 ₫",
    points: "+350 điểm",
    date: "Hôm qua, 14:20",
  },
  {
    id: "2",
    type: "reward",
    content: "Đổi Voucher ẩm thực đặc quyền tại Private Lounge",
    value: "-1.000 điểm",
    points: "-1000 điểm",
    date: "22/05/2026",
  },
  {
    id: "3",
    type: "event",
    content: "Tham gia Sự kiện Private Showcase Atelier",
    value: "Đăng ký VIP",
    points: "+200 điểm",
    date: "18/05/2026",
  },
  {
    id: "4",
    type: "referral",
    content: "Giới thiệu thành viên mới liên kết thẻ VIP",
    value: "Mã REF-302",
    points: "+150 điểm",
    date: "10/05/2026",
  },
];

// Offline fallback logic for fashion & jewelry style predictions
const getLocalStylePrediction = (
  style: string,
  palette: string,
  material: string,
  occ: string,
  brand: string
) => {
  let analysis = "";
  let prediction = "";
  let vibe = "";
  let recommendedItems: string[] = [];
  let autoTags: string[] = [];

  // 1. Analyze Core Style
  if (style === "classic") {
    analysis = "Khách hàng mang phong thái sang trọng cổ điển, đề cao tinh hoa chế tác truyền thống và nét thanh lịch lâu đời. Họ ưa chuộng các đường nét đối xứng, cân đối và thiết kế thanh nhã vượt thời gian.";
    vibe = "Thanh lịch vĩnh cửu & Quý tộc tinh tế";
    autoTags.push("Classic Luxury", "Timeless Elegance");
  } else if (style === "minimalist") {
    analysis = "Phong cách tối giản đương đại định hình gu thẩm mỹ của khách hàng. Họ tin rằng 'less is more', ưa chuộng những đường nét hình học sắc sảo, cấu trúc mở, lược bỏ tối đa chi tiết thừa để tôn vinh chất liệu thu hút.";
    vibe = "Tối giản hiện đại & Tinh xảo sắc nét";
    autoTags.push("Quiet Luxury", "Simplicity");
  } else if (style === "glamorous") {
    analysis = "Khách hàng sở hữu phong cách lộng lẫy, quyền quý, luôn là tâm điểm của sự chú ý. Họ yêu thích sự lấp lánh, phô diễn các chi tiết cầu kỳ, giác cắt đá quý phức tạp và các chuỗi dây đính kết tinh xảo.";
    vibe = "Quyền uy Lộng lẫy & Đẳng cấp Hoàng gia";
    autoTags.push("High Jewelry", "Red Carpet");
  } else if (style === "avant-garde") {
    analysis = "Cá tính mạnh mẽ, tiên phong và độc bản là bản sắc của khách hàng. Họ không ngần ngại thử nghiệm cấu trúc phi đối xứng, chất liệu phối hợp đặc biệt và phom dáng điêu khắc phá vỡ mọi quy chuẩn truyền thống.";
    vibe = "Độc bản Tiên phong & Phá cách Nghệ thuật";
    autoTags.push("Avant-Garde", "Signature Piece");
  } else {
    analysis = "Khách hàng hướng tới phong cách lãng mạn, nhẹ nhàng, thơ mộng. Gu thẩm mỹ của họ bay bổng với các họa tiết tự nhiên như cỏ cây hoa lá, đường nét uốn lượn nữ tính mềm mại và sự kết hợp sắc màu thuần khiết.";
    vibe = "Lãng mạn Bay bổng & Thanh thuần Ngọc ngà";
    autoTags.push("Romantic Style", "Floral Motif");
  }

  // 2. Add Palette details
  if (palette === "neutral") {
    analysis += " Sự ưu ái dành cho tông màu trung tính biểu lộ một tư duy thời trang bền vững, dễ phối đồ nhưng vẫn toát lên khí chất thượng hoàng.";
  } else if (palette === "warm") {
    analysis += " Tông màu ấm áp giúp tôn vinh làn da châu Á rạng rỡ, biểu hiện năng lượng nhiệt huyết và sự cởi mở, ấm áp.";
  } else if (palette === "cool") {
    analysis += " Lựa chọn tông lạnh thể hiện sự điềm tĩnh kiêu sa, tạo cảm giác sang trọng, bí ẩn và quý phái như hoàng hôn biển sâu.";
  } else {
    analysis += " Gam màu Pastel dịu mát biểu thị nét thanh xuân trẻ trung, yêu kiều, tạo ra nguồn năng lượng chữa lành và cảm giác dễ chịu cho người đối diện.";
  }

  // 3. Formulate Predictions & Recommendations
  let gemstone = "Kim cương thiên nhiên";
  let metal = "Vàng trắng 18k";
  if (material === "gold") {
    gemstone = "Kim cương giác cắt Brilliant hoặc Đá Ruby đỏ";
    metal = "Vàng vàng truyền thống 18K/24K";
    autoTags.push("Gold Collector");
  } else if (material === "white_gold") {
    gemstone = "Kim cương nước D tinh khiết hoặc Sapphire xanh sâu thẳm";
    metal = "Bạch kim (Platinum) hoặc Vàng trắng quý giá";
    autoTags.push("Plat Pure");
  } else if (material === "rose_gold") {
    gemstone = "Kim cương màu Champagne hoặc Đá thạch anh tóc hồng";
    metal = "Vàng hồng thời thượng (Rose Gold)";
    autoTags.push("Rose Gold Muse");
  } else if (material === "gemstones") {
    gemstone = "Đá Emerald (Lục bảo bảo) hoàng gia hoặc Ngọc xanh biển (Aquamarine)";
    metal = "Vàng trắng đính kết phức tạp";
    autoTags.push("Gemstone Connoisseur");
  } else {
    gemstone = "Ngọc trai Akoya Nhật Bản tròn trịa hoặc Ngọc trai Nam Hải ánh vàng rực rỡ";
    metal = "Bạch kim tinh khiết";
    autoTags.push("Pearl Lover");
  }

  // Purpose-based predictions
  if (occ === "daily") {
    prediction = `Trong thời gian tới, khách hàng sẽ có xu hướng ưu tiên chọn dùng các sản phẩm trang sức tinh giản, có tính ứng dụng cao nhưng không kém phần thanh quý. Dự đoán món đồ ưa chuộng nhất sẽ là chiếc nhẫn Eternity mỏng đính một hàng kim cương tấm bằng chất liệu ${metal}, phối cùng bông tai nụ (stud earrings) giác cắt tròn để tạo điểm nhấn nhẹ nhàng khi ra ngoài hàng ngày.`;
    recommendedItems = [
      `Nhẫn Eternity chế tác từ ${metal} nạm Kim cương Brilliant`,
      `Khuyên tai nụ Solitaire nạm ${gemstone}`,
      `Lắc tay xích mảnh tối giản tinh xảo`
    ];
  } else if (occ === "gala") {
    prediction = `Chuẩn bị cho các sự kiện tầm cỡ sắp tới, khách hàng chắc chắn sẽ tìm kiếm những tác phẩm trang sức trung tâm (statement accessories). Dự đoán xu hướng sẽ là một chiếc vòng cổ dáng Riviera lộng lẫy bằng chất liệu ${metal} đính nạm ${gemstone} nguyên khối, hoặc chiếc khuyên tai chandeliers rủ dài quý phái để tương thích tuyệt đối với các bộ váy dạ tiệc quyền quý.`;
    recommendedItems = [
      `Vòng cổ Riviera dáng hoàng gia chế tác từ ${metal} nạm ${gemstone}`,
      `Đôi khuyên tai dáng đèn chùm (Chandeliers) lộng lẫy`,
      `Nhẫn Statement bản lớn đính ${gemstone} giác cắt Marquise`
    ];
  } else if (occ === "business") {
    prediction = `Tại không gian công sở và các cuộc hội họp ngoại giao quyền uy, khách hàng sẽ chuộng các mẫu trang sức mang đậm cấu trúc mạnh mẽ, quyền lực (power dressing). Chiếc vòng tay bản cứng (bangle) kiểu dáng hình học tinh tế bằng ${metal} nạm ẩn nương theo thiết kế của ${brand === "cartier" ? "Cartier" : "thượng hiệu cao cấp"} sẽ là vật bất ly thân giúp tăng cường sự tự tin thần thái lãnh đạo.`;
    recommendedItems = [
      `Vòng tay bản cứng geometric chế tác từ ${metal}`,
      `Earcuff khuyên kẹp tai nạm kim cương cá tính công sở`,
      `Mặt dây chuyền tối giản hình học đính ${gemstone}`
    ];
  } else {
    prediction = `Khách hàng thiên hướng tích lũy và sưu tầm trang sức mang tính di sản phi thời gian để dành tặng thế hệ sau. Dự báo họ sẽ đón nhận các phiên bản Limited Edition từ các bộ sưu tập huyền thoại, kết hợp chất liệu ${metal} và ${gemstone} chất lượng cao, mang tính nghệ thuật lớn đại diện cho câu chuyện gia đình sâu sắc.`;
    recommendedItems = [
      `Mặt dây chuyền gia huy đúc bằng ${metal} đính kết thủ công`,
      `Trâm cài áo (Brooch) đính kết ngọc trai & tác phẩm điêu khắc vàng cổ`,
      `Nhẫn Signet hoàng gia nạm ${gemstone} tâm điểm`
    ];
  }

  // Brand adaptation
  if (brand === "cartier") {
    prediction += ` Thiết kế sẽ mang âm hướng cá tính quyền lực, lấy cảm hứng từ biểu tượng Panther (Báo Gấm) mạnh mẽ hoặc Love/Juste un Clou kinh điển.`;
  } else if (brand === "tiffany") {
    prediction += ` Phom dáng tôn thờ cấu trúc hình học hiện đại hoặc biểu tượng lãng mạn lấp lánh nguyên bản từ Tiffany T, HardWear hiện đại.`;
  } else if (brand === "chanel") {
    prediction += ` Trang sức mượn cảm hứng hoa trà Camélia, họa tiết chần bông Coco Crush thanh quý đậm chất Pháp cổ điển.`;
  } else if (brand === "pandora") {
    prediction += ` Đề cao tính modular, sự kết hợp ngẫu hứng giàu tình ý của các hạt charm cá nhân hóa biểu đạt câu chuyện riêng biệt.`;
  } else {
    prediction += ` Đường nét mang hơi thở gothic gothic mạnh mẽ, phóng khoáng đi cùng hoa văn chữ thập hay biểu tượng gai góc đầy bản lĩnh độc nhất.`;
  }

  return { analysis, prediction, vibe, recommendedItems, autoTags };
};

interface CustomerDashboardProps {
  customer: Customer;
  userId: string;
  companies: Company[];
  attributes: AttributeDefinition[];
  tierConfigs: TierConfig[];
  onBack: () => void;
}

// Mock email communications for demo
const MOCK_REWARDS = [
  { id: "r1", name: "Voucher High-Tea Atelier", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400", date: "20/05/2026", points: 1500, category: "Lifestyle" },
  { id: "r2", name: "Set Nến thơm Signature", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=400", date: "10/05/2026", points: 800, category: "Gift" },
  { id: "r3", name: "Khăn lụa Tơ tằm Luxury", image: "https://images.unsplash.com/photo-1601050638917-3606f548f246?auto=format&fit=crop&q=80&w=400", date: "02/04/2026", points: 2500, category: "Fashion" },
  { id: "r4", name: "Vé mời Private Showcase", image: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=400", date: "15/03/2026", points: 500, category: "Event" },
];

const MOCK_EMAIL_COMMS = [
  { id: "e1", subject: "Chào mừng thành viên hạng Essential", status: "delivered", date: "Hôm qua, 09:00", type: "automated" },
  { id: "e2", subject: "Ưu đãi đặc biệt: Giảm 20% bộ sưu tập Kim Cương", status: "opened", date: "25/05/2026", type: "marketing" },
  { id: "e3", subject: "Chúc mừng sinh nhật quý khách", status: "opened", date: "20/05/2026", type: "automated" },
  { id: "e4", subject: "Thông báo bảo trì hệ thống", status: "delivered", date: "15/05/2026", type: "transactional" },
];

export function CustomerDashboard({

  customer,
  userId,
  companies,
  attributes,
  tierConfigs,
  onBack,
}: CustomerDashboardProps) {
  const [points, setPoints] = useState(customer.points || 0);
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Privileges states
  const [personalPrivileges, setPersonalPrivileges] = useState<string[]>(customer.customFields?.privileges || []);
  const [newPrivilegeInput, setNewPrivilegeInput] = useState("");

  useEffect(() => {
    setPersonalPrivileges(customer.customFields?.privileges || []);
  }, [customer]);

  const handleAddPrivilege = async () => {
    if (!newPrivilegeInput.trim()) {
      toast.error("Vui lòng nhập nội dung đặc quyền riêng");
      return;
    }
    const updated = [...personalPrivileges, newPrivilegeInput.trim()];
    setPersonalPrivileges(updated);
    
    await updateFirestore({
      customFields: {
        ...(customer.customFields || {}),
        privileges: updated
      }
    }, "Đã cập nhật đặc quyền riêng của hội viên!");
    setNewPrivilegeInput("");
  };

  const handleRemovePrivilege = async (index: number) => {
    const updated = personalPrivileges.filter((_, i) => i !== index);
    setPersonalPrivileges(updated);
    await updateFirestore({
      customFields: {
        ...(customer.customFields || {}),
        privileges: updated
      }
    }, "Đã xóa đặc quyền riêng!");
  };

  // Local edit states
  const [fb, setFb] = useState(customer.facebook || "");
  const [zl, setZl] = useState(customer.zalo || "");
  const [li, setLi] = useState(customer.linkedin || "");
  const [ig, setIg] = useState(customer.instagram || "");
  const [tt, setTt] = useState(customer.tiktok || "");
  const [avatar, setAvatar] = useState(customer.avatarUrl || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [email, setEmail] = useState(customer.email || "");

  const [timelineFilter, setTimelineFilter] = useState<
    "all" | "purchase" | "ticket" | "status_change" | "redemption"
  >("all");
  const [clvScenario, setClvScenario] = useState<
    "conservative" | "baseline" | "optimistic"
  >("baseline");

  // Fashion style and jewelry style analytics states
  const [fashionStyle, setFashionStyle] = useState(customer.customFields?.fashionStyle || "classic");
  const [colorPalette, setColorPalette] = useState(customer.customFields?.colorPalette || "neutral");
  const [materials, setMaterials] = useState(customer.customFields?.materials || "gold");
  const [occasions, setOccasions] = useState(customer.customFields?.occasions || "daily");
  const [brandReference, setBrandReference] = useState(customer.customFields?.brandReference || "chanel");
  const [additionalNotes, setAdditionalNotes] = useState(customer.customFields?.additionalNotes || "");
  const [ringSize, setRingSize] = useState(customer.customFields?.ringSize || "");
  const [braceletSize, setBraceletSize] = useState(customer.customFields?.braceletSize || "");
  const [necklaceLength, setNecklaceLength] = useState(customer.customFields?.necklaceLength || "");
  const [jewelryPreference, setJewelryPreference] = useState(customer.customFields?.jewelryPreference || "");
  const [emailNotifications, setEmailNotifications] = useState(customer.customFields?.emailNotifications ?? true);
  const [smsNotifications, setSmsNotifications] = useState(customer.customFields?.smsNotifications ?? false);
  const [aiReport, setAiReport] = useState<any>(customer.customFields?.aiFashionReport || null);
  const [analyzingStyle, setAnalyzingStyle] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("Yêu cầu spa làm dưỡng đá quý");
  const [ticketSeverity, setTicketSeverity] = useState("Trung bình");
  const [ticketStatus, setTicketStatus] = useState("Đang xử lý");
  const [customTicketSubject, setCustomTicketSubject] = useState("");
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("");

  // Survey States
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyRating, setSurveyRating] = useState<number | null>(null);
  const [surveyComment, setSurveyComment] = useState("");
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  const handleExportPDF = () => {
    const doc = new jsPDF() as any;
    const primaryColor = [47, 108, 245]; // #2f6cf5

    // Add Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("CUSTOMER LOYALTY REPORT", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("SEVA RETAIL - PREMIUM CRM SYSTEM", 105, 30, { align: "center" });

    // Customer Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("THÔNG TIN KHÁCH HÀNG", 20, 55);
    
    doc.autoTable({
      startY: 60,
      head: [["Truong", "Gia tri"]],
      body: [
        ["Ho ten", customer.name],
        ["Email", customer.email],
        ["So dien thoai", customer.phone],
        ["Cap bac", tier.name],
        ["Diem tich luy", points.toLocaleString() + " điểm"],
        ["Ngay gia nhap", formatVietnameseDate(customer.createdAt)],
      ],
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 3 }
    });

    // Activity Summary
    doc.setFontSize(14);
    doc.text("TONG QUAN HOAT DONG", 20, doc.lastAutoTable.finalY + 15);
    
    const activityData = combinedTimeline.slice(0, 10).map(item => [
      item.dateStr,
      item.title,
      item.type.toUpperCase(),
      item.pointsStr || "0"
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Ngay", "Hoat dong", "Loai", "Diem"]],
      body: activityData,
      theme: 'striped',
      headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255] },
      styles: { fontSize: 9 }
    });

    // Footer
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Trang ${i}/${pageCount} - Bao cao duoc tao tu dong boi SEVA CRM`, 105, 285, { align: "center" });
    }

    doc.save(`SEVA_Report_${customer.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    toast.success("Đã xuất báo cáo PDF thành công!");
  };

  // States for unified extended attributes & fashion editing
  const [isEditingAttributes, setIsEditingAttributes] = useState(false);
  const [isSavingAttributes, setIsSavingAttributes] = useState(false);
  const [editedCustomFields, setEditedCustomFields] = useState<Record<string, any>>(customer.customFields || {});

  // Keep state synchronized when customer changes
  React.useEffect(() => {
    setEditedCustomFields(customer.customFields || {});
    setFashionStyle(customer.customFields?.fashionStyle || "classic");
    setColorPalette(customer.customFields?.colorPalette || "neutral");
    setMaterials(customer.customFields?.materials || "gold");
    setOccasions(customer.customFields?.occasions || "daily");
    setBrandReference(customer.customFields?.brandReference || "chanel");
    setAdditionalNotes(customer.customFields?.additionalNotes || "");
    setRingSize(customer.customFields?.ringSize || "");
    setBraceletSize(customer.customFields?.braceletSize || "");
    setNecklaceLength(customer.customFields?.necklaceLength || "");
    setJewelryPreference(customer.customFields?.jewelryPreference || "");
    setEmailNotifications(customer.customFields?.emailNotifications ?? true);
    setSmsNotifications(customer.customFields?.smsNotifications ?? false);
    setAiReport(customer.customFields?.aiFashionReport || null);
  }, [customer]);

  const handleSaveFashionStyle = async (
    newStyle = fashionStyle,
    newPalette = colorPalette,
    newMaterial = materials,
    newOccasion = occasions,
    newBrand = brandReference,
    newNotes = additionalNotes,
    newRingSize = ringSize,
    newBraceletSize = braceletSize,
    newNecklaceLength = necklaceLength,
    newJewelryPref = jewelryPreference
  ) => {
    const updatedCustomFields: Record<string, any> = {
      ...customer.customFields,
      ...editedCustomFields,
      fashionStyle: newStyle,
      colorPalette: newPalette,
      materials: newMaterial,
      occasions: newOccasion,
      brandReference: newBrand,
      additionalNotes: newNotes,
      ringSize: newRingSize,
      braceletSize: newBraceletSize,
      necklaceLength: newNecklaceLength,
      jewelryPreference: newJewelryPref,
      emailNotifications,
      smsNotifications,
    };
    
    // Auto-update tags based on local rules
    const predictionResult = getLocalStylePrediction(newStyle, newPalette, newMaterial, newOccasion, newBrand);
    const currentTags = customer.customFields?.autoTags || [];
    const otherTags = currentTags.filter((t: any) => {
      const tagStr = typeof t === 'string' ? t : (t?.tag || '');
      return !['Classic Luxury', 'Timeless Elegance', 'Quiet Luxury', 'Simplicity', 'High Jewelry', 'Red Carpet', 'Avant-Garde', 'Signature Piece', 'Romantic Style', 'Floral Motif', 'Gold Collector', 'Plat Pure', 'Rose Gold Muse', 'Gemstone Connoisseur', 'Pearl Lover'].includes(tagStr);
    });

    const newLabelTags = predictionResult.autoTags.map(tagStr => ({
      tag: tagStr,
      color: "bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/20"
    }));

    updatedCustomFields.autoTags = [...otherTags, ...newLabelTags];

    const success = await updateFirestore({ customFields: updatedCustomFields }, "Đã cập nhật gu thời trang thành công!");
    return success;
  };

  const handleSaveAllAttributes = async () => {
    setIsSavingAttributes(true);
    const updatedCustomFields: Record<string, any> = {
      ...customer.customFields,
      ...editedCustomFields,
      fashionStyle,
      colorPalette,
      materials,
      occasions,
      brandReference,
      additionalNotes,
      ringSize,
      braceletSize,
      necklaceLength,
      jewelryPreference,
      emailNotifications,
      smsNotifications,
    };
    
    // Auto-update tags based on local rules
    const predictionResult = getLocalStylePrediction(
      fashionStyle,
      colorPalette,
      materials,
      occasions,
      brandReference
    );
    const currentTags = customer.customFields?.autoTags || [];
    const otherTags = currentTags.filter((t: any) => {
      const tagStr = typeof t === 'string' ? t : (t?.tag || '');
      return !['Classic Luxury', 'Timeless Elegance', 'Quiet Luxury', 'Simplicity', 'High Jewelry', 'Red Carpet', 'Avant-Garde', 'Signature Piece', 'Romantic Style', 'Floral Motif', 'Gold Collector', 'Plat Pure', 'Rose Gold Muse', 'Gemstone Connoisseur', 'Pearl Lover'].includes(tagStr);
    });

    const newLabelTags = predictionResult.autoTags.map(tagStr => ({
      tag: tagStr,
      color: "bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/20"
    }));

    updatedCustomFields.autoTags = [...otherTags, ...newLabelTags];

    const success = await updateFirestore({ customFields: updatedCustomFields }, "Đã lưu tất cả thuộc tính thành công!");
    if (success) {
      setIsEditingAttributes(false);
    }
    setIsSavingAttributes(false);
  };

  const triggerAiStyleAnalysis = async () => {
    setAnalyzingStyle(true);
    const toastId = toast.loading("AI đang phân tích xu hướng trang sức cho " + customer.name + "...");
    try {
      const response = await fetch("/api/gemini/analyze-fashion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customer.name,
          attributes: {
            fashionStyle,
            colorPalette,
            materials,
            occasions,
            brandReference,
            additionalNotes,
            gender: customer.region || "Chưa rõ",
            points: points
          }
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const report = resData.data;
        setAiReport(report);
        
        // Save to Firestore
        const updatedCustomFields = {
          ...customer.customFields,
          aiFashionReport: report,
          autoTags: [
            ...(customer.customFields?.autoTags || []).filter((t: any) => {
              const tagStr = typeof t === "string" ? t : (t?.tag || "");
              return !(report.autoTags || []).includes(tagStr);
            }),
            ...(report.autoTags || []).map((tStr: string) => ({
              tag: tStr,
              color: "bg-purple-500/10 text-purple-400 border-purple-500/20"
            }))
          ]
        };
        await updateFirestore({ customFields: updatedCustomFields }, "Đã đồng bộ báo cáo trang sức AI thành công!");
      } else {
        throw new Error(resData.message || "Máy chủ AI không phản hồi kết quả hợp lệ.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể khởi động phân tích AI. Vui lòng kiểm tra API key trong Cấu hình.", { id: toastId });
    } finally {
      setAnalyzingStyle(false);
      toast.dismiss(toastId);
    }
  };

  // Calculates historical spend from order history or assumes a smart tier-based starting baseline
  const getHistoricalAndPredictedCLV = () => {
    const ordersList = customer.orders || [];
    const calculatedSpent = ordersList.reduce((acc: number, o: any) => {
      const cleaned = String(o.total || "0").replace(/[^0-9]/g, "");
      const parsed = parseInt(cleaned, 10) || 0;
      return acc + parsed;
    }, 0);

    const baseHistorical =
      calculatedSpent > 0
        ? calculatedSpent
        : points > 0
          ? points * 15000
          : 15000000;

    // Baseline growth rate scaled by current membership tier
    let tierFactor = 0.15;
    if (points >= 2500) {
      tierFactor = 0.42; // Atelier
    } else if (points >= 1000) {
      tierFactor = 0.28; // Icon
    } else if (points >= 500) {
      tierFactor = 0.2; // Essential
    }

    // Multiply by selected scenario coefficient
    let multiplier = 1.2;
    if (clvScenario === "conservative") multiplier = 0.7;
    if (clvScenario === "optimistic") multiplier = 1.9;

    const annualizedGrowth = tierFactor * multiplier;
    const projectedCLV = baseHistorical * (1 + annualizedGrowth);
    const growthAmount = projectedCLV - baseHistorical;

    return {
      historicalSpent: baseHistorical,
      growthRate: annualizedGrowth,
      predictedCLV: projectedCLV,
      growthAmount,
    };
  };

  const clvStats = getHistoricalAndPredictedCLV();

  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const parseVietnameseDate = (dateVal?: any) => {
    if (!dateVal) return 0;

    // 1. Check if it's already a Date object
    if (dateVal instanceof Date) {
      return dateVal.getTime();
    }

    // 2. Check if it's a Firestore Timestamp or similar object with toDate
    if (dateVal && typeof dateVal.toDate === "function") {
      return dateVal.toDate().getTime();
    }

    // 3. Check if it's a Firestore Timestamp object with _seconds
    if (dateVal && typeof dateVal.seconds === "number") {
      return dateVal.seconds * 1000;
    }

    // 4. If it's a number, assume it's a timestamp
    if (typeof dateVal === "number") {
      return dateVal;
    }

    // Convert to string and clean/parse
    const dateStr = String(dateVal);

    // Check "Hôm qua" format
    if (dateStr.includes("Hôm qua")) {
      const parts = dateStr.split(",");
      const timePart = parts[1]?.trim() || "00:00";
      const [h, m] = timePart.split(":").map(Number);
      const d = new Date();
      d.setDate(d.getDate() - 1);
      d.setHours(h || 0, m || 0, 0, 0);
      return d.getTime();
    }

    // Check Standard DD/MM/YYYY or DD/MM/YYYY HH:MM
    try {
      const dateTimeParts = dateStr.trim().split(" ");
      const datePart = dateTimeParts[0];
      const timePart = dateTimeParts[1] || "00:00";

      const [day, month, year] = datePart.split("/").map(Number);
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        // Fallback standard JS date string parsing
        const sec = Date.parse(dateStr);
        if (!isNaN(sec)) return sec;
        return 0;
      }
      const [hour, minute] = timePart.split(":").map(Number);

      const parsedDate = new Date(
        year,
        month - 1,
        day,
        hour || 0,
        minute || 0,
        0,
        0,
      );
      return parsedDate.getTime() || 0;
    } catch (e) {
      // Fallback standard JS date string parsing
      const sec = Date.parse(dateStr);
      if (!isNaN(sec)) return sec;
      return 0;
    }
  };

  const formatVietnameseDate = (dateVal: any): string => {
    if (!dateVal) return "N/A";
    let d: Date;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (typeof dateVal.toDate === "function") {
      d = dateVal.toDate();
    } else if (typeof dateVal.seconds === "number") {
      d = new Date(dateVal.seconds * 1000);
    } else if (typeof dateVal === "number") {
      d = new Date(dateVal);
    } else {
      // Try to parse string
      const ts = parseVietnameseDate(dateVal);
      if (ts > 0) {
        d = new Date(ts);
      } else {
        const fall = Date.parse(String(dateVal));
        if (!isNaN(fall)) {
          d = new Date(fall);
        } else {
          return String(dateVal);
        }
      }
    }

    // Format to "DD/MM/YYYY HH:MM" or similar
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  // Convert orders, tickets, statusHistory, and creation events into a unified chronological log
  const purchaseEvents = (customer.orders || []).map((o: any) => ({
    id: o.id,
    type: "purchase" as const,
    title: `Giao dịch mua sắm: ${o.id}`,
    description: `Mua: ${o.items || o.description || "Sản phẩm trang sức"}`,
    valueStr: o.total
      ? formatVND(o.total)
      : o.amount
        ? formatVND(o.amount)
        : "N/A",
    pointsStr: o.points ? `+${o.points} điểm` : "+50 điểm",
    badgeText: o.status || "Hoàn thành",
    badgeStyle:
      o.statusClasses ||
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    dateStr: formatVietnameseDate(o.date),
    timestamp: parseVietnameseDate(o.date) || Date.now() - 3600000,
    icon: "🛒",
    iconColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }));

  const ticketEvents = (customer.tickets || []).map((t: any) => ({
    id: t.id,
    type: "ticket" as const,
    title: `Lịch sử hỗ trợ: ${t.id}`,
    description: t.subject
      ? `Chủ đề: ${t.subject}`
      : `Nội dung: ${t.summary || "Hỗ trợ"}`,
    valueStr: t.severity ? `Mức độ: ${t.severity}` : "Yêu cầu",
    pointsStr: "",
    badgeText:
      t.status === "closed"
        ? "Đã đóng"
        : t.status === "open"
          ? "Đang mở"
          : t.status,
    badgeStyle:
      t.status === "Đang xử lý" || t.status === "open"
        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
        : "bg-slate-500/10 text-slate-500 border-slate-500/20",
    dateStr: formatVietnameseDate(t.date || t.createdAt),
    timestamp:
      parseVietnameseDate(t.date || t.createdAt) || Date.now() - 7200000,
    icon: "🎫",
    iconColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  }));

  const statusEvents = (customer.statusHistory || []).map((s: any) => {
    const fromStatusObj = CUSTOMER_STATUSES.find(
      (st) => st.code.toUpperCase() === s.from.toUpperCase(),
    );
    const toStatusObj = CUSTOMER_STATUSES.find(
      (st) => st.code.toUpperCase() === s.to.toUpperCase(),
    );
    return {
      id: s.id,
      type: "status_change" as const,
      title: "Thay đổi trạng thái khách hàng",
      description: `Cập nhật trạng thái từ "${fromStatusObj?.classification || s.from}" sang "${toStatusObj?.classification || s.to}"`,
      valueStr: "Bởi Nhân sự",
      pointsStr: "",
      badgeText: "Cập nhật",
      badgeStyle: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      dateStr: formatVietnameseDate(s.date || s.timestamp),
      timestamp: s.timestamp || parseVietnameseDate(s.date) || Date.now(),
      icon: "🔄",
      iconColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    };
  });

  const redemptionEvents = (customer.redemptions || []).map((r: any) => ({
    id: r.id,
    type: "redemption" as const,
    title: `Đổi quà ưu đãi: ${r.rewardName || r.name}`,
    description: r.description || `Đổi thành công: ${r.rewardName || r.name}`,
    valueStr: `-${r.pointsUsed || r.pointsRequired || r.points || r.value || 0} điểm`,
    pointsStr: `-${r.pointsUsed || r.pointsRequired || r.points || r.value || 0} điểm`,
    badgeText: r.status || "Đã nhận",
    badgeStyle: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    dateStr: formatVietnameseDate(r.date || r.createdAt),
    timestamp: parseVietnameseDate(r.date || r.createdAt) || Date.now() - 5000000,
    icon: "🎁",
    iconColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  }));

  const createdDateStr =
    customer.createdAt?.toDate?.()?.toLocaleDateString("vi-VN") ||
    (customer.createdAt
      ? new Date(customer.createdAt).toLocaleDateString("vi-VN")
      : new Date().toLocaleDateString("vi-VN"));
  const creationEvent = {
    id: "creation-event",
    type: "status_change" as const,
    title: "Khởi tạo hồ sơ khách hàng",
    description: `Hồ sơ khách hàng "${customer.name || "N/A"}" khởi tạo thành công trên hệ thống SEVA CRM`,
    valueStr: "Tạo mới",
    pointsStr: "",
    badgeText: "Thành công",
    badgeStyle: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dateStr: createdDateStr,
    timestamp: parseVietnameseDate(customer.createdAt) || 0,
    icon: "👤",
    iconColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  const combinedTimeline = [
    ...purchaseEvents,
    ...ticketEvents,
    ...statusEvents,
    ...redemptionEvents,
    creationEvent,
  ].sort((a, b) => b.timestamp - a.timestamp);

  const filteredTimeline = combinedTimeline.filter((item) => {
    if (timelineFilter === "all") return true;
    return item.type === timelineFilter;
  });

  const company = companies.find((c) => c.id === customer.companyId);

  // Calculate membership tier dynamically from configs
  const getTierInfo = (pts: number) => {
    if (tierConfigs && tierConfigs.length > 0) {
      // Find eligible tiers
      const eligible = [...tierConfigs].filter(t => pts >= t.threshold).sort((a,b) => b.threshold - a.threshold);
      const nextTier = [...tierConfigs].filter(t => pts < t.threshold).sort((a,b) => a.threshold - b.threshold)[0];
      
      const current = eligible.length > 0 ? eligible[0] : null;
      
      if (!current) {
        return {
          name: "Member (Hạng Phổ thông)",
          nextTarget: nextTier ? `${nextTier.threshold - pts} điểm nâng ${nextTier.name}` : "Tối đa",
          progress: nextTier ? (pts / nextTier.threshold) * 100 : 100,
          color: "text-slate-400 border-slate-400",
          bg: "bg-slate-400/10",
        };
      }

      // Compute color classes based on hex or name
      const c = current.color || "slate";
      let colorClass = "text-slate-400 border-slate-400";
      let bgClass = "bg-slate-400/10";
      
      if (c.toLowerCase().includes("gold") || c === "#f59e0b" || c === "#2f6cf5") {
        colorClass = "text-[#2f6cf5] border-[#2f6cf5]";
        bgClass = "bg-[#2f6cf5]/10";
      } else if (c.toLowerCase().includes("purple") || c === "#a855f7") {
        colorClass = "text-purple-500 border-purple-500";
        bgClass = "bg-purple-500/10";
      } else if (c.toLowerCase().includes("emerald") || c === "#10b981") {
        colorClass = "text-emerald-500 border-emerald-500";
        bgClass = "bg-emerald-500/10";
      }

      return {
        name: current.name,
        nextTarget: nextTier ? `${nextTier.threshold - pts} điểm nâng ${nextTier.name}` : "Hạng cao nhất",
        progress: nextTier ? ((pts - current.threshold) / (nextTier.threshold - current.threshold)) * 100 : 100,
        color: colorClass,
        bg: bgClass,
      };
    }

    // Static fallback
    if (pts >= 10000) {
      return {
        name: "Atelier (Thượng lưu)",
        nextTarget: "Tối đa",
        progress: 100,
        color: "text-[#2f6cf5] border-[#2f6cf5]",
        bg: "bg-[#2f6cf5]/10",
      };
    } else if (pts >= 2500) {
      return {
        name: "Icon (Vàng VIP)",
        nextTarget: `${10000 - pts} điểm nâng Atelier`,
        progress: (pts / 10000) * 100,
        color: "text-yellow-500 border-yellow-500",
        bg: "bg-yellow-500/10",
      };
    } else if (pts >= 500) {
      return {
        name: "Essential (Hạng Bạc)",
        nextTarget: `${2500 - pts} điểm nâng Icon`,
        progress: (pts / 2500) * 100,
        color: "text-sky-500 border-sky-500",
        bg: "bg-sky-500/10",
      };
    } else {
      return {
        name: "Member (Hạng Phổ thông)",
        nextTarget: `${500 - pts} điểm nâng Essential`,
        progress: (pts / 500) * 100,
        color: "text-slate-400 border-slate-400",
        bg: "bg-slate-400/10",
      };
    }
  };

  const tier = getTierInfo(points);

  const handleDeleteCustomer = async () => {
    const docPath = userId === "guest" 
      ? `customers/${customer.id}` // This is a bit tricky for guest, let's assume standard path
      : `customers/${customer.id}`;
    
    setIsDeleting(true);
    const toastId = toast.loading("Đang xóa khách hàng...");
    try {
      if (userId !== "guest") {
        await deleteDoc(doc(db, docPath));
      } else {
        // Handle guest deletion if we had a guest data store,
        // for now we just filter it out locally if needed,
        // but since it's real-time list, Firestore delete is better.
      }
      toast.success("Đã xóa khách hàng khỏi hệ thống", { id: toastId });
      onBack();
    } catch (error: any) {
      console.error("Error deleting customer: ", error);
      toast.error(`Lỗi khi xóa: ${error.message}`, { id: toastId });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const updateFirestore = async (
    updatedData: Partial<Customer>,
    successMessage?: string,
  ) => {
    if (userId === "guest") {
      const toastId = toast.loading("Đang lưu thông tin cục bộ...");
      try {
        const localCustomersStr = localStorage.getItem("crm_guest_customers");
        if (localCustomersStr) {
          const list: Customer[] = JSON.parse(localCustomersStr);
          const idx = list.findIndex(c => c.id === customer.id);
          if (idx !== -1) {
            const updatedCustomerFieldsCustom = {
              ...(list[idx].customFields || {}),
              ...(updatedData.customFields || {})
            };
            list[idx] = {
              ...list[idx],
              ...updatedData,
              customFields: updatedCustomerFieldsCustom,
              updatedAt: new Date() as any
            };
            localStorage.setItem("crm_guest_customers", JSON.stringify(list));
            window.dispatchEvent(new Event("crm_guest_data_changed"));
          }
        }
        if (successMessage) {
          toast.success(successMessage, { id: toastId });
        } else {
          toast.dismiss(toastId);
        }
        return true;
      } catch (err: any) {
        console.error("Local update error: ", err);
        toast.error("Không thể lưu cấu hình cục bộ", { id: toastId });
        return false;
      }
    }

    const docRef = doc(db, `customers/${customer.id}`);
    const toastId = toast.loading("Đang lưu thông tin...");
    try {
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
      if (successMessage) {
        toast.success(successMessage, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
      return true;
    } catch (error) {
      console.error("Error updating customer config: ", error);
      toast.error("Không thể lưu cấu hình đến cloud", { id: toastId });
      return false;
    }
  };

  const handleAdjustPoints = async (amount: number) => {
    const newPts = Math.max(0, points + amount);
    setPoints(newPts);
    const successMsg = `${amount > 0 ? "Thêm" : "Khấu trừ"} ${Math.abs(amount)} điểm thành công!`;
    await updateFirestore({ points: newPts }, successMsg);
  };

  const handleSaveSocialLinks = async () => {
    setIsEditingSocial(false);
    await updateFirestore(
      {
        facebook: fb,
        zalo: zl,
        linkedin: li,
        instagram: ig,
        tiktok: tt,
      },
      "Đã đồng bộ mạng xã hội của khách hàng!",
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Kích thước tệp quá lớn. Vui lòng chọn ảnh nhỏ hơn 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
      toast.success("Tải ảnh lên thành công!");
    };
    reader.onerror = () => {
      toast.error("Có lỗi xảy ra khi đọc tệp ảnh.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileHeader = async () => {
    setIsUpdatingField(false);
    await updateFirestore(
      {
        avatarUrl: avatar,
        phone,
        email,
        facebook: fb,
        tiktok: tt,
        zalo: zl,
        instagram: ig,
        linkedin: li,
      },
      "Cập nhật thông tin thành công!",
    );
  };

  // Helper matching the status definition config colors
  const renderStatusBadge = (status?: string) => {
    if (!status)
      return <span className="text-xs text-muted-foreground">Mới</span>;
    const matched = CUSTOMER_STATUSES.find(
      (s) => s.code.toUpperCase() === status.toUpperCase(),
    );

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${matched ? matched.color.badge : "bg-muted text-muted-foreground"}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {matched?.classification || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/30">
            Mã KH: {getCustomerCode(customer, companies)}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            (Tạo: {customer.createdAt?.toDate?.()?.toLocaleDateString("vi-VN") || "Vừa xong"})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] border border-blue-500/20 bg-blue-500/5 text-blue-600 text-sm font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Xuất PDF
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px] rounded-[10px] border border-border bg-card backdrop-blur-xl">
          <DialogHeader>
            <div className="mb-4 w-12 h-12 rounded-[10px] bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Xác nhận xóa khách hàng</DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Bạn có chắc chắn muốn xóa hồ sơ của <strong>{customer.name}</strong>? 
              Dữ liệu điểm số, lịch sử giao dịch và liên kết mạng xã hội sẽ bị gỡ bỏ vĩnh viễn khỏi SEVA CRM.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-[10px] h-10 font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCustomer}
              disabled={isDeleting}
              className="flex-1 rounded-[10px] h-10 font-bold bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI - CRM PROFILE CARD */}
        <div className="space-y-6 lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[10px] border border-border/50 bg-sidebar/75 backdrop-blur-md p-6 relative overflow-hidden shadow-xl"
          >
            {/* Elegant luxury gold visual overlay background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2f6cf5]/5 blur-3xl rounded-full" />

            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-[10px] border-2 border-[#2f6cf5]/30 overflow-hidden bg-primary/10 text-primary shadow-lg transition-transform hover:scale-105 duration-300 flex items-center justify-center text-2xl font-bold uppercase shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      className="w-full h-full object-cover"
                      alt={customer.name}
                    />
                  ) : (
                    customer.name.slice(0, 2)
                  )}
                </div>
                {!isUpdatingField && (
                  <button
                    onClick={() => setIsUpdatingField(true)}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-background border border-border rounded-[10px] shadow-md hover:text-primary transition-all text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                  {customer.name}
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {company?.name || "Thành viên Cá nhân"}
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 justify-start w-full">
                <div className="flex flex-wrap items-start gap-2 justify-start">
                  {/* Interactive Status Changer Dropdown */}
                  <div className="relative group/status flex items-center gap-1 bg-[#2f6cf5]/5 dark:bg-[#2f6cf5]/10 border border-[#2f6cf5]/20 hover:border-[#2f6cf5]/40 rounded-full px-2.5 py-1 text-xs font-bold text-[#2f6cf5] hover:text-[#2f6cf5] transition-all">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
                    <select
                      value={customer.activityStatus || "ACTIVE"}
                      onChange={async (e) => {
                        const nextStatus = e.target.value;
                        const prevStatus = customer.activityStatus || "ACTIVE";
                        if (nextStatus === prevStatus) return;

                        const logEntry = {
                          id: `ST-${Date.now()}`,
                          type: "status_change",
                          from: prevStatus,
                          to: nextStatus,
                          date:
                            new Date().toLocaleDateString("vi-VN") +
                            " " +
                            new Date().toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            }),
                          timestamp: Date.now(),
                        };

                        const updatedHistory = [
                          ...(customer.statusHistory || []),
                          logEntry,
                        ];
                        await updateFirestore(
                          {
                            activityStatus: nextStatus as any,
                            statusHistory: updatedHistory,
                          },
                          `Đã cập nhật trạng thái mới: ${CUSTOMER_STATUSES.find((st) => st.code === nextStatus)?.classification || nextStatus}`,
                        );
                      }}
                      className="bg-transparent text-xs font-extrabold outline-none cursor-pointer pr-1 appearance-none border-none text-center text-[#2f6cf5]"
                      style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                    >
                      {CUSTOMER_STATUSES.map((st) => (
                        <option
                          key={st.code}
                          value={st.code}
                          className="text-foreground dark:text-white bg-background font-semibold"
                        >
                          {st.classification}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs opacity-65 shrink-0">▼</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full border ${tier.color} ${tier.bg}`}
                  >
                    🏆 {tier.name}
                  </span>
                </div>

                {/* Suggested Status logic from StatusService */}
                {(() => {
                  const lastInteraction = customer.lastTransactionAt ? parseVietnameseDate(customer.lastTransactionAt) : parseVietnameseDate(customer.createdAt);
                  const daysDiff = Math.floor((Date.now() - (lastInteraction || Date.now())) / (1000 * 60 * 60 * 24));
                  
                  const metrics: CustomerActivityMetrics = {
                    lastInteractionDays: daysDiff,
                    lastPurchaseDays: daysDiff,
                    totalOrders: (customer.orders || []).length,
                    isVerified: !!customer.customFields?.verified,
                    isLoyaltyMember: (customer.points || 0) > 0,
                    clv: Number(customer.customFields?.clv) || 0,
                    isVip: (customer.points || 0) >= 2500,
                    hasHighRiskFlags: false
                  };
                  
                  const suggested = StatusService.determineStatus(metrics);
                  const currentStatus = customer.activityStatus || "ACTIVE";
                  
                  if (suggested.code !== currentStatus) {
                    return (
                      <div className="flex flex-col items-center gap-2 bg-indigo-500/5 border border-indigo-500/20 rounded-[10px] p-3 w-full max-w-[280px]">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Phân tích vòng đời (Lifecycle)</span>
                        </div>
                        <p className="text-[11px] text-center text-muted-foreground leading-tight">
                          Giai đoạn vòng đời phù hợp hiện tại: <strong className="text-foreground">{suggested.classification}</strong>
                        </p>
                        <button
                          onClick={async () => {
                            const logEntry = {
                              id: `ST-AUTO-${Date.now()}`,
                              type: "status_change",
                              from: currentStatus,
                              to: suggested.code,
                              date: formatVietnameseDate(Date.now()),
                              timestamp: Date.now(),
                              note: "Tự động gợi ý vòng đời từ hệ thống SEVA"
                            };
                            await updateFirestore({
                              activityStatus: suggested.code as any,
                              statusHistory: [...(customer.statusHistory || []), logEntry]
                            }, `Đã dịch chuyển vòng đời sang: ${suggested.classification}`);
                          }}
                          className="w-full py-1.5 bg-indigo-500 text-white rounded-[10px] text-[10px] font-bold shadow-sm hover:bg-indigo-600 transition-colors"
                        >
                          Cập nhật ngay
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Editing avatar, email, phone */}
            {isUpdatingField ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 border-t pt-4 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase text-[#2f6cf5] tracking-wider mb-2">
                  Sửa thông tin cơ bản
                </h4>

                <div className="space-y-2 bg-background/50 p-3 rounded-[10px] border border-dashed border-border/80">
                  <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider mb-1">
                    CẬP NHẬT ẢNH ĐẠI DIỆN
                  </span>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="file"
                      id="dashboard-avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="dashboard-avatar-upload"
                      className="text-xs font-bold uppercase py-1.5 px-3 bg-[#2f6cf5]/10 hover:bg-[#2f6cf5]/20 border border-[#2f6cf5]/30 text-[#2f6cf5] rounded-[10px] cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3 h-3" /> Tải ảnh từ máy tính
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Vui lòng tải tệp ảnh từ máy
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block font-bold">
                    SỐ ĐIỆN THOẠI
                  </span>
                  <input
                    className="w-full p-2 text-xs bg-background border rounded-[10px] focus:ring-1 focus:ring-primary/20 outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block font-bold">
                    EMAIL KHÁCH HÀNG
                  </span>
                  <input
                    className="w-full p-2 text-xs bg-background border rounded-[10px] focus:ring-1 focus:ring-primary/20 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Facebook</span>
                    <input className="w-full p-2 h-8 text-xs bg-background border rounded-[10px] focus:ring-1 outline-none" value={fb} onChange={(e) => setFb(e.target.value)} placeholder="Link FB" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Zalo</span>
                    <input className="w-full p-2 h-8 text-xs bg-background border rounded-[10px] focus:ring-1 outline-none" value={zl} onChange={(e) => setZl(e.target.value)} placeholder="Số Zalo" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">LinkedIn</span>
                    <input className="w-full p-2 h-8 text-xs bg-background border rounded-[10px] focus:ring-1 outline-none" value={li} onChange={(e) => setLi(e.target.value)} placeholder="Link LinkedIn" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Instagram</span>
                    <input className="w-full p-2 h-8 text-xs bg-background border rounded-[10px] focus:ring-1 outline-none" value={ig} onChange={(e) => setIg(e.target.value)} placeholder="Link Instagram" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">TikTok</span>
                    <input className="w-full p-2 h-8 text-xs bg-background border rounded-[10px] focus:ring-1 outline-none" value={tt} onChange={(e) => setTt(e.target.value)} placeholder="Link TikTok" />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsUpdatingField(false)}
                    className="flex-1 py-1.5 border rounded-[10px] text-xs hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveProfileHeader}
                    className="flex-1 py-1.5 bg-[#2f6cf5] text-white rounded-[10px] text-xs font-bold"
                  >
                    Lưu hồ sơ
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="mt-6 border-t border-border/40 pt-6 space-y-4 text-xs font-medium">
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="w-4 h-4 shrink-0 text-[#2f6cf5]" />
                  <span>{phone || "Chưa cung cấp SĐT"}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="w-4 h-4 shrink-0 text-[#2f6cf5]" />
                  <span className="truncate">{email || "Chưa có email"}</span>
                </div>
                {(fb || zl || li || ig || tt) && (
                  <div className="flex items-center gap-2 pt-1 pl-7">
                    {fb && (
                      <a href={fb.startsWith("http") ? fb : `https://${fb}`} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-[10px] bg-blue-600/10 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                        <Facebook className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {zl && (
                      <a href={zl.startsWith("http") ? zl : `https://zalo.me/${zl}`} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-[10px] bg-sky-500/10 text-sky-600 font-bold text-[10px] flex items-center justify-center hover:bg-sky-500 hover:text-white transition-colors">
                        Z
                      </a>
                    )}
                    {li && (
                      <a href={li.startsWith("http") ? li : `https://${li}`} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-[10px] bg-blue-700/10 text-blue-700 flex items-center justify-center hover:bg-blue-700 hover:text-white transition-colors">
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {ig && (
                      <a href={ig.startsWith("http") ? ig : `https://${ig}`} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-[10px] bg-pink-600/10 text-pink-600 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors">
                        <Instagram className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {tt && (
                      <a href={tt.startsWith("http") ? tt : `https://${tt}`} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-[10px] bg-slate-900/10 dark:bg-slate-200/10 text-slate-800 dark:text-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white dark:hover:text-black transition-colors">
                        <span className="font-extrabold text-[10px]">♬</span>
                      </a>
                    )}
                  </div>
                )}
                {company && (
                  <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors border-t border-border/30 pt-3">
                    <Landmark className="w-4 h-4 shrink-0 text-[#2f6cf5]" />
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">
                        {company.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {company.address || "Không địa chỉ"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* VIP MEMBERSHIP CARD (THẺ HỘI VIÊN) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-[10px] border border-border/50 bg-sidebar/75 p-6 shadow-xl space-y-6 text-left relative overflow-hidden"
          >
            <div>
              <h4 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500 fill-amber-500/10" /> Thẻ hội viên & Đặc quyền
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bảo chứng phân hạng và đặc quyền của hội viên trên hệ thống.
              </p>
            </div>

            {/* Simulated credit card style membership card */}
            {(() => {
              const pts = points;
              // Compute card specifics
              let cardBg = "from-slate-900 via-slate-800 to-zinc-900 text-slate-100";
              let cardTier = "MEMBER";
              let chipColor = "from-yellow-400 to-amber-600";
              let textHex = "text-slate-300";
              let borderCol = "border-slate-700";

              if (pts >= 10000) { // Atelier
                cardBg = "from-zinc-950 via-slate-900 to-purple-950 text-white";
                cardTier = "ATELIER";
                chipColor = "from-zinc-100 to-slate-400";
                textHex = "text-purple-300";
                borderCol = "border-indigo-500/30";
              } else if (pts >= 2500) { // Icon
                cardBg = "from-amber-600 via-[#b45309] to-amber-950 text-amber-50";
                cardTier = "ICON";
                chipColor = "from-yellow-200 to-yellow-500";
                textHex = "text-yellow-300";
                borderCol = "border-yellow-500/30";
              } else if (pts >= 500) { // Essential
                cardBg = "from-slate-500 via-slate-700 to-zinc-800 text-slate-50";
                cardTier = "ESSENTIAL";
                chipColor = "from-zinc-300 to-zinc-500";
                textHex = "text-sky-300";
                borderCol = "border-slate-500/30";
              }

              return (
                <div className={`w-full aspect-[1.58/1] rounded-[10px] bg-gradient-to-tr ${cardBg} p-5 relative overflow-hidden shadow-2xl flex flex-col justify-between border ${borderCol} group`}>
                  {/* Glossy reflection shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none" />
                  
                  {/* Top line: Brand & Signal */}
                  <div className="flex justify-between items-start relative z-10">
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] leading-none text-white/90">SEVA HERITAGE</p>
                      <p className="text-[7px] font-mono text-white/50 tracking-wider">EST. 2024</p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-85">
                      <div className="w-2.5 h-2.5 rounded-full border border-white/40" />
                      <div className="w-2.5 h-2.5 rounded-full border border-white/40 bg-white/20" />
                    </div>
                  </div>

                  {/* Middle part: EMV Chip & Tier Tag */}
                  <div className="flex justify-between items-center relative z-10">
                    {/* Chip */}
                    <div className="w-9 h-7 rounded-sm bg-gradient-to-r from-yellow-400 to-amber-600 relative border border-black/10 overflow-hidden shadow-sm shrink-0">
                      <div className="absolute inset-0 grid grid-cols-3 divide-x divide-black/10">
                        <div className="border-b border-black/10" />
                        <div className="border-b border-black/10" />
                        <div className="border-b border-black/10" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-[10px] bg-white/10 backdrop-blur-sm border border-white/20 text-white">
                        {cardTier}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Card Number & Details */}
                  <div className="relative z-10 flex justify-between items-end">
                    <div className="text-left space-y-1">
                      <p className="font-mono text-xs sm:text-sm tracking-[0.15em] text-white font-semibold">
                        {customer.id ? customer.id.replace(/-/g, ' ') : 'CUS 0000 000'}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white truncate max-w-[150px]">{customer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] font-semibold text-white/50 uppercase tracking-widest">MEMBER SINCE</p>
                      <p className="text-[10px] font-mono font-bold text-white leading-none tracking-wider mt-0.5">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN', {month: '2-digit', year: '2-digit'}) : 'NEW'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* List of Privileges */}
            <div className="space-y-4 pt-2 border-t border-border/40">
              {/* 1. Standard Tier Privileges */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2f6cf5] block">
                  ✓ Đặc quyền theo Cấp bậc:
                </span>
                <div className="space-y-1.5 plan-checklist">
                  {(() => {
                    // Try to get from configs or fallback statically
                    let activeBenefits: { name: string; value: string }[] = [];
                    if (tierConfigs && tierConfigs.length > 0) {
                      const eligible = [...tierConfigs].filter(t => points >= t.threshold).sort((a,b) => b.threshold - a.threshold);
                      if (eligible.length > 0 && eligible[0].benefits) {
                        activeBenefits = eligible[0].benefits;
                      }
                    }
                    if (!activeBenefits || activeBenefits.length === 0) {
                      if (points >= 10000) {
                        activeBenefits = [
                          { name: "Hệ số tích điểm", value: "2.0x (Đặc quyền tối đa)" },
                          { name: "Quà tặng chào mừng", value: "Tráp quà lụa thượng hạng VIP" },
                          { name: "Sinh nhật hoàng gia", value: "Set trang sức độc bản đính đá quý" },
                          { name: "Spa & Vệ sinh trang sức", value: "Đặc trị khuyết tật & Xi mạ cao cấp" },
                          { name: "Sử dụng Private Lounge", value: "Miễn phí 100% kèm trà bánh" },
                          { name: "Chuyên viên tư vấn riêng", value: "Quản lý Showroom phụ trách 24/7" }
                        ];
                      } else if (points >= 2500) {
                        activeBenefits = [
                          { name: "Hệ số tích điểm", value: "1.5x" },
                          { name: "Quà tặng chào mừng", value: "Voucher 1.5M + Nến thơm" },
                          { name: "Sinh nhật hoàng gia", value: "Hộp quà hoa di sản" },
                          { name: "Spa & Vệ sinh trang sức", value: "Miễn phí đánh bóng trọn đời" },
                          { name: "Sử dụng Private Lounge", value: "Giảm 50% phí dịch vụ" },
                          { name: "Chuyên viên tư vấn riêng", value: "Chuyên viên riêng" }
                        ];
                      } else if (points >= 500) {
                        activeBenefits = [
                          { name: "Hệ số tích điểm", value: "1.25x (Ưu đãi)" },
                          { name: "Quà tặng chào mừng", value: "Voucher 500k" },
                          { name: "Sinh nhật hoàng gia", value: "Voucher 1M" },
                          { name: "Spa & Vệ sinh trang sức", value: "Miễn phí đánh bóng" },
                          { name: "Chuyên viên tư vấn riêng", value: "Hotline VIP" }
                        ];
                      } else {
                        activeBenefits = [
                          { name: "Hệ số tích điểm", value: "1.0x (Cơ bản)" },
                          { name: "Quà tặng chào mừng", value: "Thiệp tay Seva Heritage" },
                          { name: "Sinh nhật hoàng gia", value: "Quà lưu niệm" },
                          { name: "Spa & Vệ sinh trang sức", value: "Giảm 20%" },
                          { name: "Chuyên viên tư vấn riêng", value: "Hotline CSKH" }
                        ];
                      }
                    }

                    return activeBenefits.map((benefit: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start text-xs bg-muted/30 px-3 py-2 rounded-[10px] border border-border/40 gap-2">
                        <span className="font-bold text-foreground shrink-0">{benefit.name}:</span>
                        <span className="text-muted-foreground font-medium text-right break-words leading-tight">{benefit.value}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* 2. Personal Privileges */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 block">
                  ★ Đặc quyền riêng biệt của quý hội viên:
                </span>
                {personalPrivileges.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic pl-1 leading-normal">Chưa thiết lập đặc quyền cá nhân hóa riêng. Sử dụng form bên dưới để thêm đặc quyền.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5">
                    {personalPrivileges.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-[10px] text-xs font-bold transition-all">
                        <span className="leading-tight flex-1 break-words">{p}</span>
                        <button
                          onClick={() => handleRemovePrivilege(idx)}
                          type="button"
                          className="text-xs text-rose-500 hover:text-rose-700 hover:scale-110 transition-transform font-bold px-1 py-0.5 ml-2 cursor-pointer rounded-[10px] hover:bg-rose-500/10 shrink-0"
                          title="Xóa đặc quyền riêng này"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Add personal privilege form */}
              <div className="space-y-2 bg-muted/20 p-3 rounded-[10px] border border-border/50">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Thêm đặc quyền riêng của hội viên
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPrivilegeInput}
                    onChange={(e) => setNewPrivilegeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPrivilege();
                      }
                    }}
                    placeholder="VD: Phòng chờ riêng VIP, Tặng hoa kỷ niệm..."
                    className="flex-1 px-3 py-1.5 bg-background border border-border rounded-[10px] text-xs font-medium outline-none focus:ring-1 focus:ring-[#2f6cf5]"
                  />
                  <button
                    onClick={handleAddPrivilege}
                    type="button"
                    className="px-3.5 py-1.5 bg-[#2f6cf5] hover:bg-[#2f6cf5]/90 text-white rounded-[10px] text-xs font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          

          {/* CUSTOM ATTRIBUTES & FASHION PANEL */}
          <div className="rounded-[10px] border border-border/50 bg-sidebar/75 p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Gem className="w-3.5 h-3.5 text-[#2f6cf5]" /> Thuộc tính mở rộng
              </h4>
              <button
                onClick={() => {
                  if (isEditingAttributes) {
                    handleSaveAllAttributes();
                  } else {
                    setEditedCustomFields(customer.customFields || {});
                    setIsEditingAttributes(true);
                  }
                }}
                disabled={isSavingAttributes}
                className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold border transition-all flex items-center gap-1 ${
                  isEditingAttributes
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
                    : "bg-background hover:bg-muted border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSavingAttributes ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : isEditingAttributes ? (
                  <>
                    <Check className="w-3 h-3" /> Lưu
                  </>
                ) : (
                  <>
                    <Edit2 className="w-3 h-3" /> Sửa
                  </>
                )}
              </button>
            </div>

            {isEditingAttributes ? (
              <div className="space-y-4 text-xs animate-in fade-in-40 duration-200">
                {/* Cancel button if editing */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAttributes(false);
                      // reload original values
                      setFashionStyle(customer.customFields?.fashionStyle || "classic");
                      setColorPalette(customer.customFields?.colorPalette || "neutral");
                      setMaterials(customer.customFields?.materials || "gold");
                      setOccasions(customer.customFields?.occasions || "daily");
                      setBrandReference(customer.customFields?.brandReference || "chanel");
                      setAdditionalNotes(customer.customFields?.additionalNotes || "");
                      setRingSize(customer.customFields?.ringSize || "");
                      setBraceletSize(customer.customFields?.braceletSize || "");
                      setNecklaceLength(customer.customFields?.necklaceLength || "");
                      setJewelryPreference(customer.customFields?.jewelryPreference || "");
                    }}
                    className="text-[10px] font-semibold text-rose-500 hover:underline flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> Hủy chỉnh sửa
                  </button>
                </div>

                {/* Section 1: Gu Thời Trang & Phụ Kiện */}
                <div className="space-y-3 border-b border-border/30 pb-3">
                  <span className="text-[10px] font-bold text-[#2f6cf5] uppercase tracking-widest block">
                    Gu thời trang & Phụ kiện
                  </span>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Gu thời trang</label>
                      <select
                        value={fashionStyle}
                        onChange={(e) => setFashionStyle(e.target.value)}
                        className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="classic">Classic Elegant (Cổ điển)</option>
                        <option value="minimalist">Minimalist (Tối giản)</option>
                        <option value="glamorous">Luxury Glamour (Sang trọng)</option>
                        <option value="avant-garde">Avant-Garde (Cá tính)</option>
                        <option value="romantic">Romantic (Lãng mạn)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Tông màu</label>
                      <select
                        value={colorPalette}
                        onChange={(e) => setColorPalette(e.target.value)}
                        className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="neutral">Neutral (Trung tính)</option>
                        <option value="warm">Warm (Tông ấm)</option>
                        <option value="cool">Cool (Tông lạnh)</option>
                        <option value="pastel">Pastel (Vàng nhạt / Hồng)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Chất liệu chính</label>
                      <select
                        value={materials}
                        onChange={(e) => setMaterials(e.target.value)}
                        className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="gold">Yellow Gold (Vàng 18K/24K)</option>
                        <option value="white_gold">White Gold & Platinum</option>
                        <option value="rose_gold">Rose Gold (Vàng hồng)</option>
                        <option value="gemstones">Diamonds & Gemstones</option>
                        <option value="pearls">Natural Pearls (Ngọc trai)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Dịp sử dụng</label>
                      <select
                        value={occasions}
                        onChange={(e) => setOccasions(e.target.value)}
                        className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="daily">Daily Wear (Đeo hàng ngày)</option>
                        <option value="gala">Parties & Gala (Dạ tiệc)</option>
                        <option value="business">Business meetings (Đi làm)</option>
                        <option value="gift">Collector & Gift (Sưu tầm)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Thương hiệu tham chiếu</label>
                      <select
                        value={brandReference}
                        onChange={(e) => setBrandReference(e.target.value)}
                        className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="cartier">Cartier Style</option>
                        <option value="tiffany">Tiffany & Co Style</option>
                        <option value="chanel">Chanel Style</option>
                        <option value="pandora">Pandora Style</option>
                        <option value="chrome_hearts">Alternative Style</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Size nhẫn</label>
                        <input
                          type="text"
                          value={ringSize}
                          onChange={(e) => setRingSize(e.target.value)}
                          placeholder="v.d. 14"
                          className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Size vòng tay</label>
                        <input
                          type="text"
                          value={braceletSize}
                          onChange={(e) => setBraceletSize(e.target.value)}
                          placeholder="v.d. 16cm"
                          className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Chiều dài dây</label>
                        <input
                          type="text"
                          value={necklaceLength}
                          onChange={(e) => setNecklaceLength(e.target.value)}
                          placeholder="v.d. 45cm"
                          className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Loại ưa thích</label>
                        <input
                          type="text"
                          value={jewelryPreference}
                          onChange={(e) => setJewelryPreference(e.target.value)}
                          placeholder="v.d. Bông tai, Nhẫn"
                          className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Ghi chú thời trang</label>
                      <textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="Nhập ghi chú style..."
                        rows={2}
                        className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Tùy chọn thông báo */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                    Tùy chọn nhận thông báo
                  </span>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-2.5 rounded-[10px] border border-border bg-background/50 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-[10px] ${emailNotifications ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"}`}>
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-foreground">Email Loyalty Updates</p>
                          <p className="text-[10px] text-muted-foreground">Nhận cập nhật điểm và hạng qua email</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="w-4 h-4 accent-[#2f6cf5] rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-[10px] border border-border bg-background/50 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-[10px] ${smsNotifications ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-foreground">SMS Loyalty Updates</p>
                          <p className="text-[10px] text-muted-foreground">Nhận mã OTP và ưu đãi qua tin nhắn</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
                        className="w-4 h-4 accent-[#2f6cf5] rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Section 3: Thuộc tính Tùy chỉnh hệ thống */}
                {attributes.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                      Thuộc tính tùy chỉnh
                    </span>
                    <div className="space-y-2">
                      {attributes.map((attr) => {
                        const val = editedCustomFields[attr.key] ?? "";
                        return (
                          <div key={attr.id} className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block">
                              {attr.label} {attr.isRequired && <span className="text-rose-500">*</span>}
                            </label>
                            
                            {attr.type === "textarea" ? (
                              <textarea
                                value={val}
                                onChange={(e) => setEditedCustomFields({ ...editedCustomFields, [attr.key]: e.target.value })}
                                placeholder={attr.placeholder}
                                className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none resize-none"
                                rows={2}
                              />
                            ) : attr.type === "select" ? (
                              <select
                                value={val}
                                onChange={(e) => setEditedCustomFields({ ...editedCustomFields, [attr.key]: e.target.value })}
                                className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                              >
                                <option value="">-- Chọn --</option>
                                {attr.options?.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : attr.type === "radio" ? (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {attr.options?.map((opt) => (
                                  <label key={opt} className="flex items-center gap-1 cursor-pointer text-xs font-medium text-foreground">
                                    <input
                                      type="radio" 
                                      name={`attr_${attr.key}`} 
                                      value={opt} 
                                      checked={val === opt}
                                      onChange={(e) => setEditedCustomFields({ ...editedCustomFields, [attr.key]: e.target.value })}
                                      className="accent-[#2f6cf5] w-3.5 h-3.5"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            ) : attr.type === "checkbox" ? (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {attr.options?.map((opt) => {
                                  const currentValues = Array.isArray(val) ? val : (val ? [val] : []);
                                  const isChecked = currentValues.includes(opt);
                                  return (
                                    <label key={opt} className="flex items-center gap-1 cursor-pointer text-xs font-medium text-foreground">
                                      <input 
                                        type="checkbox" 
                                        value={opt} 
                                        checked={isChecked}
                                        onChange={() => {
                                          const newValues = isChecked 
                                            ? currentValues.filter((v: any) => v !== opt)
                                            : [...currentValues, opt];
                                          setEditedCustomFields({ ...editedCustomFields, [attr.key]: newValues });
                                        }}
                                        className="accent-[#2f6cf5] w-3.5 h-3.5 rounded-sm"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <input
                                type={attr.type === "number" ? "number" : attr.type === "date" ? "date" : "text"}
                                value={val}
                                onChange={(e) => setEditedCustomFields({ ...editedCustomFields, [attr.key]: e.target.value })}
                                placeholder={attr.placeholder}
                                className="w-full bg-background border border-border rounded-[10px] px-2 py-1 text-xs text-foreground focus:outline-none"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveAllAttributes}
                  disabled={isSavingAttributes}
                  className="w-full bg-[#2f6cf5] hover:bg-[#2f6cf5]/90 text-white font-bold py-2 px-4 rounded-[10px] text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {isSavingAttributes ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Lưu Thay Đổi
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* View Mode Section 1: Gu Thời Trang & Thẩm Mỹ */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-background/30 p-2 rounded-[10px] border border-border/30">
                    <span className="text-muted-foreground font-medium">Gu thời trang:</span>
                    <span className="font-bold text-foreground">
                      {fashionStyle === "classic" && "Classic Elegant"}
                      {fashionStyle === "minimalist" && "Minimalist"}
                      {fashionStyle === "glamorous" && "Luxury Glamour"}
                      {fashionStyle === "avant-garde" && "Avant-Garde"}
                      {fashionStyle === "romantic" && "Romantic"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-background/30 p-2 rounded-[10px] border border-border/30">
                    <span className="text-muted-foreground font-medium">Tông màu ưa thích:</span>
                    <span className="font-bold text-[#2f6cf5] capitalize">
                      {colorPalette === "neutral" ? "Neutral" : colorPalette === "warm" ? "Warm" : colorPalette === "cool" ? "Cool" : "Pastel"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-background/30 p-2 rounded-[10px] border border-border/30">
                    <span className="text-muted-foreground font-medium">Chất liệu tối ưu:</span>
                    <span className="font-bold text-foreground capitalize">
                      {materials === "gold" && "Vàng 18K/24K"}
                      {materials === "white_gold" && "Vàng Trắng / Bạch Kim"}
                      {materials === "rose_gold" && "Vàng Hồng"}
                      {materials === "gemstones" && "Đá quý & Kim cương"}
                      {materials === "pearls" && "Ngọc trai Akoya"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-background/30 p-2 rounded-[10px] border border-border/30">
                    <span className="text-muted-foreground font-medium">Dịp sử dụng:</span>
                    <span className="font-bold text-foreground">
                      {occasions === "daily" && "Hàng ngày"}
                      {occasions === "gala" && "Sự kiện / Dạ tiệc"}
                      {occasions === "business" && "Công sở / Ngoại giao"}
                      {occasions === "gift" && "Sưu tầm di sản"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-background/30 p-2 rounded-[10px] border border-border/30">
                    <span className="text-muted-foreground font-medium">Thương hiệu Ref:</span>
                    <span className="font-bold text-foreground capitalize">
                      {brandReference} Style
                    </span>
                  </div>

                  {/* Ring size, bracelet size, necklace length, preference fields */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30 mt-4">
                    <div className="col-span-2 mb-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Thông báo ưu tiên</span>
                    </div>
                    <div className={`p-2 rounded-[10px] border ${emailNotifications ? "bg-blue-500/5 border-blue-500/20" : "bg-muted/20 border-border/20"} flex items-center gap-2`}>
                      <Mail className={`w-3.5 h-3.5 ${emailNotifications ? "text-blue-500" : "text-muted-foreground"}`} />
                      <span className={`text-[10px] font-bold ${emailNotifications ? "text-blue-600" : "text-muted-foreground"}`}>Email: {emailNotifications ? "Bật" : "Tắt"}</span>
                    </div>
                    <div className={`p-2 rounded-[10px] border ${smsNotifications ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/20 border-border/20"} flex items-center gap-2`}>
                      <MessageSquare className={`w-3.5 h-3.5 ${smsNotifications ? "text-amber-500" : "text-muted-foreground"}`} />
                      <span className={`text-[10px] font-bold ${smsNotifications ? "text-amber-600" : "text-muted-foreground"}`}>SMS: {smsNotifications ? "Bật" : "Tắt"}</span>
                    </div>
                  </div>

                  {/* Ring size, bracelet size, necklace length, preference fields */}
                  {(ringSize || braceletSize || necklaceLength || jewelryPreference) && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {ringSize && (
                        <div className="bg-background/20 p-2 rounded-[10px] border border-border/20">
                          <span className="text-[10px] text-muted-foreground block font-medium">Size nhẫn</span>
                          <span className="font-extrabold text-[#2f6cf5]">{ringSize}</span>
                        </div>
                      )}
                      {braceletSize && (
                        <div className="bg-background/20 p-2 rounded-[10px] border border-border/20">
                          <span className="text-[10px] text-muted-foreground block font-medium">Size vòng tay</span>
                          <span className="font-extrabold text-[#2f6cf5]">{braceletSize}</span>
                        </div>
                      )}
                      {necklaceLength && (
                        <div className="bg-background/20 p-2 rounded-[10px] border border-border/20">
                          <span className="text-[10px] text-muted-foreground block font-medium">Chiều dài dây</span>
                          <span className="font-extrabold text-[#2f6cf5]">{necklaceLength}</span>
                        </div>
                      )}
                      {jewelryPreference && (
                        <div className="bg-background/20 p-2 rounded-[10px] border border-border/20">
                          <span className="text-[10px] text-muted-foreground block font-medium">Loại ưa thích</span>
                          <span className="font-extrabold text-[#2f6cf5] truncate block">{jewelryPreference}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {additionalNotes && (
                    <div className="bg-[#2f6cf5]/5 p-3 rounded-[10px] border border-[#2f6cf5]/10 mt-1">
                      <span className="text-[10px] text-[#2f6cf5] block font-bold uppercase tracking-wider mb-0.5">
                        Ghi chú của tư vấn viên
                      </span>
                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                        "{additionalNotes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* View Mode Section 2: Thuộc tính Tùy chỉnh (From attributes props) */}
                {attributes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                      Thuộc tính tùy chỉnh
                    </span>
                    {attributes.map((attr) => (
                      <div
                        key={attr.id}
                        className="flex justify-between items-center bg-background/50 p-2 rounded-[10px] text-xs border border-border/35"
                      >
                        <span className="text-muted-foreground font-medium">
                          {attr.label}
                        </span>
                        <span className="font-bold text-foreground">
                          {Array.isArray(customer.customFields?.[attr.key])
                            ? (customer.customFields?.[attr.key] as string[]).join(", ")
                            : customer.customFields?.[attr.key]?.toString() || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CỘT GIỮA & CỘT PHẢI - TOÀN CẢNH ENGAGEMENT ENGINE */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6 w-full">
            <TabsList className="bg-muted/50 border p-1 rounded-[10px]">
              <TabsTrigger value="overview" className="rounded-[10px] text-xs font-bold px-4 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Tổng quan</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-[10px] text-xs font-bold px-4 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm">Timeline Sự kiện</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-0 animate-in fade-in-50 duration-500">
              {/* LOYALTY ENGINE DYNAMIC VISUALIZER CONTAINER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interactive Points Control Box */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative flex flex-col justify-between overflow-hidden shadow-lg transition-colors border border-[#2f6cf5]/30 bg-gradient-to-br from-sidebar/90 to-sidebar/40 p-6 rounded-[10px] hover:shadow-xl hover:border-[#2f6cf5]/50 group"
            >
              {/* Decorative glows */}
              <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-[#2f6cf5] to-indigo-600 rounded-l-3xl" />
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#2f6cf5]/20 rounded-full blur-3xl group-hover:bg-[#2f6cf5]/30 transition-colors" />
              <div className="absolute right-10 bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crown className="w-24 h-24 text-[#2f6cf5]" />
              </div>

              <div className="relative z-10 pl-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2f6cf5] uppercase tracking-widest block bg-[#2f6cf5]/10 px-2.5 py-1 rounded-[10px] border border-[#2f6cf5]/20 w-fit">
                    QUỸ LOYALTY
                  </span>
                  <Sparkles className="w-4 h-4 text-[#2f6cf5]" />
                </div>
                
                <div className="flex items-baseline gap-2 mt-4 relative">
                  <span className="text-5xl font-black text-foreground tracking-tighter drop-shadow-sm font-heading">
                    {points.toLocaleString()}
                  </span>
                  <span className="text-sm font-extrabold text-[#2f6cf5] uppercase tracking-wider bg-background px-1.5 py-0.5 rounded shadow-sm border border-border/50">điểm</span>
                </div>
                
                <div className="mt-5 space-y-2">
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    Sử dụng điểm để đổi quà, nâng hạng thành viên và tận hưởng các đặc quyền thượng lưu.
                  </p>
                  <div className="flex gap-2 text-[10px] font-bold">
                    <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +150 tháng này
                    </span>
                    <span className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded border border-amber-500/20">
                      Sắp hết hạn: 0
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Loyalty tier roadmap & meter */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              transition={{ delay: 0.1 }}
              className="flex flex-col justify-between shadow-md transition-colors border border-border/50 bg-sidebar/75 p-6 rounded-[10px] hover:shadow-lg hover:border-primary/30 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  LỘ TRÌNH ĐẶC QUYỀN VIP
                </span>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground capitalize">
                    {tier.name.split(" ")[0]}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-[10px] border border-amber-500/20">
                    {tier.nextTarget.replace(/pts?/g, 'điểm')}
                  </span>
                </div>

                {/* Meter road bar */}
                <div className="w-full bg-muted/60 rounded-full h-3 mt-3 overflow-hidden relative border border-border/40">
                  <div
                    className="bg-gradient-to-r from-amber-500/80 via-amber-400 to-yellow-500 h-full rounded-full transition-all duration-700 ease-out relative"
                    style={{ width: `${tier.progress}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 blur-[2px]" />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-wide">
                  <div className="flex flex-col items-center gap-1 relative">
                    <div className="w-1 h-3 border-l-2 border-border/60 absolute -top-3" />
                     Member
                  </div>
                  <div className="flex flex-col items-center gap-1 relative">
                    <div className="w-1 h-3 border-l-2 border-border/60 absolute -top-3" />
                     Essential
                  </div>
                  <div className="flex flex-col items-center gap-1 relative">
                    <div className="w-1 h-3 border-l-2 border-border/60 absolute -top-3" />
                     Icon
                  </div>
                  <div className="flex flex-col items-center gap-1 relative">
                    <div className="w-1 h-3 border-l-2 border-border/60 absolute -top-3" />
                     Atelier
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/5 p-3 rounded-[10px] border border-amber-500/20 mt-5 flex items-center gap-3 relative z-10 transition-colors hover:bg-amber-500/10">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Sử dụng điểm đổi quà cao cấp
                  </p>
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 truncate">
                    Phòng chờ VIP, Sự kiện kín tại showroom
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* BIỂU ĐỒ DỰ BÁO GIÁ TRỊ VÒNG ĐỜI KHÁCH HÀNG (FORECAST CUSTOMER LIFETIME VALUE) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-[10px] border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-5"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#2f6cf5]" />
                  Dự báo Giá trị Vòng đời Khách hàng (Predictive CLV Forecast)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mô hình học máy dự phóng xu hướng chi tiêu 12 tháng kế tiếp
                  dựa trên điểm số Loyalty ({points} điểm) & hạng thành viên{" "}
                  <span className="font-bold capitalize text-primary">
                    {tier.name.split(" ")[0]}
                  </span>
                  .
                </p>
              </div>

              {/* Scenario Toggle Button Suite */}
              <div className="flex items-center gap-1.5 self-start md:self-center bg-muted/40 p-1 rounded-[10px] border border-border/40">
                <span className="text-xs font-bold text-muted-foreground uppercase px-2">
                  Kịch bản:
                </span>
                <button
                  onClick={() => setClvScenario("conservative")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-[10px] transition-all cursor-pointer ${
                    clvScenario === "conservative"
                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-2xs font-extrabold"
                      : "text-muted-foreground border border-transparent hover:bg-muted font-bold"
                  }`}
                >
                  Thận trọng
                </button>
                <button
                  onClick={() => setClvScenario("baseline")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-[10px] transition-all cursor-pointer ${
                    clvScenario === "baseline"
                      ? "bg-[#2f6cf5]/10 text-[#2f6cf5] border border-[#2f6cf5]/20 shadow-2xs font-extrabold"
                      : "text-muted-foreground border border-transparent hover:bg-muted font-bold"
                  }`}
                >
                  Cơ bản
                </button>
                <button
                  onClick={() => setClvScenario("optimistic")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-[10px] transition-all cursor-pointer ${
                    clvScenario === "optimistic"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-2xs font-extrabold"
                      : "text-muted-foreground border border-transparent hover:bg-muted font-bold"
                  }`}
                >
                  Lạc quan
                </button>
              </div>
            </div>

            {/* Financial Insight KPIs Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                className="bg-background/45 p-3 rounded-[10px] border border-border/40 hover:border-emerald-500/30 transition-colors shadow-2xs hover:shadow-md"
              >
                <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">
                  ĐÃ CHI TIÊU
                </span>
                <span className="text-sm font-black text-foreground block mt-1">
                  {formatVND(clvStats.historicalSpent)}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{" "}
                  Hồ sơ ghi nhận
                </span>
              </motion.div>
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                className="bg-background/45 p-3 rounded-[10px] border border-border/40 hover:border-[#2f6cf5]/30 transition-colors shadow-2xs hover:shadow-md"
              >
                <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">
                  CLV LŨY KẾ DỰ DỰ KIẾN
                </span>
                <span className="text-sm font-black text-[#2f6cf5] block mt-1">
                  {formatVND(clvStats.predictedCLV)}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 block flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2f6cf5] inline-block animate-pulse" />{" "}
                  Sau 12 tháng dự kiến
                </span>
              </motion.div>
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                className="bg-background/45 p-3 rounded-[10px] border border-border/40 col-span-2 md:col-span-1 hover:border-emerald-500/30 transition-colors shadow-2xs hover:shadow-md"
              >
                <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">
                  TĂNG TRƯỞNG DỰ KIẾN
                </span>
                <span className="text-sm font-black text-emerald-500 block mt-1 flex items-center gap-1">
                  +{formatVND(clvStats.growthAmount)}
                  <span className="text-xs font-bold text-emerald-500">
                    ({(clvStats.growthRate * 100).toFixed(1)}%)
                  </span>
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 block flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-yellow-500" /> Hệ số tăng
                  trưởng hạng KH
                </span>
              </motion.div>
            </div>

            {/* Recharts Area Container */}
            <div className="h-[220px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    {
                      name: "3 tháng trước",
                      "Đã Chi Tiêu": Math.round(
                        clvStats.historicalSpent * 0.45,
                      ),
                      "Dự Báo CLV": null,
                    },
                    {
                      name: "2 tháng trước",
                      "Đã Chi Tiêu": Math.round(clvStats.historicalSpent * 0.7),
                      "Dự Báo CLV": null,
                    },
                    {
                      name: "1 tháng trước",
                      "Đã Chi Tiêu": Math.round(clvStats.historicalSpent * 0.9),
                      "Dự Báo CLV": null,
                    },
                    {
                      name: "Hiện tại",
                      "Đã Chi Tiêu": clvStats.historicalSpent,
                      "Dự Báo CLV": clvStats.historicalSpent,
                    },
                    {
                      name: "+3 tháng tới",
                      "Đã Chi Tiêu": null,
                      "Dự Báo CLV": Math.round(
                        clvStats.historicalSpent *
                          (1 + clvStats.growthRate * 0.25),
                      ),
                    },
                    {
                      name: "+6 tháng tới",
                      "Đã Chi Tiêu": null,
                      "Dự Báo CLV": Math.round(
                        clvStats.historicalSpent *
                          (1 + clvStats.growthRate * 0.5),
                      ),
                    },
                    {
                      name: "+9 tháng tới",
                      "Đã Chi Tiêu": null,
                      "Dự Báo CLV": Math.round(
                        clvStats.historicalSpent *
                          (1 + clvStats.growthRate * 0.75),
                      ),
                    },
                    {
                      name: "+12 tháng tới",
                      "Đã Chi Tiêu": null,
                      "Dự Báo CLV": Math.round(clvStats.predictedCLV),
                    },
                  ]}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                    <linearGradient id="colorCLV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2f6cf5" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#2f6cf5"
                        stopOpacity={0.01}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.06)"
                  />

                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: "currentColor",
                      opacity: 0.65,
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                    tick={{
                      fill: "currentColor",
                      opacity: 0.65,
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  />

                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isHistorical =
                          data["Đã Chi Tiêu"] !== null &&
                          data.name !== "Hiện tại";
                        return (
                          <div className="bg-popover border border-border/80 p-3 rounded-[10px] shadow-xl font-sans text-xs space-y-1.5 backdrop-blur-md">
                            <p className="font-extrabold text-foreground">
                              {data.name}
                            </p>
                            {data["Đã Chi Tiêu"] !== null && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-muted-foreground font-semibold">
                                  Thực tế chi tiêu:
                                </span>
                                <span className="font-bold text-foreground">
                                  {formatVND(data["Đã Chi Tiêu"])}
                                </span>
                              </div>
                            )}
                            {data["Dự Báo CLV"] !== null && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#2f6cf5]" />
                                <span className="text-muted-foreground font-semibold">
                                  Dự báo CLV:
                                </span>
                                <span className="font-bold text-[#2f6cf5]">
                                  {formatVND(data["Dự Báo CLV"])}
                                </span>
                              </div>
                            )}
                            {!isHistorical && (
                              <div className="text-xs text-muted-foreground border-t border-border/40 pt-1 flex items-center gap-1 font-semibold">
                                <span>🔮 Kịch bản:</span>
                                <span className="text-primary capitalize">
                                  {clvScenario === "baseline"
                                    ? "Cơ bản"
                                    : clvScenario === "conservative"
                                      ? "Thận trọng"
                                      : "Lạc quan"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="Đã Chi Tiêu"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSpent)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    dot={{ r: 3, strokeWidth: 0, fill: "#10b981" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="Dự Báo CLV"
                    stroke="#2f6cf5"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    fillOpacity={1}
                    fill="url(#colorCLV)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    dot={{ r: 3, strokeWidth: 0, fill: "#2f6cf5" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* API ĐƠN HÀNG ĐÃ MUA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-[10px] border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
                  ĐƠN HÀNG ĐÃ MUA (CRM API)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dữ liệu đơn hàng đồng bộ trực tiếp từ hệ thống ERP/CRM.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    // Start by simulating the POST to the new gateway API
                    const apiRes = await fetch("/api/pos/orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        customerPhone: customer.phone,
                        items: "OLED Smart TV 4K...",
                      }),
                    });

                    const result = await apiRes.json();

                    if (result.success) {
                      // On success, we apply the updated data to Firestore
                      const newOrder = result.data;
                      const mockOrders = [
                        newOrder,
                        {
                          id: `SO-${Math.floor(Math.random() * 10000)}`,
                          date: "15/04/2026",
                          total: "35,000,000 đ",
                          status: "Đang giao",
                          items: "Apple Watch Series 11...",
                          statusClasses:
                            "bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/20",
                        },
                      ];
                      await updateFirestore(
                        { orders: [...(customer.orders || []), ...mockOrders] },
                        result.message,
                      );
                    } else {
                      toast.error(result.message);
                    }
                  } catch (err: any) {
                    toast.error(`Lỗi hệ thống: ${err.message}`);
                  }
                }}
                className="px-3 py-1 rounded-[10px] text-xs font-bold border border-border bg-background hover:bg-muted transition-all flex items-center gap-1.5"
                title="Đồng bộ dữ liệu mới nhất"
              >
                <RefreshCw className="w-3 h-3 text-[#2f6cf5]" /> Đồng bộ giả lập
              </button>
            </div>

            <div className="space-y-3">
              {!customer.orders || customer.orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed rounded-[10px]">
                  <div className="w-12 h-12 bg-background border rounded-[10px] flex items-center justify-center mb-3 text-muted-foreground shadow-sm">
                    🛒
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    Chưa có thông tin đơn hàng
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Hệ thống chưa ghi nhận phát sinh đơn hàng nào hoặc API chưa
                    đồng bộ dữ liệu.
                  </span>
                </div>
              ) : (
                customer.orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-[10px] border border-border/60 bg-background shadow-sm hover:border-primary/20 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {order.id}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${order.statusClasses}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {order.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate max-w-[200px]">
                        {order.items}
                      </span>
                      <span>{formatVietnameseDate(order.date)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* QUÀ TẶNG & ƯU ĐÃI (Moved from left column to main tab) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Thẻ Quà Tặng */}
            <div className="rounded-[10px] border border-rose-500/20 bg-sidebar/75 p-6 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> Quà Tặng
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Quà tặng khách hàng được tặng</p>
                </div>
              </div>
              <div className="space-y-2 relative z-10">
                {MOCK_REWARDS.filter(r => r.category === "Gift" || r.category === "Fashion").map(reward => (
                  <div key={reward.id} className="flex items-center gap-3 p-3 rounded-[10px] border border-rose-500/10 bg-background/50 hover:bg-rose-500/5 transition-colors">
                    <div className="w-10 h-10 rounded-[10px] overflow-hidden shrink-0">
                      <img src={reward.image} alt={reward.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold truncate">{reward.name}</h5>
                      <p className="text-[10px] text-muted-foreground truncate">{reward.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thẻ Ưu Đãi (previously Đổi quà tặng) */}
            <div className="rounded-[10px] border border-indigo-500/20 bg-sidebar/75 p-6 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Ưu Đãi
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Các ưu đãi của khách hàng</p>
                </div>
              </div>
              <div className="space-y-2 relative z-10">
                {MOCK_REWARDS.filter(r => r.category === "Lifestyle" || r.category === "Event").map(reward => (
                  <div key={reward.id} className="flex items-center gap-3 p-3 rounded-[10px] border border-indigo-500/10 bg-background/50 hover:bg-indigo-500/5 transition-colors">
                    <div className="w-10 h-10 rounded-[10px] overflow-hidden shrink-0">
                      <img src={reward.image} alt={reward.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold truncate">{reward.name}</h5>
                      <p className="text-[10px] text-muted-foreground truncate">{reward.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* TƯƠNG TÁC (TIN NHẮN ĐÃ GỬI) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="rounded-[10px] border border-emerald-500/20 bg-sidebar/75 p-6 shadow-lg space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Tương Tác
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Các tin nhắn đã gửi cho khách hàng</p>
              </div>
            </div>
            <div className="space-y-2 relative z-10">
              {MOCK_EMAIL_COMMS.map((comm) => (
                <div key={comm.id} className="p-3 rounded-[10px] border border-emerald-500/10 bg-background flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold">{comm.subject}</span>
                    <span className="text-[10px] whitespace-nowrap text-muted-foreground font-medium">{comm.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${
                      comm.status === 'delivered' ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10' :
                      comm.status === 'opened' ? 'border-blue-500/30 text-blue-600 bg-blue-500/10' :
                      'border-border text-muted-foreground'
                    }`}>
                      {comm.status === 'delivered' ? 'Đã Gửi' : comm.status === 'opened' ? 'Đã Xem' : comm.status}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase opacity-70 border border-border px-1.5 py-0.5 rounded">
                      {comm.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* API PHIẾU HỖ TRỢ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-[10px] border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-4"
          >
            <div className="flex flex-col gap-4 border-b border-border/40 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5 font-heading">
                    🎫 PHIẾU HỖ TRỢ & TICKET (CRM API)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Đồng bộ trạng thái khiếu nại, bảo dưỡng & dịch vụ khách hàng từ CRM của SEVA.
                  </p>
                </div>
              </div>

              {/* CRM Sandbox Panel */}
              <div className="bg-background/40 p-4 rounded-[10px] border border-border/50 space-y-3.5 text-left">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-[#2f6cf5] tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Hộp Cát Giả Lập Phiếu CRM (API Sandbox)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Chủ đề yêu cầu</label>
                    <select
                      value={ticketSubject}
                      onChange={(e) => {
                        setTicketSubject(e.target.value);
                        if (e.target.value !== "custom") setCustomTicketSubject("");
                      }}
                      className="w-full bg-background/80 border border-border/70 rounded-[10px] px-3 py-1.5 text-xs text-foreground font-medium focus:outline-none focus:border-primary"
                    >
                      <option value="Yêu cầu spa làm dưỡng đá quý">Spa làm dưỡng đá quý & Kim cương</option>
                      <option value="Hỗ trợ chỉnh cỡ (size) nhẫn Atelier">Chỉnh lại cỡ nhẫn cưới Atelier</option>
                      <option value="Khiếu nại về việc tích điểm sai số">Đối soát và khiếu nại tích lũy điểm</option>
                      <option value="Đăng ký gặp chuyên gia thiết kế riêng">Đặt lịch hẹn NTK Trang sức Seva</option>
                      <option value="Yêu cầu bảo hành chuỗi ngọc trai">Bảo hành làm bóng chuỗi ngọc trai</option>
                      <option value="custom">-- Viết chủ đề tùy chỉnh --</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase font-sans">Mức độ ưu tiên</label>
                    <div className="grid grid-cols-3 gap-1">
                      {["Thấp", "Trung bình", "Cao"].map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setTicketSeverity(sev)}
                          className={`py-1 rounded-[10px] text-[10.5px] font-bold border transition-all ${
                            ticketSeverity === sev
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {ticketSubject === "custom" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Nội dung tùy chỉnh</label>
                    <input
                      type="text"
                      placeholder="Nhập chủ đề yêu cầu hỗ trợ..."
                      value={customTicketSubject}
                      onChange={(e) => setCustomTicketSubject(e.target.value)}
                      className="w-full bg-background border border-border/70 rounded-[10px] px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                    Trạng thái: 
                    <span className="ml-1 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-black text-[9.5px]">
                      Đang xử lý
                    </span>
                  </div>

                  <button
                    onClick={async () => {
                      const finalSubject = ticketSubject === "custom" ? (customTicketSubject || "Yêu cầu hỗ trợ mới") : ticketSubject;
                      const toastId = toast.loading("Đang gửi yêu cầu và đồng bộ từ CRM...");
                      try {
                        const apiRes = await fetch("/api/crm/tickets", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            customerPhone: customer.phone,
                            subject: finalSubject,
                            severity: ticketSeverity,
                            status: "Đang xử lý",
                          }),
                        });

                        const result = await apiRes.json();

                        if (result.success) {
                          await updateFirestore(
                            {
                              tickets: [
                                result.data,
                                ...(customer.tickets || []),
                              ],
                            },
                            "Đã gửi và đồng bộ phiếu hỗ trợ lên CRM hệ thống!"
                          );
                        } else {
                          toast.error(result.message, { id: toastId });
                        }
                      } catch (err: any) {
                        toast.error(`Lỗi hệ thống: ${err.message}`, { id: toastId });
                      }
                    }}
                    className="px-4 py-1.5 rounded-[10px] text-xs font-black bg-[#2f6cf5] hover:bg-blue-600 text-white transition-all flex items-center justify-center gap-1 shadow-md active:scale-95"
                  >
                    🎫 Gửi Phiếu & Đồng Bộ
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {!customer.tickets || customer.tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 border border-dashed rounded-[10px]">
                  <div className="w-12 h-12 bg-background border rounded-[10px] flex items-center justify-center mb-3 text-muted-foreground shadow-sm">
                    🎫
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    Chưa có phiếu hỗ trợ
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Khách hàng chưa có yêu cầu hỗ trợ hoặc khiếu nại nào được ghi nhận.
                  </span>
                </div>
              ) : (
                customer.tickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-[10px] border border-border/60 bg-background shadow-sm hover:border-primary/20 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground select-all">
                          {ticket.id}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ticket.status === "Đang xử lý" || ticket.status === "open" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}
                        >
                          {ticket.status === "open" ? "Đang mở" : ticket.status === "closed" ? "Đã đóng" : ticket.status}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${ticket.severity === "Cao" || ticket.severity === "High" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}`}
                      >
                        {ticket.severity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground gap-3">
                      <span className="truncate max-w-[280px] font-semibold text-foreground text-left">
                        {ticket.subject || ticket.summary}
                      </span>
                      <span className="shrink-0 text-[10px] font-mono text-muted-foreground/85">
                        {formatVietnameseDate(ticket.date || ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
          </TabsContent>

          <TabsContent value="emails" className="space-y-6 mt-0 animate-in fade-in-50 duration-500">
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
               <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                     <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                           <Mail className="w-5 h-5 text-indigo-500" /> Lịch sử Email Communications
                        </CardTitle>
                        <CardDescription className="text-xs">Theo dõi các chiến dịch email đã gửi đến khách hàng này.</CardDescription>
                     </div>
                     <Badge variant="outline" className="bg-indigo-500/5 text-indigo-500 border-indigo-500/20">
                        {MOCK_EMAIL_COMMS.length} Emails
                     </Badge>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y divide-border/30">
                     {MOCK_EMAIL_COMMS.map((email) => (
                        <div key={email.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                           <div className="flex items-start gap-4">
                              <div className={cn(
                                 "w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                 email.type === "automated" ? "bg-emerald-500/10 text-emerald-500" :
                                 email.type === "marketing" ? "bg-amber-500/10 text-amber-500" :
                                 "bg-blue-500/10 text-blue-500"
                              )}>
                                 <Mail className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                 <h5 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{email.subject}</h5>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[10px] bg-muted text-muted-foreground">
                                       {email.type}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">{email.date}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-2">
                              {email.status === "opened" ? (
                                 <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1 text-[10px]">
                                    <Check className="w-3 h-3" /> Đã mở
                                 </Badge>
                              ) : (
                                 <Badge variant="outline" className="text-muted-foreground border-muted text-[10px]">
                                    Đã gửi
                                 </Badge>
                              )}
                              <button className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                                 Xem chi tiết
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6 mt-0 animate-in fade-in-50 duration-500">
            {/* Survey Widget (New Feature) */}
            {redemptionEvents.length > 0 && !surveySubmitted && (
              <Card className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-[10px] overflow-hidden shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-[10px]">
                      <Smile className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-black">Khảo sát hài lòng sau đổi thưởng</CardTitle>
                      <CardDescription className="text-[10px]">Đánh giá nhanh trải nghiệm quà tặng của hội viên.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center gap-4 py-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setSurveyRating(num)}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all",
                          surveyRating === num 
                            ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" 
                            : "bg-background border border-border hover:border-primary/50 text-muted-foreground"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Phản hồi định tính (Qualitative Feedback)</Label>
                    <textarea 
                      className="w-full min-h-[80px] p-3 text-xs bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="Ghi chú lại đánh giá của khách hàng về món quà hoặc quy trình đổi..."
                      value={surveyComment}
                      onChange={(e) => setSurveyComment(e.target.value)}
                    />
                  </div>
                  <Button 
                    disabled={!surveyRating || !surveyComment}
                    onClick={() => {
                      setSurveySubmitted(true);
                      toast.success("Cảm ơn! Phản hồi khảo sát đã được lưu vào hệ thống.");
                    }}
                    className="w-full h-10 rounded-[10px] font-bold bg-[#2f6cf5] hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                  >
                    Lưu phản hồi khảo sát
                  </Button>
                </CardContent>
              </Card>
            )}

            {surveySubmitted && (
               <Card className="border border-emerald-500/30 bg-emerald-500/5 rounded-[10px] p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-emerald-700">Khảo sát đã hoàn tất</h5>
                    <p className="text-[10px] text-emerald-600/70">Xếp hạng: {surveyRating}/5 - Phản hồi: "{surveyComment}"</p>
                  </div>
               </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_REWARDS.map((reward) => (
                <Card key={reward.id} className="group overflow-hidden border-border/40 hover:border-amber-500/30 transition-all bg-card/60 backdrop-blur-sm">
                  <div className="aspect-video w-full overflow-hidden relative">
                    <img 
                      src={reward.image} 
                      alt={reward.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <Badge className="bg-amber-500 text-white border-none shadow-lg">
                        {reward.points} điểm
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm font-bold truncate">{reward.name}</CardTitle>
                      <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider shrink-0">{reward.category}</span>
                    </div>
                    <CardDescription className="text-[11px] flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" /> Ngày nhận: {reward.date}
                    </CardDescription>
                  </CardHeader>
                  <div className="px-4 pb-4 flex items-center justify-between">
                    <button className="text-[10px] font-bold text-[#2f6cf5] flex items-center gap-1 hover:underline">
                      <Compass className="w-3 h-3" /> Xem chứng từ <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
                      Đã sử dụng
                    </Badge>
                  </div>
                </Card>
              ))}
              <button className="border-2 border-dashed border-border/40 rounded-[10px] p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:bg-muted/30 hover:border-primary/30 transition-all min-h-[200px]">
                <div className="w-12 h-12 rounded-[10px] bg-muted flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold">Thêm quà đã đổi thủ công</p>
              </button>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 mt-0 animate-in fade-in-50 duration-500">
            {/* DÒNG THỜI GIAN HOẠT ĐỘNG CHRONOLOGICAL (ACTIVITY TIMELINE) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[10px] border border-border/50 bg-sidebar/75 p-6 shadow-lg space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                    <span className="inline-flex w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Dòng Thời Gian Hoạt Động (Live Activity Timeline)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Biên niên sử đồng bộ thời gian thực hiển thị giao dịch, khiếu
                    nại & biến động trạng thái.
                  </p>
                </div>

                {/* Filtering Controls */}
                <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-[10px] border border-border/40">
                  <button
                    onClick={() => setTimelineFilter("all")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-[10px] transition-all cursor-pointer ${
                      timelineFilter === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Tất cả ({combinedTimeline.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter("purchase")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-[10px] transition-all cursor-pointer ${
                      timelineFilter === "purchase"
                        ? "bg-[#2f6cf5] text-white shadow-xs"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Giao dịch ({purchaseEvents.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter("ticket")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-[10px] transition-all cursor-pointer ${
                      timelineFilter === "ticket"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Phiếu hỗ trợ ({ticketEvents.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter("status_change")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-[10px] transition-all cursor-pointer ${
                      timelineFilter === "status_change"
                        ? "bg-indigo-500 text-white shadow-xs"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Trạng thái ({statusEvents.length + 1})
                  </button>
                  <button
                    onClick={() => setTimelineFilter("redemption")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-[10px] transition-all cursor-pointer ${
                      timelineFilter === "redemption"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Đổi ưu đãi ({redemptionEvents.length})
                  </button>
                </div>
              </div>

              {/* Timeline Line View */}
              <div className="relative pl-6 md:pl-8 space-y-6">
                {/* Vertical timeline connector */}
                <div className="absolute left-3 md:left-4 top-2 bottom-2 w-0.5 bg-border/50 dark:bg-border/20 z-0" />

                {filteredTimeline.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Không tìm thấy hoạt động nào phù hợp với bộ lọc này.
                  </div>
                ) : (
                  filteredTimeline.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-3 bg-background/55 hover:bg-background/80 p-4 rounded-[10px] border border-border/45 hover:border-[#2f6cf5]/30 transition-all group/item shadow-2xs"
                    >
                      {/* Floating timeline bubble */}
                      <div className="absolute -left-[31px] md:-left-[35px] top-4 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs shadow-sm group-hover/item:border-primary transition-colors">
                        {item.icon}
                      </div>

                      <div className="space-y-1 max-w-full md:max-w-[70%]">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="text-xs font-extrabold text-foreground tracking-tight flex items-center gap-1.5 leading-tight">
                            {item.title}
                          </h5>
                          <span
                            className={`inline-block text-xs px-1.5 py-0.5 rounded border font-semibold ${item.badgeStyle}`}
                          >
                            {item.badgeText}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>

                        {/* Meta/Time values */}
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground/80">
                          <span>🕒 {item.dateStr}</span>
                          <span>•</span>
                          <span className="text-[#2f6cf5] font-semibold uppercase">
                            {item.type}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 md:self-center">
                        {item.valueStr && (
                          <span className="text-xs font-black text-foreground block">
                            {item.valueStr}
                          </span>
                        )}
                        {item.pointsStr && (
                          <span className="text-xs font-bold text-emerald-500">
                            {item.pointsStr}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Point Adjustment Dialog */}
      <Dialog open={isAdjustingPoints} onOpenChange={setIsAdjustingPoints}>
        <DialogContent className="sm:max-w-[425px] rounded-[10px] bg-background border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-black">Điều chỉnh điểm Loyalty</DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Thêm hoặc bớt điểm thưởng thủ công cho khách hàng <strong>{customer.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Số điểm (Dùng dấu - để trừ)</Label>
              <Input 
                type="number" 
                value={adjustAmount} 
                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                className="text-xl font-black text-center h-16 rounded-[10px] bg-muted/30 border-2 border-dashed border-border focus-visible:ring-amber-500/20 focus-visible:border-amber-500/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lý do điều chỉnh</Label>
              <textarea 
                className="w-full min-h-[120px] p-4 text-sm bg-muted/30 border border-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all"
                placeholder="Ví dụ: Tặng điểm sinh nhật muộn, Đền bù sự cố giao hàng..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" onClick={() => setIsAdjustingPoints(false)} className="rounded-[10px] font-bold px-6">Hủy</Button>
            <Button 
               disabled={!adjustReason || adjustAmount === 0}
               onClick={async () => {
                 const newPoints = points + adjustAmount;
                 const logEntry = {
                    id: `Điểm-${Date.now()}`,
                    type: adjustAmount > 0 ? "manual_add" : "manual_subtract",
                    amount: Math.abs(adjustAmount),
                    balance: newPoints,
                    description: adjustReason,
                    date: formatVietnameseDate(Date.now()),
                    timestamp: Date.now()
                 };

                 await updateFirestore({
                    points: newPoints,
                    redemptions: [logEntry, ...(customer.redemptions || [])]
                 }, `Đã điều chỉnh ${adjustAmount > 0 ? "+" : ""}${adjustAmount} điểm. Lý do: ${adjustReason}`);
                 
                 setPoints(newPoints);
                 setIsAdjustingPoints(false);
                 setAdjustAmount(0);
                 setAdjustReason("");
               }}
               className="rounded-[10px] font-bold bg-[#2f6cf5] hover:bg-blue-600 px-8 shadow-lg shadow-blue-500/20"
            >
              Xác nhận thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
