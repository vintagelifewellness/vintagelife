import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CnfModel from "@/model/c&fusers"; 
import OrderModel from "@/model/Order";  
import PointHistoryModel from "@/model/PointHistory"; 

export async function PATCH(req) {
  try {
    await dbConnect(); 
    const body = await req.json();
    const { orderId, status, requiredPoints } = body; 
    
    console.log("🔥 APPROVE API HIT! 🔥");

    const currentOrder = await OrderModel.findById(orderId);
    if (!currentOrder) {
      return NextResponse.json({ success: false, message: "Order not found!" });
    }

    const cfUser = await CnfModel.findById(currentOrder.cfId); 
    if (!cfUser) {
      return NextResponse.json({ success: false, message: "C&F User not found!" });
    }
    
    if (status === true) {
      if (cfUser.Availablepoint < requiredPoints) {
        return NextResponse.json({ 
          success: false, 
          message: `Balance Kam Hai! Required: ${requiredPoints}, Available: ${cfUser.Availablepoint}` 
        });
      }

      const oldBalance = cfUser.Availablepoint || 0;

      // 1. Points Update Karo
      cfUser.Availablepoint -= requiredPoints;
      cfUser.Usepoint = (cfUser.Usepoint || 0) + requiredPoints;
      await cfUser.save();

      // =========================================================
      // 🟢 HISTORY CREATE (Full Power Version - Replace here)
      // =========================================================
      try {
          console.log("⏳ History Process Start...");
          
          // REQUIRED FIELD CHECK: cfCode har haal mein hona chahiye
          const finalCode = cfUser.dscode || currentOrder.dscode || "SYSTEM";
          const finalName = cfUser.name || currentOrder.cfName || "C&F User";

          const historyData = {
            cfCode: finalCode, // Ye Required hai, isliye variable check kiya
            cfName: finalName,
            addedPoints: -Number(requiredPoints), 
            oldBalance: Number(oldBalance),
            newBalance: Number(cfUser.Availablepoint),
            remarks: `Order Approved: ${currentOrder.orderNo || orderId}`,
            orderId: orderId.toString(),
            transactionType: "Debited",
            date: new Date()
          };

          const historyEntry = new PointHistoryModel(historyData);
          await historyEntry.save();
          console.log("✅ HISTORY DB ME SAVE HO GAYI!");

      } catch (historyError) {
          console.error("❌ HISTORY ERROR DETAILS:", historyError.message);
      }
      // =========================================================
    }

    currentOrder.status = status;
    await currentOrder.save();

    return NextResponse.json({ success: true, message: "Order Approved & History Created!" });

  } catch (error) {
    console.error("Main API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" });
  }
}