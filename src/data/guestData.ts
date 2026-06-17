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
 name: "Seva Retail",
 logoUrl: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=150&auto=format&fit=crop&q=60",
 address: "Bitexco, TP. Hồ Chí Minh",
 type: "company",
 userId: "guest",
 createdAt: daysAgo(150),
 },
 {
 id: "comp_saigon",
 name: "Chi nhánh HeartLock",
 logoUrl: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=150&auto=format&fit=crop&q=60",
 address: "15-17 Cao Thắng, Phường 2, Quận 3, TP. Hồ Chí Minh",
 type: "branch",
 parentId: "comp_seva",
 userId: "guest",
 createdAt: daysAgo(100),
 },
 {
 id: "comp_hanoi",
 name: "Chi nhánh Memorient",
 logoUrl: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=150&auto=format&fit=crop&q=60",
 address: "86 Tràng Tiền, Hoàn Kiếm, Hà Nội",
 type: "branch",
 parentId: "comp_seva",
 userId: "guest",
 createdAt: daysAgo(95),
 },
 {
 id: "comp_revaretail",
 name: "Revaretail",
 logoUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&auto=format&fit=crop&q=60",
 address: "Trung tâm Đào tạo Kỹ năng Kỹ thuật số",
 type: "company",
 userId: "guest",
 createdAt: daysAgo(10),
 },
 {
 id: "comp_reva_b1",
 name: "Chi nhánh B1",
 logoUrl: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=150&auto=format&fit=crop&q=60",
 address: "Khu B1, TP. Hồ Chí Minh",
 type: "branch",
 parentId: "comp_revaretail",
 userId: "guest",
 createdAt: daysAgo(5),
 },
 {
 id: "comp_reva_b2",
 name: "Chi nhánh B2",
 logoUrl: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=150&auto=format&fit=crop&q=60",
 address: "Khu B2, Hà Nội",
 type: "branch",
 parentId: "comp_revaretail",
 userId: "guest",
 createdAt: daysAgo(5),
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
  },
  {
    id: "attr_ring_size",
    label: "Size nhẫn tay",
    key: "ringSize",
    type: "number",
    userId: "guest",
    createdAt: daysAgo(70),
    isRequired: false,
  },
  {
    id: "attr_hobbies",
    label: "Sở thích",
    key: "hobbies",
    type: "text",
    userId: "guest",
    createdAt: daysAgo(65),
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

    // Generate random avatar
    const avatarGender = pseudoRandom(i * 98.2) > 0.5 ? "men" : "women";
    const avatarId = Math.floor(pseudoRandom(i * 99.1) * 99);
    const avatarUrl = `https://randomuser.me/api/portraits/${avatarGender}/${avatarId}.jpg`;

    // Social Media links
    const facebook = pseudoRandom(i * 101.1) > 0.4 ? `https://facebook.com/${cleanEng}${i}` : undefined;
    const zalo = pseudoRandom(i * 102.2) > 0.2 ? phone : undefined;
    const instagram = pseudoRandom(i * 103.3) > 0.6 ? `https://instagram.com/${cleanEng}${i}_official` : undefined;
    const tiktok = pseudoRandom(i * 104.4) > 0.7 ? `https://tiktok.com/@${cleanEng}${i}` : undefined;

    list.push({
      id: `cust_${i}`,
      name,
      email,
      phone,
      avatarUrl,
      facebook,
      zalo,
      instagram,
      tiktok,
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
      tickets,
      statusHistory: points >= 10000 ? [
        { id: `sh_${i}_1`, from: "Essential", to: "Icon", timestamp: daysAgo(90).getTime(), date: daysAgo(90) },
        { id: `sh_${i}_2`, from: "Icon", to: "Atelier", timestamp: daysAgo(30).getTime(), date: daysAgo(30) }
      ] : points >= 2500 ? [
        { id: `sh_${i}_1`, from: "Essential", to: "Icon", timestamp: daysAgo(60).getTime(), date: daysAgo(60) }
      ] : points >= 500 ? [
        { id: `sh_${i}_1`, from: "Member", to: "Essential", timestamp: daysAgo(45).getTime(), date: daysAgo(45) }
      ] : [],
      redemptions: points >= 10000 ? [
        { id: `rd_${i}_1`, rewardName: "Bộ chăm sóc và vệ sinh trang sức Heart Lock Premium", pointsUsed: 200, status: "Đã nhận", date: daysAgo(15) },
        { id: `rd_${i}_2`, rewardName: "Voucher Quà tặng 500.000đ từ nhãn hàng SEVAGO", pointsUsed: 450, status: "Đã nhận", date: daysAgo(45) },
        { id: `rd_${i}_3`, rewardName: "Trải nghiệm phòng chờ Private Lounge Thượng Lưu", pointsUsed: 1000, status: "Đã nhận", date: daysAgo(70) }
      ] : points >= 2500 ? [
        { id: `rd_${i}_1`, rewardName: "Voucher Ưu đãi 100.000đ trừ trực tiếp vào đơn hàng", pointsUsed: 100, status: "Đã nhận", date: daysAgo(12) },
        { id: `rd_${i}_2`, rewardName: "Vòng tay đá phong thuỷ Thạch Anh tóc vàng", pointsUsed: 200, status: "Đã nhận", date: daysAgo(28) }
      ] : points >= 500 ? [
        { id: `rd_${i}_1`, rewardName: "Voucher Ưu đãi 100.000đ trừ trực tiếp vào đơn hàng", pointsUsed: 100, status: "Đã nhận", date: daysAgo(35) }
      ] : [],
    });
  }

  return list;
};

