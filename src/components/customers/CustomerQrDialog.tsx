import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Customer } from "@/types";
import { QrCode, ScanFace } from "lucide-react";

export function CustomerQrDialog({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  if (!customer) return null;

  return (
    <Dialog open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-[10px] bg-background border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" /> Check-in Member
          </DialogTitle>
          <DialogDescription>Quét mã QR dưới đây để check-in khách hàng tại cửa hàng vật lý.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-border mt-4">
           {/* Simulate QR Code */}
           <div className="w-48 h-48 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=MEM-0001')] bg-contain bg-center bg-no-repeat mb-4">
             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${customer.id}`} alt="QR Code" className="w-full h-full object-contain" />
           </div>
           <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800">{customer.name}</h3>
              <p className="text-sm font-semibold text-slate-500 font-mono tracking-widest">{customer.id}</p>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
