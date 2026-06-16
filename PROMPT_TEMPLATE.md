# Gợi ý Prompt để tạo ra các giao diện cùng chuẩn thiết kế (Design System) với hệ thống hiện tại

Bạn có thể copy toàn bộ đoạn Prompt dưới đây và gửi cho AI mỗi khi muốn tạo một trang (View) hoặc một component mới. Prompt này đã đóng gói toàn bộ quy chuẩn biến CSS, màu sắc, font chữ và cấu trúc layout của project.

---

**[COPY ĐOẠN DƯỚI ĐÂY]**

Bạn là một chuyên gia UI/UX và lập trình viên React. Hãy viết code cho một View (giao diện) có tên là `[TÊN_VIEW_MONG_MUỐN]` (ví dụ: `InventoryView`, `ReportsView`...) cho hệ thống quản lý. Bắt buộc phải tuân thủ nghiêm ngặt chuẩn thiết kế (design system) đang có như sau:

1. **Màu sắc & Tailwind Theme:**
   - Sử dụng thẻ cam làm Core Accent: `bg-primary`, `text-primary`, `border-primary` (mã tự động là `#eb7a2e`).
   - Nền trang và thẻ: Dùng phần nền chính là `bg-background` hoặc `bg-muted/10` cho không gian rộng.
   - Thẻ (Cards/Panels): Bắt buộc bo góc lớn `rounded-2xl` hoặc `rounded-3xl`. 
   - Sử dụng hiệu ứng kính (Glassmorphism): `bg-card/45` hoặc `bg-card/60` đi kèm `backdrop-blur-md` và `border border-border/60` để phần thẻ có độ nổi hiện đại, hỗ trợ hiệu ứng dark mode tốt.
   - Các vùng chứa phụ: Dùng `bg-muted/40` hoặc `bg-muted/20`.

2. **Typography (Cấu hình phông chữ):**
   - Headings/Tiêu đề chính: Bắt buộc dùng class `font-heading` (font Play mặc định trong HTML), kết hợp với `font-bold` hoặc `font-black`, `tracking-tight` (ví dụ: `className="text-lg font-bold font-heading"`).
   - Chữ thông thường (body): Dùng text chuẩn của bộ font Inter là `text-sm` hoặc `text-xs`. Ưu tiên màu `text-foreground` hoặc chữ nhạt màu `text-muted-foreground`.
   - Dữ liệu/Code/Tech data: Bắt buộc dùng class `font-mono` (JetBrains Mono) với size `text-[10px]` hoặc `text-xs`. Cùng với `uppercase tracking-wider` cho badge hoặc label nhỏ.

3. **Cấu trúc Banner & Tabs chuẩn:**
   - Cần có 1 Banner Header nằm ở `<div id="dashboard-upper-portal" />` hoặc đặt lên đầu trang. View bắt buộc phải có banner nổi bật:
     `<motion.div className="bg-card/45 border border-border/60 p-5 md:p-6 rounded-2xl shadow-xs backdrop-blur-md w-full flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-30">...`
   - Trong Banner, luôn có nút "Tài liệu" với icon `BookOpen` bên góc phải (`text-primary`).
   - Nếu View có chia Tabs: Sử dụng `<div className="flex gap-1 p-1 bg-muted/40 rounded-2xl w-fit">...</div>` với nút bấm khi Active là `bg-white dark:bg-zinc-800 text-primary shadow-sm scale-[1.02]`.

4. **Nút bấm & Trạng thái (Buttons):**
   - Primary Button: `bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-md`.
   - Outline Button: `bg-background border border-border text-foreground hover:bg-muted text-xs font-bold px-4 py-2 rounded-xl transition-all`.
   - Motion: Sử dụng Component `motion.div` / `motion.button` của thư viện `motion/react-client` cho các hành vi tương tác di chuột hoăc xuất hiện (ví dụ: `whileHover={{ y: -2 }}`).

5. **Icon & Tương quan hiển thị:**
   - Import 100% icon từ `lucide-react`. Dùng `w-4 h-4` hoặc `w-5 h-5` đính kèm margin theo thiết kế. Không dùng thư viện icon khác.
   - Sử dụng layout Grid/Flex responsive thông minh, luôn có spacing `space-y-6` hoặc `space-y-8` giữa các vùng nội dung chính.
   - Ưu tiên sử dụng `cn()` template string module cho class names (import từ `@/lib/utils`).

Hãy sinh ra toàn bộ code cho View này, không cần giải thích thêm.