export const GUEST_CUSTOMERS: Customer[] = generateGuestCustomers();

export const GUEST_TIERS: TierConfig[] = [
  { 
    id: "tier-member", 
    name: "Member", 
    threshold: 0, 
    multiplier: 1.0, 
    color: "#94a3b8", 
    userId: "guest", 
    createdAt: daysAgo(100), 
    description: "Cấp bậc tiêu chuẩn dành cho khách hàng mới gia nhập Seva Retail. Tích điểm cơ bản trên mỗi hóa đơn và nhận bản tin đặc quyền sớm định kỳ.",
    benefits: [
      { name: "Hệ số tích điểm", value: "1.0x (Cơ bản)" },
      { name: "Quà tặng chào mừng", value: "Thiệp tay Seva Heritage" },
      { name: "Sinh nhật hoàng gia", value: "Quà lưu niệm" },
      { name: "Spa & Vệ sinh trang sức", value: "Giảm 20%" },
      { name: "Chuyên viên tư vấn riêng", value: "Hotline CSKH" }
    ]
  },
  { 
    id: "tier-essential", 
    name: "Essential", 
    threshold: 500, 
    multiplier: 1.25, 
    color: "#10b981", 
    userId: "guest", 
    createdAt: daysAgo(100), 
    description: "Hành trình trải nghiệm xa xỉ bền vững. Thưởng thức x1.25 điểm tích lũy, miễn phí mọi dịch vụ spa trang sức trọn đời tại các chi nhánh.",
    benefits: [
      { name: "Hệ số tích điểm", value: "1.25x (Ưu đãi)" },
      { name: "Quà tặng chào mừng", value: "Voucher 500k" },
      { name: "Sinh nhật hoàng gia", value: "Voucher 1M" },
      { name: "Spa & Vệ sinh trang sức", value: "Miễn phí đánh bóng" },
      { name: "Chuyên viên tư vấn riêng", value: "Hotline VIP" }
    ]
  },
  { 
    id: "tier-icon", 
    name: "Icon", 
    threshold: 2500, 
    multiplier: 1.5, 
    color: "#f59e0b", 
    userId: "guest", 
    createdAt: daysAgo(100), 
    description: "Hạng Khách hàng VIP thể hiện vị thế biểu tượng. Trải nghiệm phòng chờ thượng hạng Private Lounge và mức chiết khấu mua sắm trực tiếp đặc quyền.",
    benefits: [
      { name: "Hệ số tích điểm", value: "1.5x" },
      { name: "Quà tặng chào mừng", value: "Voucher 1.5M + Nến thơm" },
      { name: "Sinh nhật hoàng gia", value: "Hộp quà hoa di sản" },
      { name: "Spa & Vệ sinh trang sức", value: "Miễn phí đánh bóng trọn đời" },
      { name: "Sử dụng Private Lounge", value: "Giảm 50% phí dịch vụ" },
      { name: "Chuyên viên tư vấn riêng", value: "Chuyên viên riêng" }
    ]
  },
  { 
    id: "tier-atelier", 
    name: "Atelier", 
    threshold: 10000, 
    multiplier: 2.0, 
    color: "#2f6cf5", 
    userId: "guest", 
    createdAt: daysAgo(100), 
    description: "Hạng VVIP tinh hoa trọn vẹn đặc quyền cao quý nhất. Đồng sáng tạo thiết kế Bespoke độc bản và trải nghiệm những đặc khu xa hoa vô tận.",
    benefits: [
      { name: "Hệ số tích điểm", value: "2.0x (Đặc quyền tối đa)" },
      { name: "Quà tặng chào mừng", value: "Tráp quà lụa thượng hạng VIP" },
      { name: "Sinh nhật hoàng gia", value: "Set trang sức độc bản đính đá quý" },
      { name: "Spa & Vệ sinh trang sức", value: "Đặc trị khuyết tật & Xi mạ cao cấp" },
      { name: "Sử dụng Private Lounge", value: "Miễn phí 100% kèm trà bánh" },
      { name: "Chuyên viên tư vấn riêng", value: "Quản lý Showroom phụ trách 24/7" }
    ]
  }
];

