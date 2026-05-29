import { Customer, TierConfig, RedemptionRule, EarnRule, LoyaltyCampaign, SegmentationRule, Company, AttributeDefinition } from "@/types";

// Helper for dates
const daysAgo = (num: number) => {
 const d = new Date();
 d.setDate(d.getDate() - num);
 return d;
};

export const GUEST_COMPANIES: Company[] = [
 {
 id: "comp_seva",
 name: "SEVA Group",
 logoUrl: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=150&auto=format&fit=crop&q=60",
 address: "Tòa nhà SEVA, TP. Hồ Chí Minh",
 type: "company",
 userId: "guest",
 createdAt: daysAgo(150),
 },
 {
 id: "comp_saigon",
 name: "Chi nhánh B1 - Showroom Sài Gòn Cao Thắng",
 logoUrl: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=150&auto=format&fit=crop&q=60",
 address: "15-17 Cao Thắng, Phường 2, Quận 3, TP. Hồ Chí Minh",
 type: "branch",
 parentId: "comp_seva",
 userId: "guest",
 createdAt: daysAgo(100),
 },
 {
 id: "comp_hanoi",
 name: "Chi nhánh B2 - Luxury Salon Tràng Tiền",
 logoUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=150&auto=format&fit=crop&q=60",
 address: "86 Tràng Tiền, Hoàn Kiếm, Hà Nội",
 type: "branch",
 parentId: "comp_seva",
 userId: "guest",
 createdAt: daysAgo(95),
 },
];

export const GUEST_ATTRIBUTES: AttributeDefinition[] = [
 {
 id: "attr_favorite_gem",
 label: "Loại đá phỏng vấn",
 key: "favoriteGem",
 type: "select",
 userId: "guest",
 createdAt: daysAgo(80),
 isRequired: false,
 options: ["Diamond", "Ruby", "Sapphire", "Emerald", "Jade", "Pearl"],
 },
 {
 id: "attr_anniversary",
 label: "Ngày kỷ niệm cưới",
 key: "anniversaryDate",
 type: "date",
 userId: "guest",
 createdAt: daysAgo(75),
 isRequired: false,
 }
];

export const GUEST_CUSTOMERS: Customer[] = [
 {
 id: "cust_1",
 name: "Trần Anh Tuấn",
 email: "tuan.tran@sevago.vip",
 phone: "0908123456",
 points: 1540,
 activityStatus: "active",
 companyId: "comp_saigon",
 userId: "guest",
 createdAt: daysAgo(50),
 updatedAt: daysAgo(2),
 customFields: {
 spend: 78000000,
 favoriteGem: "Diamond",
 autoTags: [{ tag: "BIG SPENDER", color: "gold" }, { tag: "ELITE VIP", color: "emerald" }]
 },
 orders: [
 { id: "ord_1", date: daysAgo(10), amount: 45000000, points: 900, status: "completed", description: "Nhẫn Kim Cương Solitaire 18K" },
 { id: "ord_2", date: daysAgo(2), amount: 33000000, points: 640, status: "completed", description: "Bông tai White Gold Diamond" }
 ],
 tickets: [
 { id: "tick_1", summary: "Đặt lịch đánh bóng định kỳ", status: "closed", createdAt: daysAgo(12) }
 ]
 },
 {
 id: "cust_2",
 name: "Nguyễn Thị Hương",
 email: "huong.nguyen@sevago.vip",
 phone: "0915654321",
 points: 240,
 activityStatus: "inactive",
 companyId: "comp_hanoi",
 userId: "guest",
 createdAt: daysAgo(120),
 updatedAt: daysAgo(35),
 customFields: {
 spend: 12500000,
 favoriteGem: "Pearl",
 autoTags: [{ tag: "INACTIVE", color: "slate" }]
 },
 orders: [
 { id: "ord_3", date: daysAgo(35), amount: 12500000, points: 240, status: "completed", description: "Chuỗi Ngọc Trai Cầm Tay Phú Quốc" }
 ],
 tickets: []
 },
 {
 id: "cust_3",
 name: "Hoàng Kim Oanh",
 email: "oanh.hoang@gmail.com",
 phone: "0987654321",
 points: 8200,
 activityStatus: "active",
 companyId: "comp_saigon",
 userId: "guest",
 createdAt: daysAgo(200),
 updatedAt: daysAgo(5),
 customFields: {
 spend: 420000000,
 favoriteGem: "Emerald",
 autoTags: [{ tag: "BIG SPENDER", color: "gold" }, { tag: "ELITE VIP", color: "emerald" }]
 },
 orders: [
 { id: "ord_4", date: daysAgo(42), amount: 210000000, points: 4200, status: "completed", description: "Vòng cổ Emerald Hoàng Gia" },
 { id: "ord_5", date: daysAgo(5), amount: 210000000, points: 4000, status: "completed", description: "Kiềng Vàng Ý 24K Chạm Khắc" }
 ],
 tickets: [
 { id: "tick_2", summary: "Tư vấn chế tác riêng cho dạ tiệc", status: "open", createdAt: daysAgo(1) }
 ]
 },
 {
 id: "cust_4",
 name: "Lê Minh Triết",
 email: "triet.le@outlook.com",
 phone: "0932112233",
 points: 50,
 activityStatus: "churn_risk",
 companyId: "comp_hanoi",
 userId: "guest",
 createdAt: daysAgo(15),
 updatedAt: daysAgo(15),
 customFields: {
 spend: 2500000,
 favoriteGem: "Ruby",
 autoTags: [{ tag: "CHURN RISK", color: "rose" }]
 },
 orders: [
 { id: "ord_6", date: daysAgo(15), amount: 2500000, points: 50, status: "completed", description: "Lắc tay bạc đính đá Ruby nhỏ" }
 ],
 tickets: []
 }
];

export const GUEST_TIERS: TierConfig[] = [
 { id: "tier-member", name: "Member", threshold: 0, multiplier: 1.0, color: "#94a3b8", userId: "guest", createdAt: daysAgo(100) },
 { id: "tier-essential", name: "Essential", threshold: 500, multiplier: 1.25, color: "#10b981", userId: "guest", createdAt: daysAgo(100) },
 { id: "tier-icon", name: "Icon", threshold: 2500, multiplier: 1.5, color: "#f59e0b", userId: "guest", createdAt: daysAgo(100) },
 { id: "tier-atelier", name: "Atelier", threshold: 10000, multiplier: 2.0, color: "#2f6cf5", userId: "guest", createdAt: daysAgo(100) }
];

export const GUEST_REDEMPTION_RULES: RedemptionRule[] = [
 { id: "rule_voucher_100", name: "Voucher Ưu đãi 100.000đ trừ trực tiếp", pointsRequired: 100, rewardValue: 100000, rewardType: "voucher", userId: "guest", createdAt: daysAgo(90) },
 { id: "rule_voucher_500", name: "Voucher Quà tặng 500.000đ nhân ngày lễ", pointsRequired: 450, rewardValue: 500000, rewardType: "voucher", userId: "guest", createdAt: daysAgo(90) },
 { id: "rule_item_clean", name: "Bộ chăm sóc và vệ sinh trang sức SeVago Premium", pointsRequired: 200, rewardValue: 250000, rewardType: "item", userId: "guest", createdAt: daysAgo(90) },
 { id: "rule_discount_5", name: "Chiết khấu đặc quyền VIP 5% hóa đơn sau", pointsRequired: 1000, rewardValue: 5, rewardType: "discount", userId: "guest", createdAt: daysAgo(90) }
];

export const GUEST_EARN_RULES: EarnRule[] = [
 { id: "earn_purchase", name: "Tích điểm mua sắm (Mỗi 100.000đ nhận 1 điểm)", type: "purchase", points: 1, isActive: true, userId: "guest", createdAt: daysAgo(90) },
 { id: "earn_birthday", name: "X2 điểm tích lũy trong tháng sinh nhật khách hàng", type: "birthday", points: 2, isActive: true, userId: "guest", createdAt: daysAgo(90) },
 { id: "earn_ai", name: "Tham gia tư vấn trang sức phong thủy ứng dụng AI", type: "ai_styling", points: 25, isActive: true, userId: "guest", createdAt: daysAgo(90) },
 { id: "earn_referral", name: "Giới thiệu thành viên VIP mới gia nhập thành công", type: "referral", points: 150, isActive: true, userId: "guest", createdAt: daysAgo(90) }
];

export const GUEST_CAMPAIGNS: LoyaltyCampaign[] = [
 { id: "camp_bday", name: "Mừng tuổi xuân sang - Đặc quyền sinh nhật Atelier", type: "birthday", rewardType: "gift", rewardValue: 0, isActive: true, userId: "guest", createdAt: daysAgo(50), description: "Quà tặng là mặt dây chuyền ngọc lục bảo thô thủ công chế tác hoàn thiện cao cấp dành riêng cho hội viên Atelier." },
 { id: "camp_winback", name: "Tri ân kết nối - Gọi mời khách cũ trở về cùng quà tặng", type: "winback", rewardType: "voucher", rewardValue: 1000000, isActive: true, userId: "guest", createdAt: daysAgo(50), description: "Tự động gửi email/Zalo kèm Voucher 1.000.000đ cho khách hàng rời mạng trên 90 ngày." }
];

// Helper matching types and loading from local storage
export const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
 const data = localStorage.getItem(key);
 if (!data) return defaultValue;
 try {
 return JSON.parse(data);
 } catch (e) {
 return defaultValue;
 }
};

export const setLocalStorageData = <T>(key: string, value: T) => {
 localStorage.setItem(key, JSON.stringify(value));
 window.dispatchEvent(new Event("crm_guest_data_changed"));
};

