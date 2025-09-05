import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PATCH(req) {
  await dbConnect();

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response(
      JSON.stringify({ success: false, message: "Not Authenticated. Please log in." }),
      { status: 401 }
    );
  }

  try {
    const { oldPassword, newPassword } = await req.json();
    const userId = session.user.id;

    if (!oldPassword || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, message: "Old and new passwords are required." }),
        { status: 400 }
      );
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found!" }),
        { status: 404 }
      );
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return new Response(
        JSON.stringify({ success: false, message: "Incorrect old password. Please try again." }),
        { status: 403 }
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { password: hashedNewPassword, plainpassword: newPassword } }, // ⚠️ plainpassword included
      { new: true }
    );

    if (!updatedUser) {
      return new Response(
        JSON.stringify({ success: false, message: "Password update failed!" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully!" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Password change error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error. Please try again later." }),
      { status: 500 }
    );
  }
}
