import { NextResponse } from "next/server";
import CnfModel from "@/model/c&fusers"; 
import dbConnect from "@/lib/dbConnect";

export async function GET(request, { params }) {
    try {
        await dbConnect(); 
 
        const userEmail = params.email; 

        const candfData = await CnfModel.findOne({ email: userEmail });

        if (!candfData) {
            return NextResponse.json({ message: "Bhai data nahi mila" }, { status: 404 });
        }

        return NextResponse.json(candfData, { status: 200 });

    } catch (error) {
        console.error("API me error aagya:", error);
        return NextResponse.json({ message: "Kuch gadbad ho gayi server par" }, { status: 500 });
    }
}