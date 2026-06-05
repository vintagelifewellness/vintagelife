import { NextResponse } from "next/server";
import mongoose from "mongoose";
import CnfDemand from "../../../../../model/CnfDemand"; 
import CnfUser from "../../../../../model/c&fusers"; 
import PointHistory from "../../../../../model/PointHistory"; 

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
        if (!demand) return NextResponse.json({ success: false, message: "Demand nahi mili" }, { status: 404 });

        if (demand.status === "Approved" && body.status === "Approved") {
            return NextResponse.json({ success: false, message: "Ye demand pehle hi approve ho chuki hai!" }, { status: 400 });
        }

        if (body.status === "Approved") {
            const rpToAdd = parseFloat(demand.totalRp || 0);
            const cnfUser = await CnfUser.findOne({ dscode: demand.dscode });
            
            if (cnfUser) {
         
                let currentPoints = parseFloat(cnfUser.Availablepoint || 0);
                
                let newPoints = currentPoints + rpToAdd;
                cnfUser.Availablepoint = newPoints.toString();
                await cnfUser.save();


                const actualCfName = cnfUser.cfName || cnfUser.name || demand.cfName;

               
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

            } else {
                 return NextResponse.json({ success: false, message: "C&F User database me nahi mila!" }, { status: 404 });
            }
        }

        demand.status = body.status;
        await demand.save();

        return NextResponse.json({ 
            success: true, 
            data: demand, 
            message: `Demand Approved! Wallet updated aur History ban gayi.` 
        }, { status: 200 });

    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ success: false, message: "Update Error" }, { status: 500 });
    }
}