import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Customer, Company } from "@/types"

export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs))
}

export function getCustomerCode(customer: Customer, companies: Company[]): string {
  let prefix = "KH";
  if (customer.companyId) {
    const comp = companies.find((c) => c.id === customer.companyId);
    if (comp && comp.name) {
      const cleanName = comp.name.replace(/^[Cc]hi\s+[Nn]hánh\s+/i, "").trim();
      const noAccents = cleanName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "D");
      if (noAccents.length >= 2) {
        prefix = noAccents.slice(0, 2).toUpperCase();
      } else if (noAccents.length > 0) {
        prefix = (noAccents + "X").slice(0, 2).toUpperCase();
      }
    }
  }
  
  let digits = "000000000";
  if (customer.phone) {
    const numericPhone = customer.phone.replace(/[^0-9]/g, "");
    if (numericPhone.length >= 9) {
      digits = numericPhone.slice(-9);
    } else {
      digits = (numericPhone + "123456789").slice(0, 9);
    }
  } else {
    let h = 0;
    for (let i = 0; i < customer.id.length; i++) {
      h = (Math.imul(31, h) + customer.id.charCodeAt(i)) | 0;
    }
    const absH = Math.abs(h);
    digits = String(absH).padStart(9, "0").slice(0, 9);
  }
  
  return `${prefix}${digits}`;
}

