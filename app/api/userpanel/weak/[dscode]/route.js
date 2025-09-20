import dbConnect from "@/lib/dbConnect";
import PaymentHistoryModel from "@/model/PaymentHistory";
import OrderModel from "@/model/Order";
import UserModel from "@/model/User";
import moment from "moment";

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
        const activationDate = user.activationDate;

        // 2. Define "current week" based on Thursday 5 PM
        const now = moment();

        // This week's Thursday 5 PM
        let thisThursday = moment().isoWeekday(4).hour(17).minute(0).second(0).millisecond(0); // Thursday = 4 in isoWeekday

        // If today is before Thursday 5 PM, then current week started **last Thursday**
        let weekStart;
        if (now.isBefore(thisThursday)) {
            weekStart = thisThursday.clone().subtract(1, "weeks"); // last Thursday 5 PM
        } else {
            weekStart = thisThursday.clone(); // this week's Thursday 5 PM
        }

        const weekEnd = weekStart.clone().add(1, "weeks"); // next Thursday 5 PM

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
