import dbConnect from "@/lib/dbConnect";
import KycModel from "@/model/KycStatus";
import UserModel from "@/model/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  // Connect to the database
  await dbConnect();

  try {
    const body = await req.json();
    const page = parseInt(body.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const dscodeSearch = body.dscode?.trim();

    // Step 1: Find all dscodes from UserModel that have valid bank details,
    // and apply the dscode search filter here if provided.
    let userFilter = {
      $or: [
        { bankName: { $nin: [null, ""] } },
        { acnumber: { $nin: [null, ""] } },
      ]
    };

    if (dscodeSearch) {
      // Apply the search to the UserModel dscode field
      userFilter.dscode = { $regex: new RegExp(dscodeSearch, "i") };
    }

    // Fetch the dscodes of all users who match the criteria
    const usersWithBankDetails = await UserModel.find(userFilter, { dscode: 1, _id: 0 });
    const dscodesToConsider = usersWithBankDetails.map(u => u.dscode);

    // Step 2: Build the final KycModel query.
    // This query ensures that the KYC entry is pending AND the associated user has bank details.
    const kycQuery = {
      bankkyc: false,
      rejectedbank: false,
      dscode: { $in: dscodesToConsider },
    };

    // Step 3: Total count (based on the final kycQuery, before pagination)
    const total = await KycModel.countDocuments(kycQuery);

    // Step 4: Get paginated KYC entries
    const paginatedKycs = await KycModel.find(kycQuery)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Extract the list of dscodes from the paginated KYC documents
    const paginatedDscodes = paginatedKycs.map((k) => k.dscode);

    // Step 5: Get the actual UserModel documents for the paginated dscodes.
    // We already know these users have bank details and their KYC is pending.
    const users = await UserModel.find({ dscode: { $in: paginatedDscodes } });

    return NextResponse.json({
      message: "Users with pending bank KYC and populated bank details fetched",
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("KYC fetch error:", error);
    return NextResponse.json(
      { message: "Error fetching data", error: error.message },
      { status: 500 }
    );
  }
}
