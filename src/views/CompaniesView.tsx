import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Plus, Settings, MapPin, Globe, ChevronRight } from "lucide-react";
import * as motion from "motion/react-client";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Company } from "@/types";
import { CompanyDialog } from "@/components/companies/CompanyDialog";
import { cn } from "@/lib/utils";

export function CompaniesView({ embedded = false }: { embedded?: boolean }) {
  const { user } = useFirebase();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/companies`;
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Company)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching companies:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <div className={cn("flex-1 space-y-8", !embedded && "p-8 pt-6")}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-heading">Công ty & Chi nhánh</h2>
            <p className="text-muted-foreground text-sm mt-1">Quản lý các thương hiệu hoặc địa điểm kinh doanh để phân loại khách hàng.</p>
          </div>
          <button 
            onClick={() => { setSelectedCompany(undefined); setShowDialog(true); }}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/25 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Thêm mới
          </button>
        </div>
      )}

      {embedded && (
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => { setSelectedCompany(undefined); setShowDialog(true); }}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm chi nhánh mới
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Đang tải danh sách...</div>
        ) : companies.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold">Chưa có công ty nào</p>
              <p className="text-sm text-muted-foreground">Hãy bắt đầu bằng cách thêm thương hiệu hoặc chi nhánh đầu tiên của bạn.</p>
            </div>
          </div>
        ) : (
          companies.map((company) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={company.id}
            >
              <Card 
                onClick={() => { setSelectedCompany(company); setShowDialog(true); }}
                className="group cursor-pointer overflow-hidden border-none bg-card hover:shadow-2xl transition-all duration-300 rounded-3xl"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {company.logoUrl ? (
                         <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                      ) : (
                         <Building2 className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-2 border border-border rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-bold font-heading line-clamp-1">{company.name}</h4>
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{company.address || 'Chưa cập nhật địa chỉ'}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-muted" />
                          ))}
                          <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold">
                            +12
                          </div>
                       </div>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">156 Khách hàng</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {showDialog && (
        <CompanyDialog 
          onClose={() => setShowDialog(false)} 
          company={selectedCompany} 
        />
      )}
    </div>
  );
}
