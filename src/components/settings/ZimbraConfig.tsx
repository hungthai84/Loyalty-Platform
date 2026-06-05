import React, { useState, useEffect } from "react";
import { Mail, Save, Activity, ShieldCheck, AlertCircle, Send } from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { ZimbraSettings } from "@/types";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export function ZimbraConfig() {
  const { user } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [settings, setSettings] = useState<ZimbraSettings>({
    id: "zimbra_main",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    fromEmail: "",
    fromName: "SEVA CRM Premium",
    userId: user?.uid || "",
    updatedAt: null
  });

  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    if (!user) return;
    
    const docRef = doc(db, "settings", "zimbra_email");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as ZimbraSettings);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/zimbra_email");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === "smtpPort" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      await setDoc(doc(db, "settings", "zimbra_email"), {
        ...settings,
        userId: user.uid,
        updatedAt: serverTimestamp()
      });
      toast.success("Đã cài đặt cấu hình Zimbra SMTP thành công!");
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, "settings/zimbra_email");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Vui lòng nhập email nhận thử nghiệm.");
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch("/api/zimbra/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          toEmail: testEmail,
          subject: "[TEST] Seva Loyalty Platform - Zimbra SMTP Connection",
          htmlContent: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2f6cf5;">Kết nối Zimbra SMTP thành công!</h2>
              <p>Đây là email kiểm tra từ hệ thống <b>Loyalty Platform</b> của bạn.</p>
              <p>Cấu hình máy chủ: <code>${settings.smtpHost}:${settings.smtpPort}</code></p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <small style="color: #666;">Gửi lúc: ${new Date().toLocaleString('vi-VN')}</small>
            </div>
          `
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Kết nối thành công! Đã gửi mail tới " + testEmail);
      } else {
        toast.error(data.message || "Lỗi kết nối Zimbra SMTP.");
      }
    } catch (error: any) {
      toast.error("Lỗi hệ thống: " + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Đang tải cấu hình Zimbra...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Cấu hình Zimbra Email</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Thay thế SendGrid bằng Zimbra SMTP để gửi email Marketing.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Enterprise SMTP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-border/60 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    SMTP Host <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="smtpHost"
                    value={settings.smtpHost}
                    onChange={handleChange}
                    placeholder="smtp.zimbra.com"
                    required
                    className="w-full px-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary/50 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Port</label>
                  <input
                    name="smtpPort"
                    type="number"
                    value={settings.smtpPort}
                    onChange={handleChange}
                    placeholder="587"
                    className="w-full px-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary/50 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Username <span className="text-rose-500">*</span></label>
                  <input
                    name="smtpUser"
                    value={settings.smtpUser}
                    onChange={handleChange}
                    placeholder="marketing@company.com"
                    required
                    className="w-full px-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary/50 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Password <span className="text-rose-500">*</span></label>
                  <input
                    name="smtpPass"
                    type="password"
                    value={settings.smtpPass}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary/50 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Email người gửi</label>
                  <input
                    name="fromEmail"
                    value={settings.fromEmail}
                    onChange={handleChange}
                    placeholder="no-reply@company.com"
                    className="w-full px-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary/50 outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Tên hiển thị</label>
                  <input
                    name="fromName"
                    value={settings.fromName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary/50 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu cấu chuẩn Zimbra
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold text-sm">Lưu ý quan trọng</h4>
            </div>
            <ul className="space-y-2.5">
              {[
                "SMTP Host và Port phải được hạ tầng IT của bạn cho phép kết nối.",
                "Zimbra thường yêu cầu port 587 (STARTTLS) hoặc 465 (SSL/TLS).",
                "Đảm bảo tài khoản Zimbra đã được cấu hình cho phép gửi qua SMTP AUTH.",
                "Tần suất gửi email Marketing nên tuân thủ giới hạn của server để tránh bị liệt vào danh sách Spam."
              ].map((note, i) => (
                <li key={i} className="text-xs text-amber-700/80 leading-relaxed flex gap-2">
                  <span className="font-bold shrink-0">{i + 1}.</span> {note}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wide">Kiểm tra kết nối</h4>
            <p className="text-xs text-muted-foreground">Nhập email để gửi một bản tin thử nghiệm qua hệ thống Zimbra.</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test-recipient@example.com"
                className="flex-1 px-4 py-2 bg-muted/50 border border-border rounded-xl text-xs outline-none focus:border-primary/50 transition-all font-medium"
              />
              <button
                onClick={handleTestEmail}
                disabled={isTesting || !settings.smtpHost}
                className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-xl text-xs font-bold hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-50"
              >
                {isTesting ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gửi test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
