import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
 className,
 size = "default",
 ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
 return (
 <div
 data-slot="card"
 data-size={size}
 className={cn(
 "group/card flex flex-col gap-4 overflow-hidden rounded-[10px] bg-card border border-border shadow-md py-4 text-sm text-card-foreground has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-[10px] *:[img:last-child]:rounded-b-[10px] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30",
 className
 )}
 {...props}
 />
 )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-header"
 className={cn(
 "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-[10px] px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
 className
 )}
 {...props}
 />
 )
}

function toSentenceCase(text: string): string {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (trimmed.length === 0) return text;
  
  let lower = trimmed.toLowerCase();
  let sentence = lower.charAt(0).toUpperCase() + lower.slice(1);
  
  // Restore known abbreviations
  const abbreviations = ["VIP", "CLV", "CRM", "ERP", "CSV", "QR", "TP.HCM", "VND"];
  abbreviations.forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    sentence = sentence.replace(regex, abbr);
  });
  
  return sentence;
}

function transformChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return toSentenceCase(child);
    }
    if (React.isValidElement(child)) {
      const element = child as React.ReactElement<any>;
      if (element.props && element.props.children) {
        return React.cloneElement(element, {
          children: transformChildren(element.props.children)
        });
      }
    }
    return child;
  });
}

function CardTitle({ className, children, ...props }: React.ComponentProps<"div">) {
  // Strip any font-size class or text-transform class passed down to enforce uniformity
  const sanitizedClassName = className
    ? className
        .split(" ")
        .filter((c) => !c.startsWith("text-") && !c.includes("text-[") && !c.startsWith("uppercase") && !c.startsWith("lowercase") && !c.startsWith("capitalize"))
        .join(" ")
    : "";

  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-bold text-foreground",
        sanitizedClassName
      )}
      {...props}
    >
      {transformChildren(children)}
    </div>
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-description"
 className={cn("text-sm text-muted-foreground", className)}
 {...props}
 />
 )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-action"
 className={cn(
 "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
 className
 )}
 {...props}
 />
 )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-content"
 className={cn("px-4 group-data-[size=sm]/card:px-3", className)}
 {...props}
 />
 )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
 return (
 <div
 data-slot="card-footer"
 className={cn(
 "flex items-center rounded-b-[10px] border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
 className
 )}
 {...props}
 />
 )
}

export {
 Card,
 CardHeader,
 CardFooter,
 CardTitle,
 CardAction,
 CardDescription,
 CardContent,
}
