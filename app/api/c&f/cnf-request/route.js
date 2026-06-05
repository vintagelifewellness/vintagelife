import { NextResponse } from "next/server";
import mongoose from "mongoose";
import CnfDemand from "@/model/CnfDemand"; // Folder ka naam 'model' hi rakha hai

// 1. Ye function humne banaya hai MongoDB se connect hone ke liye
const connectToDB = async () => {
    // Agar pehle se connected hai, toh wapas connect mat karo
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    // Agar connected nahi hai, toh .env file wale link se connect karo
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Mast Connect Ho Gaya!");
    } catch (error) {
        console.error("Database connection me error aaya:", error);
    }
};

export async function POST(req) {
    try {
        // 2. Ab ye connectToDB() perfectly kaam karega!
        await connectToDB(); 
        
        const body = await req.json();

        // 3. Naya record bana rahe hain (TotalPrice aur TotalRP ke sath)
        const newDemand = new CnfDemand({
            dscode: body.dscode,
            cfName: body.cfName,
            cfType: body.cfType,
            requestedPoints: body.requestedPoints || 0,
            totalPrice: body.totalPrice || 0,
            totalRp: body.totalRp || 0,
            requestedItems: body.requestedItems,
            status: "Pending",
        });

        // 4. Data Save kar do
        await newDemand.save();

        return NextResponse.json({ success: true, message: "Demand Saved!" }, { status: 201 });
        
    } catch (error) {
        console.error("ASLI ERROR YE HAI BAAPU:", error); 
        return NextResponse.json({ 
            success: false, 
            message: "Data save nahi hua!", 
            error: error.message 
        }, { status: 500 });
    }
}