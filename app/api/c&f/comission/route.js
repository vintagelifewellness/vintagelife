import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CandFClosingHistoryModel from "@/model/C&FClosingHistory"; 

export async function GET(request) {
    try {
        await dbConnect();
        
        // URL se dscode (dsid) nikalenge
        const { searchParams } = new URL(request.url);
        const dsid = searchParams.get("dscode");

        if (!dsid) {
            return NextResponse.json({ success: false, message: "DS Code is required" }, { status: 400 });
        }

        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        // Sirf uss specific C&F ka data find karenge jo invalid nahi hai
        const query = { dsid: dsid, invalidstatus: false };

        const totalRecords = await CandFClosingHistoryModel.countDocuments(query);
        
        const data = await CandFClosingHistoryModel.find(query)
            .sort({ createdAt: -1 }) // Sabse latest upar dikhega
            .skip(skip)
            .limit(limit)
            .lean();

        // Agar purana data hai jisme naye fields nahi the, toh usko handle karne ke liye
        const processedData = data.map(item => {
            const difference = (parseInt(item.usepoint) || 0) - (parseInt(item.lastmatchpoint) || 0);
            
            return {
                ...item,
                payoutApplicablePoint: item.payoutApplicablePoint || (Math.floor(difference / 100) * 100).toString(),
                carryForwardPoint: item.carryForwardPoint || (difference % 100).toString(),
                totalDifference: difference.toString()
            };
        });

        return NextResponse.json({ 
            success: true, 
            data: processedData, 
            currentPage: page, 
            totalPages: Math.ceil(totalRecords / limit) || 1 
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}