import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CnfModel from "@/model/c&fusers";
import OrderModel from "@/model/Order"; 

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { dscode } = await params; 

    if (!dscode) {
      return NextResponse.json({ success: false, message: "DSCODE missing" }, { status: 400 });
    }

    const user = await CnfModel.findOne({ dscode: dscode });
    
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    let stats = { total: 0, pending: 0, completed: 0 };
    let recentOrders = [];

    try {
      const cfIdString = user._id.toString();

      const orderQuery = {
        orderat: "C&F",
        cfId: cfIdString ,
         deleted: false
      };

      // Stats fetch karo
      stats.total = await OrderModel.countDocuments(orderQuery);
      stats.pending = await OrderModel.countDocuments({ ...orderQuery, status: false });
      stats.completed = await OrderModel.countDocuments({ ...orderQuery, status: true });
      
      // 🚨 FIX: Limit hata diya taaki C&F ko saare orders dikhein filter karne ke liye
      recentOrders = await OrderModel.find(orderQuery)
                                     .sort({ date: -1 }); 
                                     
    } catch (err) {
      console.log("Order Model Fetch Error:", err.message);
    }

    return NextResponse.json({
      success: true,
      stats,
      points: {
        available: user.Availablepoint || 0,
        used: user.Usepoint || 0
      },
      recentOrders // Ab isme saare orders aayenge
    }, { status: 200 });

  } catch (error) {
    console.error("API Main Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}