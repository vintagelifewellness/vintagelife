import { NextResponse } from "next/server";
import mongoose from "mongoose";
import CnfDemand from "../../../../../model/CnfDemand";
import CnfUser from "../../../../../model/c&fusers";
import PointHistory from "../../../../../model/PointHistory";

import ProductModel from "@/model/Product";
import CnfStockModel from "@/model/cnfstock";
const connectToDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error("DB Error:", error);
    }
};

export async function GET(req, { params }) {
    try {
        await connectToDB();
        const { id } = params;

        const demand = await CnfDemand.findById(id).lean();

        if (!demand) return NextResponse.json({ success: false, message: "Demand nahi mili" }, { status: 404 });

        const cnfUser = await CnfUser.findOne({ dscode: demand.dscode });
        if (cnfUser) {
            demand.cfName = cnfUser.cfName || cnfUser.name || "Unknown";
        }

        return NextResponse.json({ success: true, data: demand }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Fetch Error" }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        await connectToDB();

        const { id } = params;
        const body = await req.json();

        const demand = await CnfDemand.findById(id);

        if (!demand) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Demand not found"
                },
                { status: 404 }
            );
        }

        // Already approved
        if (demand.status === "Approved" && body.status === "Approved") {
            return NextResponse.json(
                {
                    success: false,
                    message: "this demand is already approved"
                },
                { status: 400 }
            );
        }

        // ==========================================
        // APPROVE DEMAND
        // ==========================================
        if (body.status === "Approved") {

            if (!demand.requestedItems || demand.requestedItems.length === 0) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Demand have no product found"
                    },
                    { status: 400 }
                );
            }

            // ==========================================
            // 1. FIRST CHECK ALL MAIN PRODUCT STOCK
            // ==========================================

            const products = [];

            for (const item of demand.requestedItems) {

                const product = await ProductModel.findById(item.productId);

                if (!product) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: `Product not found: ${item.productName}`
                        },
                        { status: 404 }
                    );
                }

                const requestedQty = Number(item.quantity || 0);
                const currentStock = Number(product.stock || 0);

                if (requestedQty <= 0) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: `Invalid quantity for ${item.productName}`
                        },
                        { status: 400 }
                    );
                }

                // Stock check
                if (currentStock < requestedQty) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: `${item.productName} has insufficient stock. Available: ${currentStock}, Required: ${requestedQty}`
                        },
                        { status: 400 }
                    );
                }

                products.push({
                    item,
                    product
                });
            }

            // ==========================================
            // 2. C&F USER CHECK
            // ==========================================

            const cnfUser = await CnfUser.findOne({
                dscode: demand.dscode
            });

            if (!cnfUser) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "C&F User database me nahi mila!"
                    },
                    { status: 404 }
                );
            }

            // ==========================================
            // 3. UPDATE MAIN PRODUCT STOCK
            // ==========================================

            for (const { item, product } of products) {

                const requestedQty = Number(item.quantity || 0);

                product.stock =
                    Number(product.stock || 0) - requestedQty;

                await product.save();
            }

            // ==========================================
            // 4. UPDATE C&F STOCK
            // ==========================================

            let cnfStock = await CnfStockModel.findOne({
                dscode: demand.dscode
            });

            if (!cnfStock) {
                cnfStock = new CnfStockModel({
                    dscode: demand.dscode,
                    productDetails: []
                });
            }

            for (const { item } of products) {

                const requestedQty = Number(item.quantity || 0);

                // Product already exists in C&F stock
                const existingProduct =
                    cnfStock.productDetails.find(
                        (p) =>
                            p.product === item.productName
                    );

                if (existingProduct) {

                    existingProduct.quantity = (
                        Number(existingProduct.quantity || 0) +
                        requestedQty
                    ).toString();

                    // Latest price / SP
                    existingProduct.price =
                        Number(item.price || 0).toString();

                    existingProduct.sp =
                        Number(item.rp || 0).toString();

                } else {

                    cnfStock.productDetails.push({
                        product: item.productName,
                        quantity: requestedQty.toString(),
                        price: Number(item.price || 0).toString(),
                        sp: Number(item.rp || 0).toString()
                    });
                }
            }

            await cnfStock.save();

            // ==========================================
            // 5. UPDATE C&F WALLET / POINTS
            // ==========================================

            const rpToAdd = parseFloat(demand.totalRp || 0);

            const currentPoints =
                parseFloat(cnfUser.Availablepoint || 0);

            const newPoints =
                currentPoints + rpToAdd;

            cnfUser.Availablepoint =
                newPoints.toString();

            await cnfUser.save();

            // ==========================================
            // 6. POINT HISTORY
            // ==========================================

            const actualCfName =
                cnfUser.cfName ||
                cnfUser.name ||
                demand.cfName;

            const historyEntry = new PointHistory({
                cfName: actualCfName,
                cfCode: demand.dscode,
                addedPoints: rpToAdd.toString(),
                oldBalance: currentPoints.toString(),
                newBalance: newPoints.toString(),
                remarks: `Order Approved (Demand ID: ${demand._id})`,
                date: new Date()
            });

            await historyEntry.save();

            // ==========================================
            // 7. UPDATE DEMAND STATUS
            // ==========================================

            demand.status = "Approved";

            await demand.save();

            return NextResponse.json(
                {
                    success: true,
                    data: demand,
                    message:
                        "Demand Approved! Main stock minus, C&F stock updated, wallet updated aur history ban gayi."
                },
                { status: 200 }
            );
        }

        // ==========================================
        // OTHER STATUS UPDATE
        // ==========================================

        demand.status = body.status;

        await demand.save();

        return NextResponse.json(
            {
                success: true,
                data: demand,
                message: "Demand status updated successfully."
            },
            { status: 200 }
        );

    } catch (error) {

        console.error("Update Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Update Error",
                error: error.message
            },
            { status: 500 }
        );
    }
}