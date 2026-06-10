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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Copy, Sparkles, Eye, EyeOff, Layout } from "lucide-react";
import { toast } from "sonner";

interface BulkEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  sampleCustomerName?: string;
  onSend: (template: string) => Promise<void>;
}

export function BulkEmailDialog({ 
  isOpen, 
  onClose, 
  selectedCount, 
  sampleCustomerName = "Khách hàng",
  onSend 
}: BulkEmailDialogProps) {
  const [subject, setSubject] = useState("Tri ân khách hàng thân thiết - SEVA Premium");
  const [template, setTemplate] = useState(
    "Chào {{name}},\n\nChúng tôi xin gửi lời cảm ơn chân thành nhất vì sự đồng hành của bạn trong suốt thời gian qua. SEVA xin gửi tặng bạn voucher giảm giá 15% cho đơn hàng tiếp theo.\n\nMã ưu đãi: SEVAVIP\nThân mến,\nĐội ngũ SEVA."
  );
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(template);
      toast.success(`Đã xếp hàng gửi ${selectedCount} email thành công!`);
      onClose();
    } catch (err) {
      toast.error("Gửi email thất bại. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  const getPreviewText = () => {
    return template.replace(/{{name}}/g, sampleCustomerName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold font-heading">Gửi Email Hàng Loạt</DialogTitle>
          </div>
          <DialogDescription>
            Gửi thông báo cá nhân hóa tới <strong>{selectedCount}</strong> khách hàng đã chọn.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs font-bold uppercase text-muted-foreground">Tiêu đề email</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="font-medium h-9 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="template" className="text-xs font-bold uppercase text-muted-foreground">Nội dung mẫu</Label>
                <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold cursor-pointer hover:underline">
                   <Sparkles className="w-3 h-3" /> AI Suggest
                </div>
              </div>
              <Textarea
                id="template"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="min-h-[220px] font-medium text-sm leading-relaxed resize-none"
                placeholder="Sử dụng {{name}} để cá nhân hóa..."
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-muted-foreground">
                  Placeholder: <strong>{`{{name}}`}</strong>
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-6 px-2 text-[10px] font-bold md:hidden"
                >
                  {showPreview ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  Preview
                </Button>
              </div>
            </div>
          </div>

          <div className={`space-y-2 ${!showPreview && "max-md:hidden"}`}>
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Layout className="w-3 h-3" /> Xem trước (Preview)
            </Label>
            <div className="rounded-xl border border-border/50 bg-muted/30 p-4 min-h-[220px] h-[260px] overflow-y-auto">
              <div className="pb-3 mb-3 border-b border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Tiêu đề:</p>
                <p className="text-xs font-bold">{subject}</p>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Nội dung:</p>
              <div className="text-xs whitespace-pre-wrap leading-relaxed text-foreground/80 italic">
                {getPreviewText()}
              </div>
              <div className="mt-6 pt-4 border-t border-dashed border-border/50 text-center">
                 <p className="text-[10px] text-muted-foreground font-medium italic">— Footer tự động SEVA Premium —</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold h-10">Hủy bỏ</Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending}
            className="rounded-xl font-bold px-6 bg-primary shadow-lg shadow-primary/20 h-10"
          >
            {isSending ? (
              <>Đang gửi...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" /> Gửi {selectedCount} Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
