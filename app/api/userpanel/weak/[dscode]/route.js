import dbConnect from "@/lib/dbConnect";
import PaymentHistoryModel from "@/model/PaymentHistory";
import UserModel from "@/model/User";
import ClosingHistoryModel from "@/model/ClosingHistory";

export async function GET(request, { params }) {
    await dbConnect();

    try {
        const { dscode } = params;

        // 1. Check user
        const user = await UserModel.findOne({ dscode });

        if (!user) {
            return Response.json({
                success: false,
                message: "User not found",
            });
        }

        // 2. Get latest closing
        const latestClosing = await ClosingHistoryModel
            .findOne()
            .sort({ createdAt: -1 });

        if (!latestClosing) {
            return Response.json({
                success: false,
                message: "No closing history found",
            });
        }

        const closingDate = latestClosing.createdAt;

        // 3. Latest closing ke BAAD ki saari payments
        const payments = await PaymentHistoryModel.find({
            dsid: dscode,
            type: "order",
            createdAt: { $gt: closingDate },
        });

        // 4. Calculate RP
        let saoRP = 0;
        let sgoRP = 0;

        payments.forEach((p) => {
            if (p.group === "SAO") {
                saoRP += Number(p.sp) || 0;
            }

            if (p.group === "SGO") {
                sgoRP += Number(p.sp) || 0;
            }
        });

        // 5. Prevent negative RP
        saoRP = Math.max(0, saoRP);
        sgoRP = Math.max(0, sgoRP);

        return Response.json({
            success: true,
            dscode,
            totalSAORP: saoRP,
            totalSGORP: sgoRP,
        });

    } catch (error) {
        console.error("Weekly RP API Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
}