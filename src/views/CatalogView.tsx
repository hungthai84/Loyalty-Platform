import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Package, Search, Plus, Globe, MapPin, Phone, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from "firebase/firestore";
import { Company, CatalogProduct } from "@/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { CompanyDialog } from "@/components/catalog/CompanyDialog";
import { ProductDialog } from "@/components/catalog/ProductDialog";

export function CatalogView() {
  const { user } = useFirebase();
  const [activeTab, setActiveTab] = useState<"companies" | "products">("companies");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    if (!user) return;

    const companiesRef = collection(db, "companies");
    const productsRef = collection(db, "catalog_products");

    const unsubCompanies = onSnapshot(query(companiesRef, orderBy("createdAt", "desc")), (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Company));
    });

    const unsubProducts = onSnapshot(query(productsRef, orderBy("createdAt", "desc")), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as CatalogProduct));
      setLoading(false);
    });

    return () => {
      unsubCompanies();
      unsubProducts();
    };
  }, [user]);

  const handleDeleteCompany = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa công ty này? Các sản phẩm liên quan sẽ mất liên kết.")) return;
    try {
      await deleteDoc(doc(db, "companies", id));
      toast.success("Đã xóa công ty thành công");
    } catch (error) {
      toast.error("Lỗi khi xóa công ty");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await deleteDoc(doc(db, "catalog_products", id));
      toast.success("Đã xóa sản phẩm thành công");
    } catch (error) {
      toast.error("Lỗi khi xóa sản phẩm");
    }
  };

  // Filters
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card rounded-[10px] border border-border shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight font-heading flex items-center gap-2">
            <Package className="w-5 h-5 text-primary shrink-0" />
            Sản phẩm & Công ty
          </h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Quản lý hệ sinh thái đối tác và danh mục sản phẩm chi tiết.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm..." 
                className="pl-9 h-9 rounded-lg bg-background border-border text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <Button 
            onClick={() => activeTab === 'companies' ? setShowCompanyDialog(true) : setShowProductDialog(true)}
            className="rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2 px-4 text-xs font-bold h-9"
           >
             <Plus className="w-4 h-4" />
             Thêm mới
           </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="bg-muted/50 p-1.5 rounded-full border border-border/50 h-auto inline-flex">
          <TabsTrigger value="companies" className="rounded-full px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 font-bold transition-all">
            <Building2 className="w-4 h-4" />
            Danh sách Công ty
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-full px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 font-bold transition-all">
            <Package className="w-4 h-4" />
            Kho Sản phẩm
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-6 outline-none">
          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredCompanies.map(company => (
                <motion.div
                  key={company.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="group overflow-hidden border-border/40 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-card/50 backdrop-blur-sm h-full flex flex-col">
                    <div className="relative h-20 bg-muted/30 border-b overflow-hidden">
                       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent group-hover:scale-125 transition-transform duration-700" />
                    </div>
                    
                    <CardHeader className="relative -mt-10 pb-2 space-y-4">
                       <div className="w-16 h-16 rounded-2xl bg-background border-2 border-background shadow-lg overflow-hidden flex items-center justify-center shrink-0 z-10">
                         {company.avatarUrl ? (
                           <img src={company.avatarUrl} alt={company.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                         ) : (
                           <Building2 className="w-8 h-8 text-primary/40" />
                         )}
                       </div>
                       <div>
                         <CardTitle className="text-xl font-black font-heading group-hover:text-primary transition-colors">{company.name}</CardTitle>
                         <div className="flex flex-col gap-1.5 mt-3">
                            <span className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" /> {company.address}
                            </span>
                            <span className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                              <Phone className="w-3.5 h-3.5 text-emerald-500" /> {company.phone}
                            </span>
                            {company.websiteUrl && (
                              <span className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                <Globe className="w-3.5 h-3.5 text-blue-500" /> {company.websiteUrl}
                              </span>
                            )}
                         </div>
                       </div>
                    </CardHeader>
                    
                    <CardContent className="mt-auto pt-4 flex gap-2 border-t bg-muted/20">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setEditingCompany(company); setShowCompanyDialog(true); }}
                        className="flex-1 h-9 rounded-lg hover:bg-background font-bold text-xs"
                       >
                         <Edit className="w-3.5 h-3.5 mr-2" /> Sửa
                       </Button>
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteCompany(company.id)}
                        className="flex-1 h-9 rounded-lg hover:bg-destructive/10 hover:text-destructive font-bold text-xs"
                       >
                         <Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa
                       </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Empty State */}
            {!loading && filteredCompanies.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <Building2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Chưa có công ty nào</h3>
                  <p className="text-muted-foreground text-sm">Bắt đầu bằng cách thêm công ty đầu tiên vào danh mục.</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6 outline-none">
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(product => {
                const company = companies.find(c => c.id === product.companyId);
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="group overflow-hidden border-border/40 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-card/50 backdrop-blur-sm h-full flex flex-col">
                      <div className="aspect-square relative overflow-hidden bg-muted/30">
                        {product.avatarUrl ? (
                          <img src={product.avatarUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-primary/20" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider shadow-sm border border-border/50">
                            {company?.name || "No Vendor"}
                          </span>
                        </div>
                      </div>
                      
                      <CardHeader className="p-4 space-y-1.5">
                        <CardTitle className="text-lg font-black font-heading group-hover:text-primary transition-colors leading-tight">
                          {product.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                          {product.description}
                        </p>
                        {product.website && (
                           <a href={product.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] text-blue-500 font-bold hover:underline">
                             <Globe className="w-3 h-3" /> {product.website.replace(/^https?:\/\//, '')}
                           </a>
                        )}
                      </CardHeader>
                      
                      <CardContent className="mt-auto px-4 pb-4 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { setEditingProduct(product); setShowProductDialog(true); }}
                          className="flex-1 h-9 rounded-lg font-bold text-xs"
                        >
                          <Edit className="w-3.5 h-3.5 mr-2" /> Chi tiết
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="w-10 h-9 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty State */}
            {!loading && filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <Package className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Chưa có sản phẩm nào</h3>
                  <p className="text-muted-foreground text-sm">Bắt đầu giới thiệu sản phẩm của các đối tác kinh doanh.</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showCompanyDialog && (
        <CompanyDialog 
          isOpen={showCompanyDialog} 
          onClose={() => { setShowCompanyDialog(false); setEditingCompany(null); }} 
          editingCompany={editingCompany}
        />
      )}
      
      {showProductDialog && (
        <ProductDialog 
          isOpen={showProductDialog} 
          onClose={() => { setShowProductDialog(false); setEditingProduct(null); }} 
          editingProduct={editingProduct}
          companies={companies}
        />
      )}
    </div>
  );
}
