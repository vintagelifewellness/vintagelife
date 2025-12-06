import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

export async function GET(req) {
    await dbConnect();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    try {
        // Fetch full user data for todayGreen instead of count
        const todayGreenUsers = await UserModel.find({
            activedate: { $gte: todayStart, $lte: todayEnd },
        });

        return Response.json({
            todayGreenCount: todayGreenUsers.length,
            todayGreenUsers, // full data
        });

    } catch (error) {
        console.error("Error getting todayGreen data:", error);
        return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
        });
    }
}
