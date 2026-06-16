import React, { useState } from "react";
import { 
  ShoppingCart, 
  Ticket, 
  CheckCircle2, 
  RefreshCw,
  Server,
  Settings2,
  Activity
} from "lucide-react";
import * as motion from "motion/react-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function IntegrationsView() {
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [isSyncingTickets, setIsSyncingTickets] = useState(false);
  
  const [apiKeys, setApiKeys] = useState({
    erp: "sk_test_erp_8f92j...",
    crm: "crm_live_992kx0...",
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [configApiKeys, setConfigApiKeys] = useState({
    erp: "sk_test_erp_8f92j...",
    crm: "crm_live_992kx0...",
  });

  const handleSaveApiKeys = () => {
    setApiKeys(configApiKeys);
    setIsConfigOpen(false);
    toast.success("Đã lưu cấu hình API thành công");
  };

  const handleSyncOrders = () => {
    setIsSyncingOrders(true);
    toast.info("Đang đồng bộ đơn hàng từ hệ thống ERP...");
    
    setTimeout(() => {
      setIsSyncingOrders(false);
      toast.success("Đồng bộ thành công 124 đơn hàng mới.");
    }, 2500);
  };

  const handleSyncTickets = () => {
    setIsSyncingTickets(true);
    toast.info("Đang đồng bộ phiếu hỗ trợ từ CRM...");
    
    setTimeout(() => {
      setIsSyncingTickets(false);
      toast.success("Đồng bộ thành công 18 phiếu mới.");
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight">Tích hợp Hệ thống</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý kết nối API với các hệ thống ERP (Đơn hàng) và CRM (Phiếu hỗ trợ).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Activity className="w-4 h-4" /> Xem Logs
          </Button>
          
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger render={<Button className="gap-2" />}>
              <Settings2 className="w-4 h-4" /> Cấu hình API
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cấu hình API Tích hợp</DialogTitle>
                <DialogDescription>
                  Quản lý khóa API kết nối với các hệ thống ngoại vi. Đảm bảo bảo vệ an toàn thông tin khóa này.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="erp-api-key">Hệ thống Đơn hàng (ERP) API Key</Label>
                  <Input 
                    id="erp-api-key"
                    value={configApiKeys.erp} 
                    onChange={(e) => setConfigApiKeys({...configApiKeys, erp: e.target.value})}
                    type={showKeys ? "text" : "password"} 
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="crm-api-key">Hệ thống CRM Phiếu hỗ trợ API Key</Label>
                  <Input 
                    id="crm-api-key"
                    value={configApiKeys.crm} 
                    onChange={(e) => setConfigApiKeys({...configApiKeys, crm: e.target.value})}
                    type={showKeys ? "text" : "password"} 
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Switch 
                    id="show-keys" 
                    checked={showKeys} 
                    onCheckedChange={setShowKeys} 
                  />
                  <Label htmlFor="show-keys">Hiển thị khóa API</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Hủy</Button>
                <Button onClick={handleSaveApiKeys}>Lưu Cấu hình</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="orders">Đơn hàng (ERP)</TabsTrigger>
          <TabsTrigger value="tickets">Phiếu hỗ trợ (CRM)</TabsTrigger>
        </TabsList>
        
        {/* TAB TỔNG QUAN */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm h-full flex flex-col">
                <CardHeader>
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <CardTitle className="font-heading flex items-center justify-between">
                    Hệ thống Đơn hàng (ERP)
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đã kết nối
                    </Badge>
                  </CardTitle>
                  <CardDescription>Đồng bộ dữ liệu mua hàng và doanh thu</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Lần đồng bộ cuối</p>
                      <p className="text-sm font-medium">10 phút trước</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Trạng thái API</p>
                      <p className="text-sm font-medium text-emerald-500">Hoạt động tốt</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs text-muted-foreground">API Key</p>
                      <div className="flex items-center gap-2">
                        <Input type="password" value={apiKeys.erp} readOnly className="h-8 text-xs font-mono bg-muted/50" />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/40">
                  <Button 
                    className="w-full gap-2" 
                    variant="secondary"
                    onClick={handleSyncOrders}
                    disabled={isSyncingOrders}
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingOrders ? 'animate-spin' : ''}`} />
                    {isSyncingOrders ? 'Đang đồng bộ...' : 'Đồng bộ Đơn hàng ngay'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm h-full flex flex-col">
                <CardHeader>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <CardTitle className="font-heading flex items-center justify-between">
                    Hệ thống CRM (Phiếu)
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đã kết nối
                    </Badge>
                  </CardTitle>
                  <CardDescription>Đồng bộ dữ liệu chăm sóc khách hàng và phiếu hỗ trợ</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Lần đồng bộ cuối</p>
                      <p className="text-sm font-medium">1 giờ trước</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Trạng thái API</p>
                      <p className="text-sm font-medium text-emerald-500">Hoạt động tốt</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs text-muted-foreground">API Key / Token</p>
                      <div className="flex items-center gap-2">
                        <Input type="password" value={apiKeys.crm} readOnly className="h-8 text-xs font-mono bg-muted/50" />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/40">
                  <Button 
                    className="w-full gap-2" 
                    variant="secondary"
                    onClick={handleSyncTickets}
                    disabled={isSyncingTickets}
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingTickets ? 'animate-spin' : ''}`} />
                    {isSyncingTickets ? 'Đang đồng bộ...' : 'Đồng bộ Phiếu ngay'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
          
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="font-heading text-lg">Hoạt động đồng bộ gần đây</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Hệ thống</TableHead>
                    <TableHead>Loại dữ liệu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-sm">10 phút trước</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-muted-foreground" />
                        ERP Core
                      </div>
                    </TableCell>
                    <TableCell>Đơn hàng (Auto-sync)</TableCell>
                    <TableCell><Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">Thành công</Badge></TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">+24 bản ghi</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">1 giờ trước</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-muted-foreground" />
                        Zendesk CRM
                      </div>
                    </TableCell>
                    <TableCell>Phiếu hỗ trợ (Webhook)</TableCell>
                    <TableCell><Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">Thành công</Badge></TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">+5 bản ghi</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-sm">3 giờ trước</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-muted-foreground" />
                        ERP Core
                      </div>
                    </TableCell>
                    <TableCell>Đơn hàng (Auto-sync)</TableCell>
                    <TableCell><Badge variant="outline" className="text-rose-500 border-rose-500/20 bg-rose-500/10">Lỗi kết nối</Badge></TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">Timeout ERP</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB ĐƠN HÀNG */}
        <TabsContent value="orders" className="space-y-6 mt-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
              <div>
                <CardTitle className="font-heading text-lg">Lịch sử Đơn hàng Sync (ERP)</CardTitle>
                <CardDescription>Dữ liệu đơn hàng mới nhất được đẩy về từ hệ thống ERP</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleSyncOrders} disabled={isSyncingOrders}>
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isSyncingOrders ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã ĐH</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Điểm cộng</TableHead>
                    <TableHead className="text-right">Trạng thái Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: "ORD-99382", cus: "Nguyễn Văn A", val: "1,250,000 ₫", time: "10:24 06/06/2026", pts: "+125 pts" },
                    { id: "ORD-99381", cus: "Trần Thị B", val: "850,000 ₫", time: "09:15 06/06/2026", pts: "+85 pts" },
                    { id: "ORD-99380", cus: "Lê Văn C", val: "3,400,000 ₫", time: "08:42 06/06/2026", pts: "+340 pts" },
                    { id: "ORD-99379", cus: "Phạm D", val: "450,000 ₫", time: "18:20 05/06/2026", pts: "+45 pts" },
                    { id: "ORD-99378", cus: "Hoàng E", val: "5,200,000 ₫", time: "16:10 05/06/2026", pts: "+520 pts" },
                  ].map((order, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium font-mono text-xs">{order.id}</TableCell>
                      <TableCell>{order.cus}</TableCell>
                      <TableCell>{order.val}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{order.time}</TableCell>
                      <TableCell className="font-bold text-emerald-500 text-xs">{order.pts}</TableCell>
                      <TableCell className="text-right">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB PHIẾU HỖ TRỢ */}
        <TabsContent value="tickets" className="space-y-6 mt-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
              <div>
                <CardTitle className="font-heading text-lg">Lịch sử Phiếu hỗ trợ (CRM)</CardTitle>
                <CardDescription>Phiếu phản ánh của khách hàng mới nhất liên kết với điểm Loyalty</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleSyncTickets} disabled={isSyncingTickets}>
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isSyncingTickets ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã Phiếu</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động CRM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: "TCK-1045", cus: "Nguyễn Văn A", subject: "Lỗi không nhận được điểm sau khi mua", status: "Đang xử lý", action: "Đợi kiểm tra" },
                    { id: "TCK-1044", cus: "Trần Thị C", subject: "Sinh nhật không nhận được voucher", status: "Hoàn tất", action: "Đã cộng bù" },
                    { id: "TCK-1043", cus: "Lê Tuấn", subject: "Không đăng nhập được app", status: "Hoàn tất", action: "Đã Reset mật khẩu" },
                  ].map((ticket, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium font-mono text-xs">{ticket.id}</TableCell>
                      <TableCell>{ticket.cus}</TableCell>
                      <TableCell className="truncate max-w-[250px] text-sm">{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          ticket.status === "Hoàn tất" 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{ticket.action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