export const GUEST_REDEMPTION_RULES: RedemptionRule[] = [
  { id: "rule_default_100", name: "Đổi ưu đãi 1.000đ (100 điểm)", pointsRequired: 100, rewardValue: 1000, rewardType: "discount", userId: "guest", createdAt: daysAgo(0) },
  { id: "rule_voucher_200", name: "Mã giảm giá 200.000đ áp dụng toàn phần hóa đơn kế tiếp", pointsRequired: 200, rewardValue: 200000, rewardType: "voucher", userId: "guest", createdAt: daysAgo(90) },
  { id: "rule_voucher_1000", name: "Phiếu Quà Tặng Đậm Đắc Mừng Lễ Trị Giá 1.000.000đ", pointsRequired: 900, rewardValue: 1000000, rewardType: "voucher", userId: "guest", createdAt: daysAgo(90) },
  { id: "rule_spa_service", name: "Trải nghiệm spa dọn dẹp làm sạch trang sức đặc biệt tại HeartLock", pointsRequired: 50, rewardValue: 150000, rewardType: "item", userId: "guest", createdAt: daysAgo(90) },
  { id: "rule_memorient_candle", name: "Hương thơm nến tinh dầu chiết xuất Memorient Rose", pointsRequired: 400, rewardValue: 600000, rewardType: "item", userId: "guest", createdAt: daysAgo(90) },
  { id: "rule_atelier_box", name: "Hộp quà tặng bọc thêu gấm lụa Atelier Velvet cao cấp", pointsRequired: 1500, rewardValue: 1800000, rewardType: "item", userId: "guest", createdAt: daysAgo(20) },
  { id: "rule_bespoke_class", name: "Khoá học vẽ tạc trang sức thủ công kèm tư vấn bản thiết kế riêng", pointsRequired: 5000, rewardValue: 7000000, rewardType: "discount", userId: "guest", createdAt: daysAgo(15) }
];

export const GUEST_EARN_RULES: EarnRule[] = [
  { id: "earn_purchase", name: "Tích điểm mua sắm (Mỗi 10.000đ nhận 1 điểm)", type: "purchase", points: 10, isActive: true, userId: "guest", createdAt: daysAgo(90) },
  { id: "earn_share_fb", name: "Chia sẻ bài viết trên Facebook (+50 điểm)", type: "social_share", points: 50, isActive: true, userId: "guest", createdAt: daysAgo(0) },
  { id: "earn_follow_insta", name: "Theo dõi kênh Instagram (+30 điểm)", type: "social_follow", points: 30, isActive: true, userId: "guest", createdAt: daysAgo(0) },
  { id: "earn_profile_update", name: "Cập nhật hồ sơ cá nhân (+20 điểm)", type: "other", points: 20, isActive: true, userId: "guest", createdAt: daysAgo(0) },
  { id: "earn_first_review", name: "Viết đánh giá sản phẩm đầu tiên (+100 điểm)", type: "review", points: 100, isActive: true, userId: "guest", createdAt: daysAgo(0) },
  { id: "earn_checkin_store", name: "Check-in tại cửa hàng (+40 điểm)", type: "checkin", points: 40, isActive: true, userId: "guest", createdAt: daysAgo(0) },
  { id: "earn_referral", name: "Giới thiệu bạn bè đăng ký tài khoản (+150 điểm)", type: "referral", points: 150, isActive: true, userId: "guest", createdAt: daysAgo(0) }
];

