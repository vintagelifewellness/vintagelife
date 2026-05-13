import dbConnect from "@/lib/dbConnect";
import ClosingHistoryModel from "@/model/ClosingHistory";
import MonthlyClosingHistoryModel from "@/model/MonthleClosingHistory";
import TravelfundModel from "@/model/travelfund";

export const GET = async (request, { params }) => {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;
    const dscode = params.dsid;

    // Base filter
    const filter = {
      dsid: dscode,
      status: true,
    };

    // Date Filter Logic (Filtering by statusapprovedate)
    if (startDate && endDate) {
      filter.statusapprovedate = {
        $gte: new Date(startDate),
        $lte: new Date(`${endDate}T23:59:59.999Z`), // Covers the full end day
      };
    }

    // Fetch all data
    const closingHistory = await ClosingHistoryModel.find(filter).lean();
    const monthlyHistory = await MonthlyClosingHistoryModel.find(filter).lean();
    const travelHistory = await TravelfundModel.find(filter).lean();

    // Merge all
    const combinedData = [
      ...closingHistory,
      ...monthlyHistory,
      ...travelHistory,
    ];

    // Sort latest first
    combinedData.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Calculate Overall Summary (Total Amount, Pay Amount, Charges)
    let totalAmount = 0;
    let totalPayAmount = 0;
    let totalCharges = 0;

    combinedData.forEach((item) => {
      totalAmount += parseFloat(item.amount || 0);
      totalPayAmount += parseFloat(item.payamount || 0);
      totalCharges += parseFloat(item.charges || 0);
    });

    const summary = {
      totalAmount,
      totalPayAmount,
      totalTds: (totalCharges * 2) / 5,
      totalServiceCharge: (totalCharges * 3) / 5,
    };

    // Pagination
    const paginatedData = combinedData.slice(skip, skip + limit);

    // Total count
    const totalCombined = combinedData.length;

    return Response.json({
      message: "Data fetched successfully!",
      success: true,
      data: paginatedData,
      summary: summary, // Return the summary payload
      total: totalCombined,
      currentPage: page,
      totalPages: Math.ceil(totalCombined / limit),
    });
  } catch (error) {
    console.error("Error fetching combined history:", error);

    return Response.json(
      {
        message: "Failed to fetch data",
        success: false,
      },
      {
        status: 500,
      }
    );
  }
};