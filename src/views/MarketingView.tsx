import { Badge } from "@/components/ui/badge";
import { 
  ArrowDown, 
  Clock, 
  Filter, 
  Gift, 
  Mail, 
  MessageSquare, 
  MoveRight, 
  Play, 
  Plus, 
  Zap, 
  AlertCircle, 
  Copy, 
  Trash2, 
  History as HistoryIcon, 
  Paintbrush, 
  ListRestart, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Settings,
  Smartphone, 
  Send, 
  Volume2, 
  Sparkles, 
  Laptop,
  Check,
  Edit2
} from "lucide-react";
import * as motion from "motion/react-client";
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";

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

// Simulated premium customers for fallback
const STATIC_VIP_CUSTOMERS = [
  { id: "vip-1", name: "Thái Hồng Hưng", email: "hungthai84@gmail.com", phone: "0908123456", points: 15400, segment: "Atelier (Cực Cao)" },
  { id: "vip-2", name: "Nguyễn Hương Giang", email: "giang.nguyen@atelier.vn", phone: "0912987654", points: 8300, segment: "Icon (Cao)" },
  { id: "vip-3", name: "Trần Minh Quân", email: "quan.tm@essential.com", phone: "0988776655", points: 3200, segment: "Essential (Vừa)" },
];

export function MarketingView() {
  const { user } = useFirebase();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Real-time fetched customers
  const [dbCustomers, setDbCustomers] = useState<any[]>([]);

  // Marketing Automation Campaign rules list (with template details)
  const [campaignRules, setCampaignRules] = useState([
    { id: 'rule-1', name: 'Chúc mừng Sinh nhật', trigger: 'Ngày sinh nhật', action: 'SMS', template: 'Chào quý khách {customer_name}! Atelier gửi lời chúc mừng tuổi mới đầy tài lộc tới quý khách. Món quà bồi đắp 5,000 điểm đã được tự động cộng vào tài khoản VIP của quý khách. Cảm ơn quý khách đã gắn bó.', status: 'active', usage: 452, trend: '+12%' },
    { id: 'rule-2', name: 'Khích lệ Khách hàng trễ hạn', trigger: '90 ngày không giao dịch', action: 'Zalo', template: 'Yêu thương gửi trao! Atelier nhớ quý khách {customer_name}. Thân gửi mã VIP Voucher giảm giá ngay 20% cho BST Thượng Vy mới nhất. Hãy ghé showroom sớm nhé!', status: 'active', usage: 128, trend: '+5%' },
    { id: 'rule-3', name: 'Nâng hạng Kim cương', trigger: 'Đạt 10,000 điểm', action: 'Email', template: 'Thư mời độc quyền: Chào mừng Thành Viên Kim Cương {customer_name}! Quý khách đã mở khóa thành công quyền truy cập phòng chờ thương gia sân bay toàn cầu cùng ưu đãi dặm mua sắm nhân đôi.', status: 'active', usage: 34, trend: 'stable' },
    { id: 'rule-4', name: 'Chào mừng thành viên mới', trigger: 'Đăng ký tài khoản', action: 'Email', template: 'Chào mừng {customer_name} gia nhập cộng đồng VIP Club. Ưu đãi chiết khấu 10% cho đơn hàng đầu tiên đã sẵn sàng kích hoạt trong ví ứng dụng của quý khách.', status: 'paused', usage: 670, trend: '-2%' },
  ]);

  // Create campaign dialog states
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [newCamName, setNewCamName] = useState("");
  const [newCamTrigger, setNewCamTrigger] = useState("Đăng ký tài khoản");
  const [newCamAction, setNewCamAction] = useState("SMS");
  const [newCamTemplate, setNewCamTemplate] = useState("Chào {customer_name}! Thân tặng ưu đãi đặc quyền từ câu lạc bộ thành viên của bạn.");

  // Simulation & Smartphone Sandbox states
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(0);
  const [selectedRuleId, setSelectedRuleId] = useState("rule-1");
  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState(false);
  const [smsHasDispatched, setSmsHasDispatched] = useState(false);
  const [sentAlertMessage, setSentAlertMessage] = useState("");
  const [customAudioTriggered, setCustomAudioTriggered] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<any[]>([]);

  // Fetch real customers if connected to Firebase database
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/customers`), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDbCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});
    return unsub;
  }, [user]);

  // Combined real database list and static Fallbacks
  const availableVips = dbCustomers.length > 0 ? dbCustomers : STATIC_VIP_CUSTOMERS;

  // SendGrid Custom Email States
  const [sgApiKey, setSgApiKey] = useState("");
  const [sgFromEmail, setSgFromEmail] = useState("vip@seva-atelier.com");
  const [sgFromName, setSgFromName] = useState("Atelier Luxury Club");
  const [sgToEmail, setSgToEmail] = useState(user?.email || "hungthai84@gmail.com");
  const [sgSubject, setSgSubject] = useState("✨ Quà Tặng Sinh Nhật Đặc Quyền: Chúc Mừng Sinh Nhật Quý Hội Viên!");
  const [sgGreetingText, setSgGreetingText] = useState(
    "Chúc mừng ngày sinh nhật của bạn! Atelier thân gửi tới bạn những lời chúc mừng thăng hoa nhất. Như một món quà bồi đắp tri ân, chúng tôi đã tự động gửi tặng mã ưu đãi đặc quyền trị giá 5.000 điểm tích lũy cùng mã giảm giá BST Thượng Vy hoàn toàn miễn phí."
  );
  const [sgVoucherCode, setSgVoucherCode] = useState("BDAYVIP5000");
  const [sgTheme, setSgTheme] = useState<"gold_luxury" | "royal_deco" | "minimal">("gold_luxury");
  const [isSendingSgTest, setIsSendingSgTest] = useState(false);
  const [showSgHelpModal, setShowSgHelpModal] = useState(false);

  const getSgHtmlPreview = () => {
    const greetingHtml = sgGreetingText.replace(/\n/g, "<br />");
    if (sgTheme === "gold_luxury") {
      return `
        <div style="font-family: sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 2px solid #d4af37; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.15);">
          <div style="text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 25px; margin-bottom: 30px;">
            <h1 style="color: #d4af37; font-size: 26px; letter-spacing: 3px; margin: 0 0 10px 0; text-transform: uppercase;">ATELIER HAUTE JOAILLERIE</h1>
            <p style="color: #9ca3af; font-size: 11px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">The Elite Loyalty Circle</p>
          </div>
          <div style="padding: 10px 20px; text-align: center;">
            <p style="color: #d4af37; font-size: 13px; font-style: italic; margin-bottom: 25px; letter-spacing: 1px;">Kính gửi Quý Khách,</p>
            <h2 style="font-size: 22px; color: #ffffff; margin-bottom: 20px; font-weight: 300; line-height: 1.4;">Đặc Quyền Tuổi Mới - Thăng Hoa Thịnh Vượng</h2>
            <div style="font-size: 14px; line-height: 1.8; color: #d1d5db; margin-bottom: 35px; text-align: justify;">
              ${greetingHtml}
            </div>
            <div style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); border: 1px dashed #d4af37; padding: 25px; border-radius: 12px; margin-bottom: 40px; text-align: center;">
              <span style="display: block; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Mã Ưu Đãi Sinh Nhật Độc Quyền</span>
              <strong style="display: block; font-size: 24px; color: #d4af37; font-family: monospace; letter-spacing: 3px; font-weight: bold; margin-bottom: 12px;">${sgVoucherCode}</strong>
              <span style="font-size: 11px; color: #9ca3af; display: block;">Mã có hiệu lực trong 30 ngày • Miễn phí vận chuyển toàn quốc</span>
            </div>
            <a href="#" style="background-color: #d4af37; color: #0b0f19; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Kích Hoạt Đặc Quyền VIP</a>
          </div>
          <div style="margin-top: 45px; padding-top: 25px; border-top: 1px solid rgba(212, 175, 55, 0.2); text-align: center; font-size: 10px; color: #6b7280; line-height: 1.6;">
            Trân trọng gửi chúc,<br />
            <strong>Ban Quản Trị Atelier Haute Club</strong><br />
            Showroom Trung Tâm & Lounge VIP sảnh sâm panh • Hotline hỗ trợ 1900-SEVAGO
          </div>
        </div>
      `;
    } else if (sgTheme === "royal_deco") {
      return `
        <div style="font-family: Georgia, serif; background-color: #fffdec; color: #1e293b; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 3px double #1e3a8a; box-shadow: 0 4px 15px rgba(30, 58, 138, 0.08);">
          <div style="text-align: center; border-bottom: 2px double #1e3a8a; padding-bottom: 20px; margin-bottom: 25px;">
            <span style="font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px;">ROYAL DECO SEVA</span>
            <div style="font-size: 10px; color: #475569; letter-spacing: 1px; margin-top: 5px;">EXCLUSIVE LUXURY RELATIONS</div>
          </div>
          <div style="padding: 10px 15px; text-align: center;">
            <h3 style="font-size: 20px; color: #1e3a8a;">Chúc Mừng Sinh Nhật Thành viên VIP!</h3>
            <p style="font-size: 13px; line-height: 1.7; color: #334155; margin: 20px 0; text-align: justify;">
              ${greetingHtml}
            </p>
            <div style="background-color: #1e3a8a; color: #fffdec; padding: 20px; margin: 30px auto; max-width: 320px; border-radius: 8px; text-align: center;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block;">MÃ QUÀ SANG TRỌNG</span>
              <strong style="font-size: 22px; font-weight: bold; font-family: monospace; margin-top: 5px; letter-spacing: 2px; display: block;">${sgVoucherCode}</strong>
            </div>
          </div>
          <div style="text-align: center; font-size: 10px; color: #64748b; margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 20px; line-height: 1.5;">
            Cảm ơn quý hội viên đã chọn Seva làm bạn đồng hành trọn đời.<br />
            Phòng Dịch Vụ Khách Hàng Thượng Lưu Seva Services.
          </div>
        </div>
      `;
    } else {
      return `
        <div style="font-family: sans-serif; color: #111827; background-color: #f9fafb; padding: 30px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="font-size: 20px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px;">Đặc Quyền Sinh Nhật Hội Viên</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #374151;">
            ${greetingHtml}
          </p>
          <div style="background-color: #f3f4f6; border-left: 4px solid #2f6cf5; padding: 15px; margin: 25px 0;">
            <span style="font-size: 11px; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 4px;">Mã Ưu Đãi</span>
            <strong style="font-size: 18px; font-weight: bold; font-family: monospace; color: #2f6cf5;">${sgVoucherCode}</strong>
          </div>
          <div style="font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 30px;">
            Đây là email tự động gửi từ hệ thống loyalty SEVA CRM.
          </div>
        </div>
      `;
    }
  };

  const handleSendSendGridTest = async () => {
    setIsSendingSgTest(true);
    const toastId = toast.loading("Đang thiết lập kết nối tới SendGrid API...");
    try {
      const response = await fetch("/api/sendgrid/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: sgApiKey,
          fromEmail: sgFromEmail,
          fromName: sgFromName,
          toEmail: sgToEmail,
          subject: sgSubject,
          htmlContent: getSgHtmlPreview()
        })
      });

      const resData = await response.json().catch(() => ({}));
      if (response.ok && resData.success) {
        toast.success(resData.message || "Gửi email SendGrid thành công!", { id: toastId });
        setSimulatedLogs(prev => [{
          time: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
          customerName: "Test Recipient",
          campaignName: "SendGrid Birthday",
          channel: "Email",
          status: "Đã phân phát",
          preview: sgSubject.substring(0, 40) + "..."
        }, ...prev]);
      } else {
        toast.error(resData.message || "Không thể truyền phát qua SendGrid API", { id: toastId });
        setShowSgHelpModal(true);
      }
    } catch (err: any) {
      toast.error(`Lỗi kết nối API: ${err.message}`, { id: toastId });
    } finally {
      setIsSendingSgTest(false);
    }
  };

  const handleSimulateLocalDispatch = () => {
    const toastId = toast.loading("Mô phỏng gửi tin...");
    setTimeout(() => {
      toast.success("Sandbox Simulator: Sinh nhật của Thai Hong Hung đã kích hoạt gửi Email SendGrid thành công (Giả lập)!", { id: toastId });
      setSimulatedLogs(prev => [{
        time: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
        customerName: "Thái Hồng Hưng",
        campaignName: "SendGrid Birthday",
        channel: "Email (Sim)",
        status: "Đã phân phát",
        preview: sgSubject.substring(0, 40) + "..."
      }, ...prev]);
    }, 1000);
  };

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
      setPosition(p => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY
      }));
    }
  };

  const handleActivate = () => {
    const mockNodes: GraphNode[] = [
      { id: 'trigger_1', type: 'trigger', title: 'Kích hoạt: Sinh nhật' },
      { id: 'condition_1', type: 'condition', title: 'Điều kiện' },
      { id: 'action_1', type: 'action', title: 'Gửi Email VIP' },
      { id: 'action_2', type: 'action', title: 'Cộng điểm thưởng' },
      { id: 'action_3', type: 'action', title: 'Gửi Email thường' },
      { id: 'action_4', type: 'action', title: 'SMS bị ngắt kết nối' },
    ];
    
    const mockEdges: GraphEdge[] = [
      { from: 'trigger_1', to: 'condition_1' },
      { from: 'condition_1', to: 'action_1' },
      { from: 'action_1', to: 'action_2' },
      { from: 'condition_1', to: 'action_3' }
    ];

    const result = validateWorkflow(mockNodes, mockEdges);
    setValidationError(result.valid ? null : result.error!);
    if (result.valid) {
      toast.success("Toàn bộ quy trình đã vượt qua kiểm chứng mạng lưới!");
    } else {
      toast.error("Có nút chưa liên kết trong trình thiết kế sơ đồ.");
    }
  };

  const handleRevert = (version: string) => {
    toast(`Đã khôi phục quy trình về ${version}`, {
      description: "Mọi thay đổi chưa lưu đã được hủy bỏ.",
    });
  };

  // Switch Rule Status toggle helper
  const toggleRuleStatus = (id: string) => {
    setCampaignRules(prev => prev.map(rule => {
      if (rule.id === id) {
        const nextStatus = rule.status === 'active' ? 'paused' : 'active';
        toast.info(`Quy tắc '${rule.name}' hiện ở trạng thái: ${nextStatus === 'active' ? 'Hoạt động' : 'Tạm dừng'}`);
        return { ...rule, status: nextStatus };
      }
      return rule;
    }));
  };

  // Add rule submit handler
  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamName.trim()) {
      toast.error("Tên chiến dịch không được để lãng phí!");
      return;
    }

    const newCampaign = {
      id: `rule-${Date.now()}`,
      name: newCamName,
      trigger: newCamTrigger,
      action: newCamAction,
      template: newCamTemplate,
      status: 'active',
      usage: 0,
      trend: 'mới tạo'
    };

    setCampaignRules(prev => [newCampaign, ...prev]);
    toast.success("Tạo tự động hóa tiếp thị thành công!", {
      description: "Quy tắc tự động đã nhảy vào danh sách đợi."
    });
    setNewRuleOpen(false);
    // Reset fields
    setNewCamName("");
    setNewCamTemplate("Chào {customer_name}! Thân tặng ưu đãi đặc quyền từ câu lạc bộ thành viên của bạn.");
  };

  // Simulated Dispatch triggers
  const executeSimulationDispatch = () => {
    if (availableVips.length === 0) return;
    const targetCus = availableVips[selectedCustomerIndex];
    const targetRule = campaignRules.find(r => r.id === selectedRuleId);
    
    if (!targetRule) {
      toast.error("Cần chọn một quy tắc để tiến hành mô phỏng!");
      return;
    }

    setIsSimulatingDispatch(true);
    setSmsHasDispatched(false);
    setCustomAudioTriggered(false);

    // Dynamic replacement in template
    const placeholderReplaced = targetRule.template
      .replace(/{customer_name}/g, targetCus.name)
      .replace(/{points}/g, (targetCus.points || 0).toLocaleString("vi-VN"));

    setTimeout(() => {
      setSentAlertMessage(placeholderReplaced);
      setIsSimulatingDispatch(false);
      setSmsHasDispatched(true);
      setCustomAudioTriggered(true);

      // Play soft browser notification beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high chime note-A5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (err) {
        // silent if blocked
      }

      // Record logs
      const logItem = {
        time: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
        customerName: targetCus.name,
        campaignName: targetRule.name,
        channel: targetRule.action,
        status: "Đã phân phát",
        preview: placeholderReplaced.substring(0, 40) + "..."
      };
      setSimulatedLogs(prev => [logItem, ...prev]);

      toast.success(`Mô phỏng: Đã kích hoạt [${targetRule.action}] tới ${targetCus.name} thành công!`);
    }, 1200);
  };

  return (
    <Tabs defaultValue="automations" className="flex-1 h-[calc(100vh-64px)] flex flex-col p-8 pt-6 overflow-hidden max-h-screen">
      <div className="flex items-center justify-between pb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading">Tự động hóa Tiếp thị</h2>
          <p className="text-muted-foreground text-sm mt-1">Cấu hình và theo dõi các kịch bản gửi tin/ưu đãi tự động tới khách hàng VIP.</p>
        </div>
        <div className="flex items-center space-x-4">
          <TabsList>
            <TabsTrigger value="automations"><ListRestart className="w-4 h-4 mr-2"/> Quy tắc tự động</TabsTrigger>
            <TabsTrigger value="sendgrid"><Mail className="w-4 h-4 mr-2"/> SendGrid Email</TabsTrigger>
            <TabsTrigger value="history"><HistoryIcon className="w-4 h-4 mr-2"/> Lịch sử phiên bản</TabsTrigger>
          </TabsList>
        </div>
      </div>


      <TabsContent value="automations" className="flex-1 overflow-y-auto m-0 p-8 h-full min-h-0 border-none outline-none custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs group hover:border-[#2f6cf5]/30 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xl font-black font-mono">{campaignRules.filter(r => r.status === 'active').length}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Đang hoạt động</div>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] border-emerald-500/20 bg-emerald-500/5 text-emerald-600">Ổn định</Badge>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs group hover:border-amber-500/30 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xl font-black font-mono">1,348</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Lần Kích Hoạt</div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-500 font-bold">+18.4%</span>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs group hover:border-blue-500/30 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-xl font-black font-mono">89.4%</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Đọc Tin Nhắn</div>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] border-blue-500/25 bg-blue-500/5 text-blue-500">Zalo/SMS</Badge>
            </div>

            <div className="bg-card p-5 rounded-2xl border border-border shadow-xs group hover:border-purple-500/30 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xl font-black font-mono">24.5%</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Tỷ lệ đổi quà</div>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] border-[#2f6cf5]/35 bg-[#2f6cf5]/10 text-[#2f6cf5]">ROI Cao</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: List of rules and Template Creator */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Collapsible Action Dialog Form to Add Brand Campaign Rule */}
              {newRuleOpen ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-card border border-[#2f6cf5]/40 rounded-2xl p-6 shadow-md relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                    <Sparkles className="w-24 h-24 text-[#2f6cf5]" />
                  </div>

                  <h3 className="font-black text-sm text-[#2f6cf5] uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Thiết Thừa Quy Tắc Tự Động Mới
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Xây dựng trình kích hoạt CRM và nội dung phản ứng.</p>

                  <form onSubmit={handleCreateRule} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Tên Quy Tắc / Chiến Dịch</label>
                        <input 
                          type="text" 
                          required
                          value={newCamName}
                          onChange={(e) => setNewCamName(e.target.value)}
                          placeholder="Ví dụ: Tri Ân Phân Cấp Atelier"
                          className="w-full text-xs p-2.5 bg-background border rounded-xl font-semibold outline-none focus:ring-1 focus:ring-[#2f6cf5]/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Trình kích hoạt (Trigger)</label>
                        <select
                          value={newCamTrigger}
                          onChange={(e) => setNewCamTrigger(e.target.value)}
                          className="w-full text-xs p-2.5 bg-background border rounded-xl font-semibold outline-none cursor-pointer"
                        >
                          <option value="Đăng ký tài khoản">Đăng ký tài khoản mới</option>
                          <option value="Ngày sinh nhật">Ngày sinh nhật khách hàng</option>
                          <option value="Độ trễ 90 ngày">90 ngày không giao dịch</option>
                          <option value="Đạt 10,000 điểm">Đạt mốc 10.000 điểm Loyalty</option>
                          <option value="Đã nâng hạng">Nâng phân cấp VIP mới</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Kênh gửi (Action Channel)</label>
                        <select
                          value={newCamAction}
                          onChange={(e) => setNewCamAction(e.target.value)}
                          className="w-full text-xs p-2.5 bg-background border rounded-xl font-semibold outline-none cursor-pointer"
                        >
                          <option value="SMS">Tin nhắn SMS truyền thống</option>
                          <option value="Zalo">Zalo OA (Zalo Official Account)</option>
                          <option value="Email">Email Marketing siêu cá nhân hóa</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Placeholders Hỗ trợ</label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="px-2 py-1 bg-muted rounded text-[9px] font-mono select-all cursor-pointer font-bold text-foreground">{"{customer_name}"}</span>
                          <span className="px-2 py-1 bg-muted rounded text-[9px] font-mono select-all cursor-pointer font-bold text-foreground">{"{points}"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#2f6cf5] uppercase flex items-center gap-1.5 font-mono">
                        Nội dung bản tin (Template Content)
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={newCamTemplate}
                        onChange={(e) => setNewCamTemplate(e.target.value)}
                        placeholder="Chào {customer_name}! Atelier Thương Vy thân tặng ưu đãi đổi điểm đặc quyền VIP..."
                        className="w-full text-xs p-2.5 bg-background border rounded-xl outline-none focus:ring-1 focus:ring-[#2f6cf5]/50"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setNewRuleOpen(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-all"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-bold bg-[#2f6cf5] text-slate-950 hover:bg-[#1652f1] rounded-xl transition-all uppercase"
                      >
                        Lưu quy tắc
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : null}

              {/* Main Campaign rules list container */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border flex items-center justify-between bg-muted/10">
                  <div>
                    <h3 className="font-black text-base flex items-center gap-2">
                      Quy tắc & Trình Kích hoạt Tự động <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] rounded-full uppercase">Realtime</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">Theo dõi cấu hình tự động truyền tin theo chân khách hàng.</p>
                  </div>
                  {!newRuleOpen && (
                    <button 
                      onClick={() => setNewRuleOpen(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#2f6cf5]/10 hover:bg-[#2f6cf5]/20 border border-[#2f6cf5]/30 text-[#2f6cf5] rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Thêm quy tắc
                    </button>
                  )}
                </div>

                <div className="divide-y divide-border">
                  {campaignRules.map((rule) => (
                    <div key={rule.id} className="p-5 flex flex-col hover:bg-muted/10 transition-colors group">
                      
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                            rule.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-400'
                          )}>
                            {rule.action === 'SMS' && <MessageSquare className="w-5 h-5" />}
                            {rule.action === 'Zalo' && <Smartphone className="w-5 h-5" />}
                            {rule.action === 'Email' && <Mail className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                              {rule.name}
                              {rule.id === selectedRuleId && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/15 text-primary text-[8px] font-black uppercase rounded">
                                  <Check className="w-2.5 h-2.5" /> Chọn Thử nghiệm
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2.5 mt-1">
                              <Badge variant="outline" className="text-[9px] border-border text-muted-foreground py-0 h-4 px-1.5 font-bold">
                                Kích hoạt: {rule.trigger}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] border-border text-muted-foreground py-0 h-4 px-1.5 font-bold font-mono">
                                {rule.action}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            onClick={() => setSelectedRuleId(rule.id)}
                            className={cn(
                              "text-[10px] uppercase font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                              selectedRuleId === rule.id 
                                ? "bg-primary text-primary-foreground border-primary" 
                                : "hover:bg-muted border-border text-muted-foreground text-[10px]"
                            )}
                          >
                            Dùng Thử nghiệm
                          </button>
                          
                          <button 
                            onClick={() => toggleRuleStatus(rule.id)}
                            className={cn(
                              "text-[9px] px-2 py-1 rounded-lg font-black transition-all cursor-pointer",
                              rule.status === 'active' 
                                ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25' 
                                : 'bg-slate-500/15 text-slate-500 hover:bg-slate-500/25'
                            )}
                          >
                            {rule.status === 'active' ? 'BẬT' : 'TẮT'}
                          </button>
                        </div>
                      </div>

                      {/* Display Template Preview inline nicely */}
                      <div className="mt-3.5 pl-12 bg-muted/20 hover:bg-muted/35 border-l-2 border-border/60 p-2.5 rounded-r-xl">
                        <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-2">
                          "{rule.template}"
                        </p>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Premium Smartphone sandboxed simulator preview */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-card border border-border rounded-3xl p-6 relative shadow-lg">
                <div className="absolute top-4 right-4 z-40 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  ⚡ SANDBOX INTERACTIVE
                </div>

                <h3 className="font-black text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-2.5 border-border/80">
                  <Smartphone className="w-4 h-4 text-[#2f6cf5]" /> Trình Mô Phỏng Truyền Gửi CRM
                </h3>

                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Thiết lập khách hàng nhận & kịch bản tiếp thị để chứng kiến công cụ logic gộp dữ liệu biên ra tin nhắn trên điện thoại:
                </p>

                {/* Simulated Customer selection drop-down */}
                <div className="space-y-4 mt-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground">1. CHỌN KHÁCH HÀNG VIP</label>
                      <select
                        value={selectedCustomerIndex}
                        onChange={(e) => {
                          setSelectedCustomerIndex(Number(e.target.value));
                          setSmsHasDispatched(false);
                        }}
                        className="w-full text-xs p-2 bg-background border rounded-lg font-bold text-foreground outline-none cursor-pointer"
                      >
                        {availableVips.map((vip, i) => (
                          <option key={vip.id || i} value={i}>
                            {vip.name} ({vip.segment || "VIP"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#2f6cf5]">2. KỊCH BẢN ĐANG CHỌN</label>
                      <input 
                        type="text" 
                        disabled 
                        value={campaignRules.find(r => r.id === selectedRuleId)?.name || "Chưa chọn"}
                        className="w-full text-xs p-2 bg-background border border-border/80 rounded-lg font-bold text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-background/50 p-2.5 rounded-xl border border-border/30">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-muted-foreground font-black uppercase">Thông tin thiết bị</span>
                      <p className="text-[10px] font-bold text-foreground font-mono">
                        SDT: {availableVips[selectedCustomerIndex]?.phone || "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={executeSimulationDispatch}
                      disabled={isSimulatingDispatch}
                      className="py-1.5 px-3 bg-slate-900 hover:bg-[#2f6cf5] hover:text-slate-950 text-white font-black text-[9px] tracking-widest uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      {isSimulatingDispatch ? "Đang xâu chuỗi..." : "Chạy tự động"}
                    </button>
                  </div>
                </div>

                {/* Smartphone Container Mockup */}
                <div className="mt-6 flex justify-center">
                  <div className="w-[280px] h-[480px] rounded-[44px] border-[10px] border-slate-950 bg-slate-900 shadow-2xl relative overflow-hidden flex flex-col">
                    
                    {/* Speaker & camera bar (Bezel bar) */}
                    <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 flex justify-center items-center z-50">
                      <div className="w-16 h-3.5 bg-black rounded-b-xl flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full mr-1.5" />
                        <div className="w-8 h-1 bg-zinc-900 rounded" />
                      </div>
                    </div>

                    {/* Notification Slide down overlay */}
                    {smsHasDispatched && (
                      <motion.div 
                        initial={{ y: -80, opacity: 0 }}
                        animate={{ y: 8 }}
                        className="absolute top-8 inset-x-2 bg-slate-950/90 text-white p-3 rounded-2xl border border-zinc-700/60 shadow-xl z-50 animate-bounce"
                      >
                        <div className="flex items-center gap-1.5 text-[8px] font-black text-[#2f6cf5] uppercase tracking-wider">
                          <Zap className="w-2.5 h-2.5" /> Triêu hồi tự động: {campaignRules.find(r => r.id === selectedRuleId)?.action || "CRM"}
                        </div>
                        <p className="text-[9px] leading-tight text-slate-100 font-bold mt-1">
                          Gửi từ Seva CRM: <span className="font-normal text-slate-300">{sentAlertMessage.substring(0, 70)}...</span>
                        </p>
                      </motion.div>
                    )}

                    {/* Screen Content */}
                    <div className="flex-1 bg-gradient-to-b from-[#2E1065] to-slate-950 p-4 pt-10 flex flex-col justify-between text-white relative">
                      
                      {/* Top status icons on screen */}
                      <div className="flex justify-between items-center text-[8px] text-zinc-300 font-bold tracking-tight font-mono">
                        <span>09:41</span>
                        <div className="flex items-center gap-1">
                          <span>LTE</span>
                          <div className="w-3 h-1.5 bg-current rounded-xs" />
                        </div>
                      </div>

                      {/* Mock App view based on selected channel */}
                      <div className="my-auto flex flex-col items-center justify-center p-3 text-center space-y-3">
                        
                        {campaignRules.find(r => r.id === selectedRuleId)?.action === 'Zalo' ? (
                          <>
                            {/* Zalo Mock UI view */}
                            <div className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center font-black text-xs shadow-md">
                              Za
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-[10px] font-black">Phòng Hộp Chat Zalo VIP</h4>
                              <p className="text-[8px] text-zinc-300">Seva Atelier Official Account</p>
                            </div>
                            
                            <div className="w-full bg-white/10 p-2.5 rounded-xl text-left text-[9px] font-medium leading-relaxed max-h-[140px] overflow-y-auto mt-2 border border-white/5">
                              {smsHasDispatched ? sentAlertMessage : `(Bấm "Chạy tự động" để tải tin nhắn Zalo mô phỏng cho ${availableVips[selectedCustomerIndex]?.name})`}
                            </div>
                          </>
                        ) : campaignRules.find(r => r.id === selectedRuleId)?.action === 'Email' ? (
                          <>
                            {/* Mail Mock UI */}
                            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center font-black text-xs shadow-md">
                              <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-[10px] font-black">Atelier Mailbox</h4>
                              <p className="text-[8px] text-zinc-300">Tiêu đề: Ưu đãi Độc Quyền</p>
                            </div>

                            <div className="w-full bg-white/15 p-2.5 rounded-xl text-left text-[9px] leading-relaxed max-h-[140px] overflow-y-auto mt-2 border border-white/5">
                              {smsHasDispatched ? (
                                <div className="space-y-1.5">
                                  <div className="font-bold border-b border-white/10 pb-1 text-sky-400">Gửi tới: {availableVips[selectedCustomerIndex]?.email}</div>
                                  <div>{sentAlertMessage}</div>
                                </div>
                              ) : `(Bấm "Chạy tự động" để soạn thảo Email bồi đắp tự động)`}
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Default SMS Mock */}
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-black text-xs shadow-md">
                              <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-[10px] font-black">Hộp thư Tin nhắn SMS</h4>
                              <p className="text-[8px] text-zinc-300">CRM-Gateway: +19008198</p>
                            </div>

                            <div className="w-full bg-slate-800/80 p-2.5 rounded-xl text-left text-[9px] font-medium leading-relaxed max-h-[140px] overflow-y-auto mt-2 border border-white/5">
                              {smsHasDispatched ? sentAlertMessage : `(Chờ mô phỏng tin nhắn SMS chúc mừng)`}
                            </div>
                          </>
                        )}

                        {isSimulatingDispatch && (
                          <div className="flex items-center gap-1 text-[8px] text-[#2f6cf5] tracking-wider uppercase animate-pulse">
                            <Activity className="w-3 h-3 animate-spin" /> Đang phát xạ truyền tin...
                          </div>
                        )}
                      </div>

                      {/* Mock physical back button at the bottom screen */}
                      <div className="text-center text-[7px] text-zinc-500 font-bold select-none pt-1">
                        Slide To Unlock
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated log outputs */}
                <div className="mt-5 space-y-2">
                  <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block font-mono">
                    HỒ SƠ GỬI TIN GẦN ĐÂY (System Dispatch Logs)
                  </span>
                  
                  <div className="bg-background border rounded-xl overflow-hidden text-[10px] max-h-[100px] overflow-y-auto font-mono text-muted-foreground divide-y divide-border border-border">
                    {simulatedLogs.length === 0 ? (
                      <div className="p-3 text-center italic">Chưa có nhật ký truyền phát nào trong phiên này.</div>
                    ) : (
                      simulatedLogs.map((log, i) => (
                        <div key={i} className="p-2 flex items-center justify-between text-[9px]">
                          <span className="text-slate-500 shrink-0">{log.time}</span>
                          <span className="font-bold text-foreground truncate max-w-[80px] text-left ml-2">{log.customerName}</span>
                          <span className="bg-[#2f6cf5]/10 text-[#2f6cf5] px-1 rounded truncate max-w-[70px]">{log.campaignName}</span>
                          <span className="font-bold text-emerald-500 shrink-0">{log.channel}</span>
                        </div>
                      ))
                    )}
                  </div>
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

      <TabsContent value="sendgrid" className="flex-1 overflow-y-auto m-0 p-8 h-full min-h-0 border-none outline-none custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-[#2f6cf5]/5 border border-[#2f6cf5]/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-[#2f6cf5] text-base flex items-center gap-2">
                <Mail className="w-5 h-5" /> Tích Hợp Gửi Thư Tự Động Sinh Nhật (SendGrid API)
              </h3>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Thiết lập này liên kết trực tiếp tới máy chủ SendGrid. Khi tới ngày sinh nhật của hội viên VIP, hệ thống sẽ tự động phát văn bản chúc mừng với thiết kế thượng lưu được định nghĩa bên dưới.
              </p>
            </div>
            <button 
              onClick={handleSimulateLocalDispatch}
              className="px-5 py-2.5 bg-[#2f6cf5]/10 text-[#2f6cf5] border border-[#2f6cf5]/30 rounded-xl text-xs font-bold hover:bg-[#2f6cf5]/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Mô Phỏng Tự Động Gửi Tin
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left side: Configuration and template content */}
            <div className="lg:col-span-5 bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="space-y-4">
                <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">1. Cấu hình gửi thư SendGrid</h4>
                
                <div>
                  <label className="block text-[10px] text-muted-foreground font-bold uppercase mb-1">SendGrid API Key</label>
                  <input 
                    type="password" 
                    value={sgApiKey}
                    onChange={(e) => setSgApiKey(e.target.value)}
                    placeholder="SG.xxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxx (Để trống nếu dùng .env)"
                    className="w-full p-2.5 bg-background border rounded-xl text-xs font-mono"
                  />
                  <span className="text-[9px] text-muted-foreground mt-1 block">Khuyến nghị khai báo <code>SENDGRID_API_KEY</code> trong tệp bảo mật <code>.env</code>.</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-muted-foreground font-bold uppercase mb-1">Email Người gửi (From)</label>
                    <input 
                      type="email" 
                      value={sgFromEmail}
                      onChange={(e) => setSgFromEmail(e.target.value)}
                      placeholder="vip@seva-atelier.com"
                      className="w-full p-2 bg-background border rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground font-bold uppercase mb-1">Tên Người gửi</label>
                    <input 
                      type="text" 
                      value={sgFromName}
                      onChange={(e) => setSgFromName(e.target.value)}
                      placeholder="Atelier Luxury Club"
                      className="w-full p-2 bg-background border rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-3 border-t">
                <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">2. Thiết lập Mẫu Thư Mừng Tuổi Mới</h4>

                <div>
                  <label className="block text-[10px] text-muted-foreground font-bold uppercase mb-1">Phong cách Giao diện (Email Style)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setSgTheme("gold_luxury")}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        sgTheme === "gold_luxury" 
                          ? "border-amber-500 bg-amber-500/5 text-amber-600 font-extrabold" 
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      Gold Luxury
                    </button>
                    <button 
                      onClick={() => setSgTheme("royal_deco")}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        sgTheme === "royal_deco" 
                          ? "border-blue-700 bg-blue-700/5 text-blue-700 font-extrabold" 
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      Royal Deco
                    </button>
                    <button 
                      onClick={() => setSgTheme("minimal")}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        sgTheme === "minimal" 
                          ? "border-slate-800 bg-slate-800/5 text-slate-800 font-extrabold" 
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      Minimal
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground font-bold uppercase mb-1">Tiêu đề Email (Subject Line)</label>
                  <input 
                    type="text" 
                    value={sgSubject}
                    onChange={(e) => setSgSubject(e.target.value)}
                    placeholder="✨ Quà Tặng Sinh Nhật Đặc Quyền..."
                    className="w-full p-2 bg-background border rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground font-bold uppercase mb-1">Văn bản lời chúc (Greeting Content)</label>
                  <textarea 
                    value={sgGreetingText}
                    onChange={(e) => setSgGreetingText(e.target.value)}
                    rows={4}
                    className="w-full p-2.5 bg-background border rounded-xl text-xs font-semibold leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-muted-foreground font-bold uppercase mb-1">Mã Gift Voucher Tặng kèm</label>
                  <input 
                    type="text" 
                    value={sgVoucherCode}
                    onChange={(e) => setSgVoucherCode(e.target.value)}
                    placeholder="BDAYVIP5000"
                    className="w-full p-2 bg-background border rounded-xl text-xs font-mono font-bold tracking-widest text-primary uppercase"
                  />
                </div>
              </div>

              {/* Delivery Test Panel */}
              <div className="space-y-4 pt-3 border-t">
                <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">3. Kiểm tra truyền phát thực tế</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input 
                      type="email" 
                      value={sgToEmail}
                      onChange={(e) => setSgToEmail(e.target.value)}
                      placeholder="hungthai84@gmail.com"
                      className="w-full p-2 bg-background border rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <button 
                    onClick={handleSendSendGridTest}
                    disabled={isSendingSgTest}
                    className="px-4 py-2 bg-primary hover:bg-primary/95 disabled:bg-muted text-primary-foreground font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    {isSendingSgTest ? (
                      <span>Đang gửi...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Gửi Thử Nghiệm
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: HTML Live Preview Mock Frame */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-muted/10 border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h4 className="font-bold text-foreground text-sm uppercase tracking-wide flex items-center gap-2 font-heading">
                      <Laptop className="w-4 h-4 text-primary" /> XEM TRƯỚC SẢN PHẨM EMAIL THƯỢNG HẠNG (LIVE PREVIEW)
                    </h4>
                    <p className="text-[10px] text-muted-foreground">Thư sẽ xuất hiện hệt như thế này trong hộp thư đến của hội viên VIP.</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-amber-500/20 bg-amber-500/5 text-amber-500 font-bold">Responsive</Badge>
                </div>

                {/* Simulated Web Client interface */}
                <div className="bg-background border rounded-2xl shadow-xl overflow-hidden">
                  {/* Browser Bar */}
                  <div className="bg-muted/65 px-4 py-3 border-b flex items-center gap-3">
                    <div className="flex gap-1.5 shrink-0">
                      <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    </div>
                    <div className="bg-background text-muted-foreground text-[10px] px-3.5 py-1 rounded-lg w-full max-w-sm truncate text-left border border-border/40 flex items-center justify-between">
                      <span>{sgSubject}</span>
                    </div>
                  </div>

                  {/* Mail Header Meta Info */}
                  <div className="p-4 border-b text-[11px] text-muted-foreground space-y-1 bg-muted/10 text-left">
                    <div><strong className="text-foreground">Từ người gửi:</strong> {sgFromName} &lt;{sgFromEmail}&gt;</div>
                    <div><strong className="text-foreground">Tới:</strong> {sgToEmail}</div>
                  </div>

                  {/* HTML View */}
                  <div className="p-6 bg-slate-900 overflow-y-auto max-h-[500px] custom-scrollbar flex justify-center">
                    <div className="w-full max-w-[550px]" dangerouslySetInnerHTML={{ __html: getSgHtmlPreview() }} />
                  </div>
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
