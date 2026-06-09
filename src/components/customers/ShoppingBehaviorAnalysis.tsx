import React, { useState, useMemo } from 'react';
import * as motion from "motion/react-client";
import { 
  ShoppingBag, 
  Ticket, 
  Sparkles, 
  Shirt, 
  Diamond, 
  Search,
  CheckCircle2,
  AlertCircle,
  Target,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Mock data
const MOCK_CUSTOMERS = [
  { id: 'SVG-9081', name: 'Đoàn Hương Giang', tier: 'Atelier', phone: '0912***888' },
  { id: 'SVG-4302', name: 'Nguyễn Lâm Anh', tier: 'Atelier', phone: '0987***999' },
  { id: 'SVG-7711', name: 'Trần Minh Quân', tier: 'Icon', phone: '0903***777' },
];

const MOCK_ORDERS = [
  { orderId: 'ORD-101', customerId: 'SVG-9081', date: '2025-11-20', collection: 'Heritage Gold', item: 'Dây chuyền vàng nguyên khối 18K', type: 'Dây chuyền' },
  { orderId: 'ORD-102', customerId: 'SVG-9081', date: '2026-02-14', collection: 'Heritage Gold', item: 'Nhẫn kim cương Heritage', type: 'Nhẫn' },
  { orderId: 'ORD-105', customerId: 'SVG-4302', date: '2026-01-10', collection: 'Bridal High Jewelry', item: 'Bộ nhẫn cưới Platinum', type: 'Nhẫn' },
  { orderId: 'ORD-108', customerId: 'SVG-7711', date: '2026-04-12', collection: 'Modern Art', item: 'Lắc tay đính đá Emerald', type: 'Lắc tay' },
];

const MOCK_TICKETS = [
  { ticketId: 'TCK-201', customerId: 'SVG-9081', subject: 'Cần tư vấn phối đồ sự kiện tối', status: 'Closed', notes: 'Khách thích phong cách cổ điển, sang trọng, màu sắc trầm ấm.' },
  { ticketId: 'TCK-202', customerId: 'SVG-9081', subject: 'Hỏi về độ vướng của hoa tai', status: 'Closed', notes: 'Khách hàng có vùng tai nhạy cảm, ưu tiên các mẫu hoa tai nụ, gọn gàng.' },
  { ticketId: 'TCK-203', customerId: 'SVG-4302', subject: 'Làm mới nhẫn cưới', status: 'Closed', notes: 'Liên tục quan tâm về chế độ bảo hành và đánh bóng bạch kim.' },
];

const COLLECTIONS = {
  'Heritage Gold': ['Dây chuyền', 'Nhẫn', 'Hoa tai', 'Lắc tay'],
  'Bridal High Jewelry': ['Nhẫn', 'Dây chuyền', 'Hoa tai'],
  'Modern Art': ['Lắc tay', 'Nhẫn', 'Trâm cài'],
  'Minimalist Platinum': ['Nhẫn', 'Dây chuyền']
};

export function ShoppingBehaviorAnalysis() {
  const [selectedCustomer, setSelectedCustomer] = useState(MOCK_CUSTOMERS[0].id);
  const [searchTerm, setSearchTerm] = useState('');

  const customerOrders = useMemo(() => MOCK_ORDERS.filter(o => o.customerId === selectedCustomer), [selectedCustomer]);
  const customerTickets = useMemo(() => MOCK_TICKETS.filter(t => t.customerId === selectedCustomer), [selectedCustomer]);
  const customerInfo = useMemo(() => MOCK_CUSTOMERS.find(c => c.id === selectedCustomer), [selectedCustomer]);

  // Analyze missing sets
  const collectionAnalysis = useMemo(() => {
    const purchasedByCollection: Record<string, string[]> = {};
    customerOrders.forEach(o => {
      if (!purchasedByCollection[o.collection]) purchasedByCollection[o.collection] = [];
      if (!purchasedByCollection[o.collection].includes(o.type)) {
        purchasedByCollection[o.collection].push(o.type);
      }
    });

    const analysis = [];
    for (const [coll, purchasedTypes] of Object.entries(purchasedByCollection)) {
      const fullSet = COLLECTIONS[coll as keyof typeof COLLECTIONS] || [];
      const missing = fullSet.filter(t => !purchasedTypes.includes(t));
      analysis.push({
        collection: coll,
        purchased: purchasedTypes,
        missing: missing,
        isComplete: missing.length === 0,
        completionRate: Math.round((purchasedTypes.length / fullSet.length) * 100)
      });
    }
    return analysis;
  }, [customerOrders]);

  // Generate AI Suggestion based on orders, missing sets, and tickets
  const aiSuggestion = useMemo(() => {
    if (!customerInfo) return null;
    let behavior = [];
    if (customerOrders.length > 1) {
      behavior.push(`Khách hàng có xu hướng mua sắm theo bộ sưu tập (${customerOrders[0].collection}).`);
    } else {
      behavior.push(`Khách hàng ưu tiên mua các sản phẩm lẻ, mang tính điểm nhấn.`);
    }

    if (customerTickets.length > 0) {
      const ticketNotes = customerTickets.map(t => t.notes).join(" ");
      if (ticketNotes.toLowerCase().includes('cổ điển')) {
        behavior.push(`Ghi nhận từ dịch vụ khách hàng: Ưu tiên phong cách cổ điển, sang trọng.`);
      }
      if (ticketNotes.toLowerCase().includes('nhạy cảm') || ticketNotes.toLowerCase().includes('gọn gàng')) {
        behavior.push(`Lưu ý đặc biệt: Khách thích thiết kế gọn gàng, phù hợp cơ địa nhạy cảm.`);
      }
    }

    const recommendations = [];
    collectionAnalysis.forEach(c => {
      if (!c.isComplete && c.missing.length > 0) {
        recommendations.push(`Gợi ý bán chéo (Cross-sell): Mời mua thêm ${c.missing.join(', ')} thuộc bộ sưu tập ${c.collection} để hoàn thiện bộ trang sức.`);
      }
    });

    return { behavior: behavior.join(" "), recommendations };
  }, [customerOrders, customerTickets, collectionAnalysis, customerInfo]);

  // Product Recommendation Algorithm (Next Best Action - Upsell/Cross-sell)
  const productRecommendations = useMemo(() => {
    if (!customerInfo) return [];
    
    let recommendations: Array<{ type: string, product: string, reason: string, confidence: number }> = [];
    
    // Rule 1: Cross-sell missing collection items
    collectionAnalysis.forEach(ca => {
      if (!ca.isComplete && ca.missing.length > 0 && ca.purchased.length > 0) {
        ca.missing.forEach(missingItem => {
          recommendations.push({
            type: 'cross-sell',
            product: `${missingItem} - ${ca.collection}`,
            reason: `Bổ sung hoàn thiện bộ sưu tập ${ca.collection}`,
            confidence: 85 + Math.round(Math.random() * 10)
          });
        });
      }
    });

    // Rule 2: Upsell based on Customer Tier
    if (customerInfo.tier === 'Atelier' || customerInfo.tier === 'Icon') {
      recommendations.push({
        type: 'upsell',
        product: 'Trang sức VIP / High Jewelry Limited',
        reason: `Phù hợp thói quen chi tiêu hạng ${customerInfo.tier}`,
        confidence: 75 + Math.round(Math.random() * 10)
      });
    }

    // Rule 3: Affinity based on ticket notes
    const hasSensitive = customerTickets.some(t => t.notes.toLowerCase().includes('nhạy cảm') || t.notes.toLowerCase().includes('gọn gàng'));
    if (hasSensitive) {
      recommendations.push({
        type: 'affinity',
        product: 'Hoa tai nụ Platinum (Dáng ôm gọn)',
        reason: `Dựa trên ghi chú CSKH: Cơ địa nhạy cảm, thích gọn gàng`,
        confidence: 90 + Math.round(Math.random() * 5)
      });
    }

    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }, [customerInfo, collectionAnalysis, customerTickets]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar: Customer List */}
      <div className="lg:col-span-3 space-y-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <Search className="w-4 h-4" /> Tra cứu VIP
            </CardTitle>
            <Input 
              placeholder="Tên, mã KH..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2 text-xs h-8 bg-muted border-border"
            />
          </CardHeader>
          <div className="p-2 space-y-1 overflow-y-auto max-h-[500px]">
            {MOCK_CUSTOMERS.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase())).map(customer => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomer(customer.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${selectedCustomer === customer.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <div className="font-bold text-foreground mb-0.5">{customer.name}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase">{customer.id}</span>
                  <Badge variant="outline" className="text-[9px] py-0">{customer.tier}</Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Content: Analysis */}
      <div className="lg:col-span-9 space-y-6">
        {customerInfo && (
          <motion.div
            key={customerInfo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border border-border/50 bg-card/50 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg font-heading">
                  {customerInfo.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading">{customerInfo.name}</h3>
                  <p className="text-xs text-muted-foreground">{customerInfo.id} • {customerInfo.phone}</p>
                </div>
              </div>
              <Badge className="bg-primary">{customerInfo.tier}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order History */}
              <Card className="border-border/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <ShoppingBag className="w-24 h-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                    Lịch sử Mua sắm
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customerOrders.length > 0 ? customerOrders.map((order) => (
                    <div key={order.orderId} className="flex justify-between items-start border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold">{order.item}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{order.collection}</p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{order.date}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">Chưa có dữ liệu mua sắm</p>
                  )}
                </CardContent>
              </Card>

              {/* Tickets History */}
              <Card className="border-border/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Ticket className="w-24 h-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-blue-500" />
                    Dấu vết CSKH (Phiếu hỗ trợ)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customerTickets.length > 0 ? customerTickets.map((ticket) => (
                    <div key={ticket.ticketId} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold">{ticket.subject}</p>
                        <Badge variant="outline" className="text-[9px]">{ticket.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                        "{ticket.notes}"
                      </p>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">Chưa có dữ liệu phiếu hỗ trợ</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Gap Analysis & Sets */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Diamond className="w-4 h-4 text-amber-500" />
                  Phân tích Bộ sưu tập (Set Completion)
                </CardTitle>
                <CardDescription>Các sản phẩm khách hàng đã sở hữu và các món còn thiếu trong bộ.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {collectionAnalysis.length > 0 ? collectionAnalysis.map((ca, i) => (
                  <div key={i} className="bg-muted/30 p-4 rounded-xl border border-border/40">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-sm">{ca.collection}</h4>
                      <Badge variant="secondary">{ca.completionRate}% Mức độ hoàn thiện</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-emerald-500 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã sở hữu:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {ca.purchased.map(p => <Badge key={p} variant="outline" className="text-[10px] bg-background">{p}</Badge>)}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-rose-500 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Cần bổ sung:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {ca.missing.map(m => <Badge key={m} variant="outline" className="text-[10px] border-dashed text-muted-foreground">{m}</Badge>)}
                          {ca.missing.length === 0 && <span className="text-[10px] text-muted-foreground">Đã hoàn thiện bộ</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground">Chưa đủ dữ liệu để phân tích bộ sưu tập.</p>
                )}
              </CardContent>
            </Card>

            {/* Next Best Action (NBA) Engine */}
            <Card className="border-border/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Target className="w-24 h-24" />
              </div>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Mô hình Gợi ý Sản phẩm (Next Best Action)
                </CardTitle>
                <CardDescription>Các sản phẩm ưu tiên cao để mời khách mua dựa trên lịch sử mua và đặc tính cá nhân.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {productRecommendations.length > 0 ? (
                  <div className="space-y-3 relative z-10">
                    {productRecommendations.map((rec, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-xl border border-border/60 bg-background/50 hover:bg-muted/30 transition-colors">
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500">
                          <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-semibold text-foreground">{rec.product}</h4>
                            <Badge variant="outline" className="text-[10px] ml-2 shrink-0 border-emerald-500/30 text-emerald-600 bg-emerald-500/5 backdrop-blur-sm">
                              {rec.confidence}% Phù hợp
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{rec.reason}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider opacity-80">
                              {rec.type === 'cross-sell' ? 'Bán chéo' : rec.type === 'upsell' ? 'Bán thêm' : 'Phân tích thói quen'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Thuật toán đang thu thập dữ liệu để đưa ra dự đoán.</p>
                )}
              </CardContent>
            </Card>

            {/* AI Suggestion */}
            <Card className="border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Sparkles className="w-4 h-4" />
                  AI Chẩn đoán Hành vi Thời trang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hồ sơ Phong cách</h4>
                  <p className="text-sm border-l-2 border-primary/50 pl-3 py-1">
                    {aiSuggestion?.behavior || "Không có đủ dữ liệu để phân tích."}
                  </p>
                </div>
                
                {aiSuggestion && aiSuggestion.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chiến lược Tư vấn (Next Best Action)</h4>
                    <ul className="space-y-2">
                      {aiSuggestion.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 bg-background/50 p-2.5 rounded-lg border border-border/40">
                          <div className="mt-0.5"><Shirt className="w-4 h-4 text-primary" /></div>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => {
                  const toastElement = document.createElement('div');
                  toastElement.className = "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-2xl shadow-xl transition-all duration-300 bg-card border-[#2f6cf5]";
                  toastElement.innerHTML = `<div class="text-xs font-bold text-foreground">Lưu kết quả phân tích hành vi mua sắm thành công!</div>`;
                  document.body.appendChild(toastElement);
                  setTimeout(() => document.body.removeChild(toastElement), 3000);
                }}
                className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black font-bold rounded-xl shadow inline-flex items-center gap-2 hover:opacity-80 transition-all text-sm cursor-pointer border border-transparent"
              >
                <CheckCircle2 className="w-4 h-4" />
                Lưu lại
              </button>
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
