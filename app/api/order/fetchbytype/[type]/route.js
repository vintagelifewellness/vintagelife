import dbConnect from "@/lib/dbConnect";
import OrderModel from "@/model/Order";
import CnfModel from "@/model/c&fusers";

export async function GET(request, { params }) {
    await dbConnect();

    try {
        const type = decodeURIComponent(params?.type || "");

        const orders = await OrderModel.find({
            status: type,
            deleted: false,
        }).lean();

        if (!orders.length) {
            return Response.json(
                {
                    message: "Data not found!",
                    success: false,
                },
                { status: 200 }
            );
        }

        // Get all unique cfIds from orders
        const cfIds = [
            ...new Set(
                orders
                    .map((order) => order.cfId)
                    .filter(Boolean)
                    .map((id) => id.toString())
            ),
        ];

        // Find matching CNF users
        const cnfs = await CnfModel.find({
            _id: { $in: cfIds },
        }).lean();

        // Create lookup map
        const cnfMap = new Map(
            cnfs.map((cnf) => [cnf._id.toString(), cnf.cfName])
        );

        // Add cfName to every order
        const data = orders.map((order) => ({
            ...order,
            cfName: order.cfId
                ? cnfMap.get(order.cfId.toString()) || null
                : null,
        }));

        return Response.json(
            {
                data,
                success: true,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching data:", error);

        return Response.json(
            {
                message: "Error fetching data!",
                success: false,
            },
            { status: 500 }
        );
    }
}