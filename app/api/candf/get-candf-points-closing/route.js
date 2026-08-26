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

        const statusFromFrontend = searchParams.get("status"); 
        const dsidFilter = searchParams.get("dscode");
        
        // 🗓️ 1. Extract from and to dates from the frontend
        const fromDate = searchParams.get("from");
        const toDate = searchParams.get("to");

        // 2. Base Query
        let query = { invalidstatus: false };

        // 3. Status Filter
        if (statusFromFrontend === "true") {
            query.status = true;
        } else if (statusFromFrontend === "false") {
            query.status = false;
        }

        // 4. DSID Filter
        if (dsidFilter) {
            query.dsid = dsidFilter;
        }

        // 🗓️ 5. Date Filter (Targeting updatedAt)
        if (fromDate || toDate) {
            query.updatedAt = {};
            
            if (fromDate) {
                // Set to start of the day: 00:00:00
                query.updatedAt.$gte = new Date(`${fromDate}T00:00:00.000Z`);
            }
            
            if (toDate) {
                // Set to end of the day: 23:59:59
                query.updatedAt.$lte = new Date(`${toDate}T23:59:59.999Z`);
            }
        }

        const totalRecords = await CandFClosingHistoryModel.countDocuments(query);
        
        // 6. Fetch data from DB
        const data = await CandFClosingHistoryModel.find(query)
            .select("dsid name acnumber ifscCode bankName lastmatchpoint usepoint amount charges payamount date status utr createdAt updatedAt")
            .sort({ updatedAt: -1 }) // Sorted by updatedAt descending (newest first)
            .skip(skip)
            .limit(limit)
            .lean(); 

        return NextResponse.json({ 
            success: true, 
            data: data, 
            currentPage: page, 
            totalPages: Math.ceil(totalRecords / limit) || 1 
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}