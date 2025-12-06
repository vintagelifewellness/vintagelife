import dbConnect from "@/lib/dbConnect";
import MonthsModel from "@/model/3monthsboonanza";

export async function PATCH(req, context) {
    await dbConnect();

    try {
        // ✅ In new Next.js, context is async – await it to get params
        const { params } = await context;
        const { id } = params;

        const body = await req.json();   // updated fields from frontend

        const updatedData = await MonthsModel.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true } // return updated document
        );

        if (!updatedData) {
            return Response.json(
                {
                    message: "Data not found",
                    success: false,
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                message: "Data updated successfully",
                success: true,
                data: updatedData,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log(error);
        return Response.json(
            {
                message: "Error updating data",
                success: false,
                error: error.message,
            },
            { status: 500 }
        );
    }
}
