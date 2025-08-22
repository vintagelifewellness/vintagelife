import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import OrderModel from "@/model/Order";
import bcrypt from "bcryptjs";

export async function PATCH(req) {
    await dbConnect();

    try {
        const data = await req.json();

        if (!data.id) {
            return new Response(
                JSON.stringify({ success: false, message: "User ID is required!" }),
                { status: 400 }
            );
        }

        const user = await UserModel.findById(data.id);
        if (!user) {
            return new Response(
                JSON.stringify({ success: false, message: "User not found!" }),
                { status: 404 }
            );
        }

        // ✅ If usertype = "1", update activedate and handle SAO/SP calculation
        if (data.usertype === "1") {
            data.activedate = new Date();

            // Get orders for this user by dscode where status = true
            const userOrders = await OrderModel.find({ 
                dscode: user.dscode, 
                status: true 
            });

            if (userOrders.length > 0) {
                // Sum up totalsp of only completed orders
                let totalSP = userOrders.reduce(
                    (sum, order) => sum + parseFloat(order.totalsp || 0),
                    0
                );

                // Subtract totalSP from existing saosp
                let updatedSaosp = (parseFloat(user.saosp || 0) - totalSP);

                // Prevent negative values
                data.saosp = updatedSaosp < 0 ? "0" : updatedSaosp.toString();
            } else {
                // No completed orders → keep old saosp
                data.saosp = user.saosp;
            }

        }

        // ✅ Handle password update
        if (data.password && data.password !== user.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        // ✅ Handle level details update
        if (data.level) {
            data.LevelDetails = [
                ...(user.LevelDetails || []),
                {
                    levelName: data.level,
                    sao: user.saosp || "",
                    sgo: user.sgosp || "",
                },
            ];
        }

        await UserModel.updateOne({ _id: data.id }, { $set: data });

        return new Response(
            JSON.stringify({ success: true, message: "Updated successfully!" }),
            { status: 200 }
        );
    } catch (error) {
        console.error("User update error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                message: "Internal server error. Try again later.",
            }),
            { status: 500 }
        );
    }
}
