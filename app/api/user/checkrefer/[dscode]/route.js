import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

export async function GET(request, { params }) {
    await dbConnect();

    try {
        const { dscode } = params;
        const { searchParams } = new URL(request.url);
        const group = searchParams.get("group"); // SAO or SGO

        const user = await UserModel.findOne({ dscode });
        if (!user) {
            return Response.json({ message: "User not found!", success: false }, { status: 404 });
        }

        if (!group || !["SAO", "SGO"].includes(group)) {
            return Response.json({ message: "Invalid group selected!", success: false }, { status: 400 });
        }

        const existingUser = await UserModel.findOne({ pdscode: dscode, group });

        if (existingUser) {
            return Response.json({
                message: `${group} position already assigned to ${existingUser.name}!`,
                success: false,
            }, { status: 400 });
        }

        // Valid Case (slot empty for selected group)
        return Response.json({
            name: user.name,
            message: `${group} position available.`,
            success: true,
        }, { status: 200 });

    } catch (error) {
        console.error("Error on verifying sponsor:", error);
        return Response.json(
            { message: "Internal Server Error", success: false },
            { status: 500 }
        );
    }
}
