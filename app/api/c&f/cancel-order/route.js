import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CnfModel from "@/model/c&fusers"; 
import PointHistory from "@/model/PointHistory";
import OrderModel from "@/model/Order";

export async function PATCH(request) {
    try {
        await dbConnect(); 
        const { orderId } = await request.json();

        // 1. Order ko dhoondho
        const order = await OrderModel.findById(orderId);
        if (!order) return NextResponse.json({ success: false, message: "Order nahi mila" }, { status: 404 });

        // 2. Double Cancellation Check
        if (order.status === false || order.status === "Cancelled") {
            return NextResponse.json({ success: false, message: "Order pehle se cancel hai" }, { status: 400 });
        }

        // 3. 🔥 C&F User ko dhoondhne ka Triple Logic (Kal ke liye full safe)
        let cnfUser = null;

        // Sabse pehle cfId (Unique ID) se dhoondho
        if (order.cfId) {
            cnfUser = await CnfModel.findById(order.cfId);
        }

        // Agar ID se nahi mila toh cfName (Spelling) se dhoondho
        if (!cnfUser && order.cfName) {
            cnfUser = await CnfModel.findOne({ cfName: order.cfName });
        }

        if (!cnfUser) {
            console.error("DEBUG: User match nahi hua. ID:", order.cfId, "Name:", order.cfName);
            return NextResponse.json({ 
                success: false, 
                message: "C&F User database mein nahi mila. Please check spelling or ID." 
            }, { status: 404 });
        }

        const refundAmount = Number(order.totalsp || 0); 

        // 4. ATOMIC UPDATE (Available points + aur Used points -)
        const updatedCnf = await CnfModel.findByIdAndUpdate(
            cnfUser._id,
            { 
                $inc: { 
                    Availablepoint: refundAmount, 
                    Usepoint: -refundAmount // Apne model ke field name se match kar lena
                } 
            },
            { new: true } 
        );

        // 5. Order Status Update
        order.status = false; 
        await order.save();

        // 6. Point History Entry (Accountability)
        await PointHistory.create({
            cfCode: cnfUser.dscode,
            cfName: cnfUser.cfName,
            date: new Date(),
            addedPoints: refundAmount,
            oldBalance: Number(cnfUser.Availablepoint),
            newBalance: Number(updatedCnf.Availablepoint),
            remarks: `Order #${order.orderNo} Cancelled: Points Refunded to ${cnfUser.cfName}`
        });

        return NextResponse.json({ 
            success: true, 
            message: "Mubarak ho! Points refund ho gaye hain." 
        }, { status: 200 });

    } catch (error) {
        console.error("CRITICAL ERROR:", error);
        return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
    }
}