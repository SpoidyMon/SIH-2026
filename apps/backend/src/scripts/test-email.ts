import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM || "otp@rupeshhh.in";

if (!resendApiKey) {
  console.error("❌ RESEND_API_KEY is not configured in .env");
  process.exit(1);
}

const resend = new Resend(resendApiKey);

const recipients = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : [
      "rupeshjagtap157@gmail.com",
      "rupeshwillbepro@gmail.com",
      "rupeshmhtcet@gmail.com",
    ];

async function sendTestEmails() {
  console.log("🚀 Starting Resend email delivery test...");
  console.log(`🔑 Using configured Resend API key`);
  console.log(`📤 From Address: ${fromEmail}\n`);

  for (const email of recipients) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📨 Sending verification email to: ${email}...`);

    try {
      const response = await resend.emails.send({
        from: `SIH Agricultural Platform <${fromEmail}>`,
        to: [email],
        subject: "Verify Your Account — SIH Agricultural Platform",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
            <h2 style="color: #2e7d32; margin-top: 0;">SIH Agricultural Marketplace</h2>
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 15px; color: #555;">Please use the following 6-digit One-Time Password (OTP) to verify your account:</p>
            <div style="background-color: #f1f8e9; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px dashed #81c784;">
              <span style="font-size: 34px; font-weight: bold; letter-spacing: 6px; color: #1b5e20;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px; margin-bottom: 0;">© ${new Date().getFullYear()} SIH Agricultural Marketplace. All rights reserved.</p>
          </div>
        `,
        text: `Your SIH Platform verification OTP is: ${otp}. Valid for 10 minutes.`,
      });

      if (response.error) {
        console.error(`❌ Error sending to ${email}:`, response.error);
      } else {
        console.log(`✅ Successfully sent to ${email}! Message ID: ${response.data?.id}`);
      }
    } catch (err) {
      console.error(`💥 Exception sending to ${email}:`, err);
    }
  }

  console.log("\n🏁 Email dispatch script finished.");
}

sendTestEmails();
