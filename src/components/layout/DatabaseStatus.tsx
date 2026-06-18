import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Server, Timer, Terminal, ShieldCheck, RefreshCw } from "lucide-react";
import * as motion from "motion/react-client";

interface SQLStatus {
  success: boolean;
  status: "connected" | "disconnected";
  message: string;
  error?: string;
  latency?: number;
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<SQLStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const fetchStatus = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const response = await fetch("/api/sql/status");
      const data = await response.json();
      const end = performance.now();
      
      setStatus({
        ...data,
        latency: Math.round(end - start)
      });
      setLastCheck(new Date());
    } catch (err: any) {
      setStatus({
        success: false,
        status: "disconnected",
        message: "Lỗi kết nối API trạng thái cơ sở dữ liệu.",
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-500" />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span>Enterprise Backend</span>
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Cloud SQL Instance Monitor
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
              onClick={() => fetchStatus()}
              disabled={loading}
              title="Làm mới trạng thái"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
            {loading ? (
              <div className="flex h-2 w-2 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </div>
            ) : status?.success ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold py-0 h-5">
                ONLINE
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-[10px] font-bold py-0 h-5">
                OFFLINE
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/30 rounded-[10px] p-2 border border-border/40">
              <div className="flex items-center gap-1.5 mb-1">
                <Timer className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Độ trễ</span>
              </div>
              <div className="text-sm font-mono font-bold text-foreground">
                {status?.latency ? `${status.latency}ms` : "--"}
              </div>
            </div>
            <div className="bg-muted/30 rounded-[10px] p-2 border border-border/40">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Health</span>
              </div>
              <div className="text-sm font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                {status?.success ? "Healthy" : "Critical"}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
              <span className="text-muted-foreground flex items-center gap-1">
                <Terminal className="w-3 h-3" /> System Logs
              </span>
              <span className="text-primary/60">Real-time</span>
            </div>
            <div className={`text-[11px] leading-relaxed p-2.5 rounded-[10px] border ${status?.success ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-700/80 dark:text-emerald-400/80" : "bg-rose-500/5 border-rose-500/10 text-rose-700/80 dark:text-rose-400/80"}`}>
              {status?.message || "Nhấp để làm mới cấu hình kết nối..."}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 opacity-60">
            <div className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
              <Server className="w-2.5 h-2.5" />
              <span>asia-southeast1-a</span>
            </div>
            <div className="text-[9px] font-mono text-muted-foreground">
              Vừa cập nhật: {lastCheck.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
