import { Badge } from "@/components/ui/badge";
import { ArrowDown, Clock, Filter, Gift, Mail, MessageSquare, MoveRight, Play, Plus, Zap, AlertCircle, Copy, Trash2, History as HistoryIcon, Paintbrush } from "lucide-react";
import * as motion from "motion/react-client";
import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type GraphNode = { id: string; type: string; title: string };
type GraphEdge = { from: string; to: string };

function validateWorkflow(nodes: GraphNode[], edges: GraphEdge[]) {
  const connectedNodeIds = new Set<string>();
  
  const triggers = nodes.filter(n => n.type === 'trigger');
  if (triggers.length === 0) return { valid: false, error: 'No trigger node found. Workflows must start with a trigger.' };
  
  const queue = [...triggers];
  
  while(queue.length > 0) {
    const current = queue.shift()!;
    connectedNodeIds.add(current.id);
    
    const outEdges = edges.filter(e => e.from === current.id);
    for (const edge of outEdges) {
      if (!connectedNodeIds.has(edge.to)) {
        const nextNode = nodes.find(n => n.id === edge.to);
        if (nextNode) {
          queue.push(nextNode);
          connectedNodeIds.add(nextNode.id);
        }
      }
    }
  }
  
  const orphaned = nodes.filter(n => !connectedNodeIds.has(n.id));
  if (orphaned.length > 0) {
    return { valid: false, error: `Detected ${orphaned.length} orphaned/disconnected node(s) (e.g., '${orphaned[0].title}'). All branches must be connected.` };
  }
  
  return { valid: true };
}

export function MarketingView() {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedNodeIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedNodeIds(new Set([id]));
    }
  };

  const handleCanvasClick = () => {
    setSelectedNodeIds(new Set());
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only pan on middle mouse button, or if target is the canvas background
    if (e.button !== 1 && (e.target as HTMLElement).closest('.node-element')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      setScale(s => Math.min(Math.max(0.2, s + delta), 2));
    } else {
      // Optional: pan with scroll
      setPosition(p => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY
      }));
    }
  };

  const handleActivate = () => {
    // Mocking an invalid graph structure to demonstrate the traversal detection
    const mockNodes: GraphNode[] = [
      { id: 'trigger_1', type: 'trigger', title: 'Kích hoạt: Sinh nhật' },
      { id: 'condition_1', type: 'condition', title: 'Điều kiện' },
      { id: 'action_1', type: 'action', title: 'Gửi Email VIP' },
      { id: 'action_2', type: 'action', title: 'Cộng điểm thưởng' },
      { id: 'action_3', type: 'action', title: 'Gửi Email thường' },
      { id: 'action_4', type: 'action', title: 'SMS bị ngắt kết nối' }, // Intentional orphaned node
    ];
    
    const mockEdges: GraphEdge[] = [
      { from: 'trigger_1', to: 'condition_1' },
      { from: 'condition_1', to: 'action_1' },
      { from: 'action_1', to: 'action_2' },
      { from: 'condition_1', to: 'action_3' }
      // Missing connection to action_4
    ];

    const result = validateWorkflow(mockNodes, mockEdges);
    setValidationError(result.valid ? null : result.error!);
  };

  const handleRevert = (version: string) => {
    toast(`Đã khôi phục quy trình về ${version}`, {
      description: "Mọi thay đổi chưa lưu đã được hủy bỏ.",
    });
  };

  return (
    <Tabs defaultValue="builder" className="flex-1 h-[calc(100vh-64px)] flex flex-col p-8 pt-6 overflow-hidden max-h-screen">
      <div className="flex items-center justify-between pb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading">Tự động hóa Tiếp thị</h2>
          <p className="text-muted-foreground text-sm mt-1">Thiết kế quy trình hành trình khách hàng và các trình kích hoạt tự động.</p>
        </div>
        <div className="flex items-center space-x-4">
          <TabsList>
            <TabsTrigger value="builder"><Paintbrush className="w-4 h-4 mr-2"/> Trình thiết kế</TabsTrigger>
            <TabsTrigger value="history"><HistoryIcon className="w-4 h-4 mr-2"/> Lịch sử phiên bản</TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors bg-card">
              Mẫu quy trình
            </button>
            <button 
              onClick={handleActivate}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              Kích hoạt Quy trình
            </button>
          </div>
        </div>
      </div>

      <TabsContent value="builder" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col border-none outline-none">
        {validationError && (
          <Alert variant="destructive" className="mb-6 shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi xác thực</AlertTitle>
            <AlertDescription>
              {validationError}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 flex gap-8 overflow-hidden h-full pb-8">
        {/* Sidebar: Node Palette */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto shrink-0 pr-4 pb-12 no-scrollbar">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-heading">Trình kích hoạt</h3>
            <div className="space-y-2">
              <NodeItem icon={<Zap className="w-4 h-4 text-amber-500" />} label="Đã mua hàng" />
              <NodeItem icon={<Gift className="w-4 h-4 text-emerald-500" />} label="Sinh nhật khách hàng" />
              <NodeItem icon={<Filter className="w-4 h-4 text-blue-500" />} label="Đã nâng hạng" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-heading">Điều kiện</h3>
            <div className="space-y-2">
              <NodeItem icon={<Clock className="w-4 h-4 text-slate-500" />} label="Độ trễ thời gian" />
              <NodeItem icon={<Filter className="w-4 h-4 text-purple-500" />} label="Nhánh Nếu / Thì" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-heading">Hành động</h3>
            <div className="space-y-2">
              <NodeItem icon={<Mail className="w-4 h-4 text-blue-500" />} label="Gửi Email" />
              <NodeItem icon={<MessageSquare className="w-4 h-4 text-green-500" />} label="Gửi SMS" />
              <NodeItem icon={<Plus className="w-4 h-4 text-rose-500" />} label="Cộng điểm" />
            </div>
          </div>
        </div>

        {/* Canvas: Workflow Builder bg-[#FAFAFA] */}
        <div 
          className="flex-1 bg-card rounded-2xl border border-border shadow-sm relative flex flex-col items-center pt-16 pb-24 overflow-hidden w-full select-none cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        >
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-background border border-border p-1 rounded-lg shadow-sm">
            <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-1.5 hover:bg-muted rounded-md"><Plus className="w-4 h-4" /></button>
            <div className="w-full h-px bg-border"></div>
            <button onClick={() => setScale(s => Math.max(s - 0.1, 0.2))} className="p-1.5 hover:bg-muted rounded-md"><ArrowDown className="w-4 h-4" style={{ transform: 'rotate(90deg)' }} /></button>
          </div>

          {/* Floating Action Bar */}
          {selectedNodeIds.size > 0 && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-4 py-3 rounded-full shadow-lg border border-border flex items-center gap-4 z-50 pointer-events-auto"
            >
              <span className="text-sm font-medium pr-3 border-r border-border">Đã chọn {selectedNodeIds.size}</span>
              <button className="text-sm flex items-center hover:text-primary transition-colors"><Copy className="w-4 h-4 mr-2"/> Nhóm</button>
              <button className="text-sm flex items-center text-destructive hover:text-destructive/80 transition-colors"><Trash2 className="w-4 h-4 mr-2"/> Xóa</button>
            </motion.div>
          )}

          <div 
            className="flex flex-col items-center origin-center transition-transform duration-75"
            style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}
          >
            {/* Grid Background pattern (Optional: moved relative to pan if infinite, or fixed. Let's make it fixed and infinite) */}
            <div className="absolute inset-[-1000px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div>
          
            {/* Sample Workflow */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-4 mt-8">
              
              <div className="node-element w-full flex justify-center">
                <WorkflowNode 
                  id="trigger_1"
                  icon={<Gift className="w-5 h-5 text-emerald-500" />}
                  title="Kích hoạt: Sinh nhật"
                  description="Kích hoạt vào ngày sinh nhật khách hàng lúc 09:00 sáng"
                  type="trigger"
                  selected={selectedNodeIds.has('trigger_1')}
                  onClick={handleNodeClick}
                />
              </div>

              <ArrowConnector />

              <div className="node-element w-full flex justify-center">
                <WorkflowNode 
                  id="condition_1"
                  icon={<Filter className="w-5 h-5 text-purple-500" />}
                  title="Điều kiện"
                  description="Hạng là Bạch kim hay Kim cương?"
                  type="condition"
                  selected={selectedNodeIds.has('condition_1')}
                  onClick={handleNodeClick}
                />
              </div>

            {/* Split Lines Container */}
            <div className="relative w-full flex justify-center h-8">
              {/* Horizontal Line connecting branches */}
              <div className="absolute top-4 w-72 h-px bg-border"></div>
              {/* Vertical line originating from node */}
              <div className="absolute top-0 w-px h-4 bg-border"></div>
            </div>

            <div className="flex items-start gap-8 w-full justify-center">
              {/* TRUE Branch */}
              <div className="flex flex-col items-center w-64">
                <div className="w-px h-4 bg-border"></div>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none mb-2 font-medium">Đúng</Badge>
                <div className="w-px h-4 bg-border"></div>
                <ArrowDown className="w-4 h-4 text-border mb-1 -mt-1" />

                <WorkflowNode 
                  id="action_1"
                  icon={<Mail className="w-5 h-5 text-blue-500" />}
                  title="Gửi Email VIP"
                  description="Mẫu: 'Sinh nhật VIP Đặc biệt'"
                  type="action"
                  selected={selectedNodeIds.has('action_1')}
                  onClick={handleNodeClick}
                />

                <ArrowConnector />

                <WorkflowNode 
                  id="action_2"
                  icon={<Plus className="w-5 h-5 text-rose-500" />}
                  title="Cộng điểm thưởng"
                  description="5,000 Điểm, hạn dùng 30 ngày"
                  type="action"
                  selected={selectedNodeIds.has('action_2')}
                  onClick={handleNodeClick}
                />
              </div>

              {/* FALSE Branch */}
              <div className="flex flex-col items-center w-64">
                 <div className="w-px h-4 bg-border"></div>
                 <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-none mb-2 font-medium">Sai</Badge>
                 <div className="w-px h-4 bg-border"></div>
                 <ArrowDown className="w-4 h-4 text-border mb-1 -mt-1" />

                <WorkflowNode 
                  id="action_3"
                  icon={<Mail className="w-5 h-5 text-blue-500" />}
                  title="Gửi Email Thường"
                  description="Mẫu: 'Chúc mừng sinh nhật'"
                  type="action"
                  selected={selectedNodeIds.has('action_3')}
                  onClick={handleNodeClick}
                />
              </div>
            </div>

            {/* Add Node Button placeholder at the end of longest branch */}
            <div className="w-full relative mt-8 flex justify-center pr-32">
              <button className="w-10 h-10 -ml-40 rounded-full bg-background border border-dashed border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shadow-sm cursor-pointer z-20">
                 <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Orphaned Node Simulation */}
            <div className="absolute top-32 -right-16 w-64 opacity-60">
                <WorkflowNode 
                  id="action_4"
                  icon={<MessageSquare className="w-5 h-5 text-rose-500" />}
                  title="SMS bị ngắt kết nối"
                  description="Nút này chưa có kết nối đầu vào."
                  type="action"
                  selected={selectedNodeIds.has('action_4')}
                  onClick={handleNodeClick}
                />
            </div>

          </div>
        </div>
      </div>
    </div>
      </TabsContent>

      <TabsContent value="history" className="flex-1 overflow-y-auto m-0 p-8 h-full min-h-0 border-none outline-none">
        <div className="max-w-4xl space-y-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold">Kích hoạt gần đây</h3>
            </div>
            <div className="divide-y divide-border">
              {/* Mock history items */}
              <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5"><Clock className="w-5 h-5 text-emerald-500" /></div>
                  <div>
                    <h4 className="font-medium text-foreground">Phiên bản hiện tại (Đang hoạt động)</h4>
                    <p className="text-sm text-muted-foreground mt-1">Sửa đổi bởi admin@sevacrm.com</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-sm text-muted-foreground">Vừa xong</span>
                  <Badge variant="outline" className="mt-2 bg-emerald-500/10 text-emerald-600 border-none">Đang hoạt động</Badge>
                </div>
              </div>
              
              <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors opacity-80">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5"><HistoryIcon className="w-5 h-5 text-muted-foreground" /></div>
                  <div>
                    <h4 className="font-medium text-foreground">v2.1 - Cập nhật mẫu Email</h4>
                    <p className="text-sm text-muted-foreground mt-1">Sửa đổi bởi jsnow@sevacrm.com</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-sm text-muted-foreground">3 ngày trước</span>
                  <button onClick={() => handleRevert('v2.1 - Cập nhật mẫu Email')} className="mt-2 text-sm text-primary hover:underline font-medium">Khôi phục phiên bản này</button>
                </div>
              </div>

              <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors opacity-80">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5"><HistoryIcon className="w-5 h-5 text-muted-foreground" /></div>
                  <div>
                    <h4 className="font-medium text-foreground">v2.0 - Thêm hành động Cộng điểm</h4>
                    <p className="text-sm text-muted-foreground mt-1">Sửa đổi bởi admin@sevacrm.com</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-sm text-muted-foreground">1 tuần trước</span>
                  <button onClick={() => handleRevert('v2.0 - Thêm hành động Cộng điểm')} className="mt-2 text-sm text-primary hover:underline font-medium">Khôi phục phiên bản này</button>
                </div>
              </div>

              <div className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors opacity-80">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5"><HistoryIcon className="w-5 h-5 text-muted-foreground" /></div>
                  <div>
                    <h4 className="font-medium text-foreground">v1.0 - Xuất bản lần đầu</h4>
                    <p className="text-sm text-muted-foreground mt-1">Sửa đổi bởi admin@sevacrm.com</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-sm text-muted-foreground">1 năm trước</span>
                  <button onClick={() => handleRevert('v1.0 - Xuất bản lần đầu')} className="mt-2 text-sm text-primary hover:underline font-medium">Khôi phục phiên bản này</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function NodeItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl shadow-sm cursor-grab hover:border-primary/50 transition-colors">
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
      <MoveRight className="w-4 h-4 ml-auto text-muted-foreground/30" />
    </div>
  );
}

function WorkflowNode({ id, icon, title, description, type, outputs, selected, onClick }: { id: string, icon: React.ReactNode, title: string, description: string, type: 'trigger' | 'action' | 'condition', outputs?: number, selected?: boolean, onClick?: (e: React.MouseEvent, id: string) => void }) {
  const borderColors = {
    trigger: 'border-emerald-500/30',
    action: 'border-blue-500/30',
    condition: 'border-purple-500/30'
  };
  
  const hasInput = type !== 'trigger';
  const hasOutput = true;
  const numOutputs = outputs ?? (type === 'condition' ? 2 : 1);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`node-element w-full bg-background rounded-xl border-2 ${selected ? 'border-primary ring-1 ring-primary' : borderColors[type]} shadow-sm p-4 relative z-20 group hover:shadow-md transition-shadow cursor-pointer`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => onClick?.(e, id)}
    >
      {hasInput && (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-background border-2 border-muted-foreground/40 rounded-full z-30" />
      )}

      <div className="flex items-start gap-3">
        <div className="mt-1 bg-muted p-2 rounded-lg">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-sm text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>

      {hasOutput && (
        <div className="absolute -bottom-1.5 left-0 w-full flex justify-center z-30" style={{ gap: numOutputs > 1 ? '3rem' : '0' }}>
          {Array.from({ length: numOutputs }).map((_, i) => (
            <div key={i} className={`w-3 h-3 bg-background border-2 border-muted-foreground/40 rounded-full ${numOutputs > 1 && i === 0 ? 'border-emerald-500/50' : numOutputs > 1 && i === 1 ? 'border-slate-500/50' : ''}`} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ArrowConnector() {
  return (
    <div className="flex flex-col items-center z-10 w-full relative">
      <div className="w-px h-8 bg-border"></div>
      <ArrowDown className="w-4 h-4 text-border absolute top-6" />
    </div>
  );
}
