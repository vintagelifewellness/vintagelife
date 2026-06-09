import dbConnect from "@/lib/dbConnect";
import PaymentHistoryModel from "@/model/PaymentHistory";
import OrderModel from "@/model/Order";
import UserModel from "@/model/User";
import moment from "moment";
import ClosingHistoryModel from "@/model/ClosingHistory";
export async function GET(request, { params }) {
    await dbConnect();

    try {
        const { dscode } = params;

        // 1. Fetch user to get activation date
        const user = await UserModel.findOne({ dscode });
        if (!user) {
            return Response.json({
                success: false,
                message: "User not found",
            });
        }
        const activationDate = user.activedate;

        const latestClosing = await ClosingHistoryModel
            .findOne()
            .sort({ createdAt: -1 });

        if (!latestClosing) {
            return Response.json({
                success: false,
                message: "No closing history found",
            });
        }

        const weekStart = moment(latestClosing.createdAt);
        const weekEnd = weekStart.clone().add(1, "weeks");

        // 3. Fetch payment history within this week only
        const payments = await PaymentHistoryModel.find({
            dsid: dscode,
            type: "order",
            createdAt: { $gte: weekStart.toDate(), $lt: weekEnd.toDate() },
        });

        if (!payments || payments.length === 0) {
            return Response.json({
                success: false,
                message: "No payment history found for this week",
            });
        }

        // 4. Calculate SAO RP and SGO RP
        let saoRP = 0;
        let sgoRP = 0;

        payments.forEach((p) => {
            if (p.group === "SAO") {
                saoRP += Number(p.sp) || 0;
            } else if (p.group === "SGO") {
                sgoRP += Number(p.sp) || 0;
            }
        });

        // 5. Subtract SP for orders before activation & status true
        const preActivationOrders = await OrderModel.find({
            dscode,
            status: true,
            date: { $lt: activationDate },
        });

        preActivationOrders.forEach((order) => {
            const spToSubtract = Number(order.totalsp) || 0;
            if (order.salegroup === "SAO") {
                saoRP -= spToSubtract;
            } else if (order.salegroup === "SGO") {
                sgoRP -= spToSubtract;
            }
        });

        // Prevent negative RP
        saoRP = Math.max(0, saoRP);
        sgoRP = Math.max(0, sgoRP);

        return Response.json({
            success: true,
            dscode,
            totalSAORP: saoRP,
            totalSGORP: sgoRP,
        });
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
