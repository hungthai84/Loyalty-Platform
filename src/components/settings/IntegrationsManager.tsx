import React, { useState } from "react";
import { 
  ShoppingCart, 
  Ticket, 
  CheckCircle2, 
  RefreshCw,
  Server,
  Settings2,
  Activity,
  Plug
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

export function IntegrationsManager() {
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
          <h3 className="text-xl font-bold font-heading tracking-tight flex items-center gap-2">
            <Plug className="w-5 h-5 text-primary" /> Kết nối Hệ thống ngoại vi
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Thiết lập đồng bộ dữ liệu giữa SEVA và các nền tảng ERP/CRM khác của doanh nghiệp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Activity className="w-4 h-4" /> Sync Logs
          </Button>
          
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger 
              render={
                <Button size="sm" className="gap-2">
                  <Settings2 className="w-4 h-4" /> Cấu hình API
                </Button>
              }
            />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cấu hình API Tích hợp</DialogTitle>
                <DialogDescription>
                  Quản lý khóa API kết nối với các hệ thống ngoại vi.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="erp-api-key">Hệ thống ERP Key</Label>
                  <Input 
                    id="erp-api-key"
                    value={configApiKeys.erp} 
                    onChange={(e) => setConfigApiKeys({...configApiKeys, erp: e.target.value})}
                    type={showKeys ? "text" : "password"} 
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="crm-api-key">Hệ thống CRM Key</Label>
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
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50 p-1">
          <TabsTrigger value="overview" className="text-xs font-bold">Tổng quan</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs font-bold">Đơn hàng (ERP)</TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs font-bold">Phiếu (CRM)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-[10px] bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <CardTitle className="font-heading text-base flex items-center justify-between">
                  Hệ thống ERP
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none gap-1 py-0.5 text-[10px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đã nối
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Lần sync cuối</p>
                    <p className="text-sm font-bold">10 phút trước</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">API Status</p>
                    <p className="text-sm font-bold text-emerald-500">Live</p>
                  </div>
                </div>
                <Input type="password" value={apiKeys.erp} readOnly className="h-8 text-[10px] font-mono bg-muted/30 border-none" />
              </CardContent>
              <CardFooter className="pt-3 border-t border-border/20">
                <Button 
                  className="w-full gap-2 text-xs font-bold" 
                  variant="secondary"
                  size="sm"
                  onClick={handleSyncOrders}
                  disabled={isSyncingOrders}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOrders ? 'animate-spin' : ''}`} />
                  {isSyncingOrders ? 'Đang sync...' : 'Đồng bộ ERP'}
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-[10px] bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                  <Ticket className="w-5 h-5" />
                </div>
                <CardTitle className="font-heading text-base flex items-center justify-between">
                  Hệ thống CRM
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none gap-1 py-0.5 text-[10px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đã nối
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Lần sync cuối</p>
                    <p className="text-sm font-bold">1 giờ trước</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">API Status</p>
                    <p className="text-sm font-bold text-emerald-500">Live</p>
                  </div>
                </div>
                <Input type="password" value={apiKeys.crm} readOnly className="h-8 text-[10px] font-mono bg-muted/30 border-none" />
              </CardContent>
              <CardFooter className="pt-3 border-t border-border/20">
                <Button 
                  className="w-full gap-2 text-xs font-bold" 
                  variant="secondary"
                  size="sm"
                  onClick={handleSyncTickets}
                  disabled={isSyncingTickets}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTickets ? 'animate-spin' : ''}`} />
                  {isSyncingTickets ? 'Đang sync...' : 'Đồng bộ CRM'}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden rounded-[10px]">
            <div className="p-4 border-b border-border/40 bg-muted/10 font-bold text-sm">
              Recent Sync Events
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-[10px] uppercase font-bold">Thời gian</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Hệ thống</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Dữ liệu</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold">Log</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-border/20">
                    <TableCell className="text-xs">10m ago</TableCell>
                    <TableCell className="text-xs font-bold">ERP Core</TableCell>
                    <TableCell className="text-xs">Orders (Auto)</TableCell>
                    <TableCell><Badge className="text-[9px] h-5 bg-emerald-500/10 text-emerald-600 border-none">Success</Badge></TableCell>
                    <TableCell className="text-right text-[10px] text-muted-foreground">+24 records</TableCell>
                  </TableRow>
                  <TableRow className="border-border/20">
                    <TableCell className="text-xs">1h ago</TableCell>
                    <TableCell className="text-xs font-bold">Zendesk</TableCell>
                    <TableCell className="text-xs">Tickets (Hook)</TableCell>
                    <TableCell><Badge className="text-[9px] h-5 bg-emerald-500/10 text-emerald-600 border-none">Success</Badge></TableCell>
                    <TableCell className="text-right text-[10px] text-muted-foreground">+5 records</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 mt-6">
          <Card className="border-border/50 bg-card rounded-[10px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead className="text-xs">Mã ĐH</TableHead>
                    <TableHead className="text-xs">Giá trị</TableHead>
                    <TableHead className="text-xs">Thời gian</TableHead>
                    <TableHead className="text-xs">Point</TableHead>
                    <TableHead className="text-right text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: "ORD-99382", val: "1,250,000 đ", time: "10:24 06/06", pts: "+125" },
                    { id: "ORD-99381", val: "850,000 đ", time: "09:15 06/06", pts: "+85" },
                    { id: "ORD-99380", val: "3,400,000 đ", time: "08:42 06/06", pts: "+340" },
                  ].map((order, i) => (
                    <TableRow key={i} className="border-border/20">
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell className="text-xs font-bold">{order.val}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{order.time}</TableCell>
                      <TableCell className="text-xs text-emerald-500 font-bold">{order.pts}</TableCell>
                      <TableCell className="text-right"><CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="tickets" className="mt-6">
           <Card className="p-8 border-dashed border-2 flex flex-col items-center justify-center text-center rounded-[10px] bg-muted/10">
              <Ticket className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu phiếu hỗ trợ CRM mới nhất trong kỳ sync này.</p>
              <Button variant="outline" size="sm" className="mt-4 text-xs font-bold" onClick={handleSyncTickets}>Thử sync lại</Button>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
