import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import bcrypt from "bcryptjs";
import CnfModel from "@/model/c&fusers"; 
import dbConnect from "@/lib/dbConnect";

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "Old and new passwords are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await CnfModel.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { message: "C&F User not found in database." },
        { status: 404 }
      );
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { message: "Incorrect current password." },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedNewPassword;
    user.plainpassword = newPassword;
    await user.save();

    return NextResponse.json(
      { message: "C&F Password updated successfully!" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Change Password Error:", error);
    return NextResponse.json(
      { message: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}