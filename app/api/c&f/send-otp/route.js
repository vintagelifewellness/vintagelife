// app/api/c&f/send-otp/route.js
import { NextResponse } from "next/server";
import { sendOtpMail } from "@/lib/mailer";
import { setOtp } from "@/lib/otpStore";

export async function POST() {
  try {
    const email = process.env.EMAIL_USER;
    if (!email) {
      return NextResponse.json(
        { success: false, message: "EMAIL_USER not configured" },
        { status: 500 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(email, otp);
    await sendOtpMail(otp);

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${email}`,
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP. Check SMTP config." },
      { status: 500 }
    );
  }
}