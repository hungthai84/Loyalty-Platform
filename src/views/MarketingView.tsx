import React, { useState, useEffect } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Mail, Zap, CheckCircle2, Activity, Send, Laptop, History, CheckCircle, Eye, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MarketingView() {
  const [selectedTemplate, setSelectedTemplate] = useState<
    "birthday" | "point_earning" | "share_thankyou" | "tier_upgrade" | "new_member" | "winback"
  >("birthday");

  // Template States
  const [birthdaySubject, setBirthdaySubject] = useState("✨ Quà Tặng Sinh Nhật Đặc Quyền: Chúc Mừng Sinh Nhật Quý Hội Viên Seva Club!");
  const [birthdayContent, setBirthdayContent] = useState("<p>Kính gửi quý hội viên tinh hoa,</p><p>Nhân ngày sinh nhật ý nghĩa nhất của bạn, Seva Retail kính chúc bạn một tuổi mới ngập tràn hạnh phúc, thăng hoa và lấp lánh như viên kim cương tự nhiên tinh khiết nhất.</p><p>Để tri ân chặng đường đồng hành, chúng tôi đặc biệt gửi tặng bạn món quà bất ngờ: <strong>Mã voucher quà tặng đặc quyền trị giá 2.500.000đ</strong> và x2 điểm thưởng cho mọi hóa đơn thanh toán trong tháng sinh nhật này.</p>");
  
  const [pointEarningSubject, setPointEarningSubject] = useState("🎯 Gửi Thông Báo Tích Điểm: Số dư tài khoản Seva Club đã được cập nhật!");
  const [pointEarningContent, setPointEarningContent] = useState("<p>Kính gửi quý khách,</p><p>Hóa đơn mua sắm trang sức vừa qua của bạn đã được ghi nhận tích điểm thành công vào hệ thống Seva Retail. Số điểm vừa tích lũy thêm là <b>+550 điểm</b>.</p><p>Hiện tại số dư điểm khả dụng của bạn đã được cập nhật chính thức trên ví điện tử. Bạn có thể sử dụng điểm này để đổi lấy các eVoucher ưu đãi đặc biệt hoặc bộ quà tặng tại chi nhánh <b>HeartLock</b> và <b>Memorient</b>.</p>");

  const [shareThankyouSubject, setShareThankyouSubject] = useState("💖 Cám Ơn Hội Viên Đã Chia Sẻ: Đặc quyền tri ân từ Seva Retail!");
  const [shareThankyouContent, setShareThankyouContent] = useState("<p>Chào Bạn,</p><p>Seva Retail xin gửi lời cảm ơn chân thành nhất vì bạn đã chia sẻ bài viết trải nghiệm lộng lẫy cùng trang phục của chúng tôi lên trang cá nhân mạng xã hội.</p><p>Mỗi chia sẻ của bạn là nguồn cảm hứng lớn giúp Seva lan tỏa phong cách tinh hoa. Chúng tôi vừa cộng trực tiếp <b>+100 điểm thưởng</b> vào tài khoản Seva Club của bạn như một lời tri ân sâu sắc.</p>");

  const [tierUpgradeSubject, setTierUpgradeSubject] = useState("👑 Thông Báo Nâng Hạng: Chào đón Quý thượng khách thăng cấp hạng thành viên VIP mới!");
  const [tierUpgradeContent, setTierUpgradeContent] = useState("<p>Kính gửi Quý hội viên thân thiết,</p><p>Seva Retail vô cùng tự hào và hân hoan thông báo tổng số điểm tích lũy của bạn đã chính thức đạt điều kiện nâng hạng thành viên mới vượt bậc.</p><p>Chúc mừng bạn đã nâng hạng thành công! Kể từ khoảnh khắc này, các đặc khu xa xỉ như tiếp đón Private Lounge, spa làm gia trang sức chu đáo trọn đời, và sự đồng hành của chuyên gia tư vấn thiết kế độc bản 1:1 đã sẵn sàng phục vụ chào đón quý hội viên.</p>");

  const [newMemberSubject, setNewMemberSubject] = useState("✨ Chào Mừng Thành Viên Mới: Khởi nguồn chặng đường lấp lánh tại Seva Club!");
  const [newMemberContent, setNewMemberContent] = useState("<p>Kính chào quý hội viên mới,</p><p>Chúng tôi vô cùng vui mừng và tự hào khi bạn chính thức đăng ký gia nhập Seva Club - Cộng đồng của những phong cách tinh anh và đẳng cấp lôi cuốn.</p><p>Một món quà khởi hành trang nghiêm trị giá <b>+150 điểm thưởng chào mừng</b> đã được cộng trực tiếp vào ví hội viên của bạn. Vệ sinh bảo dưỡng sương mai trang sức miễn phí trọn đời của bạn tại hai chi nhánh HeartLock & Memorient đã sẵn sàng kích hoạt phục vụ.</p>");

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
    if (selectedTemplate === "birthday") setBirthdayContent(val);
    else if (selectedTemplate === "point_earning") setPointEarningContent(val);
    else if (selectedTemplate === "share_thankyou") setShareThankyouContent(val);
    else if (selectedTemplate === "tier_upgrade") setTierUpgradeContent(val);
    else if (selectedTemplate === "new_member") setNewMemberContent(val);
    else setWinbackContent(val);
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
    if (!testEmail) {
      toast.error("Vui lòng nhập email nhận thử nghiệm.");
      return;
    }
    setIsSending(true);
    
    // Simulate sending email
    setTimeout(() => {
      setIsSending(false);
      toast.success("Đã mô phỏng gửi email tới " + testEmail);
    }, 1000);
  };

  return (
    <div className="flex-1 h-[calc(100vh-64px)] flex flex-col p-8 pt-6 overflow-hidden max-h-screen">
      <div className="bg-card/45 border border-border/60 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 flex items-center justify-center shrink-0">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Tương tác & Email Templates</h2>
            <p className="text-muted-foreground text-sm mt-1">Thiết kế và tùy chỉnh các mẫu email tự động hóa và tương tác.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Editor Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-primary" /> Trình Soạn Thảo (Editor)
                </h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted hover:bg-muted/80 px-2.5 py-1 rounded-md transition-colors cursor-default">
                  {saveStatus === "saving" && (
                    <><Activity className="w-3 h-3 animate-spin text-primary" /> Đang lưu...</>
                  )}
                  {saveStatus === "saved" && (
                    <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đã tự động lưu</>
                  )}
                  {saveStatus === "idle" && (
                    <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đã tự động lưu</>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground font-bold uppercase mb-2">Loại Chiến Dịch</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-muted p-1.5 rounded-2xl">
                    <button 
                      onClick={() => setSelectedTemplate("birthday")}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all ${selectedTemplate === "birthday" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/25"}`}
                    >
                      Sinh Nhật
                    </button>
                    <button 
                      onClick={() => setSelectedTemplate("point_earning")}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all ${selectedTemplate === "point_earning" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/25"}`}
                    >
                      Tích Điểm
                    </button>
                    <button 
                      onClick={() => setSelectedTemplate("share_thankyou")}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all ${selectedTemplate === "share_thankyou" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/25"}`}
                    >
                      Cám Ơn Chia Sẻ
                    </button>
                    <button 
                      onClick={() => setSelectedTemplate("tier_upgrade")}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all ${selectedTemplate === "tier_upgrade" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/25"}`}
                    >
                      Nâng Hạng VIP
                    </button>
                    <button 
                      onClick={() => setSelectedTemplate("new_member")}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all ${selectedTemplate === "new_member" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/25"}`}
                    >
                      Mới Gia Nhập
                    </button>
                    <button 
                      onClick={() => setSelectedTemplate("winback")}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all ${selectedTemplate === "winback" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/25"}`}
                    >
                      Tri Ân Quay Lại
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground font-bold uppercase mb-1">Tiêu đề (Subject)</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 bg-background border rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground font-bold uppercase mb-1 flex justify-between">
                    <span>Nội dung thư (Email Body)</span>
                  </label>
                  <RichTextEditor 
                    value={content}
                    onChange={setContent}
                    className="mt-1"
                  />
                </div>

                <div className="pt-4 border-t mt-6">
                  <h4 className="font-bold text-xs uppercase mb-3">Gửi Thử Nghiệm</h4>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="flex-1 p-2 bg-background border rounded-xl text-sm font-semibold"
                    />
                    <button 
                      onClick={handleSimulateSend}
                      disabled={isSending}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs flex items-center justify-center transition-colors min-w-[100px]"
                    >
                      {isSending ? <Activity className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1.5" /> Gửi</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-7">
            <div className="bg-muted/30 border rounded-3xl p-6 shadow-sm min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b pb-4 flex-wrap gap-3">
                <div>
                  <h4 className="font-bold text-sm uppercase flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Live Preview
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">Cập nhật trực tiếp khi bạn chỉnh sửa.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-muted p-1 rounded-xl border border-border">
                    <button
                      onClick={() => setPreviewMode("light")}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        previewMode === "light"
                          ? "bg-background shadow-xs text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Mẫu sáng
                    </button>
                    <button
                      onClick={() => setPreviewMode("dark")}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        previewMode === "dark"
                          ? "bg-background shadow-xs text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Mẫu tối
                    </button>
                  </div>
                  <Badge variant="outline" className="bg-background hidden sm:inline-flex">Desktop View</Badge>
                </div>
              </div>

              <div className="flex-1 bg-background border rounded-2xl overflow-hidden shadow-xl flex flex-col">
                <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-3">
                  <div className="flex gap-1.5 shrink-0">
                    <div className="w-3 h-3 bg-rose-500/80 rounded-full" />
                    <div className="w-3 h-3 bg-amber-400/80 rounded-full" />
                    <div className="w-3 h-3 bg-emerald-500/80 rounded-full" />
                  </div>
                  <div className="bg-background text-sm px-4 py-1.5 rounded-lg w-full truncate border font-medium text-muted-foreground">
                    {subject}
                  </div>
                </div>
                
                <div className="p-8 bg-[#f8fafc] dark:bg-[#020617] flex-1 flex justify-center custom-scrollbar overflow-y-auto">
                  <div className="w-full max-w-[600px] shadow-sm bg-white dark:bg-black rounded-2xl overflow-hidden self-start" dangerouslySetInnerHTML={{ __html: getHtmlPreview() }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification History Log */}
        <div className="mt-8 bg-card border border-border rounded-3xl p-6 shadow-sm mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-[#2f6cf5]" /> Lịch sử gửi thông báo
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground">Khách Hàng</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground w-1/3">Chiến Dịch</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground">Thời Gian</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground">Trạng Thái</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">Tương Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: 1, name: "Thái Hồng Hưng", email: "hungthai84@gmail.com", campaign: "✨ Quà Tặng Sinh Nhật Đặc Quyền", time: "10 phút trước", status: "delivered", open: "100%", click: "25%" },
                  { id: 2, name: "Nguyễn Minh Anh", email: "minhanh9x@gmail.com", campaign: "💔 Chúng tôi nhớ bạn - Ưu đãi đặc quyền", time: "2 giờ trước", status: "opened", open: "100%", click: "0%" },
                  { id: 3, name: "Trần Khánh Nhung", email: "nhungtran_vp@gmail.com", campaign: "✨ Quà Tặng Sinh Nhật Đặc Quyền", time: "Hôm qua, 09:00", status: "bounced", open: "-", click: "-" },
                  { id: 4, name: "Lê Gia Bảo", email: "giabao.le@company.com", campaign: "💔 Chúng tôi nhớ bạn - Ưu đãi đặc quyền", time: "Hôm qua, 08:30", status: "delivered", open: "0%", click: "0%" }
                ].map((log) => (
                  <TableRow key={log.id} className="border-border/50">
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">{log.name}</div>
                      <div className="text-xs text-muted-foreground">{log.email}</div>
                    </TableCell>
                    <TableCell className="font-medium text-xs">{log.campaign}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.time}</TableCell>
                    <TableCell>
                      {log.status === 'delivered' && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Đã giao</Badge>}
                      {log.status === 'opened' && <Badge variant="outline" className="bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/20"><Eye className="w-3 h-3 mr-1" /> Đã mở</Badge>}
                      {log.status === 'bounced' && <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20"><Activity className="w-3 h-3 mr-1" /> Bounced</Badge>}
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

      </div>
    </div>
  );
}
