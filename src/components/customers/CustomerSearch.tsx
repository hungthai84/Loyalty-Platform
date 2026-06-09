import React, { useState, useRef, useEffect } from "react";
import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Customer } from "@/types";
import { cn } from "@/lib/utils";

interface CustomerSearchProps {
  customers: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
  value: string;
  onChange: (value: string) => void;
}

export function CustomerSearch({ customers, onSelectCustomer, value, onChange }: CustomerSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = customers.filter(c => {
    if (!value) return false;
    const q = value.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
  }).slice(0, 5); // Show top 5 matches

  const handleSelect = (customer: Customer) => {
    onChange(customer.name);
    setIsOpen(false);
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
  };

  return (
    <div className="relative w-full md:w-80" ref={containerRef}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Tìm kiếm danh sách khách hàng (Họ tên, SĐT, Mã KH)..."
        className="pl-8 bg-background h-9 text-xs font-semibold"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (value) setIsOpen(true);
        }}
      />
      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-10 left-0 w-full bg-card border border-border shadow-lg rounded-xl z-50 overflow-hidden py-1">
          <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
            <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Kết quả tìm kiếm</h4>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {searchResults.map(customer => (
              <button
                key={customer.id}
                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b border-border/30 last:border-0 transition-colors flex items-start gap-3"
                onClick={() => handleSelect(customer)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {customer.avatarUrl ? (
                    <img src={customer.avatarUrl} alt={customer.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{customer.name}</p>
                  <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">{customer.id}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {isOpen && value && searchResults.length === 0 && (
        <div className="absolute top-10 left-0 w-full bg-card border border-border shadow-lg rounded-xl z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">Không tìm thấy khách hàng nào khớp với tìm kiếm.</p>
        </div>
      )}
    </div>
  );
}
