import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Plus, Settings } from "lucide-react";
import * as motion from "motion/react-client";
import { useFirebase } from "@/components/FirebaseProvider";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { Customer, AttributeDefinition, Company } from "@/types";
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { AttributeManager } from "@/components/customers/AttributeManager";
import { handleFirestoreError, OperationType } from "@/lib/firestore-errors";
import { Building2 } from "lucide-react";

export function CustomersView() {
  const { user, loading: authLoading, signIn } = useFirebase();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAttrManager, setShowAttrManager] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const customersPath = `users/${user.uid}/customers`;
    const attrsPath = `users/${user.uid}/attributeDefinitions`;

    const qCustomers = query(collection(db, customersPath), orderBy("createdAt", "desc"));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, customersPath));

    const qAttrs = query(collection(db, attrsPath), orderBy("createdAt", "asc"));
    const unsubAttrs = onSnapshot(qAttrs, (snapshot) => {
      setAttributes(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AttributeDefinition)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, attrsPath));

    const qCompanies = query(collection(db, `users/${user.uid}/companies`), orderBy("name", "asc"));
    const unsubCompanies = onSnapshot(qCompanies, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Company)));
    }, (error) => console.error(error));

    return () => {
      unsubCustomers();
      unsubAttrs();
      unsubCompanies();
    };
  }, [user]);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.id?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCompany = selectedCompanyId === "all" || c.companyId === selectedCompanyId;
    
    return matchesSearch && matchesCompany;
  });

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Hoạt động</Badge>;
      case 'inactive':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none">Ít tương tác</Badge>;
      case 'churn_risk':
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none">Rủi ro rời bỏ</Badge>;
      default:
        return <Badge variant="secondary">Mới</Badge>;
    }
  };

  if (authLoading) return <div className="p-8 text-center">Đang tải...</div>;

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight font-heading">Quản lý Khách hàng</h2>
          <p className="text-muted-foreground text-sm mt-1">Vui lòng đăng nhập để quản lý cơ sở dữ liệu khách hàng của bạn.</p>
        </div>
        <button 
          onClick={signIn}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:scale-105 transition-transform shadow-lg"
        >
          Đăng nhập với Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading">Danh sách Khách hàng</h2>
          <p className="text-muted-foreground text-sm mt-1">Quản lý hồ sơ, thuộc tính tùy chỉnh và số dư điểm.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowAttrManager(true)}
            className="flex items-center justify-center px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" /> Trường tùy chỉnh
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors">
            <Download className="w-4 h-4 mr-2" /> Xuất dữ liệu
          </button>
          <button 
            onClick={() => setShowAddDialog(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm khách hàng
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm khách hàng..."
                className="pl-8 bg-background"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               <Building2 className="w-4 h-4 text-muted-foreground" />
               <select
                 className="bg-background border border-border rounded-md text-sm px-3 py-2 outline-none"
                 value={selectedCompanyId}
                 onChange={e => setSelectedCompanyId(e.target.value)}
               >
                 <option value="all">Tất cả chi nhánh</option>
                 {companies.map(c => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
               </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã KH</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Công ty</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Điểm</TableHead>
                {attributes.slice(0, 1).map(attr => (
                  <TableHead key={attr.id}>{attr.label}</TableHead>
                ))}
                <TableHead>Ngày tham gia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Đang tải dữ liệu khách hàng...</TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Không tìm thấy khách hàng nào.</TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{customer.id}</TableCell>
                    <TableCell className="font-medium">
                      <div>
                        {customer.name}
                        <p className="text-[10px] text-muted-foreground font-normal">{customer.email || 'Không có email'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.companyId ? (
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center overflow-hidden border border-border">
                              {companies.find(comp => comp.id === customer.companyId)?.logoUrl ? (
                                <img src={companies.find(comp => comp.id === customer.companyId)?.logoUrl} className="w-full h-full object-cover" />
                              ) : <Building2 className="w-3 h-3 text-muted-foreground" />}
                           </div>
                           <span className="text-xs font-medium">{companies.find(comp => comp.id === customer.companyId)?.name || '—'}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground italic">Cá nhân</span>}
                    </TableCell>
                    <TableCell>{renderStatusBadge(customer.activityStatus)}</TableCell>
                    <TableCell className="font-bold text-primary">{customer.points?.toLocaleString() || 0}</TableCell>
                    {attributes.slice(0, 1).map(attr => (
                      <TableCell key={attr.id} className="text-sm text-muted-foreground">
                        {customer.customFields?.[attr.key]?.toString() || '—'}
                      </TableCell>
                    ))}
                    <TableCell className="text-muted-foreground text-xs text-right whitespace-nowrap">
                      {customer.createdAt?.toDate?.()?.toLocaleDateString('vi-VN') || 'Vừa xong'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showAddDialog && (
        <AddCustomerDialog 
          onClose={() => setShowAddDialog(false)} 
          attributes={attributes}
        />
      )}

      {showAttrManager && (
        <AttributeManager 
          onClose={() => setShowAttrManager(false)} 
          attributes={attributes}
        />
      )}
    </div>
  );
}
