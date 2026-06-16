import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { AuthRequest, requireAuth } from "./src/middleware/auth.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { db } from "./src/db/index.ts";
import { sql } from "drizzle-orm";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Database Health Check
  app.get("/api/sql/status", async (req, res) => {
    try {
      const host = process.env.SQL_HOST;
      if (!host) {
        return res.status(503).json({
          success: false,
          status: "disconnected",
          message: "Cloud SQL instance not provisioned. Please enable Cloud SQL integration and configure environment variables."
        });
      }

      // Simple query to verify connection
      await db.execute(sql`SELECT 1`);
      return res.json({ 
        success: true, 
        status: "connected",
        message: "Cloud SQL is online and responding." 
      });
    } catch (err: any) {
      console.error("Database status check failed:", err);
      return res.status(503).json({ 
        success: false, 
        status: "disconnected",
        error: err.message,
        message: err.message.includes("ECONNREFUSED") 
          ? "Could not connect to database host. Ensure the SQL_HOST is correct and the instance is accessible."
          : "Database connection error. Please verify your credentials and instance state."
      });
    }
  });

  // User Sync Endpoint
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const dbUser = await getOrCreateUser(
        user.uid, 
        user.email || "", 
        user.name, 
        user.picture
      );
      
      return res.json({
        success: true,
        message: "User synchronized successfully.",
        user: dbUser
      });
    } catch (err: any) {
      console.error("User sync error:", err);
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // POS Orders Gateway
  app.post("/api/pos/orders", async (req, res) => {
    try {
      const { customerPhone, orderId, total, items, date } = req.body;
      
      console.log(`[POS API Gateway] Received order ${orderId} for customer ${customerPhone}`);
      
      // Mock processing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return res.json({ 
        success: true, 
        message: "Dữ liệu đơn hàng từ POS đã được tiếp nhận thành công.",
        data: {
          id: orderId || `SO-${Math.floor(Math.random() * 10000)}`,
          date: date || new Date().toLocaleDateString('vi-VN'),
          total: total || 'Liên hệ mua hàng',
          status: 'Hoàn thành',
          items: items || 'Sản phẩm đồng bộ',
          statusClasses: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }
      });
    } catch (err: any) {
      console.error("POS API Gateway error:", err);
      return res.status(500).json({
        success: false,
        message: `Lỗi đồng bộ từ POS: ${err.message}`
      });
    }
  });

  // CRM Tickets Gateway
  app.post("/api/crm/tickets", async (req, res) => {
    try {
      const { customerPhone, ticketId, subject, severity, status, date } = req.body;
      
      console.log(`[CRM API Gateway] Received ticket ${ticketId} for customer ${customerPhone}`);
      
      // Mock processing delay
      await new Promise(resolve => setTimeout(resolve, 800));

      return res.json({ 
        success: true, 
        message: "Phiếu hỗ trợ từ CRM đã được tiếp nhận thành công.",
        data: {
          id: ticketId || `SUP-${Math.floor(Math.random() * 10000)}`,
          date: date || new Date().toLocaleDateString('vi-VN'),
          subject: subject || 'Yêu cầu hỗ trợ từ khách hàng',
          status: status || 'Đang xử lý',
          severity: severity || 'Thấp'
        }
      });
    } catch (err: any) {
      console.error("CRM API Gateway error:", err);
      return res.status(500).json({
        success: false,
        message: `Lỗi đồng bộ từ CRM: ${err.message}`
      });
    }
  });

  // Lazy Gemini Client initialization helper
  let aiClient: any = null;
  function getGeminiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in system environment. Please add it via Settings > Secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // API Route for Jewelry & Fashion Style AI Analytics
  app.post("/api/gemini/analyze-fashion", async (req, res) => {
    try {
      const { customerName, attributes } = req.body;
      const { fashionStyle, colorPalette, materials, occasions, brandReference, additionalNotes, gender, points } = attributes || {};

      const gemini = getGeminiClient();

      const prompt = `
      Hãy phân tích gu thời trang và phong cách trang sức của khách hàng cao cấp dựa trên các đặc điểm sau:
      - Tên khách hàng: ${customerName || "Khách VIP"}
      - Giới tính/Đối tượng: ${gender || "Chưa xác định"}
      - Gu thời trang tổng thể: ${fashionStyle || "Phong cách thanh lịch tự nhiên"}
      - Tông màu ưa thích: ${colorPalette || "Tông trung tính (Neutral)"}
      - Chất liệu trang sức muốn hướng tới: ${materials || "Bạch kim, Vàng trắng, Bạc cao cấp"}
      - Dịp hoặc Hoàn cảnh sử dụng: ${occasions || "Hàng ngày, Gặp gỡ đối tác"}
      - Thương hiệu/Phong cách tham chiếu: ${brandReference || "Cartier, Tiffany & Co."}
      - Ghi chú thêm: ${additionalNotes || "Không có thêm ghi chú"}
      - Điểm Loyalty tích lũy (Cột mốc chi tiêu): ${points || 0} pts

      YÊU CẦU:
      1. Đóng vai Giám đốc Sáng tạo và Chuyên gia Phong cách Trang sức cao cấp (Creative Director & High Jewelry Stylist).
      2. Đưa ra 1 nhận định chuyên sâu (khoảng 3-4 câu luận giải) về gout thẩm mỹ hiện tại của khách hàng.
      3. Đưa ra 1 dự đoán chi tiết và thuyết phục (kết luận) về dòng/loại trang sức, kiểu dáng, đá gắn, hoặc bộ sưu tập trang sức mà khách hàng có khả năng cao sẽ lựa chọn sử dụng trong thời gian tới (thể hiện sự tinh tế của thương hiệu).
      4. Tạo 1 khẩu hiệu miêu tả phong thái của họ ("vibe").
      5. Đề xuất 3 món trang sức cụ thể (tên tinh tế, xa xỉ) phù hợp nhất với phong thái này.

      Hãy trả về kết quả dưới định dạng JSON thuần túy theo mẫu cấu trúc dưới đây (KHÔNG bao gồm các khối mã markdown khác, chỉ trả về JSON có cấu trúc):
      {
        "analysis": "Lời nhận định phân tích gu thẩm mỹ của khách hàng ở đây...",
        "prediction": "Kết luận dự đoán cụ thể về trang sức khách hàng sẽ dùng trong thời gian tới và lý do tại sao...",
        "vibe": "Mô tả phong thái cốt lõi của khách hàng (VD: 'Thanh lịch vượt thời gian với nét cá tính ngầm')",
        "recommendedItems": [
          "Món thứ 1 (Mô tả ngắn gọn chất liệu/thiết kế)",
          "Món thứ 2 (Mô tả ngắn gọn chất liệu/thiết kế)",
          "Món thứ 3 (Mô tả ngắn gọn chất liệu/thiết kế)"
        ],
        "autoTags": ["Tag1", "Tag2", "Tag3"]
      }
      `;

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });

      const responseText = response.text || "{}";
      const cleanedJson = responseText.trim().replace(/^```json/, "").replace(/```$/, "").trim();
      const resultObj = JSON.parse(cleanedJson);

      return res.json({
        success: true,
        data: resultObj,
      });

    } catch (err: any) {
      console.error("Gemini API Error in analyze-fashion:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Lỗi xử lý AI phân tích thời trang. Hãy đảm bảo khóa API Gemini của bạn được đặt chính xác.",
        isMissingKey: err.message?.includes("GEMINI_API_KEY") || err.message?.includes("API_KEY")
      });
    }
  });

  // Serve static UI assets or run Vite Dev Server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