export const GUEST_CAMPAIGNS: LoyaltyCampaign[] = [
  { id: "camp_bday", name: "Đặc quyền sinh nhật - Chúc mừng tuổi xuân sang rạng rỡ", type: "birthday", rewardType: "gift", rewardValue: 0, isActive: true, userId: "guest", createdAt: daysAgo(50), description: "Hệ thống tự động kích hoạt gửi Email chúc mừng kèm ưu đãi tặng hộp quà đặc trưng khi khách hàng ghé thăm HeartLock hoặc Memorient trong tháng sinh nhật." },
  { id: "camp_point_notify", name: "Gửi thông báo tích điểm - Xác nhận hóa đơn thành công", type: "milestone", rewardType: "points", rewardValue: 10, isActive: true, userId: "guest", createdAt: daysAgo(90), description: "Gửi email thông tri lập tức khi điểm thưởng được cộng vào tài khoản của khách sau giao dịch, tạo sự an tâm và minh bạch tuyệt đối." },
  { id: "camp_share_thankyou", name: "Chiến dịch lan tỏa tinh hoa - Cám ơn đã chia sẻ bài viết", type: "event", rewardType: "points", rewardValue: 100, isActive: true, userId: "guest", createdAt: daysAgo(40), description: "Kích hoạt tự động cộng 100 điểm thưởng và gửi email cám ơn ấm áp khi khách hàng tham gia chia sẻ bài viết Seva Retail lên dòng thời gian mạng xã hội." },
  { id: "camp_tier_upgrade", name: "Nâng tầm ưu thế VIP - Chúc mừng thăng hạng thành viên", type: "milestone", rewardType: "gift", rewardValue: 0, isActive: true, userId: "guest", createdAt: daysAgo(30), description: "Chiến dịch tự động nhận diện thăng hạng và gửi thư chào mừng nồng nhiệt kèm theo trọn bộ hướng dẫn đặc quyền tương xứng dành tặng quý hội viên thượng lưu." },
  { id: "camp_new_member", name: "Bừng sáng khởi đầu - Chào mừng thành viên Seva Club", type: "event", rewardType: "points", rewardValue: 150, isActive: true, userId: "guest", createdAt: daysAgo(5), description: "Chào đón nồng hậu các người mua mới đăng ký tài khoản Seva Club, tự động gửi tặng 150 điểm tích lũy khởi nguồn cùng bức thư tri ân trang trọng." },
  { id: "camp_winback_30", name: "Kịch bản giữ chân - Chăm sóc sau 30 ngày chưa mua", type: "winback", rewardType: "voucher", rewardValue: 0, isActive: true, userId: "guest", createdAt: daysAgo(10), description: "Hệ thống tự động phát hiện khách không phát sinh giao dịch sau 30 ngày. Khởi chạy kịch bản nhắn tin SMS hỏi thăm và tặng Voucher 10% để thu hút tái mua sắm." },
  { id: "camp_winback_abandoned_cart", name: "Kịch bản Abandoned Cart - Nhắc giỏ hàng bị bỏ quên", type: "event", rewardType: "points", rewardValue: 0, isActive: true, userId: "guest", createdAt: daysAgo(1), description: "Người dùng thêm trang sức vào giỏ nhưng không checkout sau 24h. Tự động gửi Email/Zalo ZNS kèm cam kết bảo hiểm rơi vỡ để thúc đẩy thanh toán." }
];

