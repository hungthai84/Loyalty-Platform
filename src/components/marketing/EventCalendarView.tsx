import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, Bell, Sparkles, Tag, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PromoEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  multiplier: number;
  category: "points_boost" | "double_tier" | "exclusive_discount" | "free_gift" | "other";
  color: string;
}

const CATEGORIES = [
  { value: "points_boost", label: "Nhân hệ số điểm", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { value: "double_tier", label: "Gấp đôi tích luỹ cấp", color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  { value: "exclusive_discount", label: "Giảm giá đặc biệt", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { value: "free_gift", label: "Quà tặng miễn phí", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { value: "other", label: "Khác", color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
];

const PRESETS: PromoEvent[] = [
  {
    id: "preset-1",
    title: "Ngày Hội Thành Viên - Double Points",
    description: "Nhân đôi điểm thưởng cho toàn bộ đơn hàng thanh toán qua ví điện tử.",
    startDate: "2026-06-15",
    endDate: "2026-06-18",
    multiplier: 2.0,
    category: "points_boost",
    color: "#eab308", // amber-500
  },
  {
    id: "preset-2",
    title: "Sự Kiện Tri Ân VIP Diamond",
    description: "Được đổi voucher quà tặng độc quyền không giới hạn số lượng ngày cuối tuần.",
    startDate: "2026-06-25",
    endDate: "2026-06-27",
    multiplier: 1.0,
    category: "exclusive_discount",
    color: "#f43f5e", // rose-500
  },
  {
    id: "preset-3",
    title: "Chương Trình Đón Hè: Mini Gift",
    description: "Tặng ngẫu nhiên Summer Drink Box cho hội viên có phát sinh giao dịch trên 300K.",
    startDate: "2026-07-04",
    endDate: "2026-07-06",
    multiplier: 1.0,
    category: "free_gift",
    color: "#10b981", // emerald-500
  }
];

export function EventCalendarView() {
  const [events, setEvents] = useState<PromoEvent[]>(() => {
    const saved = localStorage.getItem("marketing_promo_events");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return PRESETS;
      }
    }
    return PRESETS;
  });

  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // June 2026 (matching preset dates context)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2026, 5, 15));

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDateStr, setStartDateStr] = useState("2026-06-15");
  const [endDateStr, setEndDateStr] = useState("2026-06-16");
  const [multiplier, setMultiplier] = useState(2.0);
  const [category, setCategory] = useState<PromoEvent["category"]>("points_boost");
  const [color, setColor] = useState("#eab308");

  useEffect(() => {
    localStorage.setItem("marketing_promo_events", JSON.stringify(events));
  }, [events]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (dayNum: number) => {
    setSelectedDate(new Date(year, month, dayNum));
  };

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (y: number, m: number) => {
    const firstDay = new Date(y, m, 1).getDay();
    // Adjust Sunday to be 6 if we want Monday to be 0, or leave Sunday as 0
    return firstDay; 
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Helper: check if event falls on a specific date (Y-M-D)
  const isEventOnDate = (event: PromoEvent, checkDate: Date) => {
    const start = new Date(event.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(event.endDate);
    end.setHours(23, 59, 59, 999);
    
    const check = new Date(checkDate);
    check.setHours(12, 0, 0, 0);
    return check >= start && check <= end;
  };

  const getEventsForDate = (checkDate: Date) => {
    return events.filter(event => isEventOnDate(event, checkDate));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên chương trình ưu đãi");
      return;
    }
    if (!startDateStr || !endDateStr) {
      toast.error("Vui lòng chọn ngày bắt đầu và ngày kết thúc");
      return;
    }
    if (new Date(startDateStr) > new Date(endDateStr)) {
      toast.error("Ngày kết thúc không thể trước ngày bắt đầu");
      return;
    }

    const newEvent: PromoEvent = {
      id: `evt-${Date.now()}`,
      title,
      description,
      startDate: startDateStr,
      endDate: endDateStr,
      multiplier: Number(multiplier),
      category,
      color,
    };

    setEvents([...events, newEvent]);
    toast.success("Đã lên lịch sự kiện khuyến mại thành công!");
    
    // Reset form
    setTitle("");
    setDescription("");
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
    toast.success("Chương trình ưu đãi đã được gỡ bỏ khỏi lịch trình.");
  };

  const formattedMonthYear = currentDate.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric"
  });

  // Collect weeks
  const calendarCells = [];
  // Empty slots before first day
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Days in month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left animate-in fade-in duration-500">
      
      {/* Dynamic Month Calendar Grid inside dynamic card */}
      <Card className="lg:col-span-8 bg-card border-border shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 border rounded-[10px] bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Lịch Trình Khuyến Mại Thành Viên</CardTitle>
              <CardDescription className="text-xs">
                Lên kế hoạch và theo dõi các ngày nhân điểm, tặng quà hoặc sale VIP.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 border rounded-[8px] bg-background hover:bg-muted text-muted-foreground transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-black text-foreground capitalize px-2 min-w-[120px] text-center">
              {formattedMonthYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 border rounded-[8px] bg-background hover:bg-muted text-muted-foreground transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground uppercase mb-2 border-b pb-2">
            <div>CN</div>
            <div>T2</div>
            <div>T3</div>
            <div>T4</div>
            <div>T5</div>
            <div>T6</div>
            <div>T7</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((dayNum, idx) => {
              if (dayNum === null) {
                return (
                  <div key={`empty-${idx}`} className="h-20 bg-muted/10 border border-transparent rounded-[8px]" />
                );
              }

              const cellDate = new Date(year, month, dayNum);
              const dayEvents = getEventsForDate(cellDate);
              const isSelected = selectedDate && cellDate.toDateString() === selectedDate.toDateString();
              const isToday = new Date().toDateString() === cellDate.toDateString();

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => handleDayClick(dayNum)}
                  className={`h-24 p-2 border rounded-[10px] bg-background shadow-xs hover:border-primary/50 cursor-pointer flex flex-col justify-between transition-all ${
                    isSelected 
                      ? "ring-2 ring-primary border-transparent bg-primary/5 shadow-md" 
                      : isToday 
                        ? "border-amber-500/80 bg-amber-500/5" 
                        : "border-border/80"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-black rounded-full w-5 h-5 flex items-center justify-center ${
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : isToday 
                          ? "bg-amber-500 text-white" 
                          : "text-foreground"
                    }`}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    )}
                  </div>

                  {/* Micro list of events inside cell */}
                  <div className="space-y-1 overflow-hidden max-h-12 mt-1">
                    {dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        style={{ borderLeftColor: evt.color }}
                        className="text-[9px] font-bold px-1.5 py-0.5 truncate border-l-2 bg-muted/40 text-foreground/90 rounded-[2px]"
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[8px] text-muted-foreground font-semibold px-1">
                        + {dayEvents.length - 2} sự kiện khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive view of selected date events */}
          {selectedDate && (
            <div className="mt-6 p-4 border bg-muted/10 rounded-[12px] text-left">
              <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                <span className="text-sm font-black text-foreground flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Sự kiện ngày {selectedDate.toLocaleDateString("vi-VN", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  {selectedDateEvents.length} ưu đãi đã cài đặt
                </span>
              </div>

              {selectedDateEvents.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1">
                  <Bell className="w-8 h-8 opacity-20 mb-1" />
                  Không có sự kiện quảng cáo hoặc nhân điểm nào được lên lịch vào ngày này.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((evt) => {
                    const catObj = CATEGORIES.find(c => c.value === evt.category);
                    return (
                      <div 
                        key={evt.id} 
                        className="p-3 border rounded-[10px] bg-background shadow-xs flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              style={{ backgroundColor: evt.color }}
                              className="w-2.5 h-2.5 rounded-full" 
                            />
                            <h4 className="font-extrabold text-sm text-foreground">{evt.title}</h4>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${catObj?.color || ""}`}>
                              {catObj?.label || "Khác"}
                            </span>
                            {evt.multiplier > 1 && (
                              <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500/15 text-amber-600 rounded-full border border-amber-500/20">
                                x{evt.multiplier} Điểm thưởng
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-normal">{evt.description}</p>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Khung giờ diễn ra: <strong>{evt.startDate}</strong> đến <strong>{evt.endDate}</strong>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 bg-muted/40 hover:bg-rose-500/10 rounded-[8px] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side event creation & upcoming rules schedule form */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 border rounded-[10px] bg-violet-500/10">
                <Sparkles className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Lên lịch Ưu đãi</CardTitle>
                <CardDescription className="text-xs">Setup mốc thời gian diễn ra chiến dịch</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Tên chương trình</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Giờ Vàng Thứ Bảy - x3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border rounded-[10px] p-2.5 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Diễn giải chương trình</label>
                <textarea 
                  placeholder="Nhập nội dung thông điệp chiến dịch cho khách áp dụng..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-background border rounded-[10px] p-2.5 text-xs text-foreground min-h-[60px] focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Bắt đầu</label>
                  <input 
                    type="date" 
                    required
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="w-full bg-background border rounded-[10px] p-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Kết thúc</label>
                  <input 
                    type="date" 
                    required
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="w-full bg-background border rounded-[10px] p-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Nhóm khuyến mại</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-background border rounded-[10px] p-2.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                >
                  <option value="points_boost">Hệ số tích luỹ điểm</option>
                  <option value="double_tier">Tích luỹ cấp bậc nâng hạng</option>
                  <option value="exclusive_discount">Giảm giá & Coupon độc quyền</option>
                  <option value="free_gift">Tặng quà hiện vật</option>
                  <option value="other">Chương trình khác</option>
                </select>
              </div>

              {category === "points_boost" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Hệ số nhân điểm thưởng (Multiplier)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="1"
                    max="10"
                    value={multiplier}
                    onChange={(e) => setMultiplier(Number(e.target.value))}
                    className="w-full bg-background border rounded-[10px] p-2.5 text-xs text-foreground font-black focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Mã màu nhận diện</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 border-0 rounded-[10px] p-0 overflow-hidden cursor-pointer bg-transparent"
                  />
                  <div className="text-xs text-muted-foreground">
                    Xác định màu hiển thị trên ô lịch ({color})
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-[10px] text-xs flex items-center justify-center transition-all cursor-pointer shadow-md shadow-primary/10"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Thêm Vào Lịch Trình
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Dynamic tips card */}
        <div className="bg-sky-500/5 p-4 rounded-[12px] border border-sky-500/10 text-xs text-muted-foreground flex items-start gap-2.5">
          <Info className="w-4.5 h-4.5 text-sky-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-foreground block">Đồng bộ các chiến dịch</span>
            <p className="leading-relaxed">
              Các chiến dịch sau khi lên lịch sẽ được biểu diễn sinh động trực quan. Bạn có thể thay đổi tháng để theo dõi lịch trình quảng cáo rộng khắp năm 2026.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
