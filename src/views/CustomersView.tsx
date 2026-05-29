import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Plus, Settings, Facebook, Linkedin, Instagram, ArrowRight, User, Upload, SlidersHorizontal, RotateCcw } from "lucide-react";
import * as motion from "motion/react-client";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Customer, AttributeDefinition, Company } from "@/types";
import { CUSTOMER_STATUSES } from "@/data/customerStatuses";
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { ImportCustomersDialog } from "@/components/customers/ImportCustomersDialog";
import { AttributeManager } from "@/components/customers/AttributeManager";
import { CustomerDashboard } from "@/components/customers/CustomerDashboard";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { Building2 } from "lucide-react";
import { getGuestCustomers, getGuestAttributes, getGuestCompanies } from "@/data/guestData";


const COLOR_PRESET_MAP_SHORT: Record<string, string> = {
 gold: 'bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5]/20',
 emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
 rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
 sky: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
 indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
 purple: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
 slate: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

const COLUMN_LABELS: Record<string, string> = {
 id: "Mã KH",
 nameEmail: "Họ tên & Email",
 social: "Mạng xã hội",
 company: "Công ty / Chi nhánh",
 status: "Trạng thái",
 points: "Điểm CRM",
 customAttributes: "Trường bổ sung",
 actions: "Hành động"
};

export function CustomersView() {
 const { user, loading: authLoading, signIn } = useFirebase();
 const [customers, setCustomers] = useState<Customer[]>([]);
 const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
 const [companies, setCompanies] = useState<Company[]>([]);
 const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
 const [selectedStatus, setSelectedStatus] = useState<string>("all");
 const [loading, setLoading] = useState(true);
 const [showAddDialog, setShowAddDialog] = useState(false);
 const [showAttrManager, setShowAttrManager] = useState(false);
 const [showImportDialog, setShowImportDialog] = useState(false);
 const [search, setSearch] = useState("");
 
 // Custom column toggle configuration
 const [showColumnSettings, setShowColumnSettings] = useState(false);
 const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
 id: true,
 nameEmail: true,
 social: true,
 company: true,
 status: true,
 points: true,
 customAttributes: true,
 actions: true,
 });

 // Advanced filters toggle state & custom criteria values
 const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
 const [minPoints, setMinPoints] = useState<string>("");
 const [maxPoints, setMaxPoints] = useState<string>("");
 const [selectedSocialType, setSelectedSocialType] = useState<string>("all"); // 'all', 'facebook', 'zalo', 'linkedin', 'instagram', 'tiktok'
 const [selectedHasCompany, setSelectedHasCompany] = useState<string>("all"); // 'all', 'yes', 'no'
 const [selectedTag, setSelectedTag] = useState<string>("all"); // specific segment card tag
 const [sortBy, setSortBy] = useState<string>("createdAt_desc"); // sorting option

 // New state to view a single customer details dashboard
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

 useEffect(() => {
 if (!user) {
 const loadGuestData = () => {
 setCustomers(getGuestCustomers());
 setAttributes(getGuestAttributes());
 setCompanies(getGuestCompanies());
 setLoading(false);
 };

 loadGuestData();
 window.addEventListener("crm_guest_data_changed", loadGuestData);
 return () => {
 window.removeEventListener("crm_guest_data_changed", loadGuestData);
 };
 }

 const customersPath = `users/${user.uid}/customers`;
 const attrsPath = `users/${user.uid}/attributeDefinitions`;

 const qCustomers = query(collection(db, customersPath), orderBy("createdAt", "desc"));
 const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
 setCustomers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer)));
 setLoading(false);
 }, (error) => handleFirestoreError(error, OperationType.LIST, customersPath));

 const qAttrs = query(collection(db, attrsPath), orderBy("createdAt", "asc"));
 const unsubAttrs = onSnapshot(qAttrs, (snapshot) => {
 setAttributes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AttributeDefinition)));
 }, (error) => handleFirestoreError(error, OperationType.LIST, attrsPath));

 const qCompanies = query(collection(db, `users/${user.uid}/companies`), orderBy("name", "asc"));
 const unsubCompanies = onSnapshot(qCompanies, (snapshot) => {
 setCompanies(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Company)));
 }, (error) => console.error(error));

 return () => {
 unsubCustomers();
 unsubAttrs();
 unsubCompanies();
 };
 }, [user]);

 // Keep selectedCustomer updated if background data updates
 const currentCustomerData = selectedCustomer 
 ? customers.find(c => c.id === selectedCustomer.id) || selectedCustomer 
 : null;

 // Extract all unique autoTags from existing customers for filter dropdown
 const allTags = Array.from(
 new Set(
 customers.flatMap(c => c.customFields?.autoTags?.map((t: any) => t.tag) || [])
 )
 ) as string[];

 const resetFilters = () => {
 setSearch("");
 setSelectedCompanyId("all");
 setSelectedStatus("all");
 setMinPoints("");
 setMaxPoints("");
 setSelectedSocialType("all");
 setSelectedHasCompany("all");
 setSelectedTag("all");
 setSortBy("createdAt_desc");
 };

 const hasActiveFilters = search !== "" || 
 selectedCompanyId !== "all" || 
 selectedStatus !== "all" || 
 minPoints !== "" || 
 maxPoints !== "" || 
 selectedSocialType !== "all" || 
 selectedHasCompany !== "all" || 
 selectedTag !== "all" || 
 sortBy !== "createdAt_desc";

 const filteredCustomers = customers.filter(c => {
 const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
 c.email?.toLowerCase().includes(search.toLowerCase()) ||
 c.id?.toLowerCase().includes(search.toLowerCase());
 
 const matchesCompany = selectedCompanyId === "all" || c.companyId === selectedCompanyId;
 const matchesStatus = selectedStatus === "all" || 
 (c.activityStatus && c.activityStatus.toUpperCase() === selectedStatus.toUpperCase());
 
 // Min Points
 const matchesMinPoints = minPoints === "" || (c.points || 0) >= Number(minPoints);
 
 // Max Points
 const matchesMaxPoints = maxPoints === "" || (c.points || 0) <= Number(maxPoints);
 
 // Social
 let matchesSocial = true;
 if (selectedSocialType !== "all") {
 if (selectedSocialType === "facebook") matchesSocial = !!c.facebook;
 else if (selectedSocialType === "zalo") matchesSocial = !!c.zalo;
 else if (selectedSocialType === "linkedin") matchesSocial = !!c.linkedin;
 else if (selectedSocialType === "instagram") matchesSocial = !!c.instagram;
 else if (selectedSocialType === "tiktok") matchesSocial = !!c.tiktok;
 }
 
 // Has Company
 let matchesHasCompany = true;
 if (selectedHasCompany === "yes") matchesHasCompany = !!c.companyId;
 else if (selectedHasCompany === "no") matchesHasCompany = !c.companyId;
 
 // Tag
 let matchesTag = true;
 if (selectedTag !== "all") {
 const tags = c.customFields?.autoTags || [];
 matchesTag = tags.some((t: any) => t.tag === selectedTag);
 }
 
 return matchesSearch && matchesCompany && matchesStatus && matchesMinPoints && matchesMaxPoints && matchesSocial && matchesHasCompany && matchesTag;
 });

 const sortedAndFilteredCustomers = [...filteredCustomers].sort((a, b) => {
 if (sortBy === "createdAt_desc") {
 const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
 const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
 return dateB - dateA;
 }
 if (sortBy === "createdAt_asc") {
 const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
 const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
 return dateA - dateB;
 }
 if (sortBy === "points_desc") {
 return (b.points || 0) - (a.points || 0);
 }
 if (sortBy === "points_asc") {
 return (a.points || 0) - (b.points || 0);
 }
 if (sortBy === "name_asc") {
 return a.name.localeCompare(b.name);
 }
 if (sortBy === "name_desc") {
 return b.name.localeCompare(a.name);
 }
 return 0;
 });

 const renderStatusBadge = (status?: string) => {
 if (!status) return <Badge variant="secondary">Mới</Badge>;
 
 const matched = CUSTOMER_STATUSES.find(
 s => s.code.toUpperCase() === status.toUpperCase() || 
 s.classification.toLowerCase() === status.toLowerCase()
 );
 
 if (matched) {
 return (
 <Badge className={`${matched.color.badge} border-none text-xs py-0.5 px-2 font-bold shadow-xs inline-block`}>
 {matched.classification}
 </Badge>
 );
 }
 
 // Fallbacks for existing standard values
 if (status === 'active') {
 return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none text-xs font-bold">Hoạt động</Badge>;
 }
 if (status === 'inactive') {
 return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-xs font-bold">Ít tương tác</Badge>;
 }
 if (status === 'churn_risk') {
 return <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none text-xs font-bold">Rủi ro rời bỏ</Badge>;
 }
 
 return <Badge variant="secondary" className="text-xs font-medium">{status}</Badge>;
 };

 if (authLoading) return <div className="p-8 text-center">Đang tải...</div>;

 return (
 <div className="flex-1 space-y-6 p-8 pt-6">
 {currentCustomerData ? (
 <CustomerDashboard 
 customer={currentCustomerData}
 userId={user?.uid || "guest"}
 companies={companies}
 attributes={attributes}
 onBack={() => setSelectedCustomer(null)}
 />
 ) : (
 <>
 <div className="bg-card/45 border border-border/60 p-5 md:p-6 rounded-2xl shadow-xs hover:shadow-sm hover:border-primary/20 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-30 backdrop-blur-md w-full">
 <div className="flex items-center gap-4 text-left">
 <div className="p-3 bg-primary/10 rounded-2xl text-primary flex items-center justify-center relative overflow-hidden shadow-xs shrink-0 group">
 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
 <motion.div
 animate={{ 
 scale: [1, 1.15, 0.95, 1.05, 1],
 y: [0, -3, 3, -1, 0]
 }}
 transition={{ 
 repeat: Infinity,
 duration: 5,
 ease: "easeInOut"
 }}
 >
 <User className="w-8 h-8 text-[#2f6cf5]" />
 </motion.div>
 </div>
 <div>
 <h2 className="text-2xl font-bold tracking-tight font-heading text-foreground">Danh sách Khách hàng</h2>
 <p className="text-muted-foreground text-sm mt-1">Quản lý hồ sơ cá nhân, liên kết mạng xã hội đa điểm và điểm số.</p>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <button 
 onClick={() => setShowAttrManager(true)}
 className="flex items-center justify-center px-4 py-2 border border-border rounded-xl text-sm font-medium bg-card hover:bg-muted transition-colors"
 >
 <Settings className="w-4 h-4 mr-2 text-muted-foreground" /> Trường tùy chỉnh
 </button>
 <button className="flex items-center justify-center px-4 py-2 border border-border rounded-xl text-sm font-medium bg-card hover:bg-muted transition-colors">
 <Download className="w-4 h-4 mr-2 text-muted-foreground" /> Xuất dữ liệu
 </button>
 <button 
 onClick={() => setShowImportDialog(true)}
 className="flex items-center justify-center px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors text-foreground"
 >
 <Upload className="w-4 h-4 mr-2 text-[#2f6cf5]" /> Nhập CSV
 </button>
 <button 
 onClick={() => setShowAddDialog(true)}
 className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center shadow-lg shadow-primary/25 font-bold cursor-pointer"
 >
 <Plus className="w-4 h-4 mr-2" /> Thêm khách hàng
 </button>
 </div>
 </div>

 <Card>
 <CardHeader className="pb-3">
 <div className="flex flex-col md:flex-row gap-4 w-full justify-between items-start md:items-center">
 <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
 <div className="relative w-full md:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input
 type="search"
 placeholder="Tìm kiếm khách hàng..."
 className="pl-8 bg-background h-9 text-xs font-semibold"
 value={search}
 onChange={e => setSearch(e.target.value)}
 />
 </div>
 
 <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 h-9">
 <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
 <select
 className="bg-transparent text-xs font-semibold outline-none py-1 cursor-pointer"
 value={selectedCompanyId}
 onChange={e => setSelectedCompanyId(e.target.value)}
 >
 <option value="all">Tất cả chi nhánh</option>
 {companies.map(c => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5 h-9">
 <Filter className="w-3.5 h-3.5 text-muted-foreground" />
 <select
 className="bg-transparent text-xs font-semibold outline-none py-1 cursor-pointer"
 value={selectedStatus}
 onChange={e => setSelectedStatus(e.target.value)}
 >
 <option value="all">Tất cả trạng thái</option>
 {CUSTOMER_STATUSES.map(s => (
 <option key={s.code} value={s.code}>{s.classification}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 {/* Column Visibility Configuration dropdown */}
 <div className="relative">
 <button 
 onClick={() => setShowColumnSettings(!showColumnSettings)}
 className={`flex items-center gap-1.5 px-3 py-1.5 h-9 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-colors select-none ${showColumnSettings ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card text-foreground'}`}
 >
 <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" /> 
 <span>Cột hiển thị</span>
 </button>
 {showColumnSettings && (
 <div className="absolute right-0 mt-2 w-56 bg-card border border-border hover:border-primary/20 shadow-xl rounded-xl p-3.5 z-50 text-left backdrop-blur-xl">
 <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">Ẩn/hiện cột bảng</div>
 <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
 {Object.keys(visibleColumns).map((colKey) => (
 <label key={colKey} className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded-md cursor-pointer text-xs font-semibold select-none">
 <input
 type="checkbox"
 className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
 checked={visibleColumns[colKey]}
 onChange={() => setVisibleColumns(prev => ({ ...prev, [colKey]: !prev[colKey] }))}
 />
 <span>{COLUMN_LABELS[colKey]}</span>
 </label>
 ))}
 </div>
 <div className="border-t border-border mt-3 pt-2.5 flex justify-between gap-1">
 <button 
 onClick={() => setVisibleColumns({
 id: true,
 nameEmail: true,
 social: true,
 company: true,
 status: true,
 points: true,
 customAttributes: true,
 actions: true,
 })}
 className="text-xs text-[#2f6cf5] hover:underline font-extrabold"
 >
 Mặc định
 </button>
 <button 
 onClick={() => setShowColumnSettings(false)}
 className="text-xs text-muted-foreground hover:text-foreground font-extrabold"
 >
 Đóng
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Toggle Advanced Filters */}
 <button
 onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
 className={`flex items-center gap-1.5 px-3 py-1.5 h-9 border border-border rounded-xl text-xs font-bold hover:bg-muted transition-all duration-200 select-none ${showAdvancedFilters || hasActiveFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card text-foreground'}`}
 >
 <Filter className={`w-3.5 h-3.5 ${hasActiveFilters ? "text-primary" : "text-muted-foreground"}`} />
 <span>Bộ lọc nâng cao</span>
 {hasActiveFilters && (
 <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
 )}
 </button>
 </div>
 </div>

 {/* Advanced Filters Panel */}
 {showAdvancedFilters && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="border border-dashed border-border p-4 rounded-xl mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left"
 >
 <div className="space-y-1">
 <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">Phân khúc khách hàng</label>
 <select
 className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
 value={selectedTag}
 onChange={e => setSelectedTag(e.target.value)}
 >
 <option value="all">Tất cả phân khúc</option>
 {allTags.map(tag => (
 <option key={tag} value={tag}>{tag}</option>
 ))}
 </select>
 </div>

 <div className="space-y-1">
 <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">Khoảng điểm CRM</label>
 <div className="flex items-center gap-1.5">
 <Input
 type="number"
 placeholder="Từ"
 className="bg-background h-8 text-xs font-semibold"
 value={minPoints}
 onChange={e => setMinPoints(e.target.value)}
 />
 <span className="text-xs text-muted-foreground font-bold">-</span>
 <Input
 type="number"
 placeholder="Đến"
 className="bg-background h-8 text-xs font-semibold"
 value={maxPoints}
 onChange={e => setMaxPoints(e.target.value)}
 />
 </div>
 </div>

 <div className="space-y-1">
 <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">Liên kết Mạng xã hội</label>
 <select
 className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
 value={selectedSocialType}
 onChange={e => setSelectedSocialType(e.target.value)}
 >
 <option value="all">Tất cả liên kết</option>
 <option value="facebook">Đã kết nối Facebook</option>
 <option value="zalo">Đã kết nối Zalo</option>
 <option value="linkedin">Đã kết nối LinkedIn</option>
 <option value="instagram">Đã kết nối Instagram</option>
 <option value="tiktok">Đã kết nối TikTok</option>
 </select>
 </div>

 <div className="space-y-1">
 <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">Loại khách hàng</label>
 <select
 className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2 outline-none font-semibold cursor-pointer"
 value={selectedHasCompany}
 onChange={e => setSelectedHasCompany(e.target.value)}
 >
 <option value="all">Toàn bộ</option>
 <option value="yes">Thuộc doanh nghiệp / Công ty</option>
 <option value="no">Cá nhân tự do</option>
 </select>
 </div>

 <div className="space-y-1 sm:col-span-2 md:col-span-3">
 <label className="text-xs uppercase font-black text-muted-foreground tracking-wider">Thứ tự sắp xếp</label>
 <div className="flex flex-wrap items-center gap-1.5">
 {[
 { id: "createdAt_desc", label: "Mới nhất" },
 { id: "createdAt_asc", label: "Cũ nhất" },
 { id: "points_desc", label: "Điểm CRM: Cao → Thấp" },
 { id: "points_asc", label: "Điểm CRM: Thấp → Cao" },
 { id: "name_asc", label: "Họ tên (A-Z)" },
 { id: "name_desc", label: "Họ tên (Z-A)" },
 ].map((opt) => (
 <button
 key={opt.id}
 onClick={() => setSortBy(opt.id)}
 className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${sortBy === opt.id ? 'bg-primary/10 text-primary border-primary/30' : 'bg-background hover:bg-muted border-border'}`}
 >
 {opt.label}
 </button>
 ))}
 </div>
 </div>

 <div className="flex items-end justify-end">
 <button
 onClick={resetFilters}
 className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg font-bold transition-all shrink-0 cursor-pointer"
 >
 <RotateCcw className="w-3 h-3" /> Đặt lại tất cả
 </button>
 </div>
 </motion.div>
 )}
 </CardHeader>
 <CardContent>
 <Table>
 <TableHeader>
 <TableRow>
 {visibleColumns.id && <TableHead>Mã KH</TableHead>}
 {visibleColumns.nameEmail && <TableHead>Họ tên / Email</TableHead>}
 {visibleColumns.social && <TableHead>Mạng xã hội</TableHead>}
 {visibleColumns.company && <TableHead>Công ty</TableHead>}
 {visibleColumns.status && <TableHead>Trạng thái</TableHead>}
 {visibleColumns.points && <TableHead>Điểm CRM</TableHead>}
 {visibleColumns.customAttributes && attributes.slice(0, 1).map(attr => (
 <TableHead key={attr.id}>{attr.label}</TableHead>
 ))}
 {visibleColumns.actions && <TableHead>Hành động</TableHead>}
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 <TableRow>
 <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center py-8 text-muted-foreground">Đang tải dữ liệu khách hàng...</TableCell>
 </TableRow>
 ) : sortedAndFilteredCustomers.length === 0 ? (
 <TableRow>
 <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center py-8 text-muted-foreground">Không tìm thấy khách hàng nào.</TableCell>
 </TableRow>
 ) : (
 sortedAndFilteredCustomers.map((customer) => (
 <TableRow 
 key={customer.id} 
 onClick={() => setSelectedCustomer(customer)}
 className="hover:bg-muted/50 transition-colors cursor-pointer group row-shake"
 >
 {/* ID */}
 {visibleColumns.id && <TableCell className="text-xs text-muted-foreground">{customer.id}</TableCell>}
 
 {/* AVATAR + NAME */}
 {visibleColumns.nameEmail && (
 <TableCell className="font-medium">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl overflow-hidden border border-border bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs font-bold text-xs uppercase">
 {customer.avatarUrl ? (
 <img src={customer.avatarUrl} className="w-full h-full object-cover" alt={customer.name} />
 ) : (
 customer.name.slice(0, 2)
 )}
 </div>
 <div>
 <div className="font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 flex-wrap">
 {customer.name}
 {customer.customFields?.autoTags?.map((t: any, idx: number) => {
 const colorClass = COLOR_PRESET_MAP_SHORT[t.color || 'gold'] || COLOR_PRESET_MAP_SHORT.gold;
 return (
 <span 
 key={idx} 
 className={`inline-block px-2 py-0.5 text-xs font-black uppercase rounded border tracking-wide leading-none ${colorClass}`}
 >
 {t.tag}
 </span>
 );
 })}
 </div>
 <p className="text-xs text-muted-foreground font-normal">{customer.email || 'Không có email'}</p>
 </div>
 </div>
 </TableCell>
 )}
 
 {/* SOCIAL LINKS CONNECTIVITY */}
 {visibleColumns.social && (
 <TableCell onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center gap-1.5">
 {/* Facebook */}
 <span 
 title={customer.facebook || "Chưa liên kết Facebook"}
 className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs shadow-2xs transition-all ${
 customer.facebook 
 ? 'bg-blue-600/10 text-blue-600 border-blue-600/30' 
 : 'bg-muted/10 text-muted-foreground/30 border-dashed border-border/60'
 }`}
 >
 <Facebook className="w-3 h-3" />
 </span>
 
 {/* Zalo */}
 <span 
 title={customer.zalo || "Chưa liên kết Zalo"}
 className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-extrabold shadow-2xs transition-all ${
 customer.zalo 
 ? 'bg-sky-500/10 text-sky-600 border-sky-500/35 font-sans' 
 : 'bg-muted/10 text-muted-foreground/30 border-dashed border-border/60'
 }`}
 >
 Z
 </span>
 
 {/* LinkedIn */}
 <span 
 title={customer.linkedin || "Chưa liên kết LinkedIn"}
 className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs shadow-2xs transition-all ${
 customer.linkedin 
 ? 'bg-blue-700/10 text-blue-700 border-blue-700/30' 
 : 'bg-muted/10 text-muted-foreground/30 border-dashed border-border/60'
 }`}
 >
 <Linkedin className="w-3 h-3" />
 </span>

 {/* Instagram */}
 <span 
 title={customer.instagram || "Chưa liên kết Instagram"}
 className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs shadow-2xs transition-all ${
 customer.instagram 
 ? 'bg-pink-600/10 text-pink-600 border-pink-600/30' 
 : 'bg-muted/10 text-muted-foreground/30 border-dashed border-border/60'
 }`}
 >
 <Instagram className="w-3 h-3" />
 </span>

 {/* TikTok */}
 <span 
 title={customer.tiktok || "Chưa liên kết TikTok"}
 className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-bold shadow-2xs transition-all ${
 customer.tiktok 
 ? 'bg-foreground/10 text-foreground border-foreground/30' 
 : 'bg-muted/10 text-muted-foreground/30 border-dashed border-border/60'
 }`}
 >
 TT
 </span>
 </div>
 </TableCell>
 )}

 {/* COMPANY */}
 {visibleColumns.company && (
 <TableCell>
 {customer.companyId ? (
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
 {companies.find(comp => comp.id === customer.companyId)?.logoUrl ? (
 <img src={companies.find(comp => comp.id === customer.companyId)?.logoUrl} className="w-full h-full object-cover" />
 ) : <Building2 className="w-3 h-3 text-muted-foreground" />}
 </div>
 <span className="text-xs font-semibold text-foreground truncate max-w-[120px] inline-block">{companies.find(comp => comp.id === customer.companyId)?.name || '—'}</span>
 </div>
 ) : <span className="text-xs text-muted-foreground italic">Cá nhân</span>}
 </TableCell>
 )}

 {/* STATUS */}
 {visibleColumns.status && <TableCell>{renderStatusBadge(customer.activityStatus)}</TableCell>}
 
 {/* POINTS */}
 {visibleColumns.points && <TableCell className="font-extrabold text-[#2f6cf5]">{customer.points?.toLocaleString() || 0} pts</TableCell>}
 
 {/* EXTRA ATTRIBUTE */}
 {visibleColumns.customAttributes && attributes.slice(0, 1).map(attr => (
 <TableCell key={attr.id} className="text-xs text-muted-foreground font-medium">
 {customer.customFields?.[attr.key]?.toString() || '—'}
 </TableCell>
 ))}

 {/* ACTION */}
 {visibleColumns.actions && (
 <TableCell>
 <button className="p-1 px-2.5 bg-primary/10 hover:bg-primary hover:text-white rounded-lg text-xs font-bold text-primary flex items-center gap-1 transition-all">
 Xem Dashboard <ArrowRight className="w-2.5 h-2.5" />
 </button>
 </TableCell>
 )}
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </CardContent>
 </Card>
 </>
 )}

 {showAddDialog && (
 <AddCustomerDialog 
 onClose={() => setShowAddDialog(false)} 
 attributes={attributes}
 />
 )}

 {showAttrManager && (
 <AttributeManager 
 onClose={() => setShowAttrManager(false)} 
 attributes={attributes}
 />
 )}

 {showImportDialog && (
 <ImportCustomersDialog 
 onClose={() => setShowImportDialog(false)} 
 attributes={attributes}
 companies={companies}
 userId={user?.uid || "guest"}
 />
 )}
 </div>
 );
}
