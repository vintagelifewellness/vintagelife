import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PointHistory from "@/model/PointHistory"; 
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const dscode = searchParams.get("dscode");

        let query = {};
        if (dscode) {
         
            query.cfCode = dscode;
        }
        const history = await PointHistory.find(query).sort({ date: -1 });

        return NextResponse.json(
            { success: true, data: history },
            { status: 200 }
        );

    } catch (error) {
        console.error("History fetch error:", error);
        return NextResponse.json(
            { success: false, message: "History laane mein gadbad ho gayi" },
            { status: 500 }
        );
    }
}