import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { AuthRequest, requireAuth } from "./src/middleware/auth.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { db } from "./src/db/index.ts";
import { sql } from "drizzle-orm";
import nodemailer from "nodemailer";

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

  // Secure Proxy API for Zimbra SMTP Email Actions
  app.post("/api/zimbra/test", async (req, res) => {
    try {
      const { smtpHost, smtpPort, smtpUser, smtpPass, fromEmail, fromName, toEmail, subject, htmlContent } = req.body;
      
      const host = smtpHost || process.env.ZIMBRA_SMTP_HOST;
      const port = Number(smtpPort || process.env.ZIMBRA_SMTP_PORT || 587);
      const user = smtpUser || process.env.ZIMBRA_SMTP_USER;
      const pass = smtpPass || process.env.ZIMBRA_SMTP_PASSWORD;
      const from = fromEmail || process.env.ZIMBRA_SMTP_FROM || user;

      if (!host || !user || !pass) {
        return res.status(400).json({
          success: false,
          message: "Cấu hình Zimbra SMTP chưa đầy đủ. Vui lòng cung cấp Host, User và Password trong Settings hoặc file .env."
        });
      }

      const transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user: user,
          pass: pass,
        },
      });

      const mailOptions = {
        from: `"${fromName || "SEVA CRM Premium"}" <${from}>`,
        to: toEmail,
        subject: subject,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      
      return res.json({ success: true, message: "Đã gửi email kiểm tra thành công qua máy chủ Zimbra SMTP!" });
    } catch (err: any) {
      console.error("Zimbra SMTP Error:", err);
      return res.status(500).json({
        success: false,
        message: `Lỗi kết nối máy chủ Zimbra SMTP: ${err.message}`
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
