export const kpiData = [
 { label: "Tổng doanh thu", value: "105,7 Tỷ ₫", change: "+12.5%", positive: true },
 { label: "Khách hàng hoạt động", value: "24.591", change: "+5.2%", positive: true },
 { label: "Tỷ lệ mua lại", value: "68%", change: "+2.1%", positive: true },
 { label: "Điểm đã đổi", value: "1,2M pts", change: "-4.5%", positive: false },
];

export const revenueData = [
 { name: "Th1", revenue: 4000000000 },
 { name: "Th2", revenue: 4200000000 },
 { name: "Th3", revenue: 5100000000 },
 { name: "Th4", revenue: 4800000000 },
 { name: "Th5", revenue: 7200000000 },
 { name: "Th6", revenue: 8500000000 },
];

export const recentCustomers = [
  { id: "CUS-8921", name: "Nguyễn Thảo Chi", tier: "Atelier", spent: "612.500.000 ₫", joined: "2023-01-15", points: 15000 },
  { id: "CUS-8922", name: "Trần Thế Phong", tier: "Icon", spent: "305.000.000 ₫", joined: "2023-04-20", points: 4500 },
  { id: "CUS-8923", name: "Phan Ánh Dương", tier: "Essential", spent: "120.000.000 ₫", joined: "2023-08-10", points: 1200 },
  { id: "CUS-8924", name: "Hoàng Minh Tuấn", tier: "Member", spent: "30.000.000 ₫", joined: "2024-01-05", points: 300 },
  { id: "CUS-8925", name: "Lâm Mỹ Dung", tier: "Atelier", spent: "1.320.000.000 ₫", joined: "2022-11-30", points: 32000 },
];

export const recentActivityData = [
  { id: "act-1", type: "sign_up", user: "Phạm Hải Đăng", description: "đã đăng ký thành viên mới", time: "10 phút trước" },
  { id: "act-2", type: "upgrade", user: "Lê Thúy Diễm", description: "đã thăng hạng lên Icon", time: "25 phút trước" },
  { id: "act-3", type: "redeem", user: "Nguyễn Thảo Chi", description: "đã đổi 15,000 điểm lấy Voucher High-Tea", time: "1 giờ trước" },
  { id: "act-4", type: "rule_trigger", user: "Hệ thống", description: "kích hoạt chiến dịch 'Welcome Essential Tier'", time: "3 giờ trước" },
  { id: "act-5", type: "purchase", user: "Trần Thế Phong", description: "đã hoàn thành đơn hàng 12,000,000đ", time: "5 giờ trước" }
];

export const loyaltyTiers = [

 { name: "Member", threshold: 0, spendThreshold: 0, orderThreshold: 0, multiplier: "1x", benefits: ["Quà tặng sinh nhật", "Ưu đãi đặc biệt"] },
 { name: "Essential", threshold: 500, spendThreshold: 50000000, orderThreshold: 10, multiplier: "1.25x", benefits: ["Truy cập sớm", "Miễn phí giao hàng", "Quà tặng sinh nhật"] },
 { name: "Icon", threshold: 2500, spendThreshold: 250000000, orderThreshold: 25, multiplier: "1.5x", benefits: ["Quản lý riêng", "Sự kiện VIP", "Quà tặng năm"] },
 { name: "Atelier", threshold: 10000, spendThreshold: 1000000000, orderThreshold: 50, multiplier: "2x", benefits: ["Thiết kế trang sức riêng", "Nghỉ dưỡng cao cấp", "Hỗ trợ ưu tiên"] },
];
