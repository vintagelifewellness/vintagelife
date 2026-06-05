import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";
import CnfModel from "@/model/c&fusers"; 
import PointHistory from "@/model/PointHistory";
import OrderModel from "@/model/Order";
import UserModel from "@/model/User";
import PaymentHistoryModel from "@/model/PaymentHistory";

export async function PATCH(request) {
    await dbConnect();

    try {
        // 1. Receive ONLY orderId from frontend
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, message: "orderId is required" }, { status: 400 });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 2. Find Order
            const order = await OrderModel.findById(orderId).session(session);
            
            if (!order) {
                await session.abortTransaction();
                session.endSession();
                return NextResponse.json({ success: false, message: "Order nahi mila" }, { status: 404 });
            }

            // 3. Double Cancellation Check
            if (order.status === false || order.cancelled === true) {
                await session.abortTransaction();
                session.endSession();
                return NextResponse.json({ success: false, message: "Order pehle se cancel hai" }, { status: 400 });
            }

            // Assuming refund amount is based on the total SP of the order
            const refundAmount = parseFloat(order.totalsp) || 0;

            // =========================================================
            // 🔥 4. C&F USER REFUND & HISTORY 🔥
            // =========================================================
            let cnfUser = null;

            if (order.cfId) {
                cnfUser = await CnfModel.findById(order.cfId).session(session);
            }
            if (!cnfUser && order.cfName) {
                cnfUser = await CnfModel.findOne({ cfName: order.cfName }).session(session);
            }

            if (!cnfUser) {
                await session.abortTransaction();
                session.endSession();
                return NextResponse.json({ 
                    success: false, 
                    message: "C&F User database mein nahi mila. Cancellation failed." 
                }, { status: 404 });
            }

            const oldBalance = cnfUser.Availablepoint || 0;

            // ATOMIC UPDATE (Available points + aur Usepoint -)
            const updatedCnf = await CnfModel.findByIdAndUpdate(
                cnfUser._id,
                { 
                    $inc: { 
                        Availablepoint: refundAmount, 
                        Usepoint: -refundAmount 
                    } 
                },
                { new: true, session } 
            );

            // Point History Entry (Accountability)
            await PointHistory.create([{
                cfCode: cnfUser.dscode || order.dscode || "SYSTEM",
                cfName: cnfUser.cfName || cnfUser.name || order.cfName || "C&F User",
                date: new Date(),
                addedPoints: refundAmount,
                oldBalance: Number(oldBalance),
                newBalance: Number(updatedCnf.Availablepoint),
                remarks: `Order #${order.orderNo || orderId} Cancelled: Points Refunded to ${cnfUser.cfName || 'User'}`,
                orderId: orderId.toString(),
                transactionType: "Credited"
            }], { session });


            // =========================================================
            // ✅ 5. UPLINE NETWORK SP MINUS CHAIN ✅
            // =========================================================
            const user = await UserModel.findOne({ dscode: order.dscode }).session(session);

            if (user) {
                let currentEarnsp = parseFloat(user.earnsp) || 0;
                let currentSaosp = parseFloat(user.saosp) || 0;
                let currentSgosp = parseFloat(user.sgosp) || 0;
                
                const isUpgrade = order.ordertype === "Upgrade";

                if (!isUpgrade) {
                    // Normal order → deduct self SP
                    currentEarnsp -= refundAmount;

                    if (order.salegroup === "SAO") {
                        currentSaosp -= refundAmount;
                    } else if (order.salegroup === "SGO") {
                        currentSgosp -= refundAmount;
                    }

                    await UserModel.updateOne(
                        { dscode: order.dscode },
                        {
                            earnsp: Math.max(currentEarnsp, 0).toString(),
                            saosp: Math.max(currentSaosp, 0).toString(),
                            sgosp: Math.max(currentSgosp, 0).toString()
                        },
                        { session }
                    );

                    await PaymentHistoryModel.create([{
                        dsid: user.dscode,
                        dsgroup: user.group,
                        amount: "0",
                        sp: `-${refundAmount}`,
                        group: order.salegroup,
                        type: "order-cancel",
                        orderno: order.orderNo,
                        referencename: user.dscode,
                        pairstatus: false,
                        monthlystatus: false,
                        defaultdata: "PaymentHistory",
                        levelname: "L0"
                    }], { session });

                } else {
                    // Cancel upgrade → set activesp = 50
                    await UserModel.updateOne(
                        { dscode: order.dscode },
                        { activesp: "50" },
                        { session }
                    );

                    await PaymentHistoryModel.create([{
                        dsid: user.dscode,
                        dsgroup: user.group,
                        amount: "0",
                        sp: `-${refundAmount}`,
                        group: order.salegroup,
                        type: "upgrade-cancel",
                        orderno: order.orderNo,
                        referencename: user.dscode,
                        pairstatus: false,
                        monthlystatus: false,
                        defaultdata: "PaymentHistory",
                        levelname: "L0"
                    }], { session });
                }

                // Upline deduction loop
                let currentParentCode = user.pdscode;
                let childGroup = user.group;
                let levelCounter = 1;

                while (currentParentCode) {
                    const parent = await UserModel.findOne({
                        dscode: currentParentCode
                    }).session(session);

                    if (!parent) break;

                    let updatedFields = {};

                    if (childGroup === "SAO") {
                        updatedFields.saosp = Math.max((parseFloat(parent.saosp) || 0) - refundAmount, 0);
                    } else if (childGroup === "SGO") {
                        updatedFields.sgosp = Math.max((parseFloat(parent.sgosp) || 0) - refundAmount, 0);
                    }

                    await UserModel.updateOne(
                        { dscode: parent.dscode },
                        {
                            ...(updatedFields.saosp !== undefined && { saosp: updatedFields.saosp.toString() }),
                            ...(updatedFields.sgosp !== undefined && { sgosp: updatedFields.sgosp.toString() }),
                        },
                        { session }
                    );

                    await PaymentHistoryModel.create([{
                        dsid: parent.dscode,
                        dsgroup: parent.group,
                        amount: "0",
                        sp: `-${refundAmount}`,
                        group: childGroup,
                        type: isUpgrade ? "upgrade-cancel" : "order-cancel",
                        orderno: order.orderNo,
                        referencename: user.dscode,
                        pairstatus: false,
                        monthlystatus: false,
                        defaultdata: "PaymentHistory",
                        levelname: `L${levelCounter}`
                    }], { session });

                    childGroup = parent.group;
                    currentParentCode = parent.pdscode;
                    levelCounter++;
                }
            }

            // =========================================================
            // 6. Update Order Status
            // =========================================================
            order.status = false; 
            order.cancelled = true; // Optional based on your DB schema needs
            await order.save({ session });

            // Commit Transaction
            await session.commitTransaction();
            session.endSession();

            return NextResponse.json({ 
                success: true, 
                message: "Mubarak ho! Order cancelled, C&F points refunded & SP chain updated." 
            }, { status: 200 });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Transaction Error:", error);
            return NextResponse.json({ 
                success: false, 
                message: "Transaction failed: " + error.message 
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Outer Error:", error);
        return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
    }
}