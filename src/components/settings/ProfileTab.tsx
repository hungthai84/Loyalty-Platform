import React, { useEffect, useState } from "react";
import { useFirebase } from "@/components/FirebaseProvider";
import {
  User,
  Key,
  Shield,
  BadgeCheck,
  Mail,
  Lock,
  Save,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export function ProfileTab() {
  const { user, systemUser, updateProfileData } = useFirebase();
  const [displayName, setDisplayName] = useState(
    systemUser?.displayName || user?.displayName || "",
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Google users linking local custom ID
  const [linkedId, setLinkedId] = useState("");
  const [isSearchingLinked, setIsSearchingLinked] = useState(false);
  const [hasExistingLink, setHasExistingLink] = useState(false);
  const [existingLinkedId, setExistingLinkedId] = useState("");

  const isLocal = !!user?.isLocal;

  // Search if Google user has an already linked local account
  useEffect(() => {
    async function checkLinkedAccount() {
      if (!user || isLocal || !user.email) return;
      setIsSearchingLinked(true);
      try {
        const usersRef = collection(db, "system_users");
        const q = query(
          usersRef,
          where("email", "==", user.email),
          where("isLocal", "==", true),
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Found linked account!
          const linkedDoc = querySnapshot.docs[0];
          const rawId = linkedDoc.id; // e.g., local_hungthai84
          const cleanId = rawId.replace(/^local_/, "");
          setExistingLinkedId(cleanId);
          setLinkedId(cleanId);
          setHasExistingLink(true);
        } else {
          // If this is the superadmin, suggest "hungthai84" as default User ID
          if (user.email.toLowerCase() === "hungthai84@gmail.com") {
            setLinkedId("hungthai84");
          }
        }
      } catch (err) {
        console.warn("Could not check linked accounts:", err);
      } finally {
        setIsSearchingLinked(false);
      }
    }

    checkLinkedAccount();
  }, [user, isLocal]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Vui lòng điền tên hiển thị.");
      return;
    }

    // Checking if changing password
    if (password) {
      if (password.length < 6) {
        toast.error("Mật khẩu bảo mật phải có ít nhất 6 ký tự.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Mật khẩu xác nhận không trùng khớp.");
        return;
      }
    }

    let success = false;
    if (isLocal) {
      // Local User can change Display Name & Password
      success = await updateProfileData(displayName, password || undefined);
    } else {
      // Google user can change Display Name, and optionally link/update a custom internal User ID + Password
      success = await updateProfileData(
        displayName,
        password || undefined,
        linkedId.trim() || undefined,
      );
      if (success && linkedId.trim()) {
        setHasExistingLink(true);
        setExistingLinkedId(linkedId.trim().toLowerCase());
      }
    }

    if (success) {
      setPassword("");
      setConfirmPassword("");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "profile" } }),
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Upper header profile summary card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl -z-10 translate-x-12 -translate-y-12"></div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <img
              src={
                user?.photoURL ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256"
              }
              alt={displayName}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary/10 shadow-lg"
              referrerPolicy="no-referrer"
            />
            {systemUser?.role === "Admin" && (
              <span className="absolute -bottom-2 -right-2 bg-[#2f6cf5] text-white p-1.5 rounded-xl shadow-md">
                <Shield className="w-4 h-4" />
              </span>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h3 className="text-xl font-bold font-heading text-foreground">
                {systemUser?.displayName || displayName}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase tracking-wider rounded-lg leading-none">
                <BadgeCheck className="w-3.5 h-3.5" /> Thừa nhận hệ thống
              </span>
            </div>

            <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-muted-foreground/60" />{" "}
              {user?.email}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold pt-1">
              <div className="px-3 py-1 bg-muted/60 border border-border rounded-xl">
                Quyền:{" "}
                <span className="font-extrabold text-[#2f6cf5]">
                  {systemUser?.role || "Support"}
                </span>
              </div>
              <div className="px-3 py-1 bg-muted/60 border border-border rounded-xl">
                Trạng thái:{" "}
                <span className="font-extrabold text-emerald-500 uppercase">
                  Hoạt động ({systemUser?.status || "approved"})
                </span>
              </div>
              <div className="px-3 py-1 bg-muted/60 border border-border rounded-xl">
                Kiểu:{" "}
                <span className="font-extrabold text-amber-500">
                  {isLocal ? "Đăng nhập Local ID" : "Google Authenticator"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <form
            onSubmit={handleUpdateProfile}
            className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6"
          >
            <div>
              <h3 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
                <User className="w-4 h-4 text-[#2f6cf5]" /> Cập nhật chi tiết hồ
                sơ
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Thay đổi tên hiển thị đại diện trên trang quản trị khách hàng.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Họ và tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ví dụ: Thái Hồng Hưng"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-2xl text-xs font-bold ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300"
                />
              </div>

              {/* Linking credentials section for Google users */}
              {!isLocal && (
                <div className="pt-4 border-t border-border/60">
                  <div className="bg-primary/5 border border-primary/25 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-extrabold text-primary">
                          Liên kết đăng nhập bằng User ID
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                          Tạo liên kết với tài khoản nội bộ để bạn có thể đăng
                          nhập bằng cả Google Auth lẫn gõ User ID + Mật khẩu thủ
                          công.
                        </p>
                      </div>
                    </div>

                    {isSearchingLinked ? (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 py-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />{" "}
                        Đang kiểm tra liên kết hiện tại...
                      </div>
                    ) : hasExistingLink ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-3 text-xs font-bold">
                        Hệ thống ghi nhận Email của bạn ĐÃ LIÊN KẾT thành công
                        với User ID nội bộ:{" "}
                        <span className="underline text-emerald-800 bg-emerald-500/20 px-1.5 py-0.5 rounded ml-1">
                          {existingLinkedId}
                        </span>
                        . Bạn có thể cập nhật lại mật khẩu đăng nhập của User ID
                        này bên dưới.
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl p-3 text-xs font-bold">
                        Email này chưa liên kết với tài khoản nội bộ nào. Hãy
                        khởi tạo một tên truy cập và mật khẩu phía dưới để tạo
                        cổng đăng nhập kép.
                      </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block">
                        Tên truy cập nội bộ (User ID)
                      </label>
                      <input
                        type="text"
                        disabled={hasExistingLink}
                        value={linkedId}
                        onChange={(e) => setLinkedId(e.target.value)}
                        placeholder="Viết liền không dấu (ví dụ: hungthai84)"
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-2xl text-xs font-bold disabled:opacity-65 disabled:bg-muted"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password configuration */}
              <div className="pt-4 border-t border-border/60 space-y-4">
                <div>
                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#2f6cf5]" />
                    {isLocal
                      ? "Đổi mật khẩu bảo mật"
                      : hasExistingLink
                        ? "Cập nhật mật khẩu cho User ID"
                        : "Đặt mật khẩu bảo mật liên kết"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {isLocal
                      ? "Chừa trống trường này nếu bạn không muốn thay đổi mật khẩu hiện tại."
                      : "Sử dụng mật khẩu này cùng với User ID phía trên khi đăng nhập thủ công."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu cực bảo mật"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-2xl text-xs font-semibold "
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Gõ lại mật khẩu phía trước"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-2xl text-xs font-semibold "
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#2f6cf5] hover:bg-[#1e52db] text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" /> Lưu thông tin & Mật khẩu
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar help / guidelines card */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Hướng dẫn bảo
              mật
            </h4>
            <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
              <p>
                Hệ thống CRM hỗ trợ đăng nhập{" "}
                <strong>Mã Hóa Đồng Bộ Kép</strong>, nơi một quản trị viên có
                thể sử dụng đồng thời một Account Google và một User ID nội bộ.
              </p>
              <p className="border-l-2 border-primary/40 pl-3 italic py-1 bg-primary/5 rounded-r">
                "Học rộng hiểu cao bảo mật vững chắc. Tuyệt đối không chia sẻ
                mật khẩu của bạn cho bất kỳ ai, bao gồm cả nhân viên hỗ trợ."
              </p>
              <p>
                Để liên kết tài khoản Gmail:{" "}
                <strong className="text-foreground">
                  hungthai84@gmail.com
                </strong>{" "}
                với User ID nội bộ:{" "}
                <strong className="text-foreground">hungthai84</strong> và mật
                khẩu{" "}
                <strong className="text-foreground">HungTh@i22061984</strong>,
                bạn chỉ cần đăng nhập bằng Gmail, sau đó thiết lập chính xác các
                thông tin này ngay tại khung cập nhật bên cạnh.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#2f6cf5]" /> Mã hóa bảo mật SSL
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mật khẩu đăng nhập của bạn được lưu trữ dưới dạng băm bảo mật một
              chiều không thể giải mã ngược lại trên dịch vụ Firestore. Mọi hành
              trình truyền tin đều phục vụ dưới giao thức HTTPS/SSL an toàn tối
              đa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