export const GUEST_SEGMENTATION_RULES: SegmentationRule[] = [
  { id: "seg_vip_heartlock_lovers", name: "Khách hàng thân thiết HeartLock", tag: "HeartLock VIP", color: "blue", criteriaType: "total_spend", operator: "gt", value: 150000000, isActive: true, userId: "guest", createdAt: daysAgo(60) },
  { id: "seg_memorient_lovers", name: "Khách hàng truyền thống Memorient", tag: "Memorient VIP", color: "emerald", criteriaType: "points_balance", operator: "gt", value: 3000, isActive: true, userId: "guest", createdAt: daysAgo(45) },
  { id: "seg_retention_alert", name: "Nhóm cảnh báo rời mạng 90 ngày", tag: "CHURN ALERT", color: "rose", criteriaType: "time_since_last_purchase", operator: "gt", value: 90, isActive: true, userId: "guest", createdAt: daysAgo(30) }
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
  const current = getLocalStorageData("crm_guest_customers_v6", GUEST_CUSTOMERS);
  if (current.length < 10 && GUEST_CUSTOMERS.length >= 200) {
    setLocalStorageData("crm_guest_customers_v6", GUEST_CUSTOMERS);
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
  setLocalStorageData("crm_guest_customers_v6", current);
};
export const deleteGuestCustomer = (id: string) => {
  const updated = getGuestCustomers().filter(c => c.id !== id);
  setLocalStorageData("crm_guest_customers_v6", updated);
};

// 2. Attributes
export const getGuestAttributes = (): AttributeDefinition[] => getLocalStorageData("crm_guest_attributes_v5", GUEST_ATTRIBUTES);
export const saveGuestAttribute = (attr: AttributeDefinition) => {
  const current = getGuestAttributes();
  const existingIndex = current.findIndex(a => a.id === attr.id);
  if (existingIndex > -1) {
    current[existingIndex] = attr;
  } else {
    current.push(attr);
  }
  setLocalStorageData("crm_guest_attributes_v5", current);
};
export const deleteGuestAttribute = (id: string) => {
  const updated = getGuestAttributes().filter(a => a.id !== id);
  setLocalStorageData("crm_guest_attributes_v5", updated);
};

// 3. Tiers
export const getGuestTiers = (): TierConfig[] => getLocalStorageData("crm_guest_tiers_v6", GUEST_TIERS);
export const saveGuestTier = (tier: TierConfig) => {
  const current = getGuestTiers();
  const existingIndex = current.findIndex(t => t.id === tier.id);
  if (existingIndex > -1) {
    current[existingIndex] = tier;
  } else {
    current.push(tier);
  }
  setLocalStorageData("crm_guest_tiers_v6", current);
};

// 4. Redemption Rules
export const getGuestRedemptionRules = (): RedemptionRule[] => getLocalStorageData("crm_guest_rules_v5", GUEST_REDEMPTION_RULES);
export const saveGuestRedemptionRule = (rule: RedemptionRule) => {
  const current = getGuestRedemptionRules();
  const existingIndex = current.findIndex(r => r.id === rule.id);
  if (existingIndex > -1) {
    current[existingIndex] = rule;
  } else {
    current.push(rule);
  }
  setLocalStorageData("crm_guest_rules_v5", current);
};
export const deleteGuestRedemptionRule = (id: string) => {
  const updated = getGuestRedemptionRules().filter(r => r.id !== id);
  setLocalStorageData("crm_guest_rules_v5", updated);
};

// 5. Earn Rules
export const getGuestEarnRules = (): EarnRule[] => getLocalStorageData("crm_guest_earn_rules_v5", GUEST_EARN_RULES);
export const saveGuestEarnRule = (rule: EarnRule) => {
  const current = getGuestEarnRules();
  const existingIndex = current.findIndex(r => r.id === rule.id);
  if (existingIndex > -1) {
    current[existingIndex] = rule;
  } else {
    current.push(rule);
  }
  setLocalStorageData("crm_guest_earn_rules_v5", current);
};
export const deleteGuestEarnRule = (id: string) => {
  const updated = getGuestEarnRules().filter(r => r.id !== id);
  setLocalStorageData("crm_guest_earn_rules_v5", updated);
};

// 6. Campaigns
export const getGuestCampaigns = (): LoyaltyCampaign[] => getLocalStorageData("crm_guest_campaigns_v6", GUEST_CAMPAIGNS);
export const saveGuestCampaign = (camp: LoyaltyCampaign) => {
  const current = getGuestCampaigns();
  const existingIndex = current.findIndex(c => c.id === camp.id);
  if (existingIndex > -1) {
    current[existingIndex] = camp;
  } else {
    current.push(camp);
  }
  setLocalStorageData("crm_guest_campaigns_v6", current);
};
export const deleteGuestCampaign = (id: string) => {
  const updated = getGuestCampaigns().filter(c => c.id !== id);
  setLocalStorageData("crm_guest_campaigns_v6", updated);
};

// 7. Segmentation Rules
export const getGuestSegmentationRules = (): SegmentationRule[] => getLocalStorageData("crm_guest_seg_rules_v5", GUEST_SEGMENTATION_RULES);
export const saveGuestSegmentationRule = (rule: SegmentationRule) => {
  const current = getGuestSegmentationRules();
  const existingIndex = current.findIndex(r => r.id === rule.id);
  if (existingIndex > -1) {
    current[existingIndex] = rule;
  } else {
    current.push(rule);
  }
  setLocalStorageData("crm_guest_seg_rules_v5", current);
};
export const deleteGuestSegmentationRule = (id: string) => {
  const updated = getGuestSegmentationRules().filter(r => r.id !== id);
  setLocalStorageData("crm_guest_seg_rules_v5", updated);
};

// 8. Companies
export const getGuestCompanies = (): Company[] => getLocalStorageData("crm_guest_companies_v5", GUEST_COMPANIES);
export const saveGuestCompany = (comp: Company) => {
  const current = getGuestCompanies();
  const existingIndex = current.findIndex(c => c.id === comp.id);
  if (existingIndex > -1) {
    current[existingIndex] = comp;
  } else {
    current.push(comp);
  }
  setLocalStorageData("crm_guest_companies_v5", current);
};

