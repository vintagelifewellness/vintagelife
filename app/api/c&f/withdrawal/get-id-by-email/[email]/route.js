import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User"; // ⚠️ APNA USER MODEL YAHAN IMPORT KARNA

export async function GET(request, { params }) {
  await dbConnect();

  try {
    const userEmail = params.email;

    if (!userEmail) {
      return Response.json(
        { message: "Email missing", success: false },
        { status: 400 }
      );
    }

    // Database me email se dscode nikalna
    const user = await UserModel.findOne({ email: userEmail });

    if (!user) {
      return Response.json(
        { message: "User not found", success: false },
        { status: 404 }
      );
    }

    return Response.json({
      message: "User found successfully",
      success: true,
      dscode: user.dscode // ⚠️ Check kar lena ID ka naam dscode hi hai na
    });

  } catch (error) {
    console.error("ID Fetch API Error:", error);
    return Response.json(
      { message: "Internal Server Error", success: false },
      { status: 500 }
    );
  }
}