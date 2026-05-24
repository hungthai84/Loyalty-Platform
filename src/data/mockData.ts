export const kpiData = [
  { label: "Tổng doanh thu", value: "$4.2M", change: "+12.5%", positive: true },
  { label: "Khách hàng hoạt động", value: "24,591", change: "+5.2%", positive: true },
  { label: "Tỷ lệ mua lại", value: "68%", change: "+2.1%", positive: true },
  { label: "Điểm đã đổi", value: "1.2M", change: "-4.5%", positive: false },
];

export const revenueData = [
  { name: "Th1", revenue: 400000 },
  { name: "Th2", revenue: 420000 },
  { name: "Th3", revenue: 510000 },
  { name: "Th4", revenue: 480000 },
  { name: "Th5", revenue: 720000 },
  { name: "Th6", revenue: 850000 },
];

export const recentCustomers = [
  { id: "CUS-8921", name: "Eleanor Vance", tier: "Kim cương", spent: "$24,500", joined: "2023-01-15", points: 125000 },
  { id: "CUS-8922", name: "William Darcy", tier: "Bạch kim", spent: "$12,200", joined: "2023-04-20", points: 45000 },
  { id: "CUS-8923", name: "Jane Eyre", tier: "Vàng", spent: "$4,800", joined: "2023-08-10", points: 12000 },
  { id: "CUS-8924", name: "Emma Woodhouse", tier: "Bạc", spent: "$1,200", joined: "2024-01-05", points: 3000 },
  { id: "CUS-8925", name: "Arthur Pendragon", tier: "Kim cương", spent: "$52,000", joined: "2022-11-30", points: 320000 },
];

export const loyaltyTiers = [
  { name: "Bạc", threshold: 0, spendThreshold: 0, orderThreshold: 0, multiplier: "1x", benefits: ["Quà tặng sinh nhật", "Ưu đãi đặc biệt"] },
  { name: "Vàng", threshold: 5000, spendThreshold: 5000, orderThreshold: 10, multiplier: "1.25x", benefits: ["Truy cập sớm", "Miễn phí giao hàng", "Quà tặng sinh nhật"] },
  { name: "Bạch kim", threshold: 15000, spendThreshold: 15000, orderThreshold: 25, multiplier: "1.5x", benefits: ["Quản lý riêng", "Sự kiện VIP", "Quà tặng năm"] },
  { name: "Kim cương", threshold: 50000, spendThreshold: 50000, orderThreshold: 50, multiplier: "2x", benefits: ["Thiết kế trang sức riêng", "Nghỉ dưỡng cao cấp", "Hỗ trợ ưu tiên"] },
];
