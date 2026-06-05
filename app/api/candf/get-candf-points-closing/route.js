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
        
        // Saare fields select karo jo report mein chahiye
        const data = await CandFClosingHistoryModel.find(query)
            .select("dsid name acnumber ifscCode bankName lastmatchpoint usepoint payamount date status statusapprovedate utr")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({ 
            success: true, 
            data, 
            currentPage: page, 
            totalPages: Math.ceil(totalRecords / limit) || 1 
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}