import dbConnect from "@/lib/dbConnect";
import OrderModel from "@/model/Order";
import mongoose from "mongoose";
export async function GET(request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(request.url);
        const dscode = searchParams.get("dscode");

        if (!dscode) {
            return Response.json(
                { success: false, message: "ID missing!" },
                { status: 400 }
            );
        }

        let query = [];

        if (mongoose.Types.ObjectId.isValid(dscode)) {
            query.push({ cfId: new mongoose.Types.ObjectId(dscode) });
        }
        query.push({ cfId: dscode });

  
      

        const data = await OrderModel.find({
            $or: query,
             deleted: false
        }).sort({ createdAt: -1 });

        if (!data || data.length === 0) {
            return Response.json({
                message: "No Order Fond",
                success: false,
                data: []
            }, { status: 200 });
        }

        return Response.json({
            data,
            success: true
        }, { status: 200 });

    } catch (error) {
        
        console.error("Error:", error);
        return Response.json(
            { message: "Error!", success: false },
            { status: 500 }
        );
    }
}