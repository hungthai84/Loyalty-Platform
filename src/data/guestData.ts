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

// Programmatic generator for 200 premium jewelry guest customers
const generateGuestCustomers = (): Customer[] => {
  const list: Customer[] = [];
  const VIET_FIRST_NAMES = [
    "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"
  ];
  const VIET_MIDDLE_NAMES = [
    "Thị", "Văn", "Anh", "Minh", "Hồng", "Tuấn", "Hải", "Khánh", "Thanh", "Ngọc", "Bảo", "Xuân", "Thúy", "Kim", "Quốc", "Gia"
  ];
  const VIET_LAST_NAMES = [
    "Hương", "Tuấn", "Triết", "Thư", "Oanh", "Ngọc", "Đức", "Dương", "Thịnh", "Linh",
    "Tài", "Nhung", "Bảo", "An", "Hải", "Nhã", "Duyên", "Nam", "Dung", "Giang",
    "Anh", "Trang", "Phước", "Tú", "Điệp", "Phong", "Minh", "Chi", "Vy", "Khang",
    "Hạnh", "Trà", "Yến", "Kiệt", "Đăng", "Khánh", "Mai", "Quỳnh", "Hà", "Bách"
  ];

  const GEMS = ["Diamond", "Ruby", "Sapphire", "Emerald", "Jade", "Pearl"];
  const JEWELRIES = [
    "Nhẫn Kim Cương Solitaire 18K", "Nhẫn Cưới Bridal Diamond Luxury", 
    "Vòng Cổ Bạch Kim Premium", "Mặt Dây Chuyền Emerald Hoàng Gia", 
    "Khuyên Tai Ruby Luxury", "Vòng Tay Ngọc Bích Signature", 
    "Khuyên Tai Ngọc Trai South Sea", "Vòng Tay Vàng Ý Eternity"
  ];

  // Helper for generating stable pseudo-random values so list doesn't shift on every compile
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 1; i <= 200; i++) {
    const r1 = Math.floor(pseudoRandom(i * 13.7) * VIET_FIRST_NAMES.length);
    const r2 = Math.floor(pseudoRandom(i * 17.3) * VIET_MIDDLE_NAMES.length);
    const r3 = Math.floor(pseudoRandom(i * 21.1) * VIET_LAST_NAMES.length);
    const name = `${VIET_FIRST_NAMES[r1]} ${VIET_MIDDLE_NAMES[r2]} ${VIET_LAST_NAMES[r3]}`;

    // Clean English name for email
    const cleanEng = name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, ".");
    const email = `${cleanEng}${i}@sevago.vip`;

    // Generate phone
    const prefixes = ["090", "091", "098", "096", "097", "093", "086", "089"];
    const prefIdx = Math.floor(pseudoRandom(i * 27.5) * prefixes.length);
    const phoneSuffix = Math.floor(1000000 + pseudoRandom(i * 31.9) * 8999999);
    const phone = `${prefixes[prefIdx]}${phoneSuffix}`;

    // Setup Points and Tiers: some Atelier, some Icon, some Essential, some Member
    let points = 0;
    if (i <= 25) {
      // Atelier (Member >= 10k pts)
      points = Math.floor(10200 + pseudoRandom(i * 35.1) * 12000);
    } else if (i <= 70) {
      // Icon (Member 2500 - 9999 pts)
      points = Math.floor(2600 + pseudoRandom(i * 39.3) * 6000);
    } else if (i <= 145) {
      // Essential (Member 500 - 2499 pts)
      points = Math.floor(550 + pseudoRandom(i * 43.7) * 1600);
    } else {
      // Ordinary Member (0 - 499 pts)
      points = Math.floor(15 + pseudoRandom(i * 47.9) * 450);
    }

    const spend = points * 100000; // Customer Lifetime Value

    // Setup Recency & Risk Status
    const daysSinceLastPurchase = Math.floor(pseudoRandom(i * 51.5) * 160);
    let activityStatus: 'active' | 'inactive' | 'churn_risk' = 'active';
    let riskScore = 5;
    if (daysSinceLastPurchase > 90) {
      activityStatus = 'churn_risk';
      riskScore = Math.floor(75 + pseudoRandom(i * 55.7) * 21);
    } else if (daysSinceLastPurchase > 45) {
      activityStatus = 'inactive';
      riskScore = Math.floor(35 + pseudoRandom(i * 59.9) * 28);
    } else {
      riskScore = Math.floor(5 + pseudoRandom(i * 63.3) * 22);
    }

    const companyId = pseudoRandom(i * 67.1) > 0.5 ? "comp_saigon" : "comp_hanoi";
    const region = companyId === "comp_saigon" ? "TP.HCM" : "Hà Nội";
    const favoriteGem = GEMS[Math.floor(pseudoRandom(i * 71.9) * GEMS.length)];

    // Seed realistic order items
    const ordersCount = Math.floor(1 + pseudoRandom(i * 75.3) * 4);
    const orders = [];
    for (let o = 0; o < ordersCount; o++) {
      const orderAmount = Math.floor(4000000 + pseudoRandom(i * 79.1 + o) * 45000000);
      const orderPts = Math.floor(orderAmount / 100000);
      const orderDaysAgo = daysSinceLastPurchase + o * 18;
      orders.push({
        id: `ord_${i}_${o}`,
        date: daysAgo(orderDaysAgo),
        amount: orderAmount,
        points: orderPts,
        status: "completed",
        description: JEWELRIES[Math.floor(pseudoRandom(i * 83.7 + o) * JEWELRIES.length)]
      });
    }

    // Seed active service requests (tickets) for a subset of them
    const tickets = [];
    if (pseudoRandom(i * 87.5) > 0.7) {
      tickets.push({
        id: `tick_${i}`,
        summary: pseudoRandom(i * 91.1) > 0.5 ? "Yêu cầu bảo dưỡng spa sản phẩm đính kim cương" : "Hồ trợ chỉnh size nhẫn đính hôn khẩn cấp",
        status: pseudoRandom(i * 94.3) > 0.4 ? "closed" : "open",
        createdAt: daysAgo(Math.floor(pseudoRandom(i * 97.9) * 25))
      });
    }

    // Custom tag styling based on loyalty metrics
    const tags = [];
    if (points >= 10000) {
      tags.push({ tag: "ATELIER PREMIUM", color: "blue" }, { tag: "ELITE VIP", color: "emerald" });
    } else if (points >= 2500) {
      tags.push({ tag: "BIG SPENDER", color: "gold" });
    } else if (activityStatus === 'churn_risk') {
      tags.push({ tag: "CHURN RISK", color: "rose" });
    } else {
      tags.push({ tag: "MEMBER", color: "slate" });
    }

    list.push({
      id: `cust_${i}`,
      name,
      email,
      phone,
      points,
      activityStatus,
      companyId,
      userId: "guest",
      createdAt: daysAgo(110 + daysSinceLastPurchase),
      updatedAt: daysAgo(daysSinceLastPurchase),
      customFields: {
        spend,
        favoriteGem,
        autoTags: tags,
        region,
        risk_score: riskScore,
        last_purchase: daysAgo(daysSinceLastPurchase).toISOString().split('T')[0]
      },
      orders,
      tickets
    });
  }

  return list;
};

export const GUEST_CUSTOMERS: Customer[] = generateGuestCustomers();

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
export const getGuestCustomers = (): Customer[] => {
  const current = getLocalStorageData("crm_guest_customers", GUEST_CUSTOMERS);
  if (current.length < 10 && GUEST_CUSTOMERS.length >= 200) {
    setLocalStorageData("crm_guest_customers", GUEST_CUSTOMERS);
    return GUEST_CUSTOMERS;
  }
  return current;
};
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

