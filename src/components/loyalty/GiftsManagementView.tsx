import React, { useState, useEffect } from "react";
import {
  Gift,
  Plus,
  Trash2,
  Edit2,
  Coins,
  Save,
  Search,
  RefreshCw,
  X,
  Database,
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
  orderBy,
} from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export interface GiftItem {
  id: string;
  name: string;
  pointsRequired: number;
  eligibleTiers: string[];
  stockQuantity: number;
  description: string;
  source: "manual" | "pos_api";
  imageUrl: string;
  createdAt?: any;
  updatedAt?: any;
}

const PRESET_GIFTS: GiftItem[] = [
  {
    id: "GIFT-PRESET-1",
    name: "Bình giữ nhiệt Titanium SEVA Heritage",
    pointsRequired: 350,
    eligibleTiers: ["Essential", "Icon", "Atelier"],
    stockQuantity: 45,
    description: "Phiên bản thiết kế Titanium đặc quyền, giữ nhiệt 24 giờ, khắc logo chìm tinh xảo.",
    source: "manual",
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=60",
  },
  {
    id: "GIFT-PRESET-2",
    name: "Hộp trà đặc sản Lụa Vàng Seva Organic",
    pointsRequired: 200,
    eligibleTiers: ["Member", "Essential", "Icon", "Atelier"],
    stockQuantity: 120,
    description: "Trà đinh thượng hạng sấy lạnh hữu cơ từ cao nguyên Lâm Viên, hương mộc mạc thơm dịu.",
    source: "manual",
    imageUrl: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&auto=format&fit=crop&q=60",
  },
  {
    id: "GIFT-PRESET-3",
    name: "Đồng hồ Thụy Sỹ Classic Royale",
    pointsRequired: 2500,
    eligibleTiers: ["Icon", "Atelier"],
    stockQuantity: 8,
    description: "Phiên bản giới hạn đính đá Sapphire tự nhiên, chống nước 5ATM, chế tác tinh xảo.",
    source: "manual",
    imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&auto=format&fit=crop&q=60",
  },
  {
    id: "GIFT-PRESET-4",
    name: "Bông tai bạc đính kim cương Moissanite",
    pointsRequired: 1800,
    eligibleTiers: ["Atelier"],
    stockQuantity: 5,
    description: "Được chế tác thủ công bằng bạc S925 mạ bạch kim và đính Moissanite tinh tuyển.",
    source: "pos_api",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&auto=format&fit=crop&q=60",
  }
];

const POS_MOCKED_PRODUCTS = [
  {
    name: "Bộ quà tặng Nước hoa & Sữa tắm Luxury Gold",
    pointsRequired: 650,
    description: "Thiết kế hộp quà nhung đỏ sang trọng, mùi hương gỗ tuyết tùng trầm ấm và cuốn hút.",
    imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=400&auto=format&fit=crop&q=60",
    stockQuantity: 30,
    eligibleTiers: ["Essential", "Icon", "Atelier"],
  },
  {
    name: "Hộp trưng bày trang sức 3 tầng bọc da Nubuck",
    pointsRequired: 800,
    description: "Khóa đồng xi mạ cổ điển, phân chia ngăn kéo đựng nhẫn, vòng cổ và đồng hồ nhung êm.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60",
    stockQuantity: 15,
    eligibleTiers: ["Icon", "Atelier"],
  },
  {
    name: "Vòng tay Ngọc bích Seva Heritage Blossom",
    pointsRequired: 1500,
    description: "Ngọc bích thiên nhiên kết hợp khóa charm hoa sen vàng 10K, mang lại may mắn bình an.",
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&auto=format&fit=crop&q=60",
    stockQuantity: 10,
    eligibleTiers: ["Icon", "Atelier"],
  }
];

const AVAILABLE_TIERS = ["Member", "Essential", "Icon", "Atelier"];

export function GiftsManagementView() {
  const { user } = useFirebase();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [syncing, setSyncing] = useState(false);

  // Modal State
  const [showEditor, setShowEditor] = useState(false);
  const [editingGift, setEditingGift] = useState<Partial<GiftItem> | null>(null);

  // Load Gifts
  useEffect(() => {
    if (!user || user.isLocal) {
      const stored = localStorage.getItem("crm_guest_gifts_v1");
      if (stored) {
        try {
          setGifts(JSON.parse(stored));
        } catch (e) {
          setGifts(PRESET_GIFTS);
        }
      } else {
        localStorage.setItem("crm_guest_gifts_v1", JSON.stringify(PRESET_GIFTS));
        setGifts(PRESET_GIFTS);
      }
      setLoading(false);
      return;
    }

    const path = "loyalty_gifts";
    const q = query(collection(db, path), orderBy("pointsRequired", "asc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Initialize with presets if empty
          PRESET_GIFTS.forEach(async (g) => {
            await setDoc(doc(db, `${path}/${g.id}`), {
              ...g,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          });
        } else {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as GiftItem[];
          setGifts(items);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const saveGiftsState = async (updatedGifts: GiftItem[]) => {
    setGifts(updatedGifts);
    if (!user || user.isLocal) {
      localStorage.setItem("crm_guest_gifts_v1", JSON.stringify(updatedGifts));
      window.dispatchEvent(new Event("crm_guest_data_changed"));
    }
  };

  // Sync POS Simulator
  const handleSyncFromPOS = async () => {
    setSyncing(true);
    try {
      await toast.promise(
        new Promise<void>((resolve, reject) => {
          setTimeout(async () => {
            try {
              const syncedItems: GiftItem[] = [...gifts];
              let countSynced = 0;

              for (const item of POS_MOCKED_PRODUCTS) {
                const exists = gifts.some(
                  (g) => g.name.toLowerCase() === item.name.toLowerCase()
                );
                if (!exists) {
                  const uniqueId = `GIFT-POS-${Date.now()}-${Math.floor(
                    Math.random() * 1000
                  )}`;
                  const newGift: GiftItem = {
                    id: uniqueId,
                    name: item.name,
                    pointsRequired: item.pointsRequired,
                    eligibleTiers: item.eligibleTiers,
                    stockQuantity: item.stockQuantity,
                    description: item.description,
                    source: "pos_api",
                    imageUrl: item.imageUrl,
                  };

                  if (user && !user.isLocal) {
                    await setDoc(doc(db, `loyalty_gifts/${uniqueId}`), {
                      ...newGift,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                    });
                  } else {
                    syncedItems.push(newGift);
                  }
                  countSynced++;
                }
              }

              if (!user || user.isLocal) {
                await saveGiftsState(syncedItems);
              }

              if (countSynced === 0) {
                reject(new Error("Mọi quà tặng trên POS đã được đồng bộ đầy đủ trước bấy giờ."));
              } else {
                resolve();
              }
            } catch (e) {
              reject(e);
            }
          }, 1800);
        }),
        {
          loading: "🔄 Đang bắt tay API POS Seva & quét danh mục quà tặng...",
          success: "🎉 Đồng bộ hoàn tất! Đã cập nhật quà tặng mới từ hệ thống POS.",
          error: (err) => err.message || "Không thể đồng bộ từ POS API",
        }
      );
    } catch (e) {
      // toast.promise handles user notification
    } finally {
      setSyncing(false);
    }
  };

  // Delete Gift
  const handleDeleteGift = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa quà tặng "${name}" ra khỏi kho danh mục?`)) {
      return;
    }

    if (user && !user.isLocal) {
      try {
        await deleteDoc(doc(db, "loyalty_gifts", id));
        toast.success("Đã xóa quà tặng thành công khỏi hệ thống!");
      } catch (err) {
        toast.error("Lỗi khi xóa tài liệu quà tặng");
      }
    } else {
      const updated = gifts.filter((g) => g.id !== id);
      await saveGiftsState(updated);
      toast.success("Đã xóa quà tặng thành công!");
    }
  };

  // Create or Update
  const handleSaveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGift || !editingGift.name?.trim()) {
      toast.error("Vui lòng điền tên quà tặng");
      return;
    }
    if (Number(editingGift.pointsRequired) <= 0) {
      toast.error("Điểm yêu cầu trừ phải lớn hơn 0");
      return;
    }
    if (!editingGift.eligibleTiers || editingGift.eligibleTiers.length === 0) {
      toast.error("Cần chọn ít nhất một lớp thành viên được nhận quà.");
      return;
    }

    const payload: GiftItem = {
      id: editingGift.id || `GIFT-MAN-${Date.now()}`,
      name: editingGift.name.trim(),
      pointsRequired: Number(editingGift.pointsRequired),
      eligibleTiers: editingGift.eligibleTiers,
      stockQuantity: Number(editingGift.stockQuantity || 10),
      description: (editingGift.description || "").trim(),
      source: editingGift.source || "manual",
      imageUrl: editingGift.imageUrl || "",
    };

    if (user && !user.isLocal) {
      try {
        await setDoc(doc(db, "loyalty_gifts", payload.id), {
          ...payload,
          updatedAt: serverTimestamp(),
          createdAt: editingGift.createdAt || serverTimestamp(),
        });
        toast.success("Đã lưu quà tặng lên Cloud thành công!");
      } catch (err) {
        toast.error("Lỗi lưu trữ quà tặng cloud");
      }
    } else {
      const updated = [...gifts];
      const idx = updated.findIndex((g) => g.id === payload.id);
      if (idx > -1) {
        updated[idx] = payload;
      } else {
        updated.push(payload);
      }
      await saveGiftsState(updated);
      toast.success("Đã lưu món quà tặng thành công!");
    }

    setShowEditor(false);
    setEditingGift(null);
  };

  const handleNewGift = () => {
    setEditingGift({
      id: `GIFT-MAN-${Date.now()}`,
      name: "",
      pointsRequired: 300,
      eligibleTiers: ["Member", "Essential", "Icon", "Atelier"],
      stockQuantity: 15,
      description: "",
      source: "manual",
      imageUrl: "",
    });
    setShowEditor(true);
  };

  const handleEditGift = (g: GiftItem) => {
    setEditingGift({ ...g });
    setShowEditor(true);
  };

  const filteredGifts = gifts.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier =
      filterTier === "all" || g.eligibleTiers.includes(filterTier);
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="relative overflow-hidden rounded-[10px] border border-rose-500/10 bg-gradient-to-r from-rose-550/10 via-rose-500/5 to-transparent p-6 md:p-8 backdrop-blur-md text-left">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500 via-background to-background pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-sm uppercase tracking-wider mb-2">
              <Gift className="w-5 h-5 animate-pulse" /> Trung tâm quà tặng đặc quyền
            </div>
            <h3 className="text-2xl font-bold font-heading text-foreground">
              Kho Quà Tặng Tích Lũy
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Thiết lập kho quà tri ân thượng hạng (hiện vật, ấn phẩm, sản phẩm xa xỉ). Setup trực tiếp số điểm khấu trừ tương ứng và giới hạn nhóm thành viên VIP được quyền đổi thưởng. Đồng bộ dữ liệu dễ dàng từ quầy trung tâm hoặc POS.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0 self-start md:self-auto">
            <button
              onClick={handleSyncFromPOS}
              disabled={syncing}
              className="px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-[10px] text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Database className={cn("w-4 h-4 text-rose-500", syncing && "animate-spin")} />
              Đồng bộ POS API
            </button>
            <button
              onClick={handleNewGift}
              className="px-5 py-2.5 bg-rose-500 text-white hover:bg-rose-600 rounded-[10px] text-xs font-bold transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm quà thủ công
            </button>
          </div>
        </div>
      </div>

      {/* Filter and search utilities */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between px-1">
        <div className="text-left w-full sm:w-auto">
          <h5 className="text-xs font-extrabold text-rose-500 uppercase tracking-widest">
            Danh sách vật phẩm lưu trữ ({filteredGifts.length})
          </h5>
          <p className="text-xs text-muted-foreground">
            Quản lý phần quà vật chất, số lượng tồn kho & hạn mức phân hạng
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-44">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Tìm kiếm quà..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-[10px] text-xs outline-none focus:border-rose-500/50 text-foreground"
            />
          </div>

          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="bg-background border border-border rounded-[10px] px-2.5 py-1.5 text-xs outline-none focus:border-rose-500/50 text-foreground font-medium"
          >
            <option value="all">Tất cả nhóm VIP</option>
            {AVAILABLE_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                Hạng {tier} trở lên
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground italic bg-card border border-border rounded-[10px]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
          Đang tải kho quà tặng...
        </div>
      ) : filteredGifts.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-[10px] space-y-4 bg-card/10">
          <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="text-sm font-bold text-muted-foreground">
              Chưa tìm thấy quà tặng phù hợp với cấu hình lọc.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Bạn có thể tự thêm thủ công hoặc bấm nút Đồng bộ POS API phía trên để nạp nhanh danh mục sản phẩm.
            </p>
          </div>
          <button
            onClick={handleNewGift}
            className="px-4 py-2 bg-rose-500 text-white hover:bg-rose-600 rounded-[10px] text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            Tạo quà tặng mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGifts.map((gift) => (
            <motion.div
              layout
              key={gift.id}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group h-full flex"
            >
              <Card className="p-0 border border-border/80 bg-card overflow-hidden rounded-[10px] flex flex-col justify-between w-full shadow-sm hover:shadow-xl hover:border-rose-500/25 transition-all duration-300">
                <div className="relative h-44 w-full bg-muted overflow-hidden">
                  <img
                    src={gift.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(gift.id || gift.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                    alt={gift.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Absolute stock badges, etc */}
                  <div className="absolute top-3 left-3 flex gap-1">
                    <span
                      className={cn(
                        "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full select-none text-white",
                        gift.stockQuantity > 5 ? "bg-emerald-500" : "bg-rose-500 shrink-0"
                      )}
                    >
                      {gift.stockQuantity > 0 ? `Còn lại: ${gift.stockQuantity}` : "Hết kho"}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex gap-1 select-none">
                    <span
                      className={cn(
                        "text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider text-white",
                        gift.source === "pos_api"
                          ? "bg-rose-550 border border-rose-450"
                          : "bg-slate-700/80 border border-slate-650"
                      )}
                    >
                      {gift.source === "pos_api" ? "POS API" : "Thủ công"}
                    </span>
                  </div>

                  {/* Points display prominently overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <div className="flex justify-between items-center bg-black/40 backdrop-blur-md py-1 border border-white/10 px-2.5 rounded-[10px] w-fit">
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 fill-amber-400/10" />
                        Trừ {gift.pointsRequired.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="flex-1 flex flex-col p-5 text-left justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-extrabold text-sm text-foreground line-clamp-1 group-hover:text-rose-500 transition-colors">
                      {gift.name}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 h-[52px]">
                      {gift.description || "Món quà tri ân cao cấp không kèm hướng dẫn chi tiết."}
                    </p>
                  </div>

                  {/* Eligible Tiers section list */}
                  <div className="space-y-2 pt-3 border-t border-border/10.">
                    <div className="flex flex-wrap gap-1 leading-none">
                      {gift.eligibleTiers.map((tier) => (
                        <span
                          key={tier}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        >
                          {tier}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleEditGift(gift)}
                        className="p-1.5 bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-[10px] transition-colors cursor-pointer"
                        title="Chỉnh sửa quà tặng"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGift(gift.id, gift.name)}
                        className="p-1.5 bg-background border border-border text-muted-foreground hover:text-red-500 hover:bg-red-50/10 rounded-[10px] transition-colors cursor-pointer"
                        title="Xóa quà tặng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Manual Add / Edit Modal */}
      <AnimatePresence>
        {showEditor && editingGift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditor(false);
                setEditingGift(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-background border border-border/80 rounded-[10px] shadow-2xl overflow-hidden flex flex-col text-left"
            >
              <form onSubmit={handleSaveGift} className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-[10px]">
                      <Gift className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-foreground">
                        {editingGift.id && gifts.some((g) => g.id === editingGift.id)
                          ? "Cập Nhật Quà Tặng"
                          : "Tạo Quà Tặng Thủ Công"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Điền đầy đủ thông tin chi tiết quà tặng tích lũy.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditor(false);
                      setEditingGift(null);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-[10px] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      Tên quà tặng
                    </label>
                    <input
                      type="text"
                      required
                      value={editingGift.name}
                      onChange={(e) => setEditingGift({ ...editingGift, name: e.target.value })}
                      placeholder="Ví dụ: Vòng tay Seva Blossom Gold..."
                      className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs outline-none focus:border-rose-500/50 text-foreground font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      Mô tả quà tặng & Điều kiện nhận
                    </label>
                    <textarea
                      value={editingGift.description}
                      onChange={(e) => setEditingGift({ ...editingGift, description: e.target.value })}
                      placeholder="Mô tả cụ thể (Ví dụ: Chế tác bằng bạc S925 mạ bạch kim v.v.)"
                      className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs min-h-[60px] outline-none focus:border-rose-500/50 text-foreground"
                    />
                  </div>

                  {/* Image Select / Input Preview */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      Đường dẫn hình ảnh minh họa (URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={editingGift.imageUrl}
                        onChange={(e) => setEditingGift({ ...editingGift, imageUrl: e.target.value })}
                        placeholder="Hãy dán URL hình ảnh Unsplash..."
                        className="flex-1 bg-background border border-border rounded-[10px] px-3 py-2 text-xs outline-none focus:border-rose-500/50 text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const randSeed = Math.floor(Math.random() * 1000);
                          setEditingGift({
                            ...editingGift,
                            imageUrl: `https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=450&auto=format&fit=crop&q=60`,
                          });
                        }}
                        className="px-3 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-[10px] border border-border cursor-pointer transition-all shrink-0"
                      >
                        Nạp ảnh mẫu
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-rose-500 uppercase tracking-tight flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 fill-amber-500/10" />
                        Số điểm trừ tương ứng
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={editingGift.pointsRequired}
                        onChange={(e) =>
                          setEditingGift({ ...editingGift, pointsRequired: Number(e.target.value) })
                        }
                        className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs outline-none focus:border-rose-500/50 text-foreground font-bold"
                        placeholder="Ví dụ: 300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                        Số lượng tồn kho ban đầu
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editingGift.stockQuantity}
                        onChange={(e) =>
                          setEditingGift({ ...editingGift, stockQuantity: Number(e.target.value) })
                        }
                        className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-xs outline-none focus:border-rose-500/50 text-foreground"
                        placeholder="Ví dụ: 25"
                      />
                    </div>
                  </div>

                  {/* Tier Eligibility Select boxes (Hạng thành viên được tặng quà) */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-tight block">
                      Thành viên đủ điều kiện nhận quà
                    </label>
                    <div className="p-3 bg-muted/40 rounded-[10px] border border-border/20 grid grid-cols-2 gap-2">
                      {AVAILABLE_TIERS.map((tier) => {
                        const active = editingGift.eligibleTiers?.includes(tier);
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => {
                              const currentTiers = editingGift.eligibleTiers || [];
                              const updated = currentTiers.includes(tier)
                                ? currentTiers.filter((t) => t !== tier)
                                : [...currentTiers, tier];
                              setEditingGift({ ...editingGift, eligibleTiers: updated });
                            }}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-[10px] text-xs font-bold transition-all border text-left cursor-pointer",
                              active
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                                : "bg-background text-muted-foreground border-border hover:bg-muted"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={active}
                              readOnly
                              className="accent-rose-500 w-3.5 h-3.5 rounded"
                            />
                            Hạng {tier}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 border-t border-border bg-muted/10 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditor(false);
                      setEditingGift(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-border hover:bg-muted text-xs font-bold rounded-[10px] transition-all cursor-pointer text-center text-foreground"
                  >
                    Ủy thác Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-rose-500 text-white hover:bg-rose-600 text-xs font-bold rounded-[10px] transition-all shadow-md shadow-rose-500/10 cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Lưu quà tặng
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
