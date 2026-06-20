import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays, Bell, Sparkles, Tag, Info, AlertCircle, Activity, RefreshCw } from "lucide-react";
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
  company?: string;
  branch?: string;
  imageUrl?: string;
}

const CATEGORIES = [
  { value: "points_boost", label: "Nhân hệ số điểm", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { value: "double_tier", label: "Gấp đôi tích luỹ cấp", color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
  { value: "exclusive_discount", label: "Giảm giá đặc biệt", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { value: "free_gift", label: "Quà tặng miễn phí", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { value: "other", label: "Khác", color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
];

const PRESETS: PromoEvent[] = [];

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
  const [subTab, setSubTab] = useState<"promo" | "recurring">("promo");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDateStr, setStartDateStr] = useState("2026-06-15");
  const [endDateStr, setEndDateStr] = useState("2026-06-16");
  const [multiplier, setMultiplier] = useState(2.0);
  const [category, setCategory] = useState<PromoEvent["category"]>("points_boost");
  const [color, setColor] = useState("#eab308");
  const [company, setCompany] = useState("");
  const [branch, setBranch] = useState("");
  const [imageUrl, setImageUrl] = useState("");

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      company,
      branch,
      imageUrl,
    };

    setEvents([...events, newEvent]);
    toast.success("Đã lên lịch sự kiện khuyến mại thành công!");
    
    // Reset form
    setTitle("");
    setDescription("");
    setCompany("");
    setBranch("");
    setImageUrl("");
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
    <div className="space-y-6">
      {/* Sub-tab Pill controllers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Lịch trình & Tiến trình tự động
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi các chiến dịch khuyến mại VIP hàng tháng và hệ thống tự động hóa định kỳ.
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border/50 rounded-full shrink-0">
          <button
            onClick={() => setSubTab("promo")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === "promo"
                ? "bg-white dark:bg-card text-foreground shadow-xs border border-border/40 font-extrabold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Lịch sự kiện khuyến mại
          </button>
          <button
            onClick={() => setSubTab("recurring")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === "recurring"
                ? "bg-white dark:bg-card text-foreground shadow-xs border border-border/40 font-extrabold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-rose-500" />
            Lịch & Chu kỳ định kỳ
          </button>
        </div>
      </div>

      {subTab === "promo" ? (
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
        </CardContent>
      </Card>

      {/* Side event creation & upcoming rules schedule form */}
      <div className="lg:col-span-4 space-y-6">
        {/* Interactive view of selected date events - MOVED FROM CALENDAR CARD */}
        {selectedDate && (
          <Card className="bg-card border-border shadow-md animate-in slide-in-from-right duration-300">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 border rounded-[8px] bg-primary/10">
                    <CalendarDays className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Chi tiết ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}</CardTitle>
                    <CardDescription className="text-[10px]">
                      {selectedDateEvents.length} ưu đãi đã cài đặt
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {selectedDateEvents.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1 opacity-60">
                  <Bell className="w-8 h-8 mb-1" />
                  Trống lịch trình
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((evt) => {
                    const catObj = CATEGORIES.find(c => c.value === evt.category);
                    return (
                      <div 
                        key={evt.id} 
                        className="p-3 border rounded-[10px] bg-muted/20 flex flex-col gap-2 relative group"
                      >
                        <div className="flex gap-2.5">
                          {evt.imageUrl && (
                            <div className="w-12 h-12 rounded-[8px] overflow-hidden border shrink-0">
                              <img src={evt.imageUrl} alt={evt.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="space-y-1 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-xs text-foreground truncate">{evt.title}</h4>
                              {evt.multiplier > 1 && (
                                <span className="px-1.5 py-0.5 text-[8px] font-black bg-amber-500/15 text-amber-600 rounded-full">
                                  x{evt.multiplier}
                                </span>
                              )}
                            </div>
                            <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold rounded-full border ${catObj?.color || ""}`}>
                              {catObj?.label || "Khác"}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 italic">{evt.description}</p>
                        
                        {(evt.company || evt.branch) && (
                          <div className="flex items-center gap-2 text-[9px] text-primary/80 font-bold border-t border-border/40 pt-2">
                            {evt.company && <span className="truncate">🏢 {evt.company}</span>}
                            {evt.branch && <span className="truncate">📍 {evt.branch}</span>}
                          </div>
                        )}

                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-rose-500 bg-muted/40 hover:bg-rose-500/10 rounded-[6px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Công ty</label>
                  <input 
                    type="text" 
                    placeholder="Tên công ty"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-background border rounded-[10px] p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Chi nhánh</label>
                  <input 
                    type="text" 
                    placeholder="Tên chi nhánh"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-background border rounded-[10px] p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider block mb-1">Hình ảnh sự kiện</label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="event-image-upload"
                  />
                  <label 
                    htmlFor="event-image-upload"
                    className="w-full py-2 px-3 border-2 border-dashed border-border rounded-[10px] text-xs text-muted-foreground hover:bg-muted/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-5 h-5 opacity-50" />
                    <span>Click để tải ảnh lên</span>
                  </label>
                  {imageUrl && (
                    <div className="relative w-full aspect-video rounded-[10px] overflow-hidden border">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

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

        {/* Dynamic tips card - simplified and separated */}
        <div className="p-4 text-xs text-muted-foreground flex items-start gap-2.5 opacity-80 italic">
          <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-foreground block not-italic">Đồng bộ các chiến dịch</span>
            <p className="leading-relaxed">
              Các chiến dịch sau khi lên lịch sẽ được biểu diễn sinh động trực quan. Bạn có thể thay đổi tháng để theo dõi lịch trình quảng cáo rộng khắp năm 2026.
            </p>
          </div>
        </div>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left animate-in fade-in duration-500">
          {/* Automated Schedules */}
          <Card className="lg:col-span-7 border border-border/60 shadow-sm bg-card">
            <CardHeader className="border-b bg-muted/5 pb-4 text-left">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-[8px]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black">Lịch Chiến Dịch Định Kỳ & Định Kỳ Mỗi Tuần</CardTitle>
                  <CardDescription className="text-[10px]">Tự động hóa nhân hệ số loyalty và phân bổ phần quà định kỳ.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-left">
              <div className="space-y-3">
                <div className="p-3 border rounded-[10px] bg-[#2f6cf5]/5 border-[#2f6cf5]/20 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground">💎 Cuối Tuần Vàng Trang Sức (Weekly Gold Event)</span>
                    <p className="text-[11px] text-muted-foreground">Diễn ra định kỳ thứ 7 & Chủ Nhật hàng tuần, tự động nhân x2.0 điểm thưởng cho tất cả các chi nhánh vàng 18K.</p>
                  </div>
                  <div className="bg-[#2f6cf5] text-white select-none whitespace-nowrap text-[9px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0">HÀNG TUẦN</div>
                </div>

                <div className="p-3 border rounded-[10px] bg-emerald-500/5 border-emerald-500/20 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#20a16b]">🎂 Sinh Nhật Vàng Tri Ân (Birthday Golden Gift)</span>
                    <p className="text-[11px] text-muted-foreground">Quét tự động vào lúc 08:00 sáng mỗi ngày, gửi trực tiếp voucher chiết khấu 10% cho khách hàng VIP có sinh nhật trùng với tháng.</p>
                  </div>
                  <div className="bg-emerald-500 text-white select-none whitespace-nowrap text-[9px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0">HÀNG NGÀY</div>
                </div>

                <div className="p-3 border rounded-[10px] bg-amber-500/5 border-amber-500/20 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground">🏅 Đánh Giá Lịch Sử Thăng Hạng Định Kỳ (Monthly Tier Clean)</span>
                    <p className="text-[11px] text-muted-foreground">Tự động hóa quét doanh số tổng lũy kế trong 365 ngày qua vào ngày 1 hàng tháng để cập nhật hạng & điểm thành viên chuẩn xác.</p>
                  </div>
                  <div className="bg-amber-500 text-white select-none whitespace-nowrap text-[9px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0">HÀNG THÁNG</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Automated Task Queue */}
          <Card className="lg:col-span-5 border border-border/60 shadow-sm bg-card">
            <CardHeader className="border-b bg-muted/5 pb-4 text-left">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#2f6cf5]/10 text-[#2f6cf5] rounded-[8px]">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black">Xử Lý Đồng Bộ Cron-Job Định Kỳ</CardTitle>
                  <CardDescription className="text-[10px]">Trạng thái thiết lập các quy trình tự động hóa.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-left">
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Đăng ký thành viên tự động CRM</span>
                  </div>
                  <span className="font-bold text-emerald-500 font-mono">Hoạt động</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Gửi mã OTP & Kích hoạt qua Zalo</span>
                  </div>
                  <span className="font-bold text-emerald-500 font-mono">Hoạt động</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Sao lưu cơ sở dữ liệu lên Cloud Firestore</span>
                  </div>
                  <span className="font-bold text-emerald-500 font-mono">Đồng bộ</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span>Giao tiếp API SMS Brandname</span>
                  </div>
                  <span className="font-bold text-muted-foreground font-mono">Tạm dừng</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Tiến trình phân tích định kỳ đã được làm mới thành công!");
                  }}
                  className="w-full text-center py-2.5 bg-[#2f6cf5] text-white hover:bg-[#2f6cf5]/90 rounded-[10px] text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-[#2f6cf5]/20 cursor-pointer"
                >
                  Trigger Kiểm Tra Định Kỳ Ngay
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
