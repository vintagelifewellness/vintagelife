import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CnfStockModel from "@/model/cnfstock";

export async function GET(request, { params }) {
    try {
        await dbConnect();

        const { dscode } = params;

        if (!dscode) {
            return NextResponse.json(
                {
                    success: false,
                    message: "dscode is required"
                },
                { status: 400 }
            );
        }

        const stock = await CnfStockModel.findOne({ dscode }).lean();

        if (!stock) {
            return NextResponse.json({
                success: true,
                data: {
                    dscode,
                    productDetails: []
                },
                message: "No stock found"
            });
        }

        return NextResponse.json({
            success: true,
            data: stock,
            message: "C&F stock fetched successfully"
        });

    } catch (error) {
        console.error("C&F Stock Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch C&F stock",
                error: error.message
            },
            { status: 500 }
        );
    }
}