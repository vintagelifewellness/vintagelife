import { NextResponse } from "next/server";
import mongoose from "mongoose";

import CnfDemand from "../../../../model/CnfDemand"; 

import CnfModel from "../../../../model/c&fusers"; 

const connectToDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error("DB Error:", error);
    }
};

export async function GET(request) {
    try {
        await connectToDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        const totalRecords = await CnfDemand.countDocuments();
        
        const demands = await CnfDemand.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); 

        const dsCodesArray = demands.map(demand => demand.dscode);

        const cnfUsers = await CnfModel.find({ dscode: { $in: dsCodesArray } }).lean();

        const cnfNameMap = {};
        cnfUsers.forEach(user => {
           
            cnfNameMap[user.dscode] = user.cfName || user.name || "Unknown C&F";
        });

    
        const finalDemands = demands.map(demand => ({
            ...demand,
           
            cfName: cnfNameMap[demand.dscode] || demand.cfName 
        }));

        return NextResponse.json({ 
            success: true, 
            data: finalDemands,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit) || 1
        }, { status: 200 });

    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json({ success: false, message: "Data lane me problem hui" }, { status: 500 });
    }
}