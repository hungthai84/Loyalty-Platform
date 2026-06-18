import React, { useState, useMemo } from 'react';
import { Customer, Company, AttributeDefinition } from '@/types';
import { Users, RefreshCw, Check } from 'lucide-react';

interface Props {
 customers: Customer[];
 companies: Company[];
 attributes: AttributeDefinition[];
}

export function CrossBranchAnalysis({ customers, companies, attributes }: Props) {
 const [selectedFields, setSelectedFields] = useState<string[]>(['phone']); // Default to phone
 const [analyzed, setAnalyzed] = useState(false);

 const baseFields = [
 { key: 'phone', label: 'Số điện thoại' },
 { key: 'email', label: 'Email' },
 { key: 'name', label: 'Họ và tên' },
 { key: 'facebook', label: 'Facebook / Link' },
 { key: 'zalo', label: 'Zalo' },
 ];

 const allFields = [
 ...baseFields,
 ...attributes.map(attr => ({ key: `custom_${attr.key}`, label: attr.label }))
 ];

 const toggleField = (key: string) => {
 setSelectedFields(prev => 
 prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
 );
 setAnalyzed(false); // Reset analysis if fields change
 };

 const getFieldValue = (customer: Customer, fieldKey: string) => {
 if (fieldKey.startsWith('custom_')) {
 const actualKey = fieldKey.replace('custom_', '');
 return customer.customFields?.[actualKey]?.toString().trim().toLowerCase() || '';
 }
 const val = (customer as any)[fieldKey];
 return val ? val.toString().trim().toLowerCase() : '';
 };

 // Grouping logic: find customers that share the EXACT same chosen fields BUT belong to DIFFERENT companies
 const overlapResults = useMemo(() => {
 if (!analyzed || selectedFields.length === 0) return [];

 const groups: Record<string, Customer[]> = {};

 customers.forEach(customer => {
 if (!customer.companyId) return; // Skip if no specific branch
 
 const keyParts = selectedFields.map(f => getFieldValue(customer, f));
 // Only group if all selected fields actually have a value
 if (keyParts.some(p => !p)) return;

 const groupKey = keyParts.join('|||');
 if (!groups[groupKey]) groups[groupKey] = [];
 groups[groupKey].push(customer);
 });

 const results = [];
 for (const [key, groupCustomers] of Object.entries(groups)) {
 // Find distinct companies in this group
 const distinctCompanyIds = new Set(groupCustomers.map(c => c.companyId));
 if (distinctCompanyIds.size > 1) {
 results.push({
 matchValue: key.split('|||').join(' - '),
 customers: groupCustomers,
 branchCount: distinctCompanyIds.size
 });
 }
 }

 return results.sort((a, b) => b.customers.length - a.customers.length);
 }, [customers, analyzed, selectedFields]);

 return (
 <div className="w-full bg-card border border-border shadow-sm rounded-[1.25rem] flex flex-col overflow-hidden">
 <div className="flex items-center justify-between p-6 border-b border-border bg-muted/10">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-primary/10 rounded-[10px] text-primary">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-foreground">Phân tích điểm chung giữa các chi nhánh</h2>
 <p className="text-xs text-muted-foreground mt-0.5">Phát hiện khách hàng trùng lặp hoặc giao thoa giữa các chi nhánh khác nhau.</p>
 </div>
 </div>
 </div>

 <div className="p-6 flex flex-col gap-6">
 <div className="space-y-4 border border-border rounded-[10px] p-5 bg-card">
 <div>
 <h3 className="text-sm font-bold">Chọn các trường dữ liệu để đối chiếu:</h3>
 <p className="text-xs text-muted-foreground mt-1">Các chi nhánh có khách hàng khớp giá trị hoàn toàn ở TẤT CẢ các trường được chọn dưới đây sẽ được nhóm lại.</p>
 </div>

 <div className="relative">
 <select
 multiple
 value={selectedFields}
 onChange={(e) => {
 const options = Array.from(e.target.selectedOptions, option => option.value);
 setSelectedFields(options);
 setAnalyzed(false);
 }}
 className="w-full bg-muted/50 border border-border rounded-[10px] text-sm p-2 outline-none focus:border-primary/50 min-h-[140px]"
 >
 {allFields.map(field => (
 <option key={field.key} value={field.key} className="p-1.5 hover:bg-background rounded cursor-pointer">
 {field.label} {selectedFields.includes(field.key) ? '✓' : ''}
 </option>
 ))}
 </select>
 <p className="text-[10px] text-muted-foreground mt-1">Giữ phím Ctrl (hoặc Cmd) để chọn nhiều trường. Những ô bắt buộc chọn được tô xám.</p>
 </div>

 <div className="flex justify-end pt-2 gap-3">
 <button
 onClick={() => {
 const toastElement = document.createElement('div');
 toastElement.className = "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-[10px] border backdrop-blur-2xl shadow-xl transition-all duration-300 bg-card border-[#2f6cf5]";
 toastElement.innerHTML = `<div class="text-xs font-bold text-foreground">Lưu kết quả phân tích trùng lặp chi nhánh thành công!</div>`;
 document.body.appendChild(toastElement);
 setTimeout(() => document.body.removeChild(toastElement), 3000);
 }}
 className="px-6 py-2 bg-muted text-foreground border border-border font-bold rounded-[10px] shadow-sm hover:bg-muted/80 transition-all text-sm flex items-center gap-2"
 >
 <Check className="w-4 h-4" />
 Lưu lại
 </button>
 <button
 onClick={() => setAnalyzed(true)}
 disabled={selectedFields.length === 0}
 className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-[10px] shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
 >
 <RefreshCw className="w-4 h-4" />
 Bắt đầu phân tích
 </button>
 </div>
 </div>

 {analyzed && (
 <div className="space-y-4">
 <h3 className="text-sm font-bold border-b border-border pb-2">
 Kết quả ({overlapResults.length} nhóm trùng lặp)
 </h3>
 
 {overlapResults.length === 0 ? (
 <div className="text-center py-12 px-4 border border-dashed rounded-[10px] bg-muted/10">
 <p className="text-sm font-medium">Tuyệt vời! Không phát hiện sự trùng lặp khách hàng nào ở các chi nhánh qua các trường đối chiếu trên.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {overlapResults.map((group, idx) => (
 <div key={idx} className="border border-border/80 rounded-[10px] overflow-hidden shadow-sm">
 <div className="bg-muted/30 p-3 px-4 flex items-center justify-between border-b border-border">
 <div className="text-xs font-bold text-primary">Biến số chung: <span className="text-foreground">{group.matchValue}</span></div>
 <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-background border px-2 py-0.5 rounded-full">
 {group.branchCount} chi nhánh
 </div>
 </div>
 <div className="divide-y divide-border/50 bg-background">
 {group.customers.map(c => {
 const company = companies.find(comp => comp.id === c.companyId);
 return (
 <div key={c.id} className="p-3 px-4 flex items-center justify-between hover:bg-muted/20">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
 {c.name.slice(0,2).toUpperCase()}
 </div>
 <div>
 <div className="text-sm font-bold">{c.name}</div>
 <div className="text-xs text-muted-foreground">ID: {c.id}</div>
 </div>
 </div>
 <div className="text-right">
 <div className="text-xs font-medium bg-muted px-2 py-1 rounded border inline-flex items-center gap-1.5">
 {company?.name || 'Chi nhánh ẩn'}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
