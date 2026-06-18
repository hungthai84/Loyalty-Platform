import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { 
  Mail,
  Megaphone, 
  Activity, 
  Send, 
  History, 
  CheckCircle, 
  Eye, 
  MousePointerClick,
  Phone,
  MessageSquare,
  MessageCircle,
  Clock,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  Gift,
  AlertTriangle,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface PointCampaign {
  id: string;
  name: string;
  multiplier: number;
  startDate: string;
  endDate: string;
  targetAudience: string;
  isActive: boolean;
  notes?: string;
}

export function MarketingView() {
  const [activeTab2, setActiveTab2] = useState<"messages" | "campaigns">("messages");
  const [campaigns, setCampaigns] = useState<PointCampaign[]>([]);

  // Form inputs for new campaign
  const [newCampName, setNewCampName] = useState("");
  const [newCampMultiplier, setNewCampMultiplier] = useState(2.0);
  const [newCampStart, setNewCampStart] = useState("");
  const [newCampEnd, setNewCampEnd] = useState("");
  const [newCampAudience, setNewCampAudience] = useState("Tất cả hội viên");
  const [newCampNotes, setNewCampNotes] = useState("");
  const [campDraftStatus, setCampDraftStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load Campaign Builder draft from Local Storage on mount
  useEffect(() => {
    const savedCampName = localStorage.getItem("marketing_camp_builder_name");
    if (savedCampName) setNewCampName(savedCampName);
    const savedCampMultiplier = localStorage.getItem("marketing_camp_builder_multiplier");
    if (savedCampMultiplier) setNewCampMultiplier(Number(savedCampMultiplier));
    const savedCampStart = localStorage.getItem("marketing_camp_builder_start");
    if (savedCampStart) setNewCampStart(savedCampStart);
    const savedCampEnd = localStorage.getItem("marketing_camp_builder_end");
    if (savedCampEnd) setNewCampEnd(savedCampEnd);
    const savedCampAudience = localStorage.getItem("marketing_camp_builder_audience");
    if (savedCampAudience) setNewCampAudience(savedCampAudience);
    const savedCampNotes = localStorage.getItem("marketing_camp_builder_notes");
    if (savedCampNotes) setNewCampNotes(savedCampNotes);
  }, []);

  // Save Campaign Builder draft dynamically
  useEffect(() => {
    // Only show saving / saved status if at least one field has content to prevent noise on initialization
    if (!newCampName && !newCampStart && !newCampEnd && !newCampNotes) {
      return;
    }
    setCampDraftStatus("saving");
    const timeout = setTimeout(() => {
      localStorage.setItem("marketing_camp_builder_name", newCampName);
      localStorage.setItem("marketing_camp_builder_multiplier", String(newCampMultiplier));
      localStorage.setItem("marketing_camp_builder_start", newCampStart);
      localStorage.setItem("marketing_camp_builder_end", newCampEnd);
      localStorage.setItem("marketing_camp_builder_audience", newCampAudience);
      localStorage.setItem("marketing_camp_builder_notes", newCampNotes);
      setCampDraftStatus("saved");
      const subTimeout = setTimeout(() => setCampDraftStatus("idle"), 1500);
      return () => clearTimeout(subTimeout);
    }, 800);

    return () => clearTimeout(timeout);
  }, [newCampName, newCampMultiplier, newCampStart, newCampEnd, newCampAudience, newCampNotes]);

  useEffect(() => {
    const savedCampaigns = localStorage.getItem("marketing_point_campaigns");
    if (savedCampaigns) {
      try {
        setCampaigns(JSON.parse(savedCampaigns));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultCampaigns: PointCampaign[] = [
        {
          id: "camp-1",
          name: "Tuần lễ Vàng Tri ân Hội viên (Golden Week Special)",
          multiplier: 2.0,
          startDate: "2026-06-15",
          endDate: "2026-06-22",
          targetAudience: "Tất cả hội viên",
          isActive: true,
          notes: "Áp dụng cho mọi chi nhánh HeartLock & Memorient trên toàn quốc."
        },
        {
          id: "camp-2",
          name: "Sự kiện Private Sale Diamond Elite (x3 Điểm tối thượng)",
          multiplier: 3.0,
          startDate: "2026-07-01",
          endDate: "2026-07-03",
          targetAudience: "Chỉ từ hạng Vàng trở lên",
          isActive: true,
          notes: "Độc quyền nâng bậc tích lũy cho Diamond Membership."
        }
      ];
      setCampaigns(defaultCampaigns);
      localStorage.setItem("marketing_point_campaigns", JSON.stringify(defaultCampaigns));
    }
  }, []);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim() || !newCampStart || !newCampEnd) {
      toast.error("Vui lòng điền đầy dủ Tên, Ngày bắt đầu và Ngày kết thúc chiến dịch.");
      return;
    }

    if (new Date(newCampStart) > new Date(newCampEnd)) {
      toast.error("Ngày kết thúc không thể diễn ra trước ngày bắt đầu.");
      return;
    }

    const newCamp: PointCampaign = {
      id: `camp-${Date.now()}`,
      name: newCampName,
      multiplier: Number(newCampMultiplier),
      startDate: newCampStart,
      endDate: newCampEnd,
      targetAudience: newCampAudience,
      isActive: true,
      notes: newCampNotes,
    };

    const updated = [newCamp, ...campaigns];
    setCampaigns(updated);
    localStorage.setItem("marketing_point_campaigns", JSON.stringify(updated));
    toast.success(`Đã tạo thành công chiến dịch nhân điểm x${newCampMultiplier}!`);

    // Reset Form
    setNewCampName("");
    setNewCampMultiplier(2.0);
    setNewCampStart("");
    setNewCampEnd("");
    setNewCampAudience("Tất cả hội viên");
    setNewCampNotes("");
    localStorage.removeItem("marketing_camp_builder_name");
    localStorage.removeItem("marketing_camp_builder_multiplier");
    localStorage.removeItem("marketing_camp_builder_start");
    localStorage.removeItem("marketing_camp_builder_end");
    localStorage.removeItem("marketing_camp_builder_audience");
    localStorage.removeItem("marketing_camp_builder_notes");
  };

  const handleToggleCampaign = (id: string) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    setCampaigns(updated);
    localStorage.setItem("marketing_point_campaigns", JSON.stringify(updated));
    toast.success("Đã cập nhật trạng thái hoạt động của chiến dịch.");
  };

  const handleDeleteCampaign = (id: string) => {
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    localStorage.setItem("marketing_point_campaigns", JSON.stringify(updated));
    toast.success("Đã xóa chiến dịch thành công.");
  };

  const [selectedChannel, setSelectedChannel] = useState<"email" | "sms" | "zalo" | "call">("email");
  const [selectedTemplate, setSelectedTemplate] = useState<
    "birthday" | "point_earning" | "share_thankyou" | "tier_upgrade" | "new_member" | "winback"
  >("birthday");

  // Email Template States (existing)
  const [birthdaySubject, setBirthdaySubject] = useState("✨ Quà Tặng Sinh Nhật Đặc Quyền: Chúc Mừng Sinh Nhật Quý Hội Viên Seva Club!");
  const [birthdayContent, setBirthdayContent] = useState("<p>Kính gửi quý hội viên tinh hoa,</p><p>Nhân ngày sinh nhật ý nghĩa nhất của bạn, Seva Retail kính chúc bạn một tuổi mới ngập tràn hạnh phúc, thăng hoa và lấp lánh như viên kim cương tự nhiên tinh khiết nhất.</p><p>Để tri ân chặng đường đồng hành, chúng tôi đặc biệt gửi tặng bạn món quà bất ngờ: <strong>Mã voucher quà tặng đặc quyền trị giá 2.500.000đ</strong> và x2 điểm thưởng cho mọi hóa đơn thanh toán trong tháng sinh nhật này.</p>");
  
  // SMS States
  const [smsContent, setSmsContent] = useState("Seva Club chuc mung SN {name}! Tang ban code {code} tri gia 2.5Tr. Dung tai HeartLock/Memorient. HSD: 30 ngay. LH: 1900xxxx");
  
  // Zalo OA States
  const [zaloContent, setZaloContent] = useState("✨ Chúc mừng sinh nhật {name}!\n\nSeva Retail trân trọng gửi tặng bạn quà tặng đặc quyền: Mã voucher {code} trị giá 2.500.000đ.\n\nHãy ghé thăm HeartLock & Memorient để nhận ưu đãi nhé!");
  
  // Call Script States
  const [callScript, setCallScript] = useState("Dạ em chào anh/chị {name}, em gọi từ bộ phận chăm sóc khách hàng Seva Retail ạ. Nhân dịp sinh nhật anh/chị, công ty có gửi tặng anh/chị một voucher 2.5 triệu đồng mã {code}. Anh/chị có dự định ghé bên em trong tuần này không ạ?");

  // Other Email Templates...
  const [pointEarningSubject, setPointEarningSubject] = useState("🎯 Gửi Thông Báo Tích Điểm: Số dư tài khoản Seva Club đã được cập nhật!");
  const [pointEarningContent, setPointEarningContent] = useState("<p>Kính gửi quý khách,</p><p>Hóa đơn mua sắm trang sức vừa qua của bạn đã được ghi nhận tích điểm thành công vào hệ thống Seva Retail. Số điểm vừa tích lũy thêm là <b>+550 điểm</b>.</p><p>Hiện tại số dư điểm khả dụng của bạn đã được cập nhật chính thức trên ví điện tử. Bạn có thể sử dụng điểm này để đổi lấy các eVoucher ưu đãi đặc biệt hoặc bộ quà tặng tại chi nhánh <b>HeartLock</b> và <b>Memorient</b>.</p>");

  const [shareThankyouSubject, setShareThankyouSubject] = useState("💖 Cám Ơn Thành Viên Đã Chia Sẻ: Đặc quyền tri ân từ Seva Retail!");
  const [shareThankyouContent, setShareThankyouContent] = useState("<p>Chào Bạn,</p><p>Seva Retail xin gửi lời cảm ơn chân thành nhất vì bạn đã chia sẻ bài viết trải nghiệm lộng lẫy cùng trang phục của chúng tôi lên trang cá nhân mạng xã hội.</p><p>Mỗi chia sẻ của bạn là nguồn cảm hứng lớn giúp Seva lan tỏa phong cách tinh hoa. Chúng tôi vừa cộng trực tiếp <b>+100 điểm thưởng</b> vào tài khoản Seva Club của bạn như một lời tri ân sâu sắc.</p>");

  const [tierUpgradeSubject, setTierUpgradeSubject] = useState("👑 Thông Báo Nâng Hạng: Chào đón Quý thượng khách thăng cấp hạng thành viên VIP mới!");
  const [tierUpgradeContent, setTierUpgradeContent] = useState("<p>Kính gửi Quý thành viên thân thiết,</p><p>Seva Retail vô cùng tự hào và hân hoan thông báo tổng số điểm tích lũy của bạn đã chính thức đạt điều kiện nâng hạng thành viên mới vượt bậc.</p><p>Chúc mừng bạn đã nâng hạng thành công! Kể từ khoảnh khắc này, các đặc quyền xa xỉ như tiếp đón Private Lounge, spa làm gia trang sức chu đáo trọn đời, và sự đồng hành của chuyên gia tư vấn thiết kế độc bản 1:1 đã sẵn sàng phục vụ chào đón quý thành viên.</p>");

  const [newMemberSubject, setNewMemberSubject] = useState("✨ Chào Mừng Thành Viên Mới: Khởi nguồn chặng đường lấp lánh tại Seva Club!");
  const [newMemberContent, setNewMemberContent] = useState("<p>Kính chào quý thành viên mới,</p><p>Chúng tôi vô cùng vui mừng và tự hào khi bạn chính thức đăng ký gia nhập Seva Club - Cộng đồng của những phong cách tinh anh và đẳng cấp lôi cuốn.</p><p>Một món quà khởi hành trang nghiêm trị giá <b>+150 điểm thưởng chào mừng</b> đã được cộng trực tiếp vào ví thành viên của bạn. Vệ sinh bảo dưỡng sương mai trang sức miễn phí trọn đời của bạn tại hai chi nhánh HeartLock & Memorient đã sẵn sàng kích hoạt phục vụ.</p>");

  const [winbackSubject, setWinbackSubject] = useState("💔 Chúng tôi nhớ bạn - Ưu đãi đặc quyền dành riêng cho bạn");
  const [winbackContent, setWinbackContent] = useState("<p>Đã lâu không gặp, Seva Retail rất nhớ bạn!</p><p>Chúng tôi vừa ra mắt Bộ Sưu Tập mới với những thiết kế tinh xảo nhất. Để chào mừng bạn trở lại, chúng tôi dành tặng bạn ưu đãi giảm 20% cho đơn hàng tiếp theo.</p>");

  useEffect(() => {
    const savedBirthdaySubject = localStorage.getItem("marketing_birthdaySubject");
    if (savedBirthdaySubject) setBirthdaySubject(savedBirthdaySubject);
    const savedBirthdayContent = localStorage.getItem("marketing_birthdayContent");
    if (savedBirthdayContent) setBirthdayContent(savedBirthdayContent);

    const savedPointEarningSubject = localStorage.getItem("marketing_pointEarningSubject");
    if (savedPointEarningSubject) setPointEarningSubject(savedPointEarningSubject);
    const savedPointEarningContent = localStorage.getItem("marketing_pointEarningContent");
    if (savedPointEarningContent) setPointEarningContent(savedPointEarningContent);

    const savedShareThankyouSubject = localStorage.getItem("marketing_shareThankyouSubject");
    if (savedShareThankyouSubject) setShareThankyouSubject(savedShareThankyouSubject);
    const savedShareThankyouContent = localStorage.getItem("marketing_shareThankyouContent");
    if (savedShareThankyouContent) setShareThankyouContent(savedShareThankyouContent);

    const savedTierUpgradeSubject = localStorage.getItem("marketing_tierUpgradeSubject");
    if (savedTierUpgradeSubject) setTierUpgradeSubject(savedTierUpgradeSubject);
    const savedTierUpgradeContent = localStorage.getItem("marketing_tierUpgradeContent");
    if (savedTierUpgradeContent) setTierUpgradeContent(savedTierUpgradeContent);

    const savedNewMemberSubject = localStorage.getItem("marketing_newMemberSubject");
    if (savedNewMemberSubject) setNewMemberSubject(savedNewMemberSubject);
    const savedNewMemberContent = localStorage.getItem("marketing_newMemberContent");
    if (savedNewMemberContent) setNewMemberContent(savedNewMemberContent);

    const savedWinbackSubject = localStorage.getItem("marketing_winbackSubject");
    if (savedWinbackSubject) setWinbackSubject(savedWinbackSubject);
    const savedWinbackContent = localStorage.getItem("marketing_winbackContent");
    if (savedWinbackContent) setWinbackContent(savedWinbackContent);
  }, []);

  useEffect(() => {
    setSaveStatus("saving");
    const timeoutId = setTimeout(() => {
      localStorage.setItem("marketing_birthdaySubject", birthdaySubject);
      localStorage.setItem("marketing_birthdayContent", birthdayContent);

      localStorage.setItem("marketing_pointEarningSubject", pointEarningSubject);
      localStorage.setItem("marketing_pointEarningContent", pointEarningContent);

      localStorage.setItem("marketing_shareThankyouSubject", shareThankyouSubject);
      localStorage.setItem("marketing_shareThankyouContent", shareThankyouContent);

      localStorage.setItem("marketing_tierUpgradeSubject", tierUpgradeSubject);
      localStorage.setItem("marketing_tierUpgradeContent", tierUpgradeContent);

      localStorage.setItem("marketing_newMemberSubject", newMemberSubject);
      localStorage.setItem("marketing_newMemberContent", newMemberContent);

      localStorage.setItem("marketing_winbackSubject", winbackSubject);
      localStorage.setItem("marketing_winbackContent", winbackContent);
      setSaveStatus("saved");
      
      const resetTimeout = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(resetTimeout);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    birthdaySubject, birthdayContent, 
    pointEarningSubject, pointEarningContent,
    shareThankyouSubject, shareThankyouContent,
    tierUpgradeSubject, tierUpgradeContent,
    newMemberSubject, newMemberContent,
    winbackSubject, winbackContent
  ]);

  const subject = 
    selectedTemplate === "birthday" ? birthdaySubject :
    selectedTemplate === "point_earning" ? pointEarningSubject :
    selectedTemplate === "share_thankyou" ? shareThankyouSubject :
    selectedTemplate === "tier_upgrade" ? tierUpgradeSubject :
    selectedTemplate === "new_member" ? newMemberSubject :
    winbackSubject;

  const content = 
    selectedTemplate === "birthday" ? birthdayContent :
    selectedTemplate === "point_earning" ? pointEarningContent :
    selectedTemplate === "share_thankyou" ? shareThankyouContent :
    selectedTemplate === "tier_upgrade" ? tierUpgradeContent :
    selectedTemplate === "new_member" ? newMemberContent :
    winbackContent;
  
  const setSubject = (val: string) => {
    if (selectedTemplate === "birthday") setBirthdaySubject(val);
    else if (selectedTemplate === "point_earning") setPointEarningSubject(val);
    else if (selectedTemplate === "share_thankyou") setShareThankyouSubject(val);
    else if (selectedTemplate === "tier_upgrade") setTierUpgradeSubject(val);
    else if (selectedTemplate === "new_member") setNewMemberSubject(val);
    else setWinbackSubject(val);
  };

  const setContent = (val: string) => {
    if (selectedChannel === "email") {
      if (selectedTemplate === "birthday") setBirthdayContent(val);
      else if (selectedTemplate === "point_earning") setPointEarningContent(val);
      else if (selectedTemplate === "share_thankyou") setShareThankyouContent(val);
      else if (selectedTemplate === "tier_upgrade") setTierUpgradeContent(val);
      else if (selectedTemplate === "new_member") setNewMemberContent(val);
      else setWinbackContent(val);
    } else if (selectedChannel === "sms") {
      setSmsContent(val);
    } else if (selectedChannel === "zalo") {
      setZaloContent(val);
    } else {
      setCallScript(val);
    }
  };

  const [previewMode, setPreviewMode] = useState<"light" | "dark">("dark");
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const getHtmlPreview = () => {
    let codeValue = "BDAYVIP";
    if (selectedTemplate === "point_earning") codeValue = "POINTSYNC";
    else if (selectedTemplate === "share_thankyou") codeValue = "SHARE100";
    else if (selectedTemplate === "tier_upgrade") codeValue = "UPGRADEVIP";
    else if (selectedTemplate === "new_member") codeValue = "WELCOME100";
    else if (selectedTemplate === "winback") codeValue = "COMEBACK";

    const isLight = previewMode === "light";

    const bgColor = isLight ? "#ffffff" : "#0b0f19";
    const textColor = isLight ? "#1e293b" : "#f1f5f9";
    const bodyTextColor = isLight ? "#334155" : "#d1d5db";
    const borderColor = isLight ? "#e2e8f0" : "#334155";
    const headerBorderColor = isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)";
    const h1Color = isLight ? "#b45309" : "#60a5fa"; // warm gold/amber for light mode, light blue for dark mode
    const mutedColor = isLight ? "#64748b" : "#9ca3af";
    const couponBg = isLight ? "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";
    const couponBorder = isLight ? "#cbd5e1" : "#475569";
    const footerTextColor = isLight ? "#64748b" : "#6b7280";

    return `
      <div style="font-family: 'Roboto', sans-serif; background-color: ${bgColor}; color: ${textColor}; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid ${borderColor}; transition: all 0.3s ease; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; border-bottom: 1px solid ${headerBorderColor}; padding-bottom: 25px; margin-bottom: 30px;">
          <h1 style="color: ${h1Color}; font-size: 24px; letter-spacing: 2px; margin: 0 0 10px 0; text-transform: uppercase; font-family: 'Playfair Display', serif;">SEVA RETAIL</h1>
          <p style="color: ${mutedColor}; font-size: 11px; letter-spacing: 1px; margin: 0; text-transform: uppercase;">HeartLock & Memorient Elite Club</p>
        </div>
        <div style="padding: 10px 20px;">
          <div style="font-size: 15px; line-height: 1.8; color: ${bodyTextColor}; margin-bottom: 35px;">
            ${content}
          </div>
          <div style="background: ${couponBg}; border: 1px dashed ${couponBorder}; padding: 25px; border-radius: 12px; margin-bottom: 40px; text-align: center;">
            <span style="display: block; font-size: 11px; color: ${mutedColor}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Mã Ưu Đãi Của Bạn</span>
            <strong style="display: block; font-size: 24px; color: ${h1Color}; font-family: monospace; letter-spacing: 3px; font-weight: bold; margin-bottom: 12px;">${codeValue}</strong>
          </div>
        </div>
        <div style="margin-top: 45px; padding-top: 25px; border-top: 1px solid ${headerBorderColor}; text-align: center; font-size: 11px; color: ${footerTextColor}; line-height: 1.6;">
          Trân trọng gửi lời chúc mừng,<br />
          <strong>Ban Điều Hành Hệ Thống Thành Viên Seva Retail</strong>
        </div>
      </div>
    `;
  };

  const handleSimulateSend = async () => {
    if (selectedChannel === "email" && !testEmail) {
      toast.error("Vui lòng nhập email nhận thử nghiệm.");
      return;
    }
    setIsSending(true);
    
    // Simulate sending
    setTimeout(() => {
      setIsSending(false);
      const channelNames = {
        email: "Email",
        sms: "SMS",
        zalo: "Zalo OA",
        call: "Yêu cầu Cuộc gọi"
      };
      toast.success(`Đã mô phỏng gửi ${channelNames[selectedChannel]} thành công.`);
    }, 1000);
  };

  const portalTarget = typeof document !== "undefined" ? document.getElementById("dashboard-upper-portal") : null;

  const bannerContent = (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card/45 border border-rose-500/30 p-5 md:p-6 rounded-[10px] shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full mt-4 hover:shadow-md hover:border-rose-500/50"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="p-3 bg-rose-500/10 rounded-[10px] text-rose-500 flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
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
            <Megaphone className="w-8 h-8 text-rose-500" />
          </motion.div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">
              Hành trình Tương tác & Chiến dịch
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Thiết kế đa kênh và kiến tạo chương trình tích lũy thúc đẩy doanh thu.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {}}
          className={cn(
            "flex items-center px-4 py-2 rounded-[10px] text-xs font-bold transition-all border cursor-pointer",
            "bg-background border-border hover:bg-muted text-foreground"
          )}
        >
          <BookOpen className="w-4 h-4 mr-2 text-rose-500" />
          {activeTab2 === "messages" ? "Tài liệu Trình tương tác" : "Tài liệu Chiến dịch Sự kiện"}
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {portalTarget ? createPortal(bannerContent, portalTarget) : bannerContent}

      <div className="px-4 md:px-0 pt-4">
        <div className="flex gap-1 p-1 bg-muted/40 rounded-[10px] w-fit">
          <button
            onClick={() => setActiveTab2("messages")}
            className={cn(
              "flex items-center px-4 py-2 rounded-[10px] text-sm font-bold transition-all gap-2 cursor-pointer",
              activeTab2 === "messages"
                ? "bg-background text-primary shadow-sm font-extrabold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Mail className="w-4 h-4" />
            Trình tương tác
          </button>
          <button
            onClick={() => setActiveTab2("campaigns")}
            className={cn(
              "flex items-center px-4 py-2 rounded-[10px] text-sm font-bold transition-all gap-2 cursor-pointer",
              activeTab2 === "campaigns"
                ? "bg-background text-primary shadow-sm font-extrabold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Sliders className="w-4 h-4" />
            Sự kiện
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2 pt-2">
        <AnimatePresence mode="wait">
          {activeTab2 === "messages" ? (
            <motion.div
              key="messages-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div className="relative overflow-hidden rounded-[10px] border border-blue-500/10 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent p-6 md:p-8 backdrop-blur-md text-left">
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-background to-background pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wider mb-2">
                      <Mail className="w-5 h-5 animate-pulse" /> Trình tương tác
                    </div>
                    <h3 className="text-2xl font-bold font-heading text-foreground">
                      Thông điệp khách hàng đa điểm
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                      Thiết kế và gửi thông điệp tự động tới hội viên thông qua mạng lưới đa nền tảng Email, Zalo, SMS hoặc trực tiếp thực hiện ghi chú cho đội ngũ Telesale.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Editor Column */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-card border border-border rounded-[10px] p-6 shadow-sm">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs text-muted-foreground font-bold uppercase mb-3">Kênh Tương Tác</label>
                        <div className="grid grid-cols-4 gap-2 bg-muted p-1 rounded-[10px]">
                          {[
                            { id: "email", icon: Mail, label: "Email" },
                            { id: "sms", icon: MessageSquare, label: "SMS" },
                            { id: "zalo", icon: MessageCircle, label: "Zalo" },
                            { id: "call", icon: Phone, label: "Call" }
                          ].map((ch) => (
                            <button 
                              key={ch.id}
                              onClick={() => setSelectedChannel(ch.id as any)}
                              className={cn(
                                "flex flex-col items-center justify-center py-2.5 rounded-[10px] transition-all gap-1 cursor-pointer",
                                selectedChannel === ch.id 
                                  ? "bg-background shadow-sm text-primary" 
                                  : "text-muted-foreground hover:text-foreground hover:bg-background/25"
                              )}
                            >
                              <ch.icon className="w-4 h-4" />
                              <span className="text-[10px] font-bold">{ch.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-muted-foreground font-bold uppercase mb-3">Sự kiện kích hoạt</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: "birthday", label: "Sinh Nhật" },
                            { id: "point_earning", label: "Tích Điểm" },
                            { id: "share_thankyou", label: "Cám Ơn Chia Sẻ" },
                            { id: "tier_upgrade", label: "Nâng Hạng VIP" },
                            { id: "new_member", label: "Mới Gia Nhập" },
                            { id: "winback", label: "Tri Ân Quay Lại" }
                          ].map((tmpl) => (
                            <button 
                              key={tmpl.id}
                              onClick={() => setSelectedTemplate(tmpl.id as any)}
                              className={cn(
                                "py-2 px-3 text-[11px] font-bold rounded-[10px] transition-all text-left cursor-pointer",
                                selectedTemplate === tmpl.id 
                                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              {tmpl.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t space-y-4">
                        {selectedChannel === "email" && (
                          <div>
                            <label className="block text-xs text-muted-foreground font-bold uppercase mb-1">Tiêu đề thư</label>
                            <input 
                              type="text" 
                              value={subject}
                              onChange={(e) => setSubject(e.target.value)}
                              className="w-full p-2.5 bg-background border rounded-[10px] text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs text-muted-foreground font-bold uppercase mb-1 flex justify-between">
                            <span>{selectedChannel === "call" ? "Kịch bản gọi điện" : "Nội dung thông điệp"}</span>
                            {selectedChannel !== "email" && (
                              <span className="text-[10px] text-primary/60 font-mono">
                                {selectedChannel === "sms" ? `${smsContent.length}/160` : `${zaloContent.length}/1000`} chars
                              </span>
                            )}
                          </label>
                          {selectedChannel === "email" ? (
                            <RichTextEditor 
                              value={content}
                              onChange={setContent}
                              className="mt-1"
                            />
                          ) : (
                            <textarea
                              value={selectedChannel === "sms" ? smsContent : selectedChannel === "zalo" ? zaloContent : callScript}
                              onChange={(e) => setContent(e.target.value)}
                              rows={6}
                              className="w-full p-3 bg-background border rounded-[10px] text-sm font-medium resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                            />
                          )}
                        </div>
                        
                        {selectedChannel !== "email" && (
                          <div className="bg-muted/50 p-3 rounded-[10px]">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Biến hệ thống khả dụng</p>
                            <div className="flex flex-wrap gap-2">
                              {['{name}', '{code}', '{points}', '{tier}', '{branch}'].map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-background border rounded text-[10px] font-mono text-primary/70">{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4">
                          <button 
                            onClick={handleSimulateSend}
                            disabled={isSending}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-[10px] text-sm flex items-center justify-center transition-all shadow-md active:scale-[0.98] cursor-pointer"
                          >
                            {isSending ? <Activity className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Gửi thử nghiệm ngay</>}
                          </button>
                          {selectedChannel === "email" && (
                            <input 
                              type="email" 
                              value={testEmail}
                              onChange={(e) => setTestEmail(e.target.value)}
                              placeholder="Nhập email nhận..."
                              className="w-full mt-2 p-2.5 bg-background border rounded-[10px] text-xs font-semibold text-center text-foreground"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Column */}
                <div className="lg:col-span-8">
                  <div className="bg-muted/30 border rounded-[10px] p-6 shadow-sm min-h-[600px] flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b pb-4 flex-wrap gap-3">
                      <div>
                        <h4 className="font-bold text-sm uppercase flex items-center gap-2">
                          <Eye className="w-4 h-4 text-primary" /> Live Preview: {selectedChannel.toUpperCase()}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 tracking-tight">Xử lý biến động {selectedTemplate} qua kênh {selectedChannel}.</p>
                      </div>
                      
                      {selectedChannel === "email" && (
                        <div className="flex bg-muted p-1 rounded-[10px] border border-border">
                          <button
                            onClick={() => setPreviewMode("light")}
                            className={cn(
                              "px-3 py-1.5 text-[11px] font-bold rounded-[10px] transition-all cursor-pointer",
                              previewMode === "light" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Mẫu sáng
                          </button>
                          <button
                            onClick={() => setPreviewMode("dark")}
                            className={cn(
                              "px-3 py-1.5 text-[11px] font-bold rounded-[10px] transition-all cursor-pointer",
                              previewMode === "dark" ? "bg-background shadow-xs text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Mẫu tối
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex justify-center items-center py-4 bg-background border rounded-[10px] overflow-hidden shadow-inner">
                      {selectedChannel === "email" ? (
                        <div className="w-full max-w-[600px] h-full flex flex-col scale-95 lg:scale-100">
                          <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-3 rounded-t-2xl">
                              <div className="flex gap-1.5 shrink-0">
                                <div className="w-3 h-3 bg-rose-500/80 rounded-full" />
                                <div className="w-3 h-3 bg-amber-400/80 rounded-full" />
                                <div className="w-3 h-3 bg-emerald-500/80 rounded-full" />
                              </div>
                              <div className="bg-background text-xs px-4 py-1.5 rounded-[10px] w-full truncate border font-medium text-muted-foreground">
                                {subject}
                              </div>
                          </div>
                          <div className="p-4 bg-[#f8fafc] dark:bg-[#020617] flex-1 flex justify-center custom-scrollbar overflow-y-auto min-h-[500px]">
                            <div className="w-full max-w-[550px] shadow-sm bg-white dark:bg-black rounded-[10px] overflow-hidden self-start" dangerouslySetInnerHTML={{ __html: getHtmlPreview() }} />
                          </div>
                        </div>
                      ) : selectedChannel === "sms" || selectedChannel === "zalo" ? (
                        /* Phone Mockup */
                        <div className="relative w-[300px] h-[580px] bg-slate-900 rounded-[40px] border-[6px] border-slate-800 shadow-2xl p-2 animate-fade-in">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                          <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[34px] overflow-hidden flex flex-col">
                            {/* Status Bar */}
                            <div className="h-10 flex items-center justify-between px-6 pt-2">
                              <span className="text-[10px] font-bold dark:text-white">9:41</span>
                              <div className="flex gap-1 items-center">
                                <Activity className="w-2.5 h-2.5 dark:text-white" />
                                <div className="w-4 h-2 rounded-sm border dark:border-white" />
                              </div>
                            </div>
                            
                            {/* Chat Header */}
                            <div className="px-4 py-3 border-b flex items-center gap-2">
                               <div className={cn(
                                 "w-10 h-10 rounded-full flex items-center justify-center border",
                                 selectedChannel === 'zalo' ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                               )}>
                                  {selectedChannel === 'zalo' ? <MessageCircle className="w-5 h-5" /> : <User className="w-5 h-5" />}
                               </div>
                               <div>
                                  <p className="text-xs font-bold dark:text-white">
                                    {selectedChannel === 'zalo' ? 'Seva Retail OA' : 'SEVA_RETAIL'}
                                  </p>
                                  <p className="text-[10px] text-emerald-500">Online</p>
                               </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-4">
                               <div className="flex flex-col items-center">
                                  <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full mb-4">Hôm nay</span>
                               </div>
                               
                               <div className="flex items-start gap-2">
                                   <div className="bg-white dark:bg-slate-800 p-3 rounded-[10px] rounded-tl-none shadow-sm max-w-[85%]">
                                      <p className="text-xs whitespace-pre-wrap leading-relaxed dark:text-slate-200">
                                        {selectedChannel === 'sms' ? smsContent.replace('{name}', 'Thái Hồng Hưng').replace('{code}', 'BDAYVIP') : zaloContent.replace('{name}', 'Thái Hồng Hưng').replace('{code}', 'BDAYVIP')}
                                      </p>
                                   </div>
                               </div>
                            </div>

                            {/* Input Area */}
                            <div className="p-3 border-t bg-white dark:bg-slate-950 flex gap-2 items-center">
                               <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-900 rounded-full" />
                               <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                  <Send className="w-3 h-3" />
                                </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Call Script Mockup */
                        <div className="w-full max-w-[500px]">
                          <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden">
                             <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                             <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                             
                             <div className="flex flex-col items-center text-center mb-10">
                                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4 animate-pulse">
                                   <Phone className="w-10 h-10 fill-current" />
                                </div>
                                <h5 className="text-xl font-bold text-white mb-2">Đang thiết lập cuộc gọi</h5>
                                <div className="flex items-center gap-2">
                                   <Badge className="bg-emerald-500/20 text-emerald-500 border-none text-[10px]">TƯ VẤN VIÊN SEVA</Badge>
                                   <span className="text-slate-500 text-xs font-mono tracking-widest">CONNECTING...</span>
                                </div>
                             </div>

                             <div className="bg-slate-800/50 backdrop-blur-md rounded-[10px] p-6 border border-slate-700/50 relative">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-[10px] font-bold text-white rounded-full">KỊCH BẢN NÓI CHUYỆN</div>
                                <div className="mt-2 text-slate-300 italic text-sm leading-relaxed font-serif">
                                   &ldquo;{callScript.replace('{name}', 'Anh Hưng').replace('{code}', 'BDAYVIP')}&rdquo;
                                </div>
                             </div>
                             
                             <div className="mt-10 grid grid-cols-2 gap-4">
                                <div className="flex flex-col items-center gap-2">
                                   <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                      <Clock className="w-5 h-5" />
                                   </div>
                                   <span className="text-[10px] font-bold text-slate-500 uppercase">Hẹn gọi lại</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                   <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
                                      <ShieldCheck className="w-5 h-5" />
                                   </div>
                                   <span className="text-[10px] font-bold text-slate-500 uppercase">Ghi âm</span>
                                </div>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification History Log */}
              <div className="mt-8 bg-card border border-border rounded-[10px] p-6 shadow-sm mb-10 text-left">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-[#2f6cf5]" /> Lịch sử gửi thông báo
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground text-left">Khách Hàng</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground w-1/3 text-left">Chiến Dịch & Kênh</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground text-left">Thời Gian</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground text-left">Trạng Thái</TableHead>
                        <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">Tương Tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { id: 1, name: "Thái Hồng Hưng", email: "hungthai84@gmail.com", campaign: "✨ Quà Tặng Sinh Nhật Đặc Quyền", channel: 'email', time: "10 phút trước", status: "delivered", open: "100%", click: "25%" },
                        { id: 2, name: "Nguyễn Minh Anh", phone: "090xxxx123", campaign: "Tri ân quay lại", channel: 'sms', time: "2 giờ trước", status: "delivered", open: "-", click: "-" },
                        { id: 3, name: "Trần Khánh Nhung", phone: "091xxxx456", campaign: "Xác nhận nâng hạng", channel: 'zalo', time: "Hôm qua, 09:00", status: "opened", open: "100%", click: "60%" },
                        { id: 4, name: "Lê Gia Bảo", email: "giabao.le@company.com", campaign: "Nhắc hẹn sinh nhật", channel: 'call', time: "Hôm qua, 08:30", status: "delivered", open: "-", click: "-" }
                      ].map((log) => (
                        <TableRow key={log.id} className="border-border/50">
                          <TableCell className="text-left">
                            <div className="font-semibold text-foreground text-sm">{log.name}</div>
                            <div className="text-[10px] text-muted-foreground">{log.email || log.phone}</div>
                          </TableCell>
                          <TableCell className="text-left">
                             <div className="flex items-center gap-2">
                                <div className={cn(
                                  "p-1.5 rounded-[10px] shrink-0",
                                  log.channel === 'email' ? "bg-blue-500/10 text-blue-500" :
                                  log.channel === 'sms' ? "bg-amber-500/10 text-amber-500" :
                                  log.channel === 'zalo' ? "bg-indigo-500/10 text-indigo-500" :
                                  "bg-rose-500/10 text-rose-500"
                                )}>
                                   {log.channel === 'email' && <Mail className="w-3 h-3" />}
                                   {log.channel === 'sms' && <MessageSquare className="w-3 h-3" />}
                                   {log.channel === 'zalo' && <MessageCircle className="w-3 h-3" />}
                                   {log.channel === 'call' && <Phone className="w-3 h-3" />}
                                </div>
                                <span className="font-medium text-xs">{log.campaign}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground text-left">{log.time}</TableCell>
                          <TableCell className="text-left">
                            {log.status === 'delivered' && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Đã gửi</Badge>}
                            {log.status === 'opened' && <Badge variant="outline" className="bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/20"><Eye className="w-3 h-3 mr-1" /> Đã xem</Badge>}
                            {log.status === 'bounced' && <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20"><Activity className="w-3 h-3 mr-1" /> Bị lỗi</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-3 text-xs">
                              <div className="flex items-center gap-1" title="Tỷ lệ mở">
                                  <Eye className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-semibold">{log.open}</span>
                              </div>
                              <div className="flex items-center gap-1" title="Tỷ lệ click">
                                  <MousePointerClick className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-semibold">{log.click}</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="campaigns-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="relative overflow-hidden rounded-[10px] border border-amber-500/10 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 md:p-8 backdrop-blur-md text-left">
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-background to-background pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-wider mb-2">
                      <Sliders className="w-5 h-5 animate-pulse" /> Trình sự kiện
                    </div>
                    <h3 className="text-2xl font-bold font-heading text-foreground">
                      Cấu hình sự kiện nhận điểm thưởng
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                       Thiết lập các sự kiện có giới hạn thời gian tăng hệ số nhân để thu hút khách hàng giao dịch. Mọi điểm thưởng đều quy chiếu các quy tắc được sử dụng tại bảng Điều kiện thăng hạng.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-start mb-10">
              {/* Campaign Creation Form (Left) */}
              <div className="lg:col-span-5">
                <div className="bg-card border border-border rounded-[10px] p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2 text-foreground font-heading">
                        <Sparkles className="w-5 h-5 text-amber-500" /> Tạo Sự Kiện Nhận Điểm Mới
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Thiết lập các sự kiện có giới hạn thời gian tăng hệ số nhân để thu hút khách hàng giao dịch.
                      </p>
                    </div>
                    {campDraftStatus !== "idle" && (
                      <span className="text-[10px] bg-muted px-2 py-1 rounded-full font-bold flex items-center gap-1 text-muted-foreground animate-pulse">
                        <span className={cn("w-1.5 h-1.5 rounded-full", campDraftStatus === "saving" ? "bg-amber-400" : "bg-emerald-500")} />
                        {campDraftStatus === "saving" ? "Đang lưu nháp..." : "Đã lưu nháp"}
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleCreateCampaign} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Tên sự kiện / chiến dịch</label>
                      <input
                        type="text"
                        value={newCampName}
                        onChange={(e) => setNewCampName(e.target.value)}
                        placeholder="Ví dụ: Đại Tiệc Mua Sắm Giao Niên"
                        className="w-full text-xs font-semibold p-3 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Hệ số multiplier</label>
                        <select
                          value={newCampMultiplier}
                          onChange={(e) => setNewCampMultiplier(Number(e.target.value))}
                          className="w-full text-xs font-semibold p-3 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                        >
                          <option value={1.5}>x1.5 Điểm thưởng</option>
                          <option value={2.0}>x2.0 Điểm vàng</option>
                          <option value={2.5}>x2.5 Tri ân đặc biệt</option>
                          <option value={3.0}>x3.0 Độc quyền Vip</option>
                          <option value={5.0}>x5.0 Siêu bùng nổ</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Đối tượng áp dụng</label>
                        <select
                          value={newCampAudience}
                          onChange={(e) => setNewCampAudience(e.target.value)}
                          className="w-full text-xs font-semibold p-3 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                        >
                          <option value="Tất cả hội viên">Tất cả thành viên</option>
                          <option value="Chỉ hạng Essential">Chỉ hạng Essential</option>
                          <option value="Hạng Vàng & Atelier">Hạng Vàng & Atelier</option>
                          <option value="Diamond VIP Elite">Diamond VIP Elite</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Ngày bắt đầu
                        </label>
                        <input
                          type="date"
                          value={newCampStart}
                          onChange={(e) => setNewCampStart(e.target.value)}
                          className="w-full text-xs font-semibold p-3 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-rose-500" /> Ngày kết thúc
                        </label>
                        <input
                          type="date"
                          value={newCampEnd}
                          onChange={(e) => setNewCampEnd(e.target.value)}
                          className="w-full text-xs font-semibold p-3 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Ghi chú chiến dịch (Tùy chọn)</label>
                      <textarea
                        value={newCampNotes}
                        onChange={(e) => setNewCampNotes(e.target.value)}
                        placeholder="Mô tả điều kiện đặc trưng của hệ thống nhân điểm..."
                        rows={3}
                        className="w-full text-xs font-semibold p-3 bg-background border border-border rounded-[10px] focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 resize-none text-foreground"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-[10px] text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mt-4"
                    >
                      <Plus className="w-4 h-4" /> Khởi tạo chiến dịch nhân điểm
                    </button>
                  </form>
                </div>
              </div>

              {/* Active Campaigns List (Right) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-card border border-border rounded-[10px] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2 text-left">
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <Gift className="w-4.5 h-4.5 text-[#2f6cf5]" /> Danh sách Chiến dịch Nhân điểm
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">Đang hoạt động và áp dụng tính điểm thưởng tự động.</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20 text-primary uppercase font-extrabold px-2.5 py-0.5 rounded-full">
                      {campaigns.length} Active SLA Events
                    </Badge>
                  </div>

                  <div className="space-y-4 border-l-2 border-border/60 ml-3 pl-6 relative">
                    {campaigns.length === 0 ? (
                      <div className="p-12 text-center border border-dashed rounded-[10px] bg-muted/20">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto opacity-50 mb-3" />
                        <p className="text-xs font-bold text-muted-foreground">Chưa có chiến dịch nhân điểm nào hoạt động.</p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1">Sử dụng bảng bên trái để kiến tạo chiến dịch kích cầu.</p>
                      </div>
                    ) : (
                      campaigns.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((camp) => {
                        const isLive = new Date() >= new Date(camp.startDate) && new Date() <= new Date(camp.endDate);
                        const isUpcoming = new Date() < new Date(camp.startDate);
                        
                        return (
                          <div
                            key={camp.id}
                            className={cn(
                              "relative p-5 rounded-[10px] border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left shadow-sm",
                              camp.isActive 
                                ? "bg-card hover:bg-muted/10 border-border md:border-l-4 md:border-l-primary text-card-foreground"
                                : "bg-muted/30 border-dashed border-border/40 opacity-70"
                            )}
                          >
                             {/* Timeline dot */}
                             <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-background bg-primary" />
                             
                            <div className="space-y-2 flex-1 text-left">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h4 className="font-bold text-sm text-foreground">{camp.name}</h4>
                                {camp.isActive ? (
                                  isLive ? (
                                    <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold py-0.5 px-2 rounded-full inline-flex items-center gap-1 select-none whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                      Đang chạy
                                    </Badge>
                                  ) : isUpcoming ? (
                                    <Badge className="bg-blue-500/15 text-blue-600 border border-blue-500/20 text-[10px] font-bold py-0.5 px-2 rounded-full inline-flex items-center gap-1 select-none whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                      Sắp chạy
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-zinc-500/15 text-zinc-500 border border-border text-[10px] font-bold py-0.5 px-2 rounded-full inline-flex items-center gap-1 select-none whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                                      Hết hạn
                                    </Badge>
                                  )
                                ) : (
                                  <Badge className="bg-muted text-muted-foreground border-none text-[10px] font-bold py-0.5 px-2 rounded-full select-none whitespace-nowrap">
                                    Vô hiệu hóa
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1 font-semibold text-foreground">
                                  <Sliders className="w-3.5 h-3.5 text-muted-foreground" /> Đối tượng: {camp.targetAudience}
                                </span>
                                <span className="flex items-center gap-1 font-mono text-[10px]">
                                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> {camp.startDate} ~ {camp.endDate}
                                </span>
                              </div>

                              {camp.notes && (
                                <p className="text-[11px] text-muted-foreground italic bg-muted/40 p-2 rounded-[10px] border border-border/40 mt-1">{camp.notes}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                              {/* Big glow multiplier badge */}
                              <div className="w-16 h-16 rounded-[10px] bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">hệ số</span>
                                <span className="text-xl font-black text-primary -mt-1 font-mono leading-none">x{camp.multiplier.toFixed(1)}</span>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleToggleCampaign(camp.id)}
                                  className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold rounded-[10px] transition-all cursor-pointer whitespace-nowrap text-center",
                                    camp.isActive 
                                      ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20"
                                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"
                                  )}
                                >
                                  {camp.isActive ? "Tạm ngưng" : "Kích hoạt"}
                                </button>
                                <button
                                  onClick={() => handleDeleteCampaign(camp.id)}
                                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-[10px] font-bold rounded-[10px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Trash2 className="w-3 h-3" /> Xóa bỏ
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
