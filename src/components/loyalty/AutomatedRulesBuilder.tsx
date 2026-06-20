import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AutomatedRule {
  id: string;
  trigger: string;
  threshold: number;
  rewardType: string;
  rewardValue: string;
}

export function AutomatedRulesBuilder() {
  const [rules, setRules] = useState<AutomatedRule[]>([
    {
      id: "1",
      trigger: "points_reached",
      threshold: 1000,
      rewardType: "coupon",
      rewardValue: "10% coupon",
    }
  ]);
  const [trigger, setTrigger] = useState("points_reached");
  const [threshold, setThreshold] = useState(1000);
  const [rewardType, setRewardType] = useState("coupon");
  const [rewardValue, setRewardValue] = useState("");

  const handleAddRule = () => {
    if (!rewardValue) {
      toast.error("Please specify a reward value");
      return;
    }
    const newRule: AutomatedRule = {
      id: Date.now().toString(),
      trigger,
      threshold,
      rewardType,
      rewardValue,
    };
    setRules([...rules, newRule]);
    toast.success("Automated rule added!");
    setRewardValue("");
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    toast.success("Automated rule removed!");
  };

  return (
    <Card className="text-left bg-card border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 border rounded-[10px] bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Automated Rules Builder</CardTitle>
            <CardDescription>Configure trigger-based rewards</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-muted/40 p-4 rounded-[10px] border border-border">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">Trigger</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full bg-background border rounded-[10px] p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="points_reached">Points Reached</option>
              <option value="tier_upgraded">Tier Upgraded</option>
              <option value="inactivity">Inactivity Days</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">Threshold (e.g. 1000)</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              placeholder="1000"
              className="w-full bg-background border rounded-[10px] p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">Reward Type</label>
            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value)}
              className="w-full bg-background border rounded-[10px] p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="coupon">Discount Coupon</option>
              <option value="points">Bonus Points</option>
              <option value="free_gift">Free Gift</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">Reward Value</label>
            <input
              type="text"
              value={rewardValue}
              onChange={(e) => setRewardValue(e.target.value)}
              placeholder="e.g. 10% off"
              className="w-full bg-background border rounded-[10px] p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div>
            <button
              onClick={handleAddRule}
              className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-[10px] text-sm flex items-center justify-center transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Rule
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold text-foreground">Active Automated Rules</h4>
          {rules.length === 0 ? (
            <div className="text-sm text-muted-foreground p-6 bg-muted/20 border border-dashed rounded-[10px] text-center">
              No automated rules configured yet.
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-[10px] bg-background gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-muted rounded">IF</span>
                  <span className="text-sm font-bold text-primary">
                    {rule.trigger === "points_reached" ? "Points Reach" : rule.trigger === "tier_upgraded" ? "Tier Upgrades To" : "Inactivity Exceeds"}
                  </span>
                  <span className="text-sm font-bold">{rule.threshold}</span>
                  <span className="text-xs font-semibold px-2 py-1 bg-muted rounded">THEN GRANT</span>
                  <span className="text-sm font-bold text-rose-500">
                    {rule.rewardType === "coupon" ? "Coupon:" : rule.rewardType === "points" ? "Points:" : "Gift:"} {rule.rewardValue}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveRule(rule.id)}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-[10px] transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
