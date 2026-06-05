import dbConnect from "@/lib/dbConnect";
import OrderModel from "@/model/Order";

export async function GET(request, { params }) {
    await dbConnect();
    try {
        const typeString = decodeURIComponent(params?.type || "");
        const isStatus = typeString === "true" ? true : false; 
        const data = await OrderModel.find({ status: isStatus, orderat: "C&F" });

        if (!data || data.length === 0) {
            return Response.json({ message: "Data not found!", success: false }, { status: 200 });
        }
        return Response.json({ data, success: true }, { status: 200 });
    } catch (error) {
        return Response.json({ message: "Error fetching data!", success: false }, { status: 500 });
    }
}