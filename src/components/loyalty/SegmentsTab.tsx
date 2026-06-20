import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tag, Users, Activity, CalendarDays, Plus, Trash2 } from "lucide-react";
import { Customer, SegmentationRule } from "@/types";
import { toast } from "sonner";

interface SegmentsTabProps {
  customers: Customer[];
  segmentationRules: SegmentationRule[];
}

interface LocalSegment {
  id: string;
  name: string;
  type: string;
  value: number;
}

export function SegmentsTab({ customers, segmentationRules }: SegmentsTabProps) {
  const [localSegments, setLocalSegments] = useState<LocalSegment[]>([
    { id: "s1", name: "High Spenders (Points > 5000)", type: "points_balance", value: 5000 },
    { id: "s2", name: "Inactive (> 90 days)", type: "inactive_days", value: 90 },
    { id: "s3", name: "Recent Signups (< 30 days)", type: "signup_days", value: 30 },
  ]);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("points_balance");
  const [newValue, setNewValue] = useState(100);

  const handleAddSegment = () => {
    if (!newName) {
      toast.error("Please enter a segment name");
      return;
    }
    setLocalSegments([
      ...localSegments,
      { id: Date.now().toString(), name: newName, type: newType, value: newValue }
    ]);
    toast.success("Segment created!");
    setNewName("");
  };

  const handleRemoveSegment = (id: string) => {
    setLocalSegments(localSegments.filter(s => s.id !== id));
    toast.success("Segment removed!");
  };

  const getSegmentCount = (seg: LocalSegment) => {
    const now = new Date();
    return customers.filter(c => {
      if (seg.type === "points_balance") {
        return (c.points || 0) >= seg.value;
      }
      if (seg.type === "inactive_days") {
        const lastActive = c.lastTransactionAt ? new Date(c.lastTransactionAt) : c.updatedAt ? new Date(c.updatedAt as string) : new Date(c.createdAt || now);
        const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));
        return diffDays >= seg.value;
      }
      if (seg.type === "signup_days") {
        const joinDate = new Date(c.createdAt || now);
        const diffDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 3600 * 24));
        return diffDays <= seg.value;
      }
      return false;
    }).length;
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 border rounded-[10px] bg-sky-500/10">
              <Tag className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <CardTitle>Dynamic Customer Segments</CardTitle>
              <CardDescription>Define segments based on behavior or points balance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-muted/40 p-4 rounded-[10px] border border-border">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Segment Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. VIP Potentials"
                className="w-full bg-background border rounded-[10px] p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Criteria Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-background border rounded-[10px] p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
              >
                <option value="points_balance">Points Balance (&ge;)</option>
                <option value="inactive_days">Inactive Days (&ge;)</option>
                <option value="signup_days">Days Since Signup (&le;)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Value</label>
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(Number(e.target.value))}
                className="w-full bg-background border rounded-[10px] p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <button
                onClick={handleAddSegment}
                className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-[10px] text-sm flex items-center justify-center transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Create
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localSegments.map((seg) => {
              const count = getSegmentCount(seg);
              const total = customers.length || 1;
              const percentage = Math.round((count / total) * 100);

              return (
                <div key={seg.id} className="p-5 border rounded-[10px] bg-background shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-base text-foreground">{seg.name}</h4>
                      <button onClick={() => handleRemoveSegment(seg.id)} className="text-muted-foreground hover:text-rose-500 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-4">
                      {seg.type === "points_balance" && <Activity className="w-3.5 h-3.5" />}
                      {seg.type === "inactive_days" && <CalendarDays className="w-3.5 h-3.5" />}
                      {seg.type === "signup_days" && <Users className="w-3.5 h-3.5" />}
                      <span>
                        {seg.type === "points_balance" ? `\u2265 ${seg.value} points` : 
                         seg.type === "inactive_days" ? `\u2265 ${seg.value} days inactive` : 
                         `\u2264 ${seg.value} days since signup`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-primary">{count}</span>
                      <span className="text-xs text-muted-foreground ml-1">customers</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
