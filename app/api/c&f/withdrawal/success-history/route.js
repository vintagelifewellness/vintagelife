import dbConnect from "@/lib/dbConnect";
import ClosingHistoryModel from "@/model/ClosingHistory";
import MonthlyClosingHistoryModel from "@/model/MonthleClosingHistory";
import TravelfundModel from "@/model/travelfund";

export async function GET(request) {
  await dbConnect();

  try {
    // 1. URL se saare parameters nikalna
    const { searchParams } = new URL(request.url);
    const dscode = searchParams.get("dscode");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // 2. SECURITY CHECK: Agar ID nahi mili, toh API block karo
    if (!dscode || dscode === "undefined" || dscode === "null") {
      return Response.json(
        { message: "Unauthorized: C&F ID is missing", success: false, data: [] },
        { status: 400 }
      );
    }

    // 3. Database Search Filter banana
    let filter = {
      dsid: dscode, 
      status: true, // Sirf 'Success' wala data
    };

    // 4. Date Filter Logic (From Date / To Date)
    if (fromDate || toDate) {
      filter.createdAt = {}; 
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        let end = new Date(toDate);
        end.setUTCHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // 5. Teeno Tables se data fetch karna
    const closingHistory = await ClosingHistoryModel.find(filter).lean();
    const monthlyHistory = await MonthlyClosingHistoryModel.find(filter).lean();
    const travelHistory = await TravelfundModel.find(filter).lean();

    // 6. Data Mix karke Date ke hisaab se Sort karna (Latest first)
    let combinedData = [...closingHistory, ...monthlyHistory, ...travelHistory];
    combinedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 7. Pagination Setup
    const totalRecords = combinedData.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = combinedData.slice(startIndex, endIndex);

    // 8. Final Response
    return Response.json({
      message: "Withdrawal Success Data fetched securely!",
      success: true,
      data: paginatedData,
      total: totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit) || 1,
    });

  } catch (error) {
    console.error("C&F Withdrawal API Error:", error);
    return Response.json(
      { message: "Internal Server Error", success: false, data: [] },
      { status: 500 }
    );
  }
}