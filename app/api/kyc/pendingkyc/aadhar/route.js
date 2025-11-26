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

    // Step 1: Find all dscodes from UserModel that have valid PAN details,
    // where 'valid' means AT LEAST ONE of panno OR panimage is filled.
    let userFilter = {
      // Use $or to include documents if EITHER panno OR panimage is populated (not null/empty)
      $or: [
        // { aadharno: { $nin: [null, ""] } }, 
        { aadharimage: { $nin: [null, ""] } },
      ]
    };

    if (dscodeSearch) {
      // If dscode search is present, combine the PAN details filter ($or)
      // and the dscode search filter using an explicit $and.
      userFilter = {
        $and: [
          userFilter, // The PAN details $or condition
          { dscode: { $regex: new RegExp(dscodeSearch, "i") } } // The dscode filter
        ]
      };
    }

    // Fetch the dscodes of all users who match the criteria
    const usersWithPanDetails = await UserModel.find(userFilter, { dscode: 1, _id: 0 });
    const dscodesToConsider = usersWithPanDetails.map(u => u.dscode);

    // Step 2: Build the final KycModel query.
    // This query ensures that the KYC entry is pending (PAN KYC) AND the associated user has PAN details.
    const kycQuery = {
      aadharkkyc: false, // Filter for pending PAN KYC
      rejectedaadhar: false, // Filter out rejected PAN KYC
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
    // We already know these users have PAN details (at least one field) and their PAN KYC is pending.
    const users = await UserModel.find({ dscode: { $in: paginatedDscodes } });

    return NextResponse.json({
      message: "Users with pending PAN KYC and populated PAN details (at least one field) fetched",
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
