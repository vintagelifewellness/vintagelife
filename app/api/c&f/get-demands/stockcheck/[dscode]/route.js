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


export async function PUT(request, { params }) {
    try {
        await dbConnect();
        const { dscode } = params;
        const body = await request.json();
        const { action, product, quantity, price, sp } = body;

        if (!dscode) {
            return NextResponse.json({ success: false, message: "dscode is required" }, { status: 400 });
        }

        let stockDoc = await CnfStockModel.findOne({ dscode });

        // If no stock exists for this DS code and we are adding a product, create a new doc
        if (!stockDoc && action === "ADD_PRODUCT") {
            stockDoc = new CnfStockModel({ dscode, productDetails: [] });
        } else if (!stockDoc) {
            return NextResponse.json({ success: false, message: "Stock not found" }, { status: 404 });
        }

        if (action === "ADD_PRODUCT") {
            const existingIndex = stockDoc.productDetails.findIndex(p => p.product === product);
            if (existingIndex > -1) {
                // If it already exists, just add the new quantity to the existing one
                stockDoc.productDetails[existingIndex].quantity = Number(stockDoc.productDetails[existingIndex].quantity || 0) + Number(quantity);
            } else {
                // Add new product
                stockDoc.productDetails.push({
                    product,
                    quantity: Number(quantity),
                    price: Number(price || 0),
                    sp: Number(sp || 0)
                });
            }
        } else if (action === "UPDATE_QUANTITY") {
            const productIndex = stockDoc.productDetails.findIndex(p => p.product === product);
            if (productIndex > -1) {
                stockDoc.productDetails[productIndex].quantity = Number(quantity);
            } else {
                return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
            }
        } else if (action === "REMOVE_PRODUCT") {
            stockDoc.productDetails = stockDoc.productDetails.filter(p => p.product !== product);
        } else {
            return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
        }

        await stockDoc.save();

        return NextResponse.json({
            success: true,
            data: stockDoc,
            message: `Successfully processed ${action}`
        });

    } catch (error) {
        console.error("C&F Stock Update Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update stock", error: error.message },
            { status: 500 }
        );
    }
}