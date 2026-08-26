import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CnfModel from "@/model/c&fusers";
import CandFHistoryModel from "@/model/C&FClosingHistory";

export async function GET(req) {
  try {
    // 1. Connect to the database
    await dbConnect();

    // 2. Fetch all users from the CnfModel
    const users = await CnfModel.find({});
    let processedCount = 0;

    // 3. Loop through each user to check their points
    for (const user of users) {
      const usePoint = user.Usepoint || 0;
      const lastMatchPoint = user.Lastmatchpoint || 0;

      // Find the difference between current used points and the last matched points
      const diff = usePoint - lastMatchPoint;

      // 4. Check if they have at least 100 processable points
      if (diff >= 100) {
        // Find how many multiples of 100 we can process (e.g., 120 -> 100)
        const processablePoints = Math.floor(diff / 100) * 100;
        
        // Calculate the new last match point (e.g., 200 + 100 = 300)
        const newLastMatchPoint = lastMatchPoint + processablePoints;

        // Calculate amount: For every 100 points, pay 500 rupees
        const amount = (processablePoints / 100) * 500;
        const charges = 0; // As requested, charges are 0 right now
        const payAmount = amount - charges;

        // 5. Create a new entry in CandFHistoryModel
        await CandFHistoryModel.create({
          dsid: user.dscode, // Linking by the user's unique dscode
          name: user.name,
          acnumber: user.acnumber || "",
          ifscCode: user.ifscCode || "",
          bankName: user.bankName || "",
          amount: amount.toString(),
          charges: charges.toString(),
          payamount: payAmount.toString(),
          lastmatchpoint: newLastMatchPoint.toString(),
          usepoint: usePoint.toString(),
          date: new Date().toISOString(), // Your schema requires a string for the date
          status: false 
        });

        // 6. Update the user's Lastmatchpoint in CnfModel
        user.Lastmatchpoint = newLastMatchPoint;
        await user.save();

        processedCount++;
      }
    }

    // 7. Return a success response with the count of processed users
    return NextResponse.json(
      { 
        success: true, 
        message: `Closing generated successfully! Processed ${processedCount} users.` 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error generating closing:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}