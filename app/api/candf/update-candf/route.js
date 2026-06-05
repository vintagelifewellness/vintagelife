import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CnfModel from "@/model/c&fusers"; 
import PointHistory from "@/model/PointHistory";

export async function PATCH(request) {
    try {
        await dbConnect(); 
        const body = await request.json();
        const { id, ...updateData } = body; 

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Bhai, update karne ke liye ID zaruri hai" }, 
                { status: 400 }
            );
        }
        
        const oldUser = await CnfModel.findById(id);
        if (!oldUser) {
            return NextResponse.json(
                { success: false, message: "C&F user nahi mila database me" }, 
                { status: 404 }
            );
        }

      
        if (updateData.Availablepoint !== undefined) {
            const oldBalance = parseFloat(oldUser.Availablepoint || 0);
            const newBalance = parseFloat(updateData.Availablepoint || 0);
            const diff = newBalance - oldBalance;
            
            if (diff !== 0) {
                await PointHistory.create({
                    cfCode: oldUser.dscode, 
                    cfName: oldUser.cfName || oldUser.companyName, 
                    date: new Date(),
                    addedPoints: diff > 0 ? diff : diff,
                    oldBalance: oldBalance,
                    newBalance: newBalance,
                    remarks: diff > 0 ? "Points Added by Admin" : "Points Removed/Reset"
                });
            }
        }
       
        const updatedCandF = await CnfModel.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true } 
        );

        return NextResponse.json(
            { success: true, message: "Data mast update ho gaya!", data: updatedCandF }, 
            { status: 200 }
        );

    } catch (error) {
        console.error("Update karne me error aagya:", error);
        return NextResponse.json(
            { success: false, message: "Server me kuch gadbad ho gayi update karte time" }, 
            { status: 500 }
        );
    }
}