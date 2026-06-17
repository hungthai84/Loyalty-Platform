import React, { useState } from "react";
import { Plus, Users, Calendar, Gift, ChevronRight, FileSpreadsheet, Search, CheckCircle2, ChevronLeft, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface MembershipProject {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  benefits: string[];
  membersCount: number;
  offers: string[];
  status: 'active' | 'upcoming' | 'completed';
  coverUrl: string;
}

const DEMO_PROJECTS: MembershipProject[] = [
  {
    id: "p1",
    name: "Summer Vibes 2026",
    description: "Nhóm hội viên tham dự chuỗi sự kiện mùa hè tại các bãi biển đẳng cấp.",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    benefits: ["Vé VIP khu vực lounge lễ hội", "Tặng đồ uống miễn phí mỗi ngày", "Quà tặng Merchandise độc quyền"],
    membersCount: 450,
    offers: ["Voucher -50% Combo Summer", "Freeship mọi đơn hàng mùa hè"],
    status: 'active',
    coverUrl: "https://images.unsplash.com/photo-1541410965313-d53b3c16ef17?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "p2",
    name: "Elite Investors Club",
    description: "Đặc quyền riêng dành cho nhóm hội viên đầu tư vào các dự án chiến lược của công ty.",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    benefits: ["Báo cáo phân tích chuyên sâu hàng tháng", "Gặp gỡ ban quản trị (Private Meet)", "Quyền ưu tiên mua sản phẩm giới hạn"],
    membersCount: 120,
    offers: ["Cashback 2% trên mọi giao dịch lớn", "Gói vay lãi suất 0% tháng đầu"],
    status: 'active',
    coverUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "p3",
    name: "Foodie Passport Q3",
    description: "Khám phá ẩm thực 3 miền cùng với các đầu bếp danh tiếng, dành cho nhóm Foodie.",
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    benefits: ["Mã mời dự Private Dining", "Miễn phí món khai vị tại hệ thống nhà hàng", "Tích x3 điểm CRM cho hóa đơn ẩm thực"],
    membersCount: 890,
    offers: ["Voucher 500k tại Golden Dragon", "Combo Món Âu giá đặc biệt"],
    status: 'upcoming',
    coverUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "p4",
    name: "Tech Innovators Retreat",
    description: "Dự án quy tụ các thành viên đam mê công nghệ tham gia hội thảo Retreat cuối năm.",
    startDate: "2025-11-15",
    endDate: "2025-11-20",
    benefits: ["Tham dự Workshop nội bộ", "Quyền lợi truy cập Beta Software", "Tặng khóa học Masterclass"],
    membersCount: 300,
    offers: ["Giảm 30% phụ kiện công nghệ", "Gói bảo hành mở rộng miễn phí"],
    status: 'completed',
    coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
  }
];

export function MembershipProjectsView() {
  const [projects, setProjects] = useState<MembershipProject[]>(DEMO_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<MembershipProject | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [viewingMembers, setViewingMembers] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [benefits, setBenefits] = useState("");
  const [offers, setOffers] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newProject: MembershipProject = {
      id: "p" + Date.now(),
      name,
      description,
      startDate,
      endDate,
      benefits: benefits.split('\n').filter(b => b.trim() !== ""),
      offers: offers.split('\n').filter(o => o.trim() !== ""),
      membersCount: Math.floor(Math.random() * 500), // simulate file upload
      status: 'upcoming',
      coverUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    };
    setProjects([newProject, ...projects]);
    setShowCreateForm(false);
    // Reset
    setName(""); setDescription(""); setStartDate(""); setEndDate(""); setBenefits(""); setOffers("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full">Đang diễn ra</span>;
      case 'upcoming': return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full">Sắp tới</span>;
      case 'completed': return <span className="px-2.5 py-1 text-[10px] font-black uppercase text-muted-foreground bg-muted border border-border/50 rounded-full">Đã kết thúc</span>;
      default: return null;
    }
  };

  if (viewingMembers && selectedProject) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full pb-20 text-left"
      >
        <button 
          onClick={() => setViewingMembers(false)}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Quay lại dự án
        </button>

        <div className="bg-card/45 border border-border/60 rounded-3xl p-6 shadow-sm backdrop-blur-md relative">
           <h2 className="text-xl font-black text-foreground mb-1">Danh sách hội viên: {selectedProject.name}</h2>
           <p className="text-sm font-medium text-muted-foreground mb-6">Tổng {selectedProject.membersCount} thành viên trong danh sách</p>
           
           <div className="relative mb-6">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm kiếm hội viên..." className="pl-9 h-10 font-medium max-w-sm" />
           </div>

           <div className="border border-border/50 rounded-2xl overflow-hidden">
             <table className="w-full text-left font-medium text-sm">
               <thead className="bg-muted/50 border-b border-border/50 text-xs font-black uppercase tracking-wider text-muted-foreground">
                 <tr>
                   <th className="p-4">Họ và tên</th>
                   <th className="p-4">Số điện thoại</th>
                   <th className="p-4">Email</th>
                   <th className="p-4">Ngày thêm</th>
                   <th className="p-4">Trạng thái</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/50">
                  {Array.from({length: 8}).map((_, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold text-foreground">Nguyễn Văn {String.fromCharCode(65 + i)}</td>
                      <td className="p-4">0987xxx{100 + i}</td>
                      <td className="p-4">user_{i}@example.com</td>
                      <td className="p-4">16/06/2026</td>
                      <td className="p-4"><span className="px-2.5 py-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full">Hợp lệ</span></td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        </div>
      </motion.div>
    );
  }

  if (selectedProject) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full pb-20"
      >
        <button 
          onClick={() => setSelectedProject(null)}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Quay lại danh sách
        </button>

        <div className="bg-card/45 border border-border/60 rounded-3xl overflow-hidden shadow-sm backdrop-blur-md relative">
          <div className="h-64 w-full relative">
            <img src={selectedProject.coverUrl} className="w-full h-full object-cover" alt="Cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-left">
               <div className="mb-3">{getStatusBadge(selectedProject.status)}</div>
               <h2 className="text-3xl font-black text-white text-shadow-md">{selectedProject.name}</h2>
               <div className="flex items-center gap-4 mt-3 text-white/80 text-sm font-medium">
                  <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {selectedProject.startDate} - {selectedProject.endDate}</div>
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors" onClick={() => setViewingMembers(true)}><Users className="w-4 h-4" /> {selectedProject.membersCount} hội viên tham gia (Xem danh sách)</div>
               </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            <div className="col-span-2 space-y-8">
               <div>
                 <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Mô tả dự án</h3>
                 <p className="text-sm font-medium leading-relaxed">{selectedProject.description}</p>
               </div>

               <div>
                 <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Gift className="w-4 h-4" /> Quyền lợi đặc exclusive</h3>
                 <ul className="space-y-3">
                   {selectedProject.benefits.map((b, i) => (
                     <li key={i} className="flex items-start gap-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                       <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                       <span className="text-sm font-bold text-foreground">{b}</span>
                     </li>
                   ))}
                  </ul>
               </div>
            </div>
            
            <div className="space-y-6">
                <div className="bg-[#2f6cf5]/5 border border-[#2f6cf5]/20 rounded-2xl p-5">
                   <h3 className="text-sm font-black uppercase tracking-wider text-[#2f6cf5] mb-4 flex items-center gap-2"> Ưu đãi áp dụng đính kèm</h3>
                   <div className="space-y-2">
                     {selectedProject.offers.map((o, i) => (
                       <div key={i} className="bg-white dark:bg-zinc-900 border border-border rounded-xl p-3 shadow-xs font-bold text-xs">
                         {o}
                       </div>
                     ))}
                   </div>
                </div>

                <div 
                  onClick={() => setViewingMembers(true)}
                  className="bg-card border border-border/80 rounded-2xl p-5 text-center cursor-pointer hover:bg-muted/30 transition-colors group"
                >
                   <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3 group-hover:text-[#2f6cf5] transition-colors" />
                   <h3 className="text-lg font-black mb-1 group-hover:text-[#2f6cf5] transition-colors">{selectedProject.membersCount}</h3>
                   <p className="text-xs font-bold text-muted-foreground mb-4">Nhấn để xem danh sách hội viên</p>
                   <Button variant="outline" className="w-full text-xs font-bold pointer-events-none">
                     <FileSpreadsheet className="w-4 h-4 mr-2" /> Xem / Tải danh sách
                   </Button>
                </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (showCreateForm) {
     return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-full text-left"
      >
        <button 
          onClick={() => setShowCreateForm(false)}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Bỏ qua & Quay lại
        </button>

        <form onSubmit={handleCreate} className="bg-card/45 border border-border/60 rounded-3xl p-6 md:p-8 max-w-3xl space-y-6 backdrop-blur-md shadow-sm">
           <div>
             <h2 className="text-xl font-black text-foreground">Tạo danh sách Dự án hội viên mới</h2>
             <p className="text-xs font-medium text-muted-foreground mt-1">Thiết lập nhóm hội viên đặc biệt kèm quyền lợi và ưu đãi dự án.</p>
           </div>

           <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 block">Tên dự án</label>
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="VD: Khách hàng VIP Hè 2026..." className="font-semibold" />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 block">Mô tả chi tiết</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 text-sm font-medium outline-none h-24" placeholder="Mục đích của dự án..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 block">Ngày bắt đầu</label>
                    <Input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="font-semibold" />
                 </div>
                 <div>
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 block">Ngày kết thúc</label>
                    <Input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="font-semibold" />
                 </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 block">Nạp danh sách hội viên (File đính kèm)</label>
                <div className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer">
                   <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                   <p className="text-sm font-bold">Kéo thả file CSV/Excel hoặc click để tải lên</p>
                   <p className="text-xs text-muted-foreground mt-1">Hỗ trợ định dạng: .csv, .xlsx</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 block">Add ưu đãi từ Mục ưu đãi (có thể chọn nhiều ưu đãi)</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    "Voucher -50% Combo Summer", "Freeship mọi đơn hàng mùa hè",
                    "Cashback 2% trên mọi giao dịch lớn", "Gói vay lãi suất 0% tháng đầu",
                    "Voucher 500k tại Golden Dragon", "Combo Món Âu giá đặc biệt",
                    "Giảm 30% phụ kiện công nghệ", "Gói bảo hành mở rộng miễn phí"
                  ].map((offer, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-sm font-bold text-foreground cursor-pointer bg-muted/20 p-2 rounded-lg border border-border/40 hover:bg-muted/50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded border-border text-[#2f6cf5] focus:ring-[#2f6cf5] w-4 h-4"
                        checked={offers.includes(offer)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOffers(prev => prev ? prev + "\n" + offer : offer);
                          } else {
                            setOffers(prev => prev.split('\n').filter(o => o !== offer).join('\n'));
                          }
                        }}
                      />
                      <span className="truncate">{offer}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 block">Thêm mục quyền lợi: thêm từng dòng ghi chú về quyền lợi</label>
                <textarea value={benefits} onChange={e => setBenefits(e.target.value)} className="w-full bg-background border border-border rounded-xl p-3 text-sm font-medium outline-none h-24" placeholder="Ví dụ:&#10;Miễn phí vé vào cửa&#10;Quà tặng cao cấp"></textarea>
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
             <Button variant="outline" type="button" onClick={() => setShowCreateForm(false)} className="cursor-pointer font-bold">Hủy bỏ</Button>
             <Button type="submit" className="bg-[#2f6cf5] text-white hover:bg-[#2f6cf5]/90 font-bold cursor-pointer">Tạo dự án tham gia</Button>
           </div>
        </form>
      </motion.div>
     );
  }

  return (
    <div className="w-full flex md:flex flex-col gap-6 w-full">
      {/* Banner / Header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/10 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-6 md:p-8 backdrop-blur-md text-left">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-background to-background pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm uppercase tracking-wider mb-2">
              <Users className="w-5 h-5 animate-pulse" /> Phân loại trạng thái
            </div>
            <h3 className="text-2xl font-bold font-heading text-foreground">
              Dự án Phân Nhóm Hội Viên
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Nhóm các khách hàng vào các dự án ưu đãi độc quyền. Thiết lập đặc quyền, voucher và phần quà đặc biệt, và kiểm soát danh sách tham gia theo thời gian thực.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div className="relative flex-1 max-w-md text-left">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm kiếm dự án hội viên..." className="pl-9 h-10 font-medium" />
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-[#2f6cf5] text-white hover:bg-[#2f6cf5]/90 font-bold px-5 h-10 shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tạo nhóm dự án mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
         {projects.map(proj => (
           <motion.div
             key={proj.id}
             whileHover={{ y: -4 }}
             onClick={() => setSelectedProject(proj)}
             className="bg-card/45 border border-border/60 rounded-3xl overflow-hidden shadow-xs cursor-pointer group hover:shadow-md transition-all text-left flex flex-col"
           >
             <div className="h-32 w-full relative overflow-hidden">
               <img src={proj.coverUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
               <div className="absolute bottom-3 left-3 right-3 text-white flex justify-between items-end">
                  {getStatusBadge(proj.status)}
               </div>
             </div>
             
             <div className="p-5 flex flex-col flex-1">
               <h3 className="text-base font-black text-foreground mb-2 line-clamp-1 group-hover:text-[#2f6cf5] transition-colors">{proj.name}</h3>
               <p className="text-xs font-medium text-muted-foreground line-clamp-2 mb-4 flex-1">
                 {proj.description}
               </p>

               <div className="mt-auto space-y-3 pt-3 border-t border-border/50">
                 <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" /> {proj.startDate}</span>
                 </div>
                 <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#2f6cf5]" /> {proj.membersCount} thành viên</span>
                    <span className="flex items-center gap-1.5 text-amber-500"><Gift className="w-3.5 h-3.5" /> {proj.benefits.length} quyền lợi</span>
                 </div>
               </div>
             </div>
           </motion.div>
         ))}
      </div>
    </div>
  );
}
