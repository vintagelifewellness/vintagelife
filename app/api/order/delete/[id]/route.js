import dbConnect from "@/lib/dbConnect";

import OrderModel from "@/model/Order";
import { NextResponse } from "next/server"; // ✅ Import this

export async function DELETE(req, { params }) {
    await dbConnect();

    try {
        const { id } = params;
        const deletedorder = await OrderModel.findOneAndDelete({ _id: id });

        if (!deletedorder) {
            return NextResponse.json({
                message: "order not found",
                success: false
            }, { status: 404 });
        }

        return NextResponse.json({
            message: "order deleted successfully",
            success: true
        }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({
            message: "Error deleting order",
            success: false
        }, { status: 500 });
    }
}
