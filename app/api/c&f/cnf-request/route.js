import { NextResponse } from "next/server"; 
import CnfDemand from "@/model/CnfDemand";  
import dbConnect from "@/lib/dbConnect";



export async function POST(req) {
    try { 
        await dbConnect();
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