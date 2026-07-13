import dbConnect from "@/lib/dbConnect";
import ClosingHistoryModel from "@/model/ClosingHistory";

export const GET = async (request) => {
  await dbConnect();

  const { searchParams } = new URL(request.url);

  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const limit = Math.max(parseInt(searchParams.get("limit") || "20"), 1);

  const dscode = searchParams.get("dscode");
  const date = searchParams.get("date");
  const minAmount = searchParams.get("minAmount");

  try {
    // ======================================================
    // BASE FILTER
    // ======================================================

    const filter = {
      invalidstatus: false,
      status: false,
    };

    // DSID FILTER
    if (dscode) {
      filter.dsid = dscode;
    }

    // DATE FILTER
    if (date) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);

      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      filter.createdAt = {
        $gte: dateStart,
        $lt: dateEnd,
      };
    }

    // ======================================================
    // HELPER: KYC LOOKUP PIPELINE
    // ClosingHistory.dsid === Kyc.dscode
    // ======================================================

    const kycLookupPipeline = [
      {
        $lookup: {
          from: "kyc2",
          localField: "dsid",
          foreignField: "dscode",
          as: "kycData",
        },
      },
      {
        $unwind: {
          path: "$kycData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          pankkyc: {
            $ifNull: ["$kycData.pankkyc", false],
          },
          panresn: {
            $ifNull: ["$kycData.panresn", null],
          },
        },
      },
      {
        $project: {
          kycData: 0,
        },
      },
    ];

    // ======================================================
    // WHEN MIN AMOUNT EXISTS
    // ======================================================

    if (minAmount) {
      const min = Number(minAmount);

      if (Number.isNaN(min)) {
        return Response.json(
          {
            success: false,
            message: "Invalid minAmount",
          },
          { status: 400 }
        );
      }

      // STEP 1:
      // FIND USERS WHOSE TOTAL PAY AMOUNT >= MIN AMOUNT

      const groupedUsers = await ClosingHistoryModel.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$dsid",

            totalPayAmount: {
              $sum: {
                $convert: {
                  input: "$payamount",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
            },
          },
        },
        {
          $match: {
            totalPayAmount: {
              $gte: min,
            },
          },
        },
      ]);

      // VALID DSIDS
      const validDsids = groupedUsers.map((item) => item._id);

      // NO USERS FOUND
      if (validDsids.length === 0) {
        return Response.json(
          {
            success: true,
            message: "No data found",
            data: [],
            total: 0,
            currentPage: page,
            totalPages: 0,
          },
          { status: 200 }
        );
      }

      // STEP 2:
      // FETCH ALL ENTRIES OF THOSE USERS
      // AND ADD PAN KYC DETAILS

      const finalFilter = {
        ...filter,
        dsid: {
          $in: validDsids,
        },
      };

      const data = await ClosingHistoryModel.aggregate([
        {
          $match: finalFilter,
        },

        ...kycLookupPipeline,

        {
          $sort: {
            dsid: 1,
            createdAt: -1,
          },
        },

        {
          $skip: (page - 1) * limit,
        },

        {
          $limit: limit,
        },
      ]);

      const total = await ClosingHistoryModel.countDocuments(finalFilter);

      return Response.json(
        {
          success: true,
          message: "Data fetched successfully!",
          data,
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
        },
        { status: 200 }
      );
    }

    // ======================================================
    // NORMAL QUERY (WITHOUT MIN AMOUNT)
    // ALSO ADD PAN KYC DETAILS
    // ======================================================

    const data = await ClosingHistoryModel.aggregate([
      {
        $match: filter,
      },

      ...kycLookupPipeline,

      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $skip: (page - 1) * limit,
      },

      {
        $limit: limit,
      },
    ]);

    const total = await ClosingHistoryModel.countDocuments(filter);

    return Response.json(
      {
        success: true,
        message: "Data fetched successfully!",
        data,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching closing history:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch data",
        error: error.message,
      },
      { status: 500 }
    );
  }
};