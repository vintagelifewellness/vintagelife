import dbConnect from "@/lib/dbConnect";
import CnfModel from "@/model/c&fusers";
import LevelsModel from "@/model/Level";

export async function GET(request, { params }) {
  await dbConnect();

  try {
    const { id } = params;

    const user = await CnfModel.findOne({ dscode: id });
    if (!user) {
      return Response.json(
        {
          message: "User not found!",
          success: false,
        },
        { status: 404 }
      );
    }


    // Only proceed with level lookup and income calc if Cnftype is "0" or "1"
    if (user.Cnftype === "0" || user.Cnftype === "1") {
      const userLevel = await LevelsModel.findOne({ level_name: user.level });

      // If level not found or sao is invalid, income remains 0 and no error is returned
    }

    return Response.json(
      {
        ...user._doc,
      
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error on getting user:", error);
    return Response.json(
      {
        message: "Error on getting user!",
        success: false,
      },
      { status: 500 }
    );
  }
}
