import React, { useEffect, useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  UserX, 
  UserPlus, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle,
  BadgeAlert,
  Info,
  Clock,
  Check,
  X,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface RolePermission {
  id: string;
  name: string;
  description: string;
  admin: boolean;
  manager: boolean;
  support: boolean;
}

export function RoleManager() {
  const [permissions, setPermissions] = useState<RolePermission[]>([
    { id: "cust_view", name: "Xem Danh Sách Khách Hàng", description: "Có quyền tra cứu thông tin cơ bản khách hàng VIP", admin: true, manager: true, support: true },
    { id: "cust_edit", name: "Sửa Thông Tin & Đổi Điểm", description: "Thay đổi thông tin liên lạc, cộng/trừ điểm tích lũy", admin: true, manager: true, support: true },
    { id: "tier_config", name: "Cấu Hình Hạng Hội Viên", description: "Chỉnh sửa ngưỡng thăng hạng (Essential, Icon, Atelier)", admin: true, manager: true, support: false },
    { id: "marketing_publish", name: "Kích Hoạt Chiến Dịch", description: "Bật/tắt tự động hóa tiếp thị, gửi SMS/Zalo/Email mẫu", admin: true, manager: true, support: false },
    { id: "financial_edit", name: "Tham Số Tài Chính", description: "Quyết định quỹ chi phí VIP, ngân sách loyalty showroom", admin: true, manager: false, support: false },
    { id: "api_write", name: "Quản Trị Hệ Thống & Keys", description: "Tạo API Keys, sửa đổi cài đặt SendGrid & Firebase Rules", admin: true, manager: false, support: false },
  ]);

  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real-time users from Firestore
  useEffect(() => {
    const q = query(collection(db, "system_users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: any[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      // Sort users: approved first, then alphabetically
      usersList.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return (a.displayName || "").localeCompare(b.displayName || "");
      });
      setSystemUsers(usersList);
      setLoading(false);
    }, (error) => {
      console.error("Failed to load real-time system users", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const approveUser = async (userId: string, role: string) => {
    try {
      const userDocRef = doc(db, "system_users", userId);
      await updateDoc(userDocRef, {
        status: "approved",
        role: role,
        updatedAt: new Date()
      });
      toast.success("Đã phê duyệt tài duyệt và gán quyền truy cập thành công!");
    } catch (error: any) {
      toast.error(`Duyệt thất bại: ${error.message}`);
    }
  };

  const rejectUser = async (userId: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn từ chối quyền truy cập của ${name}?`)) {
      try {
        const userDocRef = doc(db, "system_users", userId);
        await updateDoc(userDocRef, {
          status: "rejected",
          updatedAt: new Date()
        });
        toast.success(`Đã từ chối quyền tham gia của ${name}`);
      } catch (error: any) {
        toast.error(`Từ chối thất bại: ${error.message}`);
      }
    }
  };

  const revokeAccess = async (userId: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn thu hồi quyền & khóa tài khoản ${name}?`)) {
      try {
        const userDocRef = doc(db, "system_users", userId);
        await updateDoc(userDocRef, {
          status: "rejected",
          updatedAt: new Date()
        });
        toast.success(`Đã thu hồi truy cập của ${name}`);
      } catch (error: any) {
        toast.error(`Thu hồi thất bại: ${error.message}`);
      }
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const userDocRef = doc(db, "system_users", userId);
      await updateDoc(userDocRef, {
        role: role,
        updatedAt: new Date()
      });
      toast.success("Thay đổi phân quyền vai trò thành công!");
    } catch (error: any) {
      toast.error(`Lỗi thay đổi vai trò: ${error.message}`);
    }
  };

  const togglePermission = (permId: string, role: "manager" | "support") => {
    setPermissions(prev => prev.map(p => {
      if (p.id === permId) {
        return {
          ...p,
          [role]: !p[role]
        };
      }
      return p;
    }));
    toast.success("Đã cập nhật cấu hình ma trận vai trò!");
  };

  // Organize groups
  const pendingUsers = systemUsers.filter(u => u.status === "pending");
  const approvedUsers = systemUsers.filter(u => u.status === "approved");
  const rejectedUsers = systemUsers.filter(u => u.status === "rejected");

  return (
    <div className="space-y-8">
      {/* Top Description Box */}
      <div className="bg-[#2f6cf5]/5 border border-[#2f6cf5]/25 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2.5 bg-[#2f6cf5]/15 rounded-xl text-[#2f6cf5] shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-[#2f6cf5] text-sm">Hệ Thống Duyệt Đăng Ký & Phân Vai Trò (RBAC System)</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thiết lập này giúp quản trị viên xét duyệt hồ sơ đăng ký Gmail từ nhân viên. Bạn có thể gán các nhóm vai trò (Admin, Manager, Support) và bật/tắt động các quyền năng cụ thể cho từng vai trò Showroom trực tiếp bên dưới.
          </p>
        </div>
      </div>

      {/* 1. Pending Approvals Queue - Super visual and high-intent */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="font-black font-heading text-amber-600 text-sm tracking-wide uppercase flex items-center gap-2">
              Yêu Cầu Chờ Duyệt ({pendingUsers.length})
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">Các tài khoản Gmail mới gửi yêu cầu đăng ký. Vui lòng gán vai trò và ấn "Phê duyệt" để họ có thể đăng nhập.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map((u) => {
              const [selectedRole, setSelectedRole] = useState<string>("Support");
              return (
                <div key={u.id} className="bg-card border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-amber-500 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <img src={u.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256"} alt={u.displayName} className="w-10 h-10 rounded-full border shadow-sm object-cover" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground leading-tight">{u.displayName}</h4>
                        <span className="text-[10px] text-muted-foreground leading-none font-mono block">{u.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground shrink-0">Chọn vai trò:</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="bg-background border border-border rounded-lg text-[11px] p-1.5 focus:outline-none focus:ring-1 focus:ring-primary h-8"
                    >
                      <option value="Support">Support (Nhân viên)</option>
                      <option value="Manager">Manager (Quản lý)</option>
                      <option value="Admin">Admin (Quản trị viên)</option>
                    </select>

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => approveUser(u.id, selectedRole)}
                        className="p-1 px-3.5 bg-emerald-500 text-white hover:bg-emerald-650 rounded-lg text-[11px] font-extrabold flex items-center gap-1 h-8 cursor-pointer active:scale-95 transition-transform"
                        title="Duyệt tài khoản"
                      >
                        <Check className="w-3.5 h-3.5" /> Duyệt
                      </button>
                      <button
                        onClick={() => rejectUser(u.id, u.displayName)}
                        className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-xs cursor-pointer h-8 active:scale-95 transition-all"
                        title="Từ chối yêu cầu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns: Matrix */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold font-heading text-foreground text-base uppercase">MA TRẬN PHÂN QUYỀN VAI TRÒ</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Tùy chỉnh phân quyền cho Manager & Support trực quan.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground uppercase font-black tracking-wider text-[10px]">
                  <th className="py-3 px-4">Quyền Hạn & Chức Năng</th>
                  <th className="py-3 px-4 text-center">Admin</th>
                  <th className="py-3 px-4 text-center">Manager</th>
                  <th className="py-3 px-4 text-center">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {permissions.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{p.description}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="mx-auto w-fit p-1 bg-emerald-500/10 text-emerald-600 rounded-md">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => togglePermission(p.id, "manager")}
                        className={`mx-auto flex p-1.5 rounded-lg transition-all cursor-pointer ${
                          p.manager 
                            ? "bg-primary/10 text-primary border border-primary/30" 
                            : "bg-muted text-muted-foreground/45 border border-transparent"
                        }`}
                      >
                        {p.manager ? <CheckCircle2 className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => togglePermission(p.id, "support")}
                        className={`mx-auto flex p-1.5 rounded-lg transition-all cursor-pointer ${
                          p.support 
                            ? "bg-primary/10 text-primary border border-primary/30" 
                            : "bg-muted text-muted-foreground/45 border border-transparent"
                        }`}
                      >
                        {p.support ? <CheckCircle2 className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/20 p-3.5 rounded-xl border border-border/40 text-[11px] text-muted-foreground flex gap-2">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>Mẹo: Quản trị viên (Admin) luôn sở hữu tối cao mà không cần cấu hình. Mọi thay đổi ở ma trận vai trò sẽ tự tác động tức thì tới các nhân sự phụ thuộc tương ứng.</span>
          </div>
        </div>

        {/* Right Columns: Approved and Revoked User list */}
        <div className="space-y-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold font-heading text-sm text-foreground uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2f6cf5]" /> THÀNH VIÊN HOẠT ĐỘNG ({approvedUsers.length})
              </h3>
              <p className="text-[11px] text-muted-foreground">Tài khoản Gmail hợp lệ được cấp quyền gia nhập hệ thống CRM.</p>
            </div>

            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Đang tải danh sách thành viên...</p>
            ) : approvedUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Chưa có thành viên nào.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 divide-y divide-border/40">
                {approvedUsers.map((u, i) => (
                  <div key={u.id} className={`flex items-center justify-between pt-3 ${i === 0 ? "pt-0 border-none" : ""}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <img src={u.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256"} alt="" className="w-6 h-6 rounded-full border shadow-sm object-cover" />
                        <span className="text-xs font-bold text-foreground leading-none">{u.displayName}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block font-mono pl-7">{u.email}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {u.email?.toLowerCase() === "hungthai84@gmail.com" ? (
                        <span className="p-1 px-2.5 border rounded-lg bg-emerald-500/10 text-emerald-600 border-emerald-500/25 text-[9px] font-black uppercase">Gốc</span>
                      ) : (
                        <>
                          <select
                            value={u.role || "Support"}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            className="bg-transparent border border-border/60 rounded-lg text-[10px] font-extrabold px-1.5 py-1 text-foreground"
                          >
                            <option value="Support">Support</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                          </select>
                          <button 
                            onClick={() => revokeAccess(u.id, u.displayName)}
                            className="text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Khóa/Thu hồi quyền tham gia"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rejected/Blocked Users queue - easily allow re-approving blocks */}
          {rejectedUsers.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold font-heading text-xs text-rose-500 uppercase flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" /> TÀI KHOẢN BỊ KHÓA ({rejectedUsers.length})
                </h3>
                <p className="text-[10px] text-muted-foreground">Tài khoản nằm trong diện từ chối hoặc đã thu hồi quyền.</p>
              </div>

              <div className="space-y-3 max-h-[150px] overflow-y-auto divide-y divide-border/40">
                {rejectedUsers.map((u, i) => (
                  <div key={u.id} className={`flex items-center justify-between pt-2.5 ${i === 0 ? "pt-0 border-none" : ""}`}>
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-muted-foreground line-through">{u.displayName}</span>
                      <span className="text-[9px] text-muted-foreground/60 font-mono block">{u.email}</span>
                    </div>
                    <button
                      onClick={() => approveUser(u.id, "Support")}
                      className="p-1 px-2.5 bg-[#2f6cf5]/10 text-[#2f6cf5] border border-[#2f6cf5]/20 rounded-md text-[9px] font-extrabold cursor-pointer hover:bg-primary hover:text-white transition-all"
                    >
                      Bỏ khóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
