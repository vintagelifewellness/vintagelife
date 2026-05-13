import dbConnect from "@/lib/dbConnect";
import ClosingHistoryModel from "@/model/ClosingHistory";

export const GET = async (request) => {
  await dbConnect();

  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

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

      const dateEnd = new Date(date);
      dateEnd.setDate(dateEnd.getDate() + 1);

      filter.createdAt = {
        $gte: dateStart,
        $lt: dateEnd,
      };
    }

    // ======================================================
    // WHEN MIN AMOUNT EXISTS
    // ======================================================

    if (minAmount) {
      const min = Number(minAmount);

      // STEP 1:
      // FIND USERS WHOSE TOTAL >= MIN AMOUNT

      const groupedUsers = await ClosingHistoryModel.aggregate([
        {
          $match: filter,
        },

        {
          $group: {
            _id: "$dsid",

            totalPayAmount: {
              $sum: {
                $toDouble: "$payamount",
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
      // SAME USER DATA TOGETHER

      const finalFilter = {
        ...filter,
        dsid: {
          $in: validDsids,
        },
      };

      const data = await ClosingHistoryModel.find(finalFilter)
        .sort({
          dsid: 1, // same user together
          createdAt: -1, // latest first inside same user
        })
        .skip((page - 1) * limit)
        .limit(limit);

      const total =
        await ClosingHistoryModel.countDocuments(finalFilter);

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
    // ======================================================

    const data = await ClosingHistoryModel.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit);

    const total =
      await ClosingHistoryModel.countDocuments(filter);

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
      },
      { status: 500 }
    );
  }
};