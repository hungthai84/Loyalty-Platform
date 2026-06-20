import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Globe, Image as ImageIcon, Building2, AlignLeft } from "lucide-react";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { CatalogProduct, Company } from "@/types";
import { toast } from "sonner";

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: CatalogProduct | null;
  companies: Company[];
}

export function ProductDialog({ isOpen, onClose, editingProduct, companies }: ProductDialogProps) {
  const { user } = useFirebase();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setDescription(editingProduct.description);
      setAvatarUrl(editingProduct.avatarUrl || "");
      setWebsite(editingProduct.website || "");
      setCompanyId(editingProduct.companyId);
    } else {
      setName("");
      setDescription("");
      setAvatarUrl("");
      setWebsite("");
      setCompanyId(companies[0]?.id || "");
    }
  }, [editingProduct, isOpen, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name || !description || !companyId) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }

    setLoading(true);
    try {
      const id = editingProduct?.id || `prod_${Date.now()}`;
      const productData: CatalogProduct = {
        id,
        name,
        description,
        avatarUrl: avatarUrl || undefined,
        website: website || undefined,
        companyId,
        userId: user.uid,
        createdAt: editingProduct ? editingProduct.createdAt : serverTimestamp(),
      };

      await setDoc(doc(db, "catalog_products", id), productData);
      toast.success(editingProduct ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm thành công");
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Lỗi khi lưu thông tin sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-heading flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            {editingProduct ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm mới"}
          </DialogTitle>
          <DialogDescription>
            Cung cấp thông tin chi tiết về sản phẩm trong danh mục.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider">Công ty chủ quản *</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Chọn công ty..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {companies.map(comp => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                  {companies.length === 0 && (
                    <SelectItem value="none" disabled>Không có công ty nào</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-name" className="text-xs font-black uppercase tracking-wider">Tên sản phẩm *</Label>
              <div className="relative">
                <Package className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="prod-name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" placeholder="VD: Trang sức cao cấp Heart Lock" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-desc" className="text-xs font-black uppercase tracking-wider">Mô tả chi tiết *</Label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea id="prod-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="pl-10 min-h-[100px]" placeholder="Mô tả công dụng, đặc điểm nổi bật..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prod-website" className="text-xs font-black uppercase tracking-wider">Website sản phẩm</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input id="prod-website" value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-10" placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-avatar" className="text-xs font-black uppercase tracking-wider">Ảnh minh họa (URL)</Label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input id="prod-avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="pl-10" placeholder="https://..." />
                </div>
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
