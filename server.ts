import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Secure Proxy API for SendGrid Actions
  app.post("/api/sendgrid/test", async (req, res) => {
    try {
      const { apiKey, fromEmail, fromName, toEmail, subject, htmlContent } = req.body;
      const keyToUse = apiKey || process.env.SENDGRID_API_KEY;

      if (!keyToUse) {
        return res.status(400).json({
          success: false,
          message: "API Key chưa được cấu hình. Vui lòng cung cấp trong Settings hoặc file .env; hoặc nhập trực tiếp phía trên để kiểm tra thử nghiệm."
        });
      }

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${keyToUse}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: fromEmail, name: fromName || "SEVA CRM Premium" },
          subject: subject,
          content: [{ type: "text/html", value: htmlContent }]
        })
      });

      if (response.ok || response.status === 202) {
        return res.json({ success: true, message: "Đã gửi email kiểm tra thành công qua SendGrid API!" });
      } else {
        const errorData = await response.json().catch(() => ({}));
        const detailedError = errorData.errors?.[0]?.message || "Gặp phản hồi không hợp lệ từ SendGrid (kiểm tra lại API key hoặc email gửi đi đã được xác thực chưa).";
        return res.status(response.status).json({
          success: false,
          message: `SendGrid API Error: ${detailedError}`
        });
      }
    } catch (err: any) {
      console.error("Express SendGrid Proxy error:", err);
      return res.status(500).json({
        success: false,
        message: `Lỗi kết nối máy chủ tới SendGrid: ${err.message}`
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
