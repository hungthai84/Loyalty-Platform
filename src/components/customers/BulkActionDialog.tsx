import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tag, UserCheck, Smartphone, Send, AlertTriangle, Award } from "lucide-react";

interface BulkActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (updateData: any) => Promise<void>;
  actionType: "tag" | "status" | "points" | "tier";
}

export function BulkActionDialog({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
  actionType,
}: BulkActionDialogProps) {
  const [status, setStatus] = useState("active");
  const [tag, setTag] = useState("");
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (actionType === "status") {
        await onConfirm({ activityStatus: status });
      } else if (actionType === "tag") {
        await onConfirm({ "tags": tag }); 
      } else if (actionType === "points") {
        await onConfirm({ points: points });
      } else if (actionType === "tier") {
        // Map common tier names to point values
        const tierPoints: Record<string, number> = {
          "Member": 0,
          "Essential": 500,
          "Icon": 2500,
          "Atelier": 10000
        };
        await onConfirm({ points: tierPoints[tag] || 0 });
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-heading">
            {actionType === "tag" && <Tag className="w-5 h-5 text-indigo-500" />}
            {actionType === "status" && <UserCheck className="w-5 h-5 text-emerald-500" />}
            {actionType === "points" && <Smartphone className="w-5 h-5 text-blue-500" />}
            {actionType === "tier" && <Award className="w-5 h-5 text-amber-500" />}
            Thao tác hàng loạt
          </DialogTitle>
          <DialogDescription>
            Đang thực hiện thay đổi cho <span className="font-bold text-foreground">{selectedCount}</span> khách hàng đã chọn.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {actionType === "status" && (
            <div className="space-y-2">
              <Label htmlFor="status">Cập nhật trạng thái thành</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="rounded-xl">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active">Active (Đang hoạt động)</SelectItem>
                  <SelectItem value="new">New (Mới)</SelectItem>
                  <SelectItem value="churn_risk">Churn Risk (Nguy cơ rời bỏ)</SelectItem>
                  <SelectItem value="inactive">Inactive (Ngừng hoạt động)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {actionType === "tag" && (
            <div className="space-y-2">
              <Label htmlFor="tag">Gắn thẻ phân loại</Label>
              <div className="flex gap-2 flex-wrap mb-2">
                {["VIP", "Loyal", "Potential", "Warm", "Cold"].map((t) => (
                  <Badge 
                    key={t} 
                    variant={tag === t ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setTag(t)}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
              <Input 
                id="tag" 
                placeholder="Hoặc nhập thẻ tự chọn..." 
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}

          {actionType === "points" && (
            <div className="space-y-2">
              <Label htmlFor="points">Cộng/Trừ điểm thưởng</Label>
              <Input 
                id="points" 
                type="number" 
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                placeholder="VD: 50 hoặc -50"
                className="rounded-xl"
              />
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Lưu ý: Thao tác này sẽ thiết lập lại điểm thưởng (Simulated).
              </p>
            </div>
          )}

          {actionType === "tier" && (
            <div className="space-y-2">
              <Label htmlFor="tier">Chuyển sang hạng hội viên</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Member", color: "bg-slate-500" },
                  { name: "Essential", color: "bg-emerald-500" },
                  { name: "Icon", color: "bg-amber-500" },
                  { name: "Atelier", color: "bg-[#2f6cf5]" }
                ].map((t) => (
                  <Badge 
                    key={t.name} 
                    variant={tag === t.name ? "default" : "outline"}
                    className={`cursor-pointer h-10 flex items-center justify-center gap-2 border-2 ${tag === t.name ? t.color : 'border-border'}`}
                    onClick={() => setTag(t.name)}
                  >
                    <div className={`w-2 h-2 rounded-full ${t.color}`} />
                    {t.name}
                  </Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground italic mt-2 text-left">
                Hệ thống sẽ tự động cập nhật số điểm tương ứng với hạng được chọn.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Hủy</Button>
          <Button 
            onClick={handleConfirm} 
            className="rounded-xl bg-primary text-primary-foreground font-bold"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Xác nhận thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
