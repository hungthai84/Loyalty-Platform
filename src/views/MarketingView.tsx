import React, { useState, useEffect } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Mail, Zap, CheckCircle2, Activity, Send, Laptop } from "lucide-react";
import { toast } from "sonner";

export function MarketingView() {
  const [selectedTemplate, setSelectedTemplate] = useState<"birthday" | "winback">("birthday");

  // Template States
  const [birthdaySubject, setBirthdaySubject] = useState("✨ Quà Tặng Sinh Nhật Đặc Quyền: Chúc Mừng Sinh Nhật Quý Hội Viên!");
  const [birthdayContent, setBirthdayContent] = useState("<p>Chúc mừng ngày sinh nhật của bạn! Atelier thân gửi tới bạn những lời chúc mừng thăng hoa nhất.</p><p>Như một món quà bồi đắp tri ân, chúng tôi đã tự động gửi tặng mã ưu đãi đặc quyền trị giá 5.000 điểm tích lũy cùng mã giảm giá đổi quà miễn phí.</p>");
  
  const [winbackSubject, setWinbackSubject] = useState("💔 Chúng tôi nhớ bạn - Ưu đãi đặc quyền dành riêng cho bạn");
  const [winbackContent, setWinbackContent] = useState("<p>Đã lâu không gặp, Atelier rất nhớ bạn!</p><p>Chúng tôi vừa ra mắt Bộ Sưu Tập mới với những thiết kế tinh xảo nhất. Để chào mừng bạn trở lại, chúng tôi dành tặng bạn ưu đãi giảm 20% cho đơn hàng tiếp theo.</p>");

  useEffect(() => {
    const savedBirthdaySubject = localStorage.getItem("marketing_birthdaySubject");
    if (savedBirthdaySubject) setBirthdaySubject(savedBirthdaySubject);
    
    const savedBirthdayContent = localStorage.getItem("marketing_birthdayContent");
    if (savedBirthdayContent) setBirthdayContent(savedBirthdayContent);

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
      localStorage.setItem("marketing_winbackSubject", winbackSubject);
      localStorage.setItem("marketing_winbackContent", winbackContent);
      setSaveStatus("saved");
      
      const resetTimeout = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(resetTimeout);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [birthdaySubject, birthdayContent, winbackSubject, winbackContent]);

  const subject = selectedTemplate === "birthday" ? birthdaySubject : winbackSubject;
  const content = selectedTemplate === "birthday" ? birthdayContent : winbackContent;
  
  const setSubject = selectedTemplate === "birthday" ? setBirthdaySubject : setWinbackSubject;
  const setContent = selectedTemplate === "birthday" ? setBirthdayContent : setWinbackContent;

  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const getHtmlPreview = () => {
    return `
      <div style="font-family: 'Roboto', sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #334155;">
        <div style="text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 25px; margin-bottom: 30px;">
          <h1 style="color: #60a5fa; font-size: 24px; letter-spacing: 2px; margin: 0 0 10px 0; text-transform: uppercase;">ATELIER LUXURY</h1>
          <p style="color: #9ca3af; font-size: 12px; letter-spacing: 1px; margin: 0; text-transform: uppercase;">The Elite Loyalty Circle</p>
        </div>
        <div style="padding: 10px 20px;">
          <div style="font-size: 15px; line-height: 1.8; color: #d1d5db; margin-bottom: 35px;">
            ${content}
          </div>
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px dashed #475569; padding: 25px; border-radius: 12px; margin-bottom: 40px; text-align: center;">
            <span style="display: block; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Mã Ưu Đãi Của Bạn</span>
            <strong style="display: block; font-size: 24px; color: #60a5fa; font-family: monospace; letter-spacing: 3px; font-weight: bold; margin-bottom: 12px;">${selectedTemplate === 'birthday' ? 'BDAYVIP' : 'COMEBACK'}</strong>
          </div>
        </div>
        <div style="margin-top: 45px; padding-top: 25px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center; font-size: 11px; color: #6b7280; line-height: 1.6;">
          Trân trọng gửi chúc,<br />
          <strong>Ban Quản Trị Atelier Haute Club</strong>
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
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Marketing & Email Templates</h2>
            <p className="text-muted-foreground text-sm mt-1">Thiết kế và tùy chỉnh các mẫu email tự động hóa Marketing.</p>
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
                  <div className="flex bg-muted p-1 rounded-xl">
                    <button 
                      onClick={() => setSelectedTemplate("birthday")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${selectedTemplate === "birthday" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Sinh Nhật
                    </button>
                    <button 
                      onClick={() => setSelectedTemplate("winback")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${selectedTemplate === "winback" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Win-back
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
              <div className="flex items-center justify-between mb-4 border-b pb-4">
                <div>
                  <h4 className="font-bold text-sm uppercase flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Live Preview
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">Cập nhật trực tiếp khi bạn chỉnh sửa.</p>
                </div>
                <Badge variant="outline" className="bg-background">Desktop View</Badge>
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
      </div>
    </div>
  );
}
