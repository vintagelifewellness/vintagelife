import dbConnect from "@/lib/dbConnect";
import MonthlyClosingHistoryModel from "@/model/MonthleClosingHistory";
import UserModel from "@/model/User";
import steppending from "@/constanst/StepPending";
import KycModel from "@/model/KycStatus";

export async function POST(req) {
  await dbConnect();

  try {



    const approvedKycs = await KycModel.find(
      { aadharkkyc: true },
      { dscode: 1 }
    ).lean();

    const dscodeList = approvedKycs.map(k => k.dscode);

    if (dscodeList.length > 0) {
      await UserModel.updateMany(
        { dscode: { $in: dscodeList } },
        {
          $set: {
            "kycVerification.isVerified": true,
          },
        }
      );
    }

    // Step 1: Get only users who have at least one SAO child and one SGO child
    const potentialUsers = await UserModel.find({
      "kycVerification.isVerified": true,
    });
    const filteredUsers = [];

    // Step 1: Filter users with at least one SAO and one SGO child
    for (const user of potentialUsers) {
      const hasSAO = await UserModel.exists({ pdscode: user.dscode, group: "SAO" });
      const hasSGO = await UserModel.exists({ pdscode: user.dscode, group: "SGO" });

      if (hasSAO && hasSGO) {
        filteredUsers.push(user);
      }
    }

    let successfulPayouts = 0;

    // Step 2: Process eligible users
    for (const user of filteredUsers) {
      const saosp = Number(user.saosp || 0);
      const sgosp = Number(user.sgosp || 0);
      const lastMatchedLevel = user.monthlylastMatched || null;

      let lastIndex = -1;
      if (lastMatchedLevel) {
        lastIndex = steppending.findIndex((step) => step.level === lastMatchedLevel);
      }

      let nextIndex = lastIndex + 1;
      let latestLevel = lastMatchedLevel;

      // Total amounts for single closing entry
      let totalBonus = 0;

      // Step 3: Loop through all next eligible levels
      while (nextIndex < steppending.length) {
        const nextLevel = steppending[nextIndex];

        // Calculate cumulative SAO/SGO required up to this level
        const requiredSAO = steppending
          .slice(0, nextIndex + 1)
          .reduce((sum, level) => sum + level.sao, 0);
        const requiredSGO = steppending
          .slice(0, nextIndex + 1)
          .reduce((sum, level) => sum + level.sgo, 0);

        if (saosp >= requiredSAO && sgosp >= requiredSGO) {
          const bonusAmount = parseInt(nextLevel.bonus.replace(/[₹,]/g, ""), 10);
          totalBonus += bonusAmount;
          latestLevel = nextLevel.level;
          nextIndex++;
        } else {
          break; // stop if next level not eligible
        }
      }

      // Step 4: Create a single closing entry if any bonus earned
      if (totalBonus > 0) {
        const charges = totalBonus * 0.05;
        const payamount = totalBonus - charges;

        const closingEntry = new MonthlyClosingHistoryModel({
          dsid: user.dscode,
          name: user.name || "N/A",
          acnumber: user.acnumber || "N/A",
          ifscCode: user.ifscCode || "N/A",
          bankName: user.bankName || "N/A",
          amount: totalBonus,
          charges: charges.toFixed(2),
          payamount: payamount.toFixed(2),
          date: new Date().toISOString().split("T")[0],
          level: latestLevel, // latest achieved level
        });

        await closingEntry.save();

        // Update last matched level
        await UserModel.updateOne(
          { _id: user._id },
          { $set: { monthlylastMatched: latestLevel } }
        );

        successfulPayouts++;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Closing process completed successfully. Payouts generated for ${successfulPayouts} users.`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating closing history:", error);
    return new Response(
      JSON.stringify({
        message: "Something went wrong during the closing process.",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
