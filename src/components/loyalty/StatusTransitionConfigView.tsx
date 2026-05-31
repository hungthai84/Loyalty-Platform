import React, { useState, useEffect } from "react";
import { 
 GitCompare, 
 Plus, 
 Trash2, 
 Settings2, 
 Play, 
 ToggleLeft, 
 ToggleRight, 
 HelpCircle, 
 FileCode2, 
 Save, 
 Sparkles, 
 ChevronRight, 
 AlertCircle, 
 CheckCircle2, 
 Clock, 
 UserCheck, 
 Zap, 
 ArrowRight,
 RefreshCw,
 Info
} from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { 
 collection, 
 query, 
 onSnapshot, 
 doc, 
 setDoc, 
 deleteDoc, 
 serverTimestamp,
 getDocs,
 updateDoc
} from "firebase/firestore";
import { CUSTOMER_STATUSES, CustomerStatusConfig } from "@/data/customerStatuses";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "motion/react";

// Types for customizable conditions
export interface TransitionCondition {
 metric: 'total_spend' | 'current_points' | 'inactive_days' | 'purchase_drop_rate' | 'bad_reviews_count' | 'fraud_alerts_count' | 'current_tier';
 operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
 value: string; // stored as string, casted during execution
}

export interface TransitionRule {
 id: string;
 name: string;
 description: string;
 fromStatus: string; // Code of status, or "ALL"
 toStatus: string; // Code of target status
 matchType: 'and' | 'or';
 conditions: TransitionCondition[];
 enabled: boolean;
 automations: {
 sendZalo: boolean;
 grantVoucher: boolean;
 notifySupport: boolean;
 enableDoublePoints: boolean;
 lockAccount: boolean;
 };
 createdAt?: any;
}

const METRIC_OPTIONS = [
 { value: 'total_spend', label: 'Tổng chi tiêu (VNĐ)', type: 'number', unit: '₫' },
 { value: 'current_points', label: 'Điểm tích lũy hiện có', type: 'number', unit: 'pts' },
 { value: 'inactive_days', label: 'Số ngày không hoạt động', type: 'number', unit: 'ngày' },
 { value: 'purchase_drop_rate', label: 'Tỷ lệ sút giảm giao dịch', type: 'number', unit: '%' },
 { value: 'bad_reviews_count', label: 'Số lượt khiếu nại/đánh giá xấu', type: 'number', unit: 'lần' },
 { value: 'fraud_alerts_count', label: 'Số lần cảnh báo bất thường/spam', type: 'number', unit: 'lần' },
 { value: 'current_tier', label: 'Hạng hội viên hiện tại', type: 'select', unit: '' }
];

const OPERATOR_OPTIONS = [
 { value: 'gt', label: '> (Lớn hơn)' },
 { value: 'gte', label: '>= (Lớn hơn hoặc bằng)' },
 { value: 'lt', label: '< (Nhỏ hơn)' },
 { value: 'lte', label: '<= (Nhỏ hơn hoặc bằng)' },
 { value: 'eq', label: '= (Bằng)' },
 { value: 'neq', label: '!= (Khác)' }
];

const TIER_VALUES = [
 { value: 'BRONZE', label: 'Đồng (Bronze)' },
 { value: 'SILVER', label: 'Bạc (Silver)' },
 { value: 'GOLD', label: 'Vàng (Gold)' },
 { value: 'PLATINUM', label: 'Bạch Kim (Platinum)' },
 { value: 'DIAMOND', label: 'Kim Cương (Diamond)' }
];

// Presets if empty
const DEFAULT_RULES: TransitionRule[] = [
 {
 id: "RULE_VIP_PROMOTION",
 name: "Tự động thăng thăng hạng VIP đặc biệt",
 description: "Nhận diện khách hàng có điểm tích lũy hoặc chi tiêu vượt hạng và tự động kích hoạt quyền lợi VIP cao cấp.",
 fromStatus: "ACTIVE_LOYALTY",
 toStatus: "VIP",
 matchType: "or",
 conditions: [
 { metric: "current_points", operator: "gte", value: "100000" },
 { metric: "total_spend", operator: "gte", value: "50000000" }
 ],
 enabled: true,
 automations: {
 sendZalo: true,
 grantVoucher: true,
 notifySupport: true,
 enableDoublePoints: true,
 lockAccount: false
 }
 },
 {
 id: "RULE_CHURN_WARNING",
 name: "Cảnh báo sớm rủi ro rời bỏ hệ thống",
 description: "Kích hoạt cảnh báo khi hội viên không tương tác quá lâu kèm sụt giảm tần suất giao dịch đột ngột.",
 fromStatus: "ACTIVE",
 toStatus: "CHURN_RISK",
 matchType: "and",
 conditions: [
 { metric: "inactive_days", operator: "gte", value: "45" },
 { metric: "purchase_drop_rate", operator: "gte", value: "35" }
 ],
 enabled: true,
 automations: {
 sendZalo: true,
 grantVoucher: true,
 notifySupport: true,
 enableDoublePoints: false,
 lockAccount: false
 }
 },
 {
 id: "RULE_FRAUD_LOCKDOWN",
 name: "Tự động khóa tạm thời nghi ngờ gian lận",
 description: "Tự động kích hoạt trạng thái tạm khóa khi có nhiều cảnh báo bảo mật, spam hoặc hành vi trục lợi hệ thống.",
 fromStatus: "ALL",
 toStatus: "TEMP_LOCK",
 matchType: "and",
 conditions: [
 { metric: "fraud_alerts_count", operator: "gte", value: "3" }
 ],
 enabled: true,
 automations: {
 sendZalo: false,
 grantVoucher: false,
 notifySupport: true,
 enableDoublePoints: false,
 lockAccount: true
 }
 }
];

export function StatusTransitionConfigView() {
 const { user } = useFirebase();
 const [rules, setRules] = useState<TransitionRule[]>([]);
 const [loading, setLoading] = useState(true);
 const [editingRule, setEditingRule] = useState<Partial<TransitionRule> | null>(null);
 const [showEditor, setShowEditor] = useState(false);

 // Simulation state
 const [simSpend, setSimSpend] = useState("12000000");
 const [simPoints, setSimPoints] = useState("45000");
 const [simInactive, setSimInactive] = useState("10");
 const [simDropRate, setSimDropRate] = useState("15");
 const [simBadReviews, setSimBadReviews] = useState("0");
 const [simFraudAlerts, setSimFraudAlerts] = useState("0");
 const [simCurrentStatus, setSimCurrentStatus] = useState("ACTIVE");
 const [simCurrentTier, setSimCurrentTier] = useState("GOLD");
 
 const [simResults, setSimResults] = useState<Array<{
 ruleId: string;
 ruleName: string;
 isMatched: boolean;
 targetStatus: string;
 appliedAutomations: string[];
 details: string[];
 }>>([]);

 // States for real transitions execution on active database
 const [executing, setExecuting] = useState(false);
 const [executionReport, setExecutionReport] = useState<{
 totalCustomers: number;
 changedCount: number;
 details: Array<{
 customerName: string;
 fromStatus: string;
 toStatus: string;
 ruleName: string;
 }>;
 } | null>(null);

 const handleExecuteLiveTransitions = async () => {

 setExecuting(true);
 setExecutionReport(null);
 try {
 // 1. Fetch live customers from Firestore
 const customersRef = collection(db, "customers");
 const custSnap = await getDocs(customersRef);
 const liveCustomers = custSnap.docs.map(d => ({ ...d.data(), id: d.id } as any));

 if (liveCustomers.length === 0) {
 toast.info("Không tìm thấy khách hàng nào để áp dụng.");
 setExecuting(false);
 return;
 }

 // 2. Fetch or filter active rules
 const activeRules = rules.filter(r => r.enabled);
 if (activeRules.length === 0) {
 toast.error("Không có quy tắc chuyển đổi nào đang được bật.");
 setExecuting(false);
 return;
 }

 const changedLogs: Array<{
 customerName: string;
 fromStatus: string;
 toStatus: string;
 ruleName: string;
 }> = [];

 let updatedCount = 0;

 // 3. For each customer, check rules
 for (const cust of liveCustomers) {
 let matchedRule: TransitionRule | null = null;
 const currentStatus = (cust.activityStatus || 'NEW_MEMBER').toUpperCase();

 for (const rule of activeRules) {
 // Verify rule.fromStatus
 if (rule.fromStatus !== "ALL" && rule.fromStatus.toUpperCase() !== currentStatus) {
 continue;
 }

 // Evaluate conditions in the rule
 const matches = rule.conditions.map(cond => {
 let profileValue: any = 0;
 
 switch (cond.metric) {
 case "total_spend":
 profileValue = cust.customFields?.spend ?? 
 cust.customFields?.total_spend ?? 
 cust.spend ?? 
 (cust.points ? cust.points * 50000 : 0);
 break;
 case "current_points":
 profileValue = cust.points ?? 0;
 break;
 case "inactive_days": {
 // Determine days since last transaction / activity
 const lastDate = cust.lastTransactionAt?.toDate?.() || 
 cust.updatedAt?.toDate?.() || 
 cust.createdAt?.toDate?.() || 
 new Date();
 profileValue = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
 break;
 }
 case "purchase_drop_rate":
 profileValue = Number(cust.customFields?.purchase_drop_rate ?? 0);
 break;
 case "bad_reviews_count":
 profileValue = Number(cust.customFields?.bad_reviews_count ?? 0);
 break;
 case "fraud_alerts_count":
 profileValue = Number(cust.customFields?.fraud_alerts_count ?? 0);
 break;
 case "current_tier":
 profileValue = cust.customFields?.current_tier || cust.customFields?.tier || "BRONZE";
 break;
 }

 let isCondTrue = false;
 const ruleValue = cond.metric === 'current_tier' ? cond.value : parseFloat(cond.value || "0");

 if (cond.metric === 'current_tier') {
 if (cond.operator === 'eq') isCondTrue = String(profileValue).toUpperCase() === String(ruleValue).toUpperCase();
 else if (cond.operator === 'neq') isCondTrue = String(profileValue).toUpperCase() !== String(ruleValue).toUpperCase();
 else isCondTrue = String(profileValue).toUpperCase() === String(ruleValue).toUpperCase();
 } else {
 const profNum = Number(profileValue);
 const ruleNum = Number(ruleValue);
 switch (cond.operator) {
 case "gt": isCondTrue = profNum > ruleNum; break;
 case "gte": isCondTrue = profNum >= ruleNum; break;
 case "lt": isCondTrue = profNum < ruleNum; break;
 case "lte": isCondTrue = profNum <= ruleNum; break;
 case "eq": isCondTrue = profNum === ruleNum; break;
 case "neq": isCondTrue = profNum !== ruleNum; break;
 }
 }
 return isCondTrue;
 });

 const isAllTrue = matches.every(x => x);
 const isAnyTrue = matches.some(x => x);
 const ruleMatched = rule.matchType === 'and' ? isAllTrue : isAnyTrue;

 if (ruleMatched) {
 // Found matched rule. Ensure we don't transition if target is same as current status
 if (rule.toStatus.toUpperCase() !== currentStatus) {
 matchedRule = rule;
 break; // Trigger first matched rule
 }
 }
 }

 if (matchedRule) {
 // Perform state transition update in Firestore
 const docRef = doc(db, `users/${user.uid}/customers/${cust.id}`);
 await updateDoc(docRef, {
 activityStatus: matchedRule.toStatus,
 updatedAt: serverTimestamp()
 });

 changedLogs.push({
 customerName: cust.name || cust.email || cust.id,
 fromStatus: currentStatus,
 toStatus: matchedRule.toStatus,
 ruleName: matchedRule.name
 });

 updatedCount++;
 }
 }

 setExecutionReport({
 totalCustomers: liveCustomers.length,
 changedCount: updatedCount,
 details: changedLogs
 });

 if (updatedCount > 0) {
 toast.success(`Đã tự động chuyển đổi trạng thái thành công cho ${updatedCount} khách hàng!`, {
        description: changedLogs.length > 0 ? (
          <div className="mt-2 space-y-1 text-left">
            {changedLogs.slice(0, 3).map((log, idx) => (
              <div key={idx} className="text-[11px] leading-tight">
                <span className="font-semibold">{log.customerName}</span>: {log.fromStatus} ➝ {log.toStatus}
              </div>
            ))}
            {changedLogs.length > 3 && (
              <div className="text-[10px] italic text-muted-foreground mt-1">...và {changedLogs.length - 3} chi tiết khác.</div>
            )}
          </div>
        ) : undefined
      });
 } else {
 toast.info("Tất cả khách hàng đã phù hợp với trạng thái hiện tại, không có cập nhật nào cần thực hiện.");
 }

 } catch (err: any) {
 console.error(err);
 toast.error(`Lỗi thực thi: ${err.message || err}`, { description: "Có lỗi khi đồng bộ trạng thái, vui lòng kiểm tra cấu hình." });
 } finally {
 setExecuting(false);
 }
 };

 // Fetch Rules from Firestore
 useEffect(() => {
 if (!user) return;

 const path = `status_transitions`;
 const q = query(collection(db, path));
 
 const unsub = onSnapshot(q, (snapshot) => {
 if (snapshot.empty) {
 // Seed default rules if empty
 setRules(DEFAULT_RULES);
 DEFAULT_RULES.forEach(async (r) => {
 await setDoc(doc(db, `${path}/${r.id}`), {
 ...r,
 userId: user.uid,
 createdAt: serverTimestamp()
 });
 });
 } else {
 const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TransitionRule));
 // Sort items by name
 items.sort((a, b) => a.name.localeCompare(b.name));
 setRules(items);
 }
 setLoading(false);
 }, (err) => {
 console.error("Error fetching status transitions:", err);
 setLoading(false);
 });

 return unsub;
 }, [user]);

 // Handler to toggle rule enabled/disabled
 const handleToggleRule = async (rule: TransitionRule) => {
 if (!user) return;
 const path = `users/${user.uid}/statusTransitions/${rule.id}`;
 try {
 await setDoc(doc(db, path), {
 ...rule,
 enabled: !rule.enabled,
 updatedAt: serverTimestamp()
 }, { merge: true });
 toast.success(`Đã ${!rule.enabled ? 'kích hoạt' : 'tạm dừng'} quy tắc: ${rule.name}`);
 } catch (e) {
 console.error(e);
 toast.error("Không thể cập nhật trạng thái quy tắc");
 }
 };

 // Handler to delete rule
 const handleDeleteRule = async (id: string) => {
 if (!user) return;
 const path = `users/${user.uid}/statusTransitions/${id}`;
 if (!window.confirm("Bạn có chắc chắn muốn xóa quy tắc chuyển trạng thái này?")) return;
 
 try {
 await deleteDoc(doc(db, path));
 toast.success("Đã xóa quy tắc thành công");
 } catch (e) {
 console.error(e);
 toast.error("Không thể xóa quy tắc");
 }
 };

 // Initiate Create New Rule
 const handleNewRule = () => {
 setEditingRule({
 id: `RULE-${Date.now()}`,
 name: "",
 description: "",
 fromStatus: "ALL",
 toStatus: "ACTIVE",
 matchType: "and",
 conditions: [
 { metric: "total_spend", operator: "gte", value: "5000000" }
 ],
 enabled: true,
 automations: {
 sendZalo: false,
 grantVoucher: false,
 notifySupport: true,
 enableDoublePoints: false,
 lockAccount: false
 }
 });
 setShowEditor(true);
 };

 // Initiate Edit Existing Rule
 const handleEditRule = (rule: TransitionRule) => {
 setEditingRule({ ...rule });
 setShowEditor(true);
 };

 // Add condition row dynamically
 const handleAddCondition = () => {
 if (!editingRule) return;
 const newConditions = [...(editingRule.conditions || [])];
 newConditions.push({ metric: "current_points", operator: "gte", value: "1000" });
 setEditingRule({ ...editingRule, conditions: newConditions });
 };

 // Remove condition row dynamically
 const handleRemoveCondition = (index: number) => {
 if (!editingRule || !editingRule.conditions) return;
 const newConditions = editingRule.conditions.filter((_, i) => i !== index);
 setEditingRule({ ...editingRule, conditions: newConditions });
 };

 // Update dynamic fields of condition
 const handleUpdateCondition = (index: number, key: keyof TransitionCondition, val: string) => {
 if (!editingRule || !editingRule.conditions) return;
 const newConditions = [...editingRule.conditions];
 newConditions[index] = { ...newConditions[index], [key]: val };
 setEditingRule({ ...editingRule, conditions: newConditions });
 };

 // Save Rule to Firestore
 const handleSaveRule = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user || !editingRule) return;

 if (!editingRule.name?.trim()) {
 toast.error("Vui lòng nhập tên quy tắc cấu hình");
 return;
 }

 if (!editingRule.conditions || editingRule.conditions.length === 0) {
 toast.error("Quy tắc cần có ít nhất một điều kiện đi kèm");
 return;
 }

 const path = `users/${user.uid}/statusTransitions/${editingRule.id}`;
 try {
 await setDoc(doc(db, path), {
 ...editingRule,
 userId: user.uid,
 updatedAt: serverTimestamp()
 });
 toast.success("Đã ghi nhận cấu hình chuyển trạng thái khách hàng");
 setShowEditor(false);
 setEditingRule(null);
 } catch (err) {
 console.error(err);
 toast.error("Lỗi khi ghi cấu hình");
 }
 };

 // Simulation Runner
 const runSimulation = () => {
 const results = rules.map(rule => {
 // Check current status match
 let isStatusMatched = false;
 if (rule.fromStatus === "ALL" || rule.fromStatus === simCurrentStatus) {
 isStatusMatched = true;
 }

 if (!rule.enabled) {
 return {
 ruleId: rule.id,
 ruleName: rule.name,
 isMatched: false,
 targetStatus: rule.toStatus,
 appliedAutomations: [],
 details: ["Quy tắc đang bị VÔ HIỆU HÓA"]
 };
 }

 if (!isStatusMatched) {
 return {
 ruleId: rule.id,
 ruleName: rule.name,
 isMatched: false,
 targetStatus: rule.toStatus,
 appliedAutomations: [],
 details: [`Trạng thái gốc của hồ sơ (${simCurrentStatus}) không khớp yêu cầu (${rule.fromStatus})`]
 };
 }

 const details: string[] = [];
 const matchStatuses = rule.conditions.map(cond => {
 let profileValue: any = 0;
 let label = "";
 
 switch (cond.metric) {
 case "total_spend":
 profileValue = parseFloat(simSpend);
 label = "Tổng chi tiêu";
 break;
 case "current_points":
 profileValue = parseFloat(simPoints);
 label = "Điểm tích lũy";
 break;
 case "inactive_days":
 profileValue = parseFloat(simInactive);
 label = "Số ngày không hoạt động";
 break;
 case "purchase_drop_rate":
 profileValue = parseFloat(simDropRate);
 label = "Tỷ lệ sụt giảm giao dịch";
 break;
 case "bad_reviews_count":
 profileValue = parseFloat(simBadReviews);
 label = "Số lượt khiếu nại";
 break;
 case "fraud_alerts_count":
 profileValue = parseFloat(simFraudAlerts);
 label = "Cảnh báo bảo mật";
 break;
 case "current_tier":
 profileValue = simCurrentTier;
 label = "Hạng hội viên";
 break;
 }

 let isCondTrue = false;
 const ruleValue = cond.metric === 'current_tier' ? cond.value : parseFloat(cond.value || "0");

 if (cond.metric === 'current_tier') {
 if (cond.operator === 'eq') isCondTrue = profileValue === ruleValue;
 else if (cond.operator === 'neq') isCondTrue = profileValue !== ruleValue;
 else {
 isCondTrue = profileValue === ruleValue; // fallback for noneq
 }
 } else {
 const profNum = Number(profileValue);
 const ruleNum = Number(ruleValue);
 switch (cond.operator) {
 case "gt": isCondTrue = profNum > ruleNum; break;
 case "gte": isCondTrue = profNum >= ruleNum; break;
 case "lt": isCondTrue = profNum < ruleNum; break;
 case "lte": isCondTrue = profNum <= ruleNum; break;
 case "eq": isCondTrue = profNum === ruleNum; break;
 case "neq": isCondTrue = profNum !== ruleNum; break;
 }
 }

 const formatVal = cond.metric === 'total_spend' 
 ? `${profileValue.toLocaleString()}đ` 
 : cond.metric === 'current_points' 
 ? `${profileValue.toLocaleString()} pts`
 : `${profileValue} ${METRIC_OPTIONS.find(m => m.value === cond.metric)?.unit || ''}`;

 const formatRuleVal = cond.metric === 'total_spend' 
 ? `${parseFloat(cond.value || "0").toLocaleString()}đ` 
 : cond.metric === 'current_points' 
 ? `${parseFloat(cond.value || "0").toLocaleString()} pts`
 : `${cond.value} ${METRIC_OPTIONS.find(m => m.value === cond.metric)?.unit || ''}`;

 const operatorText = cond.operator === 'gt' ? 'lớn hơn' 
 : cond.operator === 'gte' ? 'lớn hơn hoặc bằng'
 : cond.operator === 'lt' ? 'nhỏ hơn'
 : cond.operator === 'lte' ? 'nhỏ hơn hoặc bằng'
 : cond.operator === 'neq' ? 'khác' : 'bằng';

 details.push(
 `${label}: ${formatVal} so với mốc định ${operatorText} ${formatRuleVal} -> ${isCondTrue ? 'ĐẠT ✅' : 'KHO TRẠM ❌'}`
 );

 return isCondTrue;
 });

 const isAllTrue = matchStatuses.every(x => x);
 const isAnyTrue = matchStatuses.some(x => x);
 const overallMatch = rule.matchType === 'and' ? isAllTrue : isAnyTrue;

 const appliedAutomations: string[] = [];
 if (overallMatch) {
 if (rule.automations.sendZalo) appliedAutomations.push("Gửi tin nhắn ZNS chăm sóc");
 if (rule.automations.grantVoucher) appliedAutomations.push("Phát hành Voucher ưu đãi");
 if (rule.automations.notifySupport) appliedAutomations.push("Cảnh báo khẩn lên hệ thống CSKH");
 if (rule.automations.enableDoublePoints) appliedAutomations.push("Áp dụng hệ số điểm thưởng đặc biệt (x2)");
 if (rule.automations.lockAccount) appliedAutomations.push("Khóa chức năng giao dịch/đăng nhập");
 }

 return {
 ruleId: rule.id,
 ruleName: rule.name,
 isMatched: overallMatch,
 targetStatus: rule.toStatus,
 appliedAutomations,
 details
 };
 });

 setSimResults(results);
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* Overview Card */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 p-6 border border-primary/10 rounded-3xl">
 <div className="flex items-start gap-4">
 <GitCompare className="w-6 h-6 text-primary shrink-0 mt-1" />
 <div className="space-y-1">
 <h4 className="font-bold">Quy tắc Chuyển đổi Trạng thái Khách hàng</h4>
 <p className="text-sm text-muted-foreground leading-relaxed">
 Thiết lập các điều kiện tự động hóa với nhiều thông số phức tạp để phân loại, phát hiện rủi ro rời bỏ hoặc tự động thăng cấp trạng thái VIP.
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={handleNewRule}
 className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl transition-all hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/10"
 >
 <Plus className="w-4 h-4" />
 Thêm quy tắc mới
 </button>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
 
 {/* Rules List (Left side - Col 7) */}
 <div className="xl:col-span-7 space-y-4">
 <div className="flex items-center justify-between px-1">
 <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Danh sách quy tắc kích hoạt ({rules.length})</h5>
 <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md font-bold">Thời gian thực (Firestore)</span>
 </div>

 {loading ? (
 <div className="py-12 text-center text-muted-foreground italic bg-card border border-border rounded-3xl">Đang tải cấu hình quy tắc...</div>
 ) : rules.length === 0 ? (
 <div className="py-16 text-center border-2 border-dashed border-border rounded-3xl space-y-3">
 <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto" />
 <p className="text-sm text-muted-foreground font-medium">Chưa có quy tắc chuyển đổi tùy biến nào</p>
 <button 
 onClick={handleNewRule}
 className="text-primary text-xs font-bold hover:underline"
 >
 Tạo quy tắc đầu tiên của bạn
 </button>
 </div>
 ) : (
 <div className="space-y-4">
 {rules.map((rule) => {
 const sourceStatusObj = CUSTOMER_STATUSES.find(s => s.code === rule.fromStatus);
 const destStatusObj = CUSTOMER_STATUSES.find(s => s.code === rule.toStatus);
 
 return (
 <Card key={rule.id} className={`border-none ${rule.enabled ? 'bg-card' : 'bg-muted/10 opacity-70'} hover:shadow-lg transition-all duration-300 rounded-3xl overflow-hidden border border-border/40`}>
 <CardContent className="p-6 space-y-4">
 <div className="flex items-start justify-between gap-4">
 <div className="space-y-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm font-extrabold text-foreground">{rule.name}</span>
 {!rule.enabled && <span className="text-xs bg-red-500/10 text-red-600 px-1.5 py-0.2 rounded font-black tracking-wider uppercase">TẮT</span>}
 </div>
 <p className="text-xs text-muted-foreground leading-relaxed text-left max-w-xl">
 {rule.description || "Không có mô tả chi tiết."}
 </p>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 onClick={() => handleToggleRule(rule)}
 className="p-1.5 hover:bg-muted rounded-lg transition-colors"
 title={rule.enabled ? "Tạm ngưng quy tắc" : "Kích hoạt quy tắc"}
 >
 {rule.enabled ? (
 <ToggleRight className="w-6 h-6 text-emerald-500" />
 ) : (
 <ToggleLeft className="w-6 h-6 text-muted-foreground" />
 )}
 </button>
 <button
 type="button"
 onClick={() => handleEditRule(rule)}
 className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
 title="Sửa điều kiện"
 >
 <Settings2 className="w-4 h-4" />
 </button>
 <button
 type="button"
 onClick={() => handleDeleteRule(rule.id)}
 className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
 title="Xóa quy tắc"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Transition visual indicator */}
 <div className="p-3 bg-muted/30 rounded-2xl flex items-center justify-between border border-border/20 text-xs">
 <div className="flex items-center gap-2 ">
 <span className="text-muted-foreground">Từ:</span>
 {rule.fromStatus === "ALL" ? (
 <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">Mọi trạng thái</span>
 ) : (
 <span className={`text-xs font-bold px-2 py-0.5 rounded border ${sourceStatusObj?.color.bg || ''} ${sourceStatusObj?.color.text || ''} ${sourceStatusObj?.color.border || ''}`}>
 {rule.fromStatus}
 </span>
 )}
 </div>

 <ArrowRight className="w-4 h-4 text-muted-foreground" />

 <div className="flex items-center gap-2 ">
 <span className="text-muted-foreground">Chuyển sang:</span>
 <span className={`text-xs font-bold px-2 py-0.5 rounded border ${destStatusObj?.color.bg || ''} ${destStatusObj?.color.text || ''} ${destStatusObj?.color.border || ''}`}>
 {rule.toStatus}
 </span>
 </div>
 </div>

 {/* Conditions list snippet */}
 <div className="space-y-1.5 text-left">
 <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase mb-1">
 Điều kiện xác định ({rule.matchType === 'and' ? "Thỏa tất cả - AND" : "Thỏa bất kỳ - OR"})
 </p>
 <div className="flex flex-wrap gap-2">
 {rule.conditions.map((cond, index) => {
 const opt = METRIC_OPTIONS.find(m => m.value === cond.metric);
 const operatorText = cond.operator === 'gt' ? '>' 
 : cond.operator === 'gte' ? '>='
 : cond.operator === 'lt' ? '<'
 : cond.operator === 'lte' ? '<='
 : cond.operator === 'neq' ? '!=' : '=';
 
 const niceValue = cond.metric === 'total_spend' 
 ? `${parseFloat(cond.value).toLocaleString()}₫` 
 : cond.metric === 'current_points' 
 ? `${parseFloat(cond.value).toLocaleString()} pts`
 : `${cond.value} ${opt?.unit || ''}`;

 return (
 <span key={index} className="inline-flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-xl border border-border/40 font-semibold">
 <span className="text-muted-foreground">{opt?.label}</span>
 <span className="text-primary ">{operatorText}</span>
 <span className="text-foreground font-bold">{niceValue}</span>
 </span>
 );
 })}
 </div>
 </div>

 {/* Automations status */}
 <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
 <span className="font-bold text-muted-foreground uppercase tracking-widest">Hành vi tự động:</span>
 {rule.automations.sendZalo && <span className="bg-[#2f6cf5]/5 text-[#2f6cf5] font-bold py-0.5 px-2 rounded-lg border border-[#2f6cf5]/15">Gửi Zalo ZNS</span>}
 {rule.automations.grantVoucher && <span className="bg-amber-500/5 text-amber-600 font-bold py-0.5 px-2 rounded-lg border border-amber-500/15">Tặng quà/Voucher</span>}
 {rule.automations.notifySupport && <span className="bg-indigo-500/5 text-indigo-600 font-bold py-0.5 px-2 rounded-lg border border-indigo-500/15">Thông báo CSKH</span>}
 {rule.automations.enableDoublePoints && <span className="bg-purple-500/5 text-purple-600 font-bold py-0.5 px-2 rounded-lg border border-purple-500/15">Nhân đôi x2 điểm</span>}
 {rule.automations.lockAccount && <span className="bg-rose-500/5 text-rose-600 font-bold py-0.5 px-2 rounded-lg border border-rose-500/15">Khóa quyền hội viên</span>}
 </div>

 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </div>

 {/* Sandbox Simulation Panel (Right side - Col 5) */}
 <div className="xl:col-span-5 space-y-6">
 <Card className="border-none bg-card rounded-3xl shadow-xl overflow-hidden border border-border/40">
 <div className="p-6 border-b border-border bg-muted/10">
 <h5 className="font-bold font-heading text-base flex items-center gap-2">
 <Play className="w-5 h-5 text-primary fill-current" />
 Chạy thử nghiệm Sandbox (Simulator)
 </h5>
 <p className="text-xs text-muted-foreground mt-0.5">
 Nhập thông số mô phỏng của khách hàng để kiểm tra tính năng tự động chuyển đổi trạng thái nào sẽ được kích kích hoạt.
 </p>
 </div>
 <CardContent className="p-6 space-y-5 text-left">
 
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs text-muted-foreground font-bold tracking-tight uppercase">Trạng thái hiện tại</label>
 <select 
 value={simCurrentStatus}
 onChange={e => setSimCurrentStatus(e.target.value)}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 >
 {CUSTOMER_STATUSES.map(s => (
 <option key={s.code} value={s.code}>{s.code} ({s.classification})</option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs text-muted-foreground font-bold tracking-tight uppercase">Hạng hội viên hiện có</label>
 <select 
 value={simCurrentTier}
 onChange={e => setSimCurrentTier(e.target.value)}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 >
 {TIER_VALUES.map(t => (
 <option key={t.value} value={t.value}>{t.label}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs text-muted-foreground font-bold tracking-tight uppercase">Tổng chi tiêu (₫)</label>
 <input 
 type="number" 
 value={simSpend}
 onChange={e => setSimSpend(e.target.value)}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 placeholder="₫"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs text-muted-foreground font-bold tracking-tight uppercase">Điểm tích lũy (pts)</label>
 <input 
 type="number" 
 value={simPoints}
 onChange={e => setSimPoints(e.target.value)}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 placeholder="pts"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs text-muted-foreground font-bold tracking-tight uppercase">Số ngày không hoạt động</label>
 <input 
 type="number" 
 value={simInactive}
 onChange={e => setSimInactive(e.target.value)}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs text-muted-foreground font-bold tracking-tight uppercase">Tắt giảm giao dịch %</label>
 <input 
 type="number" 
 value={simDropRate}
 onChange={e => setSimDropRate(e.target.value)}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs text-muted-foreground font-bold tracking-tight uppercase">Số khiếu nại/xấu</label>
 <input 
 type="number" 
 value={simBadReviews}
 onChange={e => setSimBadReviews(e.target.value)}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs text-muted-foreground font-bold tracking-tight uppercase">Cảnh báo nghi ngờ bảo mật</label>
 <input 
 type="number" 
 value={simFraudAlerts}
 onChange={e => setSimFraudAlerts(e.target.value)}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 />
 </div>
 </div>

 <button
 type="button"
 onClick={runSimulation}
 className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
 >
 <RefreshCw className="w-4 h-4 animate-spin-hover" />
 Kiểm thử và Phân tích Quy tắc
 </button>

 {/* Simulation Output results */}
 {simResults.length > 0 && (
 <div className="mt-5 space-y-4 pt-4 border-t border-border">
 <h6 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kế quả đối chiếu điều kiện</h6>
 
 <div className="space-y-3.5">
 {simResults.map(res => (
 <div key={res.ruleId} className={`p-4 rounded-2xl border ${res.isMatched ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-100' : 'bg-muted/40 border-border/40 opacity-75'} text-xs`}>
 <div className="flex items-start justify-between gap-2.5">
 <div className="space-y-0.5">
 <span className="font-bold block text-sm">{res.ruleName}</span>
 <span className="text-xs text-muted-foreground block ">ID: {res.ruleId}</span>
 </div>
 <span className={`px-2 py-0.5 rounded text-xs font-black uppercase shrink-0 ${res.isMatched ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
 {res.isMatched ? 'KHỚP ĐIỀU KIỆN' : 'KHÔNG KHỚP'}
 </span>
 </div>

 {/* Breakdown conditions detail */}
 <div className="mt-3.5 pl-2.5 border-l-2 border-border space-y-1.5 text-muted-foreground text-xs text-left">
 {res.details.map((d, index) => (
 <p key={index}>{d}</p>
 ))}
 </div>

 {res.isMatched && (
 <div className="mt-4 pt-3 border-t border-emerald-500/20 space-y-2">
 <p className="font-semibold text-emerald-700 dark:text-emerald-400">Trạng thái đích quy đổi: <span className="underline font-bold font-sans text-xs">{res.targetStatus}</span></p>
 
 {res.appliedAutomations.length > 0 && (
 <div className="space-y-1">
 <p className="text-xs text-muted-foreground uppercase font-semibold">Tự động hóa hành vi kích hoạt:</p>
 <div className="flex flex-wrap gap-1">
 {res.appliedAutomations.map((auto, i) => (
 <span key={i} className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded text-xs font-semibold">{auto}</span>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 </CardContent>
 </Card>

 {/* Vận hành Thực tế CRM Transition Engine */}
 <Card className="border-none bg-card rounded-3xl shadow-xl overflow-hidden border border-border/40 mt-6">
 <div className="p-6 border-b border-border bg-primary/5">
 <h5 className="font-bold font-heading text-base flex items-center gap-2 text-primary">
 <Zap className="w-5 h-5 fill-current" />
 Vận hành Hệ thống Thực tế (Live Engine)
 </h5>
 <p className="text-xs text-muted-foreground mt-0.5">
 Chạy các quy tắc chuyển đổi trạng thái đã kích hoạt lên toàn bộ cơ sở dữ liệu khách hàng thực trên hệ thống.
 </p>
 </div>
 <CardContent className="p-6 space-y-4 text-left">
 <div className="bg-amber-500/10 dark:bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20 text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-sans flex items-start gap-2.5">
 <AlertCircle className="w-5 h-5 shrink-0" />
 <span>
 <strong>Lưu ý:</strong> Hành động này sẽ thay đổi nhãn trạng thái trực tiếp của các khách hàng trên Firestore dựa trên các mốc điều kiện và quy tắc đang BẬT. Các hành động tự động đi kèm (Zalo, Voucher...) cũng sẽ được lập trình kích hoạt.
 </span>
 </div>

 <button
 type="button"
 disabled={executing || rules.filter(r => r.enabled).length === 0}
 onClick={handleExecuteLiveTransitions}
 className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-lg hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {executing ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" />
 Đang xử lý quy tắc chuyển đổi...
 </>
 ) : (
 <>
 <Play className="w-4 h-4 fill-current" />
 Bắt đầu chuyển trạng thái thành viên
 </>
 )}
 </button>

 {executionReport && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 className="space-y-3.5 pt-4 border-t border-border"
 >
 <div className="flex items-center justify-between">
 <h6 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Báo cáo cập nhật trực tiếp</h6>
 <span className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-0.5 px-2 rounded-full">
 Hoàn tất
 </span>
 </div>

 <div className="grid grid-cols-2 gap-3.5 text-center">
 <div className="bg-muted/40 p-3 rounded-2xl border border-border/10">
 <span className="text-xs text-muted-foreground uppercase block font-medium">Tổng số khách hàng quét</span>
 <span className="text-lg font-bold text-foreground">{executionReport.totalCustomers}</span>
 </div>
 <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/15 text-emerald-800 dark:text-emerald-400">
 <span className="text-xs text-muted-foreground uppercase block font-medium">Khách hàng được cập nhật</span>
 <span className="text-lg font-bold">{executionReport.changedCount}</span>
 </div>
 </div>

 {executionReport.details.length > 0 ? (
 <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
 {executionReport.details.map((log, i) => (
 <div key={i} className="p-3 bg-muted/30 rounded-xl border border-border/30 text-xs space-y-1">
 <div className="flex items-center justify-between">
 <span className="font-bold text-foreground">{log.customerName}</span>
 <span className="text-xs text-[#2f6cf5] font-semibold">{log.ruleName}</span>
 </div>
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground ">
 <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded text-xs font-bold">{log.fromStatus}</span>
 <ArrowRight className="w-3 h-3 text-muted-foreground" />
 <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded text-xs font-bold">{log.toStatus}</span>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="bg-muted/20 p-4 text-center rounded-2xl border border-dashed border-border/80 text-xs text-muted-foreground">
 Không có khách hàng nào thay đổi trạng thái trong lượt quét này.
 </div>
 )}
 </motion.div>
 )}
 </CardContent>
 </Card>
 </div>
 </div>

 {/* Editor Dialog/Modal using Radix / native layout styled absolute */}
 <AnimatePresence>
 {showEditor && editingRule && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Backdrop */}
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setShowEditor(false)}
 className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
 />
 
 {/* Dialog Content */}
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 15 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 15 }}
 className="relative w-full max-w-2xl bg-background border border-border/80 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
 >
 <form onSubmit={handleSaveRule} className="flex flex-col h-full overflow-hidden">
 {/* Header */}
 <div className="p-6 border-b border-border bg-muted/10 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Settings2 className="w-5 h-5 text-primary" />
 <div>
 <h4 className="font-bold text-lg">Cấu hình Quy tắc Chuyển Trạng thái</h4>
 <p className="text-xs text-muted-foreground">Xây dựng luật tự động đổi nhãn phân loại khách hàng với nhiều thuộc tính.</p>
 </div>
 </div>
 <button 
 type="button" 
 onClick={() => setShowEditor(false)}
 className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
 >
 X
 </button>
 </div>

 {/* Form fields */}
 <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1 text-left">
 
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Tên quy tắc cấu hình</label>
 <input 
 type="text"
 required
 value={editingRule.name || ""}
 onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
 placeholder="Ví dụ: Tăng cấp VIP khi đủ điểm chi tiêu..."
 className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-primary/50"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Mô tả chi tiết</label>
 <textarea 
 value={editingRule.description || ""}
 onChange={e => setEditingRule({ ...editingRule, description: e.target.value })}
 placeholder="Nhập ghi chú ý nghĩa hoặc mục đích của quy tắc chuyển trạng thái này..."
 className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs min-h-[60px] outline-none focus:border-primary/50"
 />
 </div>

 {/* Transition Matrix Config */}
 <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-2xl border border-border/40">
 <div className="space-y-1.5">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Trạng thái gốc (Source)</label>
 <select 
 value={editingRule.fromStatus || "ALL"}
 onChange={e => setEditingRule({ ...editingRule, fromStatus: e.target.value })}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 >
 <option value="ALL">MỌI TRẠNG THÁI (ALL)</option>
 {CUSTOMER_STATUSES.map(s => (
 <option key={s.code} value={s.code}>{s.code} ({s.classification})</option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Trạng thái Đích (Target)</label>
 <select 
 value={editingRule.toStatus || "ACTIVE"}
 onChange={e => setEditingRule({ ...editingRule, toStatus: e.target.value })}
 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 >
 {CUSTOMER_STATUSES.map(s => (
 <option key={s.code} value={s.code}>{s.code} ({s.classification})</option>
 ))}
 </select>
 </div>
 </div>

 {/* Multiple logical conditions multi-condition builder */}
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1.5">
 Thiết lập Tổ hợp Điều kiện Custom
 </label>
 
 {/* Combination logic picker AND/OR */}
 <div className="flex items-center bg-muted/70 p-1 rounded-xl border border-transparent gap-1 scale-90 origin-right">
 <button
 type="button"
 onClick={() => setEditingRule({ ...editingRule, matchType: 'and' })}
 className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
 editingRule.matchType === 'and' 
 ? 'bg-primary text-primary-foreground shadow-sm' 
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 KHỚP TẤT CẢ (AND)
 </button>
 <button
 type="button"
 onClick={() => setEditingRule({ ...editingRule, matchType: 'or' })}
 className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
 editingRule.matchType === 'or' 
 ? 'bg-primary text-primary-foreground shadow-sm' 
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 MỘT TRONG CÁC (OR)
 </button>
 </div>
 </div>

 {/* Condition rows list */}
 <div className="space-y-3">
 {editingRule.conditions?.map((cond, index) => {
 const currentMetricType = METRIC_OPTIONS.find(m => m.value === cond.metric);
 
 return (
 <div key={index} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center bg-muted/20 p-3 rounded-2xl border border-border/30">
 {/* Metric Selector */}
 <select
 value={cond.metric}
 onChange={e => handleUpdateCondition(index, "metric", e.target.value as any)}
 className="flex-1 min-w-[150px] bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 >
 {METRIC_OPTIONS.map(m => (
 <option key={m.value} value={m.value}>{m.label}</option>
 ))}
 </select>

 {/* Operator Selector */}
 <select
 value={cond.operator}
 onChange={e => handleUpdateCondition(index, "operator", e.target.value as any)}
 className="w-32 bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 >
 {OPERATOR_OPTIONS.map(o => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>

 {/* Value input (Dropdown for tier, input for others) */}
 {cond.metric === 'current_tier' ? (
 <select
 value={cond.value}
 onChange={e => handleUpdateCondition(index, "value", e.target.value)}
 className="w-44 bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
 >
 {TIER_VALUES.map(t => (
 <option key={t.value} value={t.value}>{t.label}</option>
 ))}
 </select>
 ) : (
 <div className="relative w-full sm:w-44">
 <input
 type="number"
 required
 value={cond.value}
 onChange={e => handleUpdateCondition(index, "value", e.target.value)}
 className="w-full bg-background border border-border rounded-xl pl-3 pr-8 py-2 text-xs outline-none focus:border-primary/50"
 placeholder="0"
 />
 {currentMetricType?.unit && (
 <span className="absolute right-3.5 top-2.5 text-xs text-muted-foreground font-bold">
 {currentMetricType.unit}
 </span>
 )}
 </div>
 )}

 {/* Delete Button */}
 <button
 type="button"
 onClick={() => handleRemoveCondition(index)}
 className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-colors cursor-pointer self-end sm:self-auto shrink-0"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 );
 })}

 <button
 type="button"
 onClick={handleAddCondition}
 className="w-full py-2 bg-muted/40 hover:bg-muted/75 border border-dashed border-border text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
 >
 <Plus className="w-4 h-4" />
 Thêm điều kiện so khớp mới
 </button>
 </div>
 </div>

 {/* Transition Automations checkboxes */}
 <div className="space-y-3 pt-3">
 <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1.5">
 Hành động tự động kích hoạt kèm (Automation Actions)
 </label>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
 <label className="flex items-center gap-3 p-3 bg-muted/15 border border-border/20 rounded-2xl cursor-pointer hover:bg-muted/30 transition-colors">
 <input 
 type="checkbox"
 checked={editingRule.automations?.sendZalo || false}
 onChange={e => setEditingRule({
 ...editingRule,
 automations: {
 ...editingRule.automations!,
 sendZalo: e.target.checked
 }
 })}
 className="rounded text-primary focus:ring-primary h-4 w-4"
 />
 <div>
 <span className="text-xs font-bold block">Gửi SMS/Zalo ZNS</span>
 <span className="text-xs text-muted-foreground">Tự động nhắn tin cá nhân hóa thương hiệu</span>
 </div>
 </label>

 <label className="flex items-center gap-3 p-3 bg-muted/15 border border-border/20 rounded-2xl cursor-pointer hover:bg-muted/30 transition-colors">
 <input 
 type="checkbox"
 checked={editingRule.automations?.grantVoucher || false}
 onChange={e => setEditingRule({
 ...editingRule,
 automations: {
 ...editingRule.automations!,
 grantVoucher: e.target.checked
 }
 })}
 className="rounded text-primary focus:ring-primary h-4 w-4"
 />
 <div>
 <span className="text-xs font-bold block">Tặng Voucher/Quà</span>
 <span className="text-xs text-muted-foreground">Tặng ưu đãi giảm 20% tự động</span>
 </div>
 </label>

 <label className="flex items-center gap-3 p-3 bg-muted/15 border border-border/20 rounded-2xl cursor-pointer hover:bg-muted/30 transition-colors">
 <input 
 type="checkbox"
 checked={editingRule.automations?.notifySupport || false}
 onChange={e => setEditingRule({
 ...editingRule,
 automations: {
 ...editingRule.automations!,
 notifySupport: e.target.checked
 }
 })}
 className="rounded text-primary focus:ring-primary h-4 w-4"
 />
 <div>
 <span className="text-xs font-bold block">Cảnh báo CSKH Tròn Toàn</span>
 <span className="text-xs text-muted-foreground">Gửi thông báo đẩy lên dashboard nhân viên CSKH</span>
 </div>
 </label>

 <label className="flex items-center gap-3 p-3 bg-muted/15 border border-border/20 rounded-2xl cursor-pointer hover:bg-muted/30 transition-colors">
 <input 
 type="checkbox"
 checked={editingRule.automations?.enableDoublePoints || false}
 onChange={e => setEditingRule({
 ...editingRule,
 automations: {
 ...editingRule.automations!,
 enableDoublePoints: e.target.checked
 }
 })}
 className="rounded text-primary focus:ring-primary h-4 w-4"
 />
 <div>
 <span className="text-xs font-bold block">Hệ số x2 Điểm Hạng</span>
 <span className="text-xs text-muted-foreground">Tăng tốc độ nhận ưu đãi dành cho hội viên</span>
 </div>
 </label>

 <label className="flex items-center gap-3 p-3 bg-muted/15 border border-border/20 rounded-2xl cursor-pointer hover:bg-muted/30 transition-colors sm:col-span-2">
 <input 
 type="checkbox"
 checked={editingRule.automations?.lockAccount || false}
 onChange={e => setEditingRule({
 ...editingRule,
 automations: {
 ...editingRule.automations!,
 lockAccount: e.target.checked
 }
 })}
 className="rounded text-primary focus:ring-primary h-4 w-4 text-rose-500"
 />
 <div>
 <span className="text-xs font-bold text-rose-600 block">Tạm thời hạn chế đặc quyền & khóa tài khoản</span>
 <span className="text-xs text-muted-foreground">Chặn đổi điểm, login sảnh khách hàng hoặc giao dịch thanh toán để đề phòng gian lận</span>
 </div>
 </label>
 </div>
 </div>

 </div>

 {/* Footer buttons */}
 <div className="p-6 border-t border-border bg-muted/10 flex items-center justify-end gap-3 shrink-0">
 <button
 type="button"
 onClick={() => setShowEditor(false)}
 className="px-5 py-2.5 bg-background border border-border text-xs font-bold rounded-xl transition-all hover:bg-muted cursor-pointer"
 >
 Hủy bỏ
 </button>
 <button
 type="submit"
 className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl transition-all hover:bg-primary/95 flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/15"
 >
 <Save className="w-4 h-4" />
 Lưu quy tắc cấu hình
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
