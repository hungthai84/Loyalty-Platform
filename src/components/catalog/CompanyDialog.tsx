import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Phone, Globe, Image as ImageIcon } from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Company } from "@/types";
import { toast } from "sonner";

interface CompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingCompany: Company | null;
}

export function CompanyDialog({ isOpen, onClose, editingCompany }: CompanyDialogProps) {
  const { user } = useFirebase();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingCompany) {
      setName(editingCompany.name);
      setAddress(editingCompany.address);
      setPhone(editingCompany.phone);
      setAvatarUrl(editingCompany.avatarUrl || "");
      setWebsiteUrl(editingCompany.websiteUrl || "");
    } else {
      setName("");
      setAddress("");
      setPhone("");
      setAvatarUrl("");
      setWebsiteUrl("");
    }
  }, [editingCompany, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name || !address || !phone) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }

    setLoading(true);
    try {
      const id = editingCompany?.id || `comp_${Date.now()}`;
      const companyData: Company = {
        id,
        name,
        address,
        phone,
        avatarUrl: avatarUrl || undefined,
        websiteUrl: websiteUrl || undefined,
        userId: user.uid,
        createdAt: editingCompany ? editingCompany.createdAt : serverTimestamp(),
      };

      await setDoc(doc(db, "companies", id), companyData);
      toast.success(editingCompany ? "Cập nhật công ty thành công" : "Thêm công ty thành công");
      onClose();
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Lỗi khi lưu thông tin công ty");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-heading flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            {editingCompany ? "Chỉnh sửa Công ty" : "Thêm Công ty mới"}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết của doanh nghiệp đối tác hoặc chi nhánh.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black uppercase tracking-wider">Tên công ty *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" placeholder="VD: Công ty TNHH Seva VIP" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-black uppercase tracking-wider">Địa chỉ *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-black uppercase tracking-wider">Số điện thoại *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" placeholder="090..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-xs font-black uppercase tracking-wider">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input id="website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="pl-10" placeholder="https://..." />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar" className="text-xs font-black uppercase tracking-wider">Avatar / Logo URL</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="pl-10" placeholder="https://example.com/logo.png" />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="font-bold">Hủy</Button>
            <Button type="submit" disabled={loading} className="font-bold px-8 shadow-lg shadow-primary/20">
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
