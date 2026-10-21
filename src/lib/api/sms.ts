// ============================================================
// Server-Side SMS OTP Service
// Real SMS via Fast2SMS (Indian numbers) — free tier supported
// Fallback: SQLite OTP storage (dev mode, shows code on screen)
// ============================================================
import { createServerFn } from "@tanstack/react-start";

// ─── Generate & Send OTP ──────────────────────────────────────

export const sendMobileOtp = createServerFn({ method: "POST" })
  .validator((data: { phone: string }) => {
    if (!data.phone || typeof data.phone !== "string") {
      throw new Error("Phone number is required.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<{ success: boolean; message: string; demoOtp?: string }> => {
    // Dynamic import keeps database.ts OUT of the browser bundle
    const { getDb } = await import("../../db/database.js");

    const db = getDb();

    // Ensure OTP table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        phone TEXT PRIMARY KEY,
        otp TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Clean phone — extract last 10 digits (Indian format)
    const digitsOnly = data.phone.replace(/\D/g, "");
    const cleanPhone = digitsOnly.slice(-10);

    if (cleanPhone.length !== 10) {
      return { success: false, message: "Please enter a valid 10-digit Indian mobile number." };
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();

    // Always store in DB first (used for verification regardless of SMS)
    db.prepare(`
      INSERT OR REPLACE INTO otp_verifications (phone, otp, created_at, verified)
      VALUES (?, ?, ?, 0)
    `).run(cleanPhone, otp, now);

    const apiKey = process.env["FAST2SMS_API_KEY"];

    // ── Real SMS via Fast2SMS ────────────────────────────────
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            "authorization": apiKey.trim(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: otp,
            numbers: cleanPhone,
          }),
        });

        const resData = (await response.json()) as {
          return?: boolean;
          message?: string[] | string;
          request_id?: string;
        };

        if (resData.return === true) {
          console.log(`✅ OTP SMS sent to +91${cleanPhone} (request_id: ${resData.request_id ?? "N/A"})`);
          return {
            success: true,
            message: `OTP sent to +91 ${cleanPhone}. Check your phone.`,
          };
        }

        const errMsg = Array.isArray(resData.message)
          ? resData.message.join(", ")
          : (resData.message ?? "SMS gateway returned an error");

        console.error("Fast2SMS error:", errMsg);
        return {
          success: true,
          message: `SMS gateway issue: ${errMsg}. Use the code shown below.`,
          demoOtp: otp,
        };
      } catch (err) {
        console.error("Fast2SMS network error:", err);
        return {
          success: true,
          message: "Could not reach SMS gateway. Use the code shown below.",
          demoOtp: otp,
        };
      }
    }

    // ── Dev mode — no API key, show code on screen ───────────
    console.log(`🔑 [DEV] OTP for +91${cleanPhone}: ${otp}`);
    return {
      success: true,
      message: "No SMS API key configured. Your OTP is shown below.",
      demoOtp: otp,
    };
  });

// ─── Verify OTP ──────────────────────────────────────────────

export const verifyMobileOtp = createServerFn({ method: "POST" })
  .validator((data: { phone: string; otp: string }) => {
    if (!data.phone || !data.otp) {
      throw new Error("Phone and OTP are required.");
    }
    return data;
  })
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    // Dynamic import keeps database.ts OUT of the browser bundle
    const { getDb } = await import("../../db/database.js");

    const db = getDb();

    db.exec(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        phone TEXT PRIMARY KEY,
        otp TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        verified INTEGER NOT NULL DEFAULT 0
      );
    `);

    const digitsOnly = data.phone.replace(/\D/g, "");
    const cleanPhone = digitsOnly.slice(-10);

    const record = db.prepare(`
      SELECT otp, created_at, verified FROM otp_verifications WHERE phone = ?
    `).get(cleanPhone) as { otp: string; created_at: number; verified: number } | undefined;

    if (!record) {
      return { success: false, message: "No OTP was requested for this phone number. Please go back and send OTP first." };
    }

    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - record.created_at > tenMinutes) {
      return { success: false, message: "OTP has expired (10 min limit). Please request a new one." };
    }

    if (record.verified === 1) {
      return { success: false, message: "This OTP was already used. Please request a new one." };
    }

    if (record.otp !== data.otp.trim()) {
      return { success: false, message: "Incorrect OTP. Please check the code and try again." };
    }

    db.prepare(`UPDATE otp_verifications SET verified = 1 WHERE phone = ?`).run(cleanPhone);

    return { success: true, message: "Phone number verified successfully!" };
  });
