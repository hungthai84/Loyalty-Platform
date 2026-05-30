import React, { useState } from "react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, writeBatch, collection, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
 Database, 
 Sparkles, 
 Trash2, 
 CheckCircle2, 
 AlertTriangle, 
 Users, 
 Building2, 
 Star, 
 Gift, 
 Tag 
} from "lucide-react";
import { toast } from "sonner";

export function SeedDemoData() {
 const { user } = useFirebase();
 const [loading, setLoading] = useState(false);
 const [cleanupLoading, setCleanupLoading] = useState(false);
 const [progress, setProgress] = useState(0);
 const [statusText, setStatusText] = useState("");
 const [numCustomers, setNumCustomers] = useState(200);

 const VIETNAMESE_NAMES = [
 "Nguyễn Thị Hương", "Trần Anh Tuấn", "Lê Minh Triết", "Phạm Minh Thư", "Hoàng Kim Oanh",
 "Huỳnh Bảo Ngọc", "Võ Minh Đức", "Đặng Thùy Dương", "Bùi Quốc Thịnh", "Đỗ Hà Linh",
 "Ngô Tấn Tài", "Dương Hồng Nhung", "Lý Gia Bảo", "Tống Khánh An", "Trương Nam Hải",
 "Phan Thanh Nhã", "Cao Kỳ Duyên", "Mai Phương Nam", "Lâm Mỹ Dung", "Đoàn Hương Giang",
 "Nguyễn Lâm Anh", "Hoàng Thu Trang", "Đinh Hữu Phước", "Phùng Mỹ Linh", "Hà Cẩm Tú",
 "Vũ Hoàng Điệp", "Tạ Đình Phong", "Giáp Văn Minh", "Nguyễn Thảo Chi", "Trần Thế Phong",
 "Phan Ánh Dương", "Hoàng Minh Tuấn", "Quách Thu Phương", "Tôn Nữ Ngọc Tâm", "Phạm Nhật Vy",
 "Lê Hoàng Nam", "Vương Minh Khang", "Diệp Lâm Anh", "Triệu Vy", "Thái Hồng Hưng",
 "Trần Ngọc Diệp", "Lê Khánh Chi", "Phạm Hoài Nam", "Nguyễn Tuấn Kiệt", "Bùi Minh Đăng",
 "Hoàng Bảo Khánh", "Vũ Tuyết Mai", "Nguyễn Hải Yến", "Trịnh Thùy Trang", "Đỗ Quang Hà",
 "Lê Việt Bách", "Trần Mỹ Hạnh", "Phạm Quỳnh Chi", "Nguyễn Hoàng Linh", "Bùi Thế Kiệt"
 ];

 const JEWELRY_COLLECTIONS = [
 "Heritage Collection", "Bridal Luxury", "Italian Gold 18K", "Royal Diamond", 
 "Lotus Essence", "Solitaire Single Stone", "Eternal Love Rings"
 ];

 const randomSelection = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

 const generatePhone = () => {
 const prefixes = ["090", "091", "098", "096", "097", "093", "086", "089"];
 const randDigits = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
 return `${randomSelection(prefixes)}${randDigits}`;
 };

 const cleanEmail = (name: string) => {
 // simple Vietnamese accent removal and conversion for email
 const cleanStr = name.toLowerCase()
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "")
 .replace(/đ/g, "d")
 .replace(/\s+/g, ".");
 return `${cleanStr}@sevago.vip`;
 };

 const handleCleanup = async () => {
 if (!user) {
 toast.error("Vui lòng đăng nhập trước!");
 return;
 }

 if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ DỮ LIỆU liên quan để chuẩn bị nạp mới?")) {
 return;
 }

 setCleanupLoading(true);
 setStatusText("Bắt đầu dọn dẹp hệ thống...");
 setProgress(10);

 try {
 const collectionsToClean = ["customers", "companies", "tierConfigs", "redemptionRules", "earnRules", "campaigns", "segmentationRules"];
 
 for (let i = 0; i < collectionsToClean.length; i++) {
 const colName = collectionsToClean[i];
 setStatusText(`Đang xóa bộ dữ liệu '${colName}'...`);
 const colRef = collection(db, `users/${user.uid}/${colName}`);
 const snapshot = await getDocs(colRef);
 
 if (!snapshot.empty) {
 const batch = writeBatch(db);
 snapshot.docs.forEach((snapDoc) => {
 batch.delete(snapDoc.ref);
 });
 await batch.commit();
 }
 
 setProgress(Math.round(((i + 1) / collectionsToClean.length) * 100));
 }

 setStatusText("Đã dọn dẹp sạch sẽ cơ sở dữ liệu!");
 setProgress(100);
 toast.success("Đã xóa sạch dữ liệu demo cũ thành công!");
 } catch (err: any) {
 console.error(err);
 toast.error(`Lỗi dọn dẹp dữ liệu: ${err.message}`);
 } finally {
 setCleanupLoading(false);
 }
 };

 const handleSeed = async () => {
 if (!user) {
 toast.error("Vui lòng đăng nhập trước!");
 return;
 }

 setLoading(true);
 setProgress(0);
 setStatusText("Bắt đầu tạo cơ sở dữ liệu trang sức sang trọng...");

 try {
 const userRefPath = `users/${user.uid}`;
 
 // Step 1: Add Branch Locations (Companies)
 setStatusText("Bước 1/6: Đang thiết lập 2 Chi nhánh chính...");
 setProgress(5);
 
 const compMainRef = doc(collection(db, `${userRefPath}/companies`));
  const compB1Ref = doc(collection(db, `${userRefPath}/companies`));
  const compB2Ref = doc(collection(db, `${userRefPath}/companies`));

  const mainId = compMainRef.id;
  const b1Id = compB1Ref.id;
  const b2Id = compB2Ref.id;

  const batchComp = writeBatch(db);
  
  batchComp.set(compMainRef, {
  id: mainId,
  name: "SEVA Group - Trụ sở chính",
  type: "company",
  logoUrl: "https://images.unsplash.com/photo-1599643478524-fb66f70d00de?w=150&auto=format&fit=crop&q=60",
  address: "Level 20, Bitexco, TP. HCM",
  userId: user.uid,
  createdAt: serverTimestamp()
  });

  batchComp.set(compB1Ref, {
  id: b1Id,
  name: "Chi nhánh B1 - Showroom Sài Gòn Cao Thắng",
  type: "branch",
  parentId: mainId,
  logoUrl: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=150&auto=format&fit=crop&q=60",
  address: "15-17 Cao Thắng, Phường 2, Quận 3, TP. Hồ Chí Minh",
  userId: user.uid,
  createdAt: serverTimestamp()
  });

  batchComp.set(compB2Ref, {
  id: b2Id,
  name: "Chi nhánh B2 - Luxury Salon Tràng Tiền",
  type: "branch",
  parentId: mainId,
  logoUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=150&auto=format&fit=crop&q=60",
  address: "86 Tràng Tiền, Hoàn Kiếm, Hà Nội",
  userId: user.uid,
  createdAt: serverTimestamp()
  });
  await batchComp.commit();

 // Step 2: Add Tiers (configs)
 setStatusText("Bước 2/6: Đang thiết lập 4 thứ hạng thành viên đặc quyền...");
 setProgress(15);

 const tiers = [
 { id: "tier-member", name: "Member", threshold: 0, multiplier: 1, color: "#94a3b8" },
 { id: "tier-essential", name: "Essential", threshold: 500, multiplier: 1.25, color: "#10b981" },
 { id: "tier-icon", name: "Icon", threshold: 2500, multiplier: 1.5, color: "#f59e0b" },
 { id: "tier-atelier", name: "Atelier", threshold: 10000, multiplier: 2.0, color: "#2f6cf5" }
 ];

 const batchTiers = writeBatch(db);
 tiers.forEach((t) => {
 const docRef = doc(db, `${userRefPath}/tierConfigs`, t.id);
 batchTiers.set(docRef, {
 id: t.id,
 name: t.name,
 threshold: t.threshold,
 multiplier: t.multiplier,
 color: t.color,
 userId: user.uid,
 createdAt: serverTimestamp(),
 conditions: [
 { field: "points", operator: "gte", value: t.threshold }
 ]
 });
 });
 await batchTiers.commit();

 // Step 3: Add Earning Rules, Redemption Rules, Campaigns & Segmentation Rules
 setStatusText("Bước 3/6: Đang tạo luật nạp/đổi điểm và chiến dịch demo...");
 setProgress(25);

 const earnRules = [
 { id: "earn-purchase", name: "Tích lũy mua sắm trang sức", type: "purchase", points: 1, value: 100000, isActive: true },
 { id: "earn-birthday", name: "Cộng điểm nhân đôi sinh nhật VIP", type: "birthday", points: 500, isActive: true },
 { id: "earn-review", name: "Đánh giá sản phẩm & Thiết kế riêng", type: "review", points: 200, isActive: true },
 { id: "earn-ai-styling", name: "Tư vấn ngũ hành phong thủy với AI", type: "ai_styling", points: 150, isActive: true },
 ];

 const batchRules = writeBatch(db);
 earnRules.forEach((rule) => {
 const docRef = doc(db, `${userRefPath}/earnRules`, rule.id);
 batchRules.set(docRef, {
 ...rule,
 userId: user.uid,
 createdAt: serverTimestamp()
 });
 });

 const redemptionRules = [
 { id: "redeem-voucher-500", name: "Voucher 500.000 ₫ mua sắm Bridal", pointsRequired: 1000, rewardValue: 500000, rewardType: "voucher" },
 { id: "redeem-voucher-2000", name: "Voucher 2.000.000 ₫ BST Atelier Premium", pointsRequired: 3500, rewardValue: 2000000, rewardType: "voucher" },
 { id: "redeem-gift-cleaning", name: "Gói spa/làm sạch kim cương siêu âm trọn đời", pointsRequired: 500, rewardValue: 150000, rewardType: "item" },
 { id: "redeem-gift-box", name: "Hộp trang sức bọc nhung hoàng gia đỏ", pointsRequired: 1500, rewardValue: 1000000, rewardType: "item" }
 ];

 redemptionRules.forEach((rule) => {
 const docRef = doc(db, `${userRefPath}/redemptionRules`, rule.id);
 batchRules.set(docRef, {
 ...rule,
 userId: user.uid,
 createdAt: serverTimestamp()
 });
 });

 const campaigns = [
 { id: "camp-heritage", name: "Private Showcase BST Heritage 2026", type: "event", rewardType: "gift", rewardValue: 0, isActive: true },
 { id: "camp-birthday-care", name: "Khách hàng sinh nhật quý 2", type: "birthday", rewardType: "points", rewardValue: 1000, isActive: true },
 { id: "camp-re-engage", name: "Chiến dịch Winback - Chăm sóc Atelier trễ hẹn", type: "winback", rewardType: "voucher", rewardValue: 5000000, isActive: true },
 { id: "camp-milestone-atelier", name: "Tri ân nâng cấp tầng Atelier tuyệt vời", type: "milestone", rewardType: "gift", rewardValue: 0, isActive: true }
 ];

 campaigns.forEach((camp) => {
 const docRef = doc(db, `${userRefPath}/campaigns`, camp.id);
 batchRules.set(docRef, {
 ...camp,
 description: `Chiến dịch demo ưu đãi trang sức tự động dành cho khách hàng thân thiết.`,
 userId: user.uid,
 createdAt: serverTimestamp()
 });
 });

 const segmentationRules = [
 { id: "seg-high-spenders", name: "Khách Hàng Atelier Cao Cấp", tag: "Atelier Premium", color: "#2f6cf5", criteriaType: "points_balance", operator: "gte", value: 10000, isActive: true },
 { id: "seg-loyal-gold", name: "Khách Hàng Vàng Trung Thành", tag: "Icon Loyalty", color: "#f59e0b", criteriaType: "points_balance", operator: "gte", value: 2500, isActive: true },
 { id: "seg-recent-buyers", name: "Hội Viên Essential Mới", tag: "Essential New", color: "#10b981", criteriaType: "points_balance", operator: "lte", value: 1000, isActive: true }
 ];

 segmentationRules.forEach((seg) => {
 const docRef = doc(db, `${userRefPath}/segmentationRules`, seg.id);
 batchRules.set(docRef, {
 ...seg,
 userId: user.uid,
 createdAt: serverTimestamp()
 });
 });

 await batchRules.commit();

 // Step 4: Generates customers (Batch-by-batch writing)
 setStatusText(`Bước 4/6: Đang chế tác danh sách ${numCustomers} Khách hàng trang sức đẳng cấp...`);
 setProgress(40);

 let batch = writeBatch(db);
 let opCount = 0;

 for (let i = 0; i < numCustomers; i++) {
 const name = `${randomSelection(VIETNAMESE_NAMES)} (Mẫu)`;
 const email = cleanEmail(name.replace(" (Mẫu)", "")) + `.${i}@sevago.vip`;
 const phone = generatePhone();
 
 // Distribute points to fit tiers nicely
 // Member: 0-499, Essential: 500-2499, Icon: 2500-9999, Atelier: 10000+
 const tierWeights = [
 { tierId: "tier-member", minPts: 50, maxPts: 490, status: "inactive" },
 { tierId: "tier-essential", minPts: 550, maxPts: 2400, status: "active" },
 { tierId: "tier-icon", minPts: 2600, maxPts: 9500, status: "active" },
 { tierId: "tier-atelier", minPts: 10500, maxPts: 45000, status: "active" }
 ];

 let atkThreshold = Math.floor(0.15 * numCustomers);
 let iconThreshold = Math.floor(0.40 * numCustomers);
 let essThreshold = Math.floor(0.75 * numCustomers);

 let chosenTier;
 if (i < atkThreshold) {
 chosenTier = tierWeights[3]; // Atelier (15%)
 } else if (i < iconThreshold) {
 chosenTier = tierWeights[2]; // Icon (25%)
 } else if (i < essThreshold) {
 chosenTier = tierWeights[1]; // Essential (35%)
 } else {
 chosenTier = tierWeights[0]; // Member (25%)
 }

 const pts = Math.floor(chosenTier.minPts + Math.random() * (chosenTier.maxPts - chosenTier.minPts));
 const clv = pts * 100000; // 1 pt = 100k VND
 
 // Random last purchase date
 const daysAgo = Math.floor(Math.random() * 120);
 const purchaseDate = new Date();
 purchaseDate.setDate(purchaseDate.getDate() - daysAgo);
 const lastPurchaseStr = purchaseDate.toISOString().split('T')[0];

 // Determine activity status based on days ago
 let activityStatus: 'active' | 'inactive' | 'churn_risk' = 'active';
 let riskScore = 5;
 if (daysAgo > 90) {
 activityStatus = 'churn_risk';
 riskScore = Math.floor(75 + Math.random() * 20);
 } else if (daysAgo > 45) {
 activityStatus = 'inactive';
 riskScore = Math.floor(35 + Math.random() * 30);
 } else {
 riskScore = Math.floor(5 + Math.random() * 25);
 }

 const compId = Math.random() > 0.5 ? b1Id : b2Id;
 const region = compId === b1Id ? "TP.HCM" : "Hà Nội";
 const collectionSelected = randomSelection(JEWELRY_COLLECTIONS);

 const customerRef = doc(collection(db, `${userRefPath}/customers`));
 
 batch.set(customerRef, {
 id: customerRef.id,
 name,
 email,
 phone,
 avatarUrl: "",
 facebook: `facebook.com/user.${i}`,
 zalo: phone,
 points: pts,
 activityStatus,
 companyId: compId,
 userId: user.uid,
 customFields: {
 clv,
 repeat_rate: Math.floor(65 + Math.random() * 30),
 last_purchase: lastPurchaseStr,
 risk_score: riskScore,
 region,
 collection: collectionSelected
 },
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp()
 });

 opCount++;

 // Commit batch every 40 operations to prevent Firestore payload size restrictions
 if (opCount === 40 || i === numCustomers - 1) {
 setStatusText(`Đang đồng bộ hóa khối lượng khách hàng (${i + 1}/${numCustomers})...`);
 setProgress(Math.round(40 + ((i + 1) / numCustomers) * 50));
 await batch.commit();
 batch = writeBatch(db);
 opCount = 0;
 // small cool down sleep to prevent write pacing limits
 await new Promise(r => setTimeout(r, 100));
 }
 }

 setStatusText("Nạp hoàn chỉnh cơ sở dữ liệu demo thành công!");
 setProgress(100);
 toast.success(`Đã hoàn tất bổ sung dữ liệu ${numCustomers} khách hàng, chi nhánh & hạng đặc quyền!`);
 } catch (err: any) {
 console.error(err);
 toast.error(`Gặp lỗi trong tiến trình: ${err.message}`);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="bg-card border border-border/55 rounded-3xl p-6 shadow-xl space-y-6 max-w-4xl mx-auto">
 <div className="flex items-start justify-between border-b pb-4 border-border/40">
 <div className="space-y-1">
 <h3 className="text-lg font-extrabold flex items-center gap-2 text-foreground font-heading">
 <Database className="w-5 h-5 text-primary" /> BỘ NẠP DỮ LIỆU DEMO DOANH NGHIỆP TRANG SỨC
 </h3>
 <p className="text-xs text-muted-foreground">
 Bản nạp một chạm (1-click seed) tạo tức thời {numCustomers} khách hàng hoàn chỉnh, với 4 hạng thành viên cao cấp (Atelier, Icon, Essential, Member), luật tích điểm, đổi thưởng và 2 Showroom địa lý chính thức.
 </p>
 </div>
 <div className="p-1 px-3 bg-primary/10 text-primary text-xs font-black uppercase rounded-full tracking-wider shrink-0">
 SLA Sandbox
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-5 rounded-2xl border border-border/30">
 <div className="space-y-4">
 <h4 className="text-xs font-black uppercase text-foreground tracking-widest flex items-center gap-1">
 <Sparkles className="w-4 h-4 text-amber-500" /> CÁC DỮ LIỆU SẼ ĐƯỢC THIẾT LẬP:
 </h4>
 <ul className="space-y-2 text-xs font-medium text-muted-foreground">
 <li className="flex items-center gap-2">
 <Building2 className="w-4 h-4 text-primary" /> <strong>Showroom B1 & Showroom B2</strong> (Showroom Hồ Chí Minh & Luxury Salon Hà Nội)
 </li>
 <li className="flex items-center gap-2">
 <Star className="w-4 h-4 text-amber-500" /> <strong>4 Hạng thành viên</strong>: Member, Essential, Icon, Atelier (thăng hạng tự động)
 </li>
 <li className="flex items-center gap-2">
 <Users className="w-4 h-4 text-blue-500" /> <strong>{numCustomers} Khách hàng trang sức mẫu</strong> với hồ sơ đa liên kết, thói quen mua sắm, CLV lớn
 </li>
 <li className="flex items-center gap-2">
 <Gift className="w-4 h-4 text-emerald-500" /> <strong>4 Luật Tích Điểm</strong> (Earning) & <strong>4 Đặc Quyền Đồng Giá</strong> (Redemption)
 </li>
 <li className="flex items-center gap-2">
 <Tag className="w-4 h-4 text-indigo-500" /> <strong>4 Chiến dịch Marketing</strong> & <strong>3 Đột phá Phân Phối phân loại AI</strong>
 </li>
 </ul>
 </div>

 <div className="flex flex-col justify-center space-y-4 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-5">
 <div className="space-y-2">
 <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">SỐ LƯỢNG KHÁCH HÀNG (TÙY CHỈNH)</Label>
 <Input 
 type="number" 
 min={1} 
 max={2000} 
 value={numCustomers} 
 onChange={(e) => setNumCustomers(Number(e.target.value) || 200)} 
 disabled={loading || cleanupLoading}
 className="h-9 text-sm"
 />
 </div>
 <div className="space-y-2">
 <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">TIẾN TRÌNH THỰC HIỆN</span>
 <div className="w-full bg-muted-foreground/10 rounded-full h-2 overflow-hidden border">
 <div 
 className="bg-primary h-full rounded-full transition-all duration-300" 
 style={{ width: `${progress}%` }}
 />
 </div>
 <p className="text-xs text-primary font-bold">{statusText || "Hệ thống sẵn sàng nạp dữ liệu."}</p>
 </div>

 <div className="flex flex-col sm:flex-row gap-2 pt-2">
 <button
 onClick={handleSeed}
 disabled={loading || cleanupLoading}
 className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
 >
 <Sparkles className="w-4 h-4" />
 {loading ? "Đang gieo mẫu..." : "NẠP TỨC THỜI (SEED DATA)"}
 </button>
 <button
 onClick={handleCleanup}
 disabled={loading || cleanupLoading}
 className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
 >
 <Trash2 className="w-4 h-4" />
 Reset dọn dẹp
 </button>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/30">
 <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
 <span>Lưu ý: Bộ gieo mẫu sử dụng môi trường Firestore thật trực thuộc phiên làm việc hiện hữu của bạn (UID), đảm bảo trải nghiệm các biểu đồ hoàn chỉnh 100%.</span>
 </div>
 </div>
 );
}