// 1. Customers
export const getGuestCustomers = (): Customer[] => getLocalStorageData("crm_guest_customers", GUEST_CUSTOMERS);
export const saveGuestCustomer = (cust: Customer) => {
 const current = getGuestCustomers();
 const existingIndex = current.findIndex(c => c.id === cust.id);
 if (existingIndex > -1) {
 current[existingIndex] = cust;
 } else {
 current.unshift(cust);
 }
 setLocalStorageData("crm_guest_customers", current);
};
export const deleteGuestCustomer = (id: string) => {
 const updated = getGuestCustomers().filter(c => c.id !== id);
 setLocalStorageData("crm_guest_customers", updated);
};

// 2. Attributes
export const getGuestAttributes = (): AttributeDefinition[] => getLocalStorageData("crm_guest_attributes", GUEST_ATTRIBUTES);
export const saveGuestAttribute = (attr: AttributeDefinition) => {
 const current = getGuestAttributes();
 const existingIndex = current.findIndex(a => a.id === attr.id);
 if (existingIndex > -1) {
 current[existingIndex] = attr;
 } else {
 current.push(attr);
 }
 setLocalStorageData("crm_guest_attributes", current);
};
export const deleteGuestAttribute = (id: string) => {
 const updated = getGuestAttributes().filter(a => a.id !== id);
 setLocalStorageData("crm_guest_attributes", updated);
};

// 3. Tiers
export const getGuestTiers = (): TierConfig[] => getLocalStorageData("crm_guest_tiers", GUEST_TIERS);
export const saveGuestTier = (tier: TierConfig) => {
 const current = getGuestTiers();
 const existingIndex = current.findIndex(t => t.id === tier.id);
 if (existingIndex > -1) {
 current[existingIndex] = tier;
 } else {
 current.push(tier);
 }
 setLocalStorageData("crm_guest_tiers", current);
};

// 4. Redemption Rules
export const getGuestRedemptionRules = (): RedemptionRule[] => getLocalStorageData("crm_guest_rules", GUEST_REDEMPTION_RULES);
export const saveGuestRedemptionRule = (rule: RedemptionRule) => {
 const current = getGuestRedemptionRules();
 const existingIndex = current.findIndex(r => r.id === rule.id);
 if (existingIndex > -1) {
 current[existingIndex] = rule;
 } else {
 current.push(rule);
 }
 setLocalStorageData("crm_guest_rules", current);
};
export const deleteGuestRedemptionRule = (id: string) => {
 const updated = getGuestRedemptionRules().filter(r => r.id !== id);
 setLocalStorageData("crm_guest_rules", updated);
};

// 5. Earn Rules
export const getGuestEarnRules = (): EarnRule[] => getLocalStorageData("crm_guest_earn_rules", GUEST_EARN_RULES);
export const saveGuestEarnRule = (rule: EarnRule) => {
 const current = getGuestEarnRules();
 const existingIndex = current.findIndex(r => r.id === rule.id);
 if (existingIndex > -1) {
 current[existingIndex] = rule;
 } else {
 current.push(rule);
 }
 setLocalStorageData("crm_guest_earn_rules", current);
};
export const deleteGuestEarnRule = (id: string) => {
 const updated = getGuestEarnRules().filter(r => r.id !== id);
 setLocalStorageData("crm_guest_earn_rules", updated);
};

// 6. Campaigns
export const getGuestCampaigns = (): LoyaltyCampaign[] => getLocalStorageData("crm_guest_campaigns", GUEST_CAMPAIGNS);
export const saveGuestCampaign = (camp: LoyaltyCampaign) => {
 const current = getGuestCampaigns();
 const existingIndex = current.findIndex(c => c.id === camp.id);
 if (existingIndex > -1) {
 current[existingIndex] = camp;
 } else {
 current.push(camp);
 }
 setLocalStorageData("crm_guest_campaigns", current);
};
export const deleteGuestCampaign = (id: string) => {
 const updated = getGuestCampaigns().filter(c => c.id !== id);
 setLocalStorageData("crm_guest_campaigns", updated);
};

// 7. Segmentation Rules
export const getGuestSegmentationRules = (): SegmentationRule[] => getLocalStorageData("crm_guest_seg_rules", []);
export const saveGuestSegmentationRule = (rule: SegmentationRule) => {
 const current = getGuestSegmentationRules();
 const existingIndex = current.findIndex(r => r.id === rule.id);
 if (existingIndex > -1) {
 current[existingIndex] = rule;
 } else {
 current.push(rule);
 }
 setLocalStorageData("crm_guest_seg_rules", current);
};
export const deleteGuestSegmentationRule = (id: string) => {
 const updated = getGuestSegmentationRules().filter(r => r.id !== id);
 setLocalStorageData("crm_guest_seg_rules", updated);
};

// 8. Companies
export const getGuestCompanies = (): Company[] => getLocalStorageData("crm_guest_companies", GUEST_COMPANIES);
export const saveGuestCompany = (comp: Company) => {
 const current = getGuestCompanies();
 const existingIndex = current.findIndex(c => c.id === comp.id);
 if (existingIndex > -1) {
 current[existingIndex] = comp;
 } else {
 current.push(comp);
 }
 setLocalStorageData("crm_guest_companies", current);
};

