import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CnfModel from "@/model/c&fusers";
import OrderModel from "@/model/Order"; // Apna Order model yahan check karlena

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    // NAYA FIX: params ke aage await laga diya
    const { dscode } = await params;

    if (!dscode) {
      return NextResponse.json({ success: false, message: "DSCODE is required" }, { status: 400 });
    }

    // 1. C&F User aur Points nikalo
    const user = await CnfModel.findOne({ dscode: dscode });
    
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found!" }, { status: 404 });
    }

    const availablePoints = user.Availablepoint || 0;
    const usedPoints = user.Usepoint || 0;

    // 2. Orders nikalo
    let totalOrders = 0, pendingOrders = 0, completedOrders = 0, orderList = [];

    try {
      totalOrders = await OrderModel.countDocuments({ dscode: dscode });
      pendingOrders = await OrderModel.countDocuments({ dscode: dscode, status: "Pending" });
      completedOrders = await OrderModel.countDocuments({ dscode: dscode, status: "Completed" });
      orderList = await OrderModel.find({ dscode: dscode }).sort({ createdAt: -1 }).limit(5);
    } catch (orderError) {
      console.log("Order fetch error:", orderError.message);
    }

    // 3. Sab bhej do
    return NextResponse.json({
      success: true,
      stats: { total: totalOrders, pending: pendingOrders, completed: completedOrders },
      points: { available: availablePoints, used: usedPoints },
      recentOrders: orderList
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard Stats API me Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}