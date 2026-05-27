import React, { useState } from "react";
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
  Info
} from "lucide-react";
import { toast } from "sonner";

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

  const [mockUsers, setMockUsers] = useState([
    { id: "usr-1", name: "Nguyễn Lâm Anh", email: "lamanh.n@sevago.vip", role: "Admin", active: true },
    { id: "usr-2", name: "Trần Anh Tuấn", email: "tuan.ta@sevago.vip", role: "Manager", active: true },
    { id: "usr-3", name: "Phạm Minh Thư", email: "thu.pm@sevago.vip", role: "Support", active: true },
    { id: "usr-4", name: "Lý Gia Bảo", email: "bao.lg@sevago.vip", role: "Support", active: false }
  ]);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Admin" | "Manager" | "Support">("Support");

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
    toast.success("Đã thay đổi cài đặt phân quyền!");
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error("Vui lòng điền đủ Họ tên và Email");
      return;
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      active: true
    };
    setMockUsers(prev => [...prev, newUser]);
    toast.success(`Đã thêm thành viên mới: ${newUserName} (${newUserRole})`);
    setNewUserName("");
    setNewUserEmail("");
  };

  const deleteUser = (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa thành viên ${name}?`)) {
      setMockUsers(prev => prev.filter(u => u.id !== id));
      toast.success(`Đã gỡ quyền truy cập của ${name}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Description Alert */}
      <div className="bg-[#2f6cf5]/5 border border-[#2f6cf5]/25 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2.5 bg-[#2f6cf5]/15 rounded-xl text-[#2f6cf5] shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-[#2f6cf5] text-sm">Quản Trị Vai Trò & Phân Quyền (RBAC System)</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thiết lập này giúp bạn kiểm soát ranh giới bảo mật cho nhân sự. Quản trị viên (Admin) luôn giữ toàn quyền hệ thống. Bạn có thể bật/tắt động các quyền cụ thể cho cấp Quản lý (Manager) và Nhân viên Hỗ trợ (Support) Showroom bên dưới.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left/Middle Table: Permissions togglers */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold font-heading text-foreground text-base">MA TRẬN PHÂN QUYỀN VAI TRÒ</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Tùy chỉnh quyền hạn của từng nhóm trực quan.</p>
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
            <span>Mẹo: Quản trị viên có mã bảo vệ không thể bị hạn chế quyền. Các lượt thay đổi sẽ có hiệu lực tức thời cho tài khoản phụ thuộc tương ứng.</span>
          </div>
        </div>

        {/* Right Column: User list & Adding user */}
        <div className="space-y-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold font-heading text-foreground text-sm uppercase">THÊM NHÂN SỰ MỚI</h3>
              <p className="text-[11px] text-muted-foreground">Phát hành tài khoản truy cập showroom mới.</p>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-[10px] text-muted-foreground font-bold uppercase mb-1">Họ và tên</label>
                <input 
                  type="text" 
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Lê Minh Triết"
                  className="w-full p-2 bg-background border rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground font-bold uppercase mb-1">Email truy cập</label>
                <input 
                  type="email" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="triet.lm@sevago.vip"
                  className="w-full p-2 bg-background border rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-muted-foreground font-bold uppercase mb-1">Nhóm vai trò</label>
                <select 
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full p-2 bg-background border rounded-xl text-xs font-semibold text-foreground outline-none"
                >
                  <option value="Admin">Admin (Toàn Quyền)</option>
                  <option value="Manager">Manager (Quản Lý)</option>
                  <option value="Support">Support (Hỗ Trợ Showroom)</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md mt-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Bổ nhiệm vai trò
              </button>
            </form>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold font-heading text-sm text-foreground uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2f6cf5]" /> DANH SÁCH THÀNH VIÊN
              </h3>
              <p className="text-[11px] text-muted-foreground">Tài khoản đang có thiết lập phân quyền.</p>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 divide-y divide-border/40">
              {mockUsers.map((u, i) => (
                <div key={u.id} className={`flex items-center justify-between pt-3 ${i === 0 ? "pt-0 border-none" : ""}`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">{u.name}</span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                        u.role === "Admin" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                        u.role === "Manager" ? "bg-[#2f6cf5]/10 text-[#2f6cf5] border border-[#2f6cf5]/20" :
                        "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      }`}>
                        {u.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">{u.email}</span>
                  </div>

                  {u.role !== "Admin" ? (
                    <button 
                      onClick={() => deleteUser(u.id, u.name)}
                      className="text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Thu hồi quyền"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="p-1 px-2 border rounded-lg bg-muted text-muted-foreground/35 text-[9px] font-bold">Gốc</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
