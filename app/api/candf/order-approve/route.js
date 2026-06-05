import dbConnect from "@/lib/dbConnect";
import OrderModel from "@/model/Order";
import mongoose from "mongoose";
import UserModel from "@/model/User";
import PaymentHistoryModel from "@/model/PaymentHistory";
import CnfModel from "@/model/c&fusers"; 
import PointHistoryModel from "@/model/PointHistory"; 

export async function PATCH(req) {
    await dbConnect();

    try {
        const data = await req.json();
         
        const id = data.orderId;  
        const requiredPoints = data.requiredPoints || 0;

        if (!id) {
             return Response.json({
                 message: "Order ID is required",
                 success: false
             }, { status: 400 });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const updatedOrder = await OrderModel.findByIdAndUpdate(
                id,
                data,
                { new: true, session }
            );

            if (!updatedOrder) {
                await session.abortTransaction();
                session.endSession();
                return Response.json({
                    message: "Order not found",
                    success: false
                }, { status: 404 });
            }

            // =========================================================
            // 🔥 C&F USER POINT DEDUCTION & HISTORY (INTEGRATED) 🔥
            // =========================================================
            if (data.status === true && !data.cancelled) {
                if (updatedOrder.cfId) {
                    const cfUser = await CnfModel.findById(updatedOrder.cfId).session(session);
                    
                    if (!cfUser) {
                        await session.abortTransaction();
                        session.endSession();
                        return Response.json({ 
                            success: false, 
                            message: "C&F User not found!" 
                        }, { status: 404 });
                    }

                    if (cfUser.Availablepoint < requiredPoints) {
                        await session.abortTransaction();
                        session.endSession();
                        return Response.json({ 
                            success: false, 
                            message: `Low Balance! Required: ${requiredPoints}, Available: ${cfUser.Availablepoint}` 
                        }, { status: 400 });
                    }

                    const oldBalance = cfUser.Availablepoint || 0;

                    // 1. Points Update
                    cfUser.Availablepoint -= requiredPoints;
                    cfUser.Usepoint = (cfUser.Usepoint || 0) + requiredPoints;
                    
                    await cfUser.save({ session });

                    // 2. History Create
                    const finalCode = cfUser.dscode || updatedOrder.dscode || "SYSTEM";
                    const finalName = cfUser.name || updatedOrder.cfName || "C&F User";

                    await PointHistoryModel.create([{
                        cfCode: finalCode,
                        cfName: finalName,
                        addedPoints: -Number(requiredPoints), 
                        oldBalance: Number(oldBalance),
                        newBalance: Number(cfUser.Availablepoint),
                        remarks: `Order Approved: ${updatedOrder.orderNo || id}`,
                        orderId: id.toString(),
                        transactionType: "Debited",
                        date: new Date()
                    }], { session });
                }
            }
            // =========================================================


            const user = await UserModel.findOne({
                dscode: updatedOrder.dscode
            }).session(session);

            if (user) {
                let currentEarnsp = parseFloat(user.earnsp) || 0;
                let currentSaosp = parseFloat(user.saosp) || 0;
                let currentSgosp = parseFloat(user.sgosp) || 0;
                const orderTotalSp = parseFloat(updatedOrder.totalsp) || 0;

                // ✅ APPROVE ORDER
                if (data.status === true && !data.cancelled) {

                    const isUpgrade = updatedOrder.ordertype === "Upgrade";

                    if (!isUpgrade) {
                        // ✅ Normal order → add self SP
                        currentEarnsp += orderTotalSp;

                        if (updatedOrder.salegroup === "SAO") {
                            currentSaosp += orderTotalSp;
                        } else if (updatedOrder.salegroup === "SGO") {
                            currentSgosp += orderTotalSp;
                        }

                        await UserModel.updateOne(
                            { dscode: updatedOrder.dscode },
                            {
                                earnsp: currentEarnsp.toString(),
                                saosp: currentSaosp.toString(),
                                sgosp: currentSgosp.toString()
                            },
                            { session }
                        );

                        await PaymentHistoryModel.create([{
                            dsid: user.dscode,
                            dsgroup: user.group,
                            amount: "0",
                            sp: orderTotalSp.toString(),
                            group: updatedOrder.salegroup,
                            type: "order",
                            orderno: updatedOrder.orderNo,
                            referencename: user.dscode,
                            pairstatus: false,
                            monthlystatus: false,
                            defaultdata: "PaymentHistory",
                            levelname: "L0"
                        }], { session });

                    } else {
                        // ✅ Upgrade → only activate
                        await UserModel.updateOne(
                            { dscode: updatedOrder.dscode },
                            {
                                activesp: "100"
                            },
                            { session }
                        );

                        await PaymentHistoryModel.create([{
                            dsid: user.dscode,
                            dsgroup: user.group,
                            amount: "0",
                            sp: orderTotalSp.toString(),
                            group: updatedOrder.salegroup,
                            type: "upgrade",
                            orderno: updatedOrder.orderNo,
                            referencename: user.dscode,
                            pairstatus: false,
                            monthlystatus: false,
                            defaultdata: "PaymentHistory",
                            levelname: "L0"
                        }], { session });
                    }

                    // ✅ Upline distribution
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
                            updatedFields.saosp =
                                (parseFloat(parent.saosp) || 0) + orderTotalSp;
                        } else if (childGroup === "SGO") {
                            updatedFields.sgosp =
                                (parseFloat(parent.sgosp) || 0) + orderTotalSp;
                        }

                        await UserModel.updateOne(
                            { dscode: parent.dscode },
                            {
                                ...(updatedFields.saosp !== undefined && {
                                    saosp: updatedFields.saosp.toString()
                                }),
                                ...(updatedFields.sgosp !== undefined && {
                                    sgosp: updatedFields.sgosp.toString()
                                }),
                            },
                            { session }
                        );

                        await PaymentHistoryModel.create([{
                            dsid: parent.dscode,
                            dsgroup: parent.group,
                            amount: "0",
                            sp: orderTotalSp.toString(),
                            group: childGroup,
                            type: isUpgrade ? "upgrade" : "order",
                            orderno: updatedOrder.orderNo,
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

                // ❌ CANCEL / UNAPPROVE ORDER
                else if (data.status === false || data.cancelled === true) {

                    const isUpgrade = updatedOrder.ordertype === "Upgrade";

                    if (!isUpgrade) {
                        // ✅ Normal order → deduct self SP
                        currentEarnsp -= orderTotalSp;

                        if (updatedOrder.salegroup === "SAO") {
                            currentSaosp -= orderTotalSp;
                        } else if (updatedOrder.salegroup === "SGO") {
                            currentSgosp -= orderTotalSp;
                        }

                        currentEarnsp = Math.max(currentEarnsp, 0);
                        currentSaosp = Math.max(currentSaosp, 0);
                        currentSgosp = Math.max(currentSgosp, 0);

                        await UserModel.updateOne(
                            { dscode: updatedOrder.dscode },
                            {
                                earnsp: currentEarnsp.toString(),
                                saosp: currentSaosp.toString(),
                                sgosp: currentSgosp.toString()
                            },
                            { session }
                        );

                        await PaymentHistoryModel.create([{
                            dsid: user.dscode,
                            dsgroup: user.group,
                            amount: "0",
                            sp: `-${orderTotalSp}`,
                            group: updatedOrder.salegroup,
                            type: "order-cancel",
                            orderno: updatedOrder.orderNo,
                            referencename: user.dscode,
                            pairstatus: false,
                            monthlystatus: false,
                            defaultdata: "PaymentHistory",
                            levelname: "L0"
                        }], { session });

                    } else {
                        // ✅ Cancel upgrade → set activesp = 50
                        await UserModel.updateOne(
                            { dscode: updatedOrder.dscode },
                            {
                                activesp: "50"
                            },
                            { session }
                        );

                        await PaymentHistoryModel.create([{
                            dsid: user.dscode,
                            dsgroup: user.group,
                            amount: "0",
                            sp: `-${orderTotalSp}`,
                            group: updatedOrder.salegroup,
                            type: "upgrade-cancel",
                            orderno: updatedOrder.orderNo,
                            referencename: user.dscode,
                            pairstatus: false,
                            monthlystatus: false,
                            defaultdata: "PaymentHistory",
                            levelname: "L0"
                        }], { session });
                    }

                    // ✅ Upline deduction
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
                            updatedFields.saosp = Math.max(
                                (parseFloat(parent.saosp) || 0) - orderTotalSp,
                                0
                            );
                        } else if (childGroup === "SGO") {
                            updatedFields.sgosp = Math.max(
                                (parseFloat(parent.sgosp) || 0) - orderTotalSp,
                                0
                            );
                        }

                        await UserModel.updateOne(
                            { dscode: parent.dscode },
                            {
                                ...(updatedFields.saosp !== undefined && {
                                    saosp: updatedFields.saosp.toString()
                                }),
                                ...(updatedFields.sgosp !== undefined && {
                                    sgosp: updatedFields.sgosp.toString()
                                }),
                            },
                            { session }
                        );

                        await PaymentHistoryModel.create([{
                            dsid: parent.dscode,
                            dsgroup: parent.group,
                            amount: "0",
                            sp: `-${orderTotalSp}`,
                            group: childGroup,
                            type: isUpgrade ? "upgrade-cancel" : "order-cancel",
                            orderno: updatedOrder.orderNo,
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
            }

            await session.commitTransaction();
            session.endSession();

            return Response.json({
                message: "Order updated successfully",
                success: true,
                data: updatedOrder
            }, { status: 200 });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Transaction error:", error);
            return Response.json({
                message: "Transaction failed",
                success: false
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Outer error:", error);
        return Response.json({
            message: "Error updating order",
            success: false
        }, { status: 500 });
    }
}