// app/api/c&f/verify-otp/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyOtp } from "@/lib/otpStore";

export async function POST(req) {
  try {
    const { otp } = await req.json();
    const email = process.env.EMAIL_USER;

    if (!otp) {
      return NextResponse.json(
        { success: false, message: "OTP required" },
        { status: 400 }
      );
    }

    const result = verifyOtp(email, otp);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { role: "stock-admin", email },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: "5m" }
    );

    return NextResponse.json({ success: true, token });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 500 }
    );
  }
}