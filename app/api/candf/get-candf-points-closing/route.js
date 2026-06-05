import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CandFClosingHistoryModel from "@/model/C&FClosingHistory"; 

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const skip = (page - 1) * limit;

        // 🛠️ FIX: Frontend se aane wale status ko pakdo
        const statusFromFrontend = searchParams.get("status"); 
        const dsidFilter = searchParams.get("dscode");

        // Default query
        let query = { invalidstatus: false };

        // Agar frontend se status=true aaya hai toh true dhundo, warna false
        if (statusFromFrontend === "true") {
            query.status = true;
        } else {
            query.status = false;
        }

        // Agar DSID se search kiya hai toh wo bhi add karo
        if (dsidFilter) {
            query.dsid = dsidFilter;
        }

        const totalRecords = await CandFClosingHistoryModel.countDocuments(query);
        
        // Saare fields select karo jo report mein chahiye, sath mein naye fields bhi
        const data = await CandFClosingHistoryModel.find(query)
            .select("dsid name acnumber ifscCode bankName lastmatchpoint usepoint payamount date status statusapprovedate utr payoutApplicablePoint carryForwardPoint")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // 👈 .lean() use kiya taaki plain JS object mile jisme calculation add kar sakein

        // 🧮 CALCULATION LOGIC: Har record par loop chalake points nikal rahe hain
        const processedData = data.map(item => {
            // Strings ko numbers mein convert karo calculation ke liye
            const usePointNum = parseInt(item.usepoint) || 0;
            const lastMatchPointNum = parseInt(item.lastmatchpoint) || 0;
            
            // 1. Difference nikalo (e.g., 1154 - 954 = 200)
            const difference = usePointNum - lastMatchPointNum;
            
            // 2. Payout Applicable (Sirf 100 ke multiples, e.g., 220 / 100 = 2.2 => floor(2) * 100 = 200)
            const applicablePoint = Math.floor(difference / 100) * 100;
            
            // 3. Carry Forward (Jo 100 se divide nahi hua bacha hua hissa, e.g., 220 % 100 = 20)
            const carryForward = difference % 100;

            return {
                ...item,
                // Agar DB mein pehle se save hai toh wo dikhao, warna abhi ka calculate kiya hua dikhao
                payoutApplicablePoint: item.payoutApplicablePoint && item.payoutApplicablePoint !== "0" 
                                       ? item.payoutApplicablePoint 
                                       : applicablePoint.toString(),
                carryForwardPoint: item.carryForwardPoint && item.carryForwardPoint !== "0" 
                                   ? item.carryForwardPoint 
                                   : carryForward.toString(),
                // Frontend check karne ke liye total difference bhi bhej rahe hain
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