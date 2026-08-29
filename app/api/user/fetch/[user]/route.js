import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

export const GET = async (request) => {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    const searchField = searchParams.get("searchField");
    const searchValue = searchParams.get("searchValue");
    const date = searchParams.get("date");

    const filter = {
        defaultdata: { $in: ["freeze", "user", "block"] },
        usertype: { $ne: 2 },
    };

    // Advanced search logic
    if (searchField && searchValue) {
        // Only apply regex if both are valid
        filter[searchField] = { $regex: searchValue, $options: 'i' };
    }
    
    // Exact date filtering logic
    if (date) {
        const dateStart = new Date(date);
        const dateEnd = new Date(date);
        dateEnd.setDate(dateEnd.getDate() + 1);
        
        // This targets everything that happened from 00:00:00 to 23:59:59 on the selected date
        filter.createdAt = { $gte: dateStart, $lt: dateEnd };
    }

    try {
        const data = await UserModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await UserModel.countDocuments(filter);

        return Response.json(
            {
                message: "Data fetched successfully!",
                success: true,
                data,
                total,
                currentPage: page,
                totalPages: Math.ceil(total / limit) || 1, // Fallback to 1 if empty
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching users:", error);
        return Response.json(
            { message: "Failed to fetch data", success: false },
            { status: 500 }
        );
    }
};