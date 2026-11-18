import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CnfStockModel from "@/model/cnfstock";
import CnfModel from "@/model/c&fusers";
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

        if (!stockDoc && action === "ADD_PRODUCT") {
            stockDoc = new CnfStockModel({ dscode, productDetails: [] });
        } else if (!stockDoc) {
            return NextResponse.json({ success: false, message: "Stock not found" }, { status: 404 });
        }

        // ---- Track the delta to apply to Availablepoint ----
        // delta = (change in total stock value at SP) = Δqty × sp
        let availablePointDelta = 0;

        if (action === "ADD_PRODUCT") {
            const existingIndex = stockDoc.productDetails.findIndex(p => p.product === product);

            if (existingIndex > -1) {
                // Merge into existing product: quantity increases by `quantity`
                // Use the EXISTING product's sp for the delta (that's what's stored)
                const existingSp = Number(stockDoc.productDetails[existingIndex].sp || 0);
                availablePointDelta = Number(quantity) * existingSp;

                stockDoc.productDetails[existingIndex].quantity =
                    Number(stockDoc.productDetails[existingIndex].quantity || 0) + Number(quantity);
            } else {
                // New product: delta = qty × sp (from request)
                const newSp = Number(sp || 0);
                availablePointDelta = Number(quantity) * newSp;

                stockDoc.productDetails.push({
                    product,
                    quantity: Number(quantity),
                    price: Number(price || 0),
                    sp: newSp
                });
            }
        } else if (action === "UPDATE_QUANTITY") {
            const productIndex = stockDoc.productDetails.findIndex(p => p.product === product);
            if (productIndex > -1) {
                const oldQty = Number(stockDoc.productDetails[productIndex].quantity || 0);
                const newQty = Number(quantity);
                const existingSp = Number(stockDoc.productDetails[productIndex].sp || 0);

                // delta = (new - old) × sp  → positive if increased, negative if decreased
                availablePointDelta = (newQty - oldQty) * existingSp;

                stockDoc.productDetails[productIndex].quantity = newQty;
            } else {
                return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
            }
        } else if (action === "REMOVE_PRODUCT") {
            const productIndex = stockDoc.productDetails.findIndex(p => p.product === product);
            if (productIndex > -1) {
                const oldQty = Number(stockDoc.productDetails[productIndex].quantity || 0);
                const existingSp = Number(stockDoc.productDetails[productIndex].sp || 0);

                // Removing → subtract oldQty × sp
                availablePointDelta = -(oldQty * existingSp);
            }

            stockDoc.productDetails = stockDoc.productDetails.filter(p => p.product !== product);
        } else {
            return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
        }

        await stockDoc.save();

        // ---- Increment (not replace) Availablepoint on the C&F user ----
        let newAvailablePoint = null;
        if (availablePointDelta !== 0) {
            const cnfUpdate = await CnfModel.findOneAndUpdate(
                { dscode },
                { $inc: { Availablepoint: availablePointDelta } }, // <-- $inc, not $set
                { new: true }
            );
            if (cnfUpdate) {
                newAvailablePoint = cnfUpdate.Availablepoint;
            } else {
                console.warn(`C&F user not found for dscode=${dscode}; Availablepoint not updated.`);
            }
        }

        return NextResponse.json({
            success: true,
            data: stockDoc,
            availablePointDelta,
            availablepoint: newAvailablePoint,
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