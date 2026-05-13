import dbConnect from "@/lib/dbConnect";
import OrderModel from "@/model/Order";
import { NextResponse } from "next/server";

export async function PUT(req, context) {
    try {
        await dbConnect();

        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Id is required",
                },
                { status: 400 }
            );
        }

        const deletedorder = await OrderModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    deleted: false,
                },
            },
            {
                new: true,
            }
        );


        if (!deletedorder) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Order not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Order deleted successfully",
                data: deletedorder,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
            },
            { status: 500 }
        );
    }
}