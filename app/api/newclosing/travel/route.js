import dbConnect from "@/lib/dbConnect";
import TravelfundModel from "@/model/travelfund";
import UserModel from "@/model/User";

export async function POST(req) {
  await dbConnect();

  try {
    // 1. Bulk fetch valid downline codes (Reduces 10,000+ DB queries to 2)
    const saoPdscodes = await UserModel.distinct("pdscode", { group: "SAO" });
    const sgoPdscodes = await UserModel.distinct("pdscode", { group: "SGO" });

    // Use Sets for O(1) lightning-fast in-memory lookups
    const saoSet = new Set(saoPdscodes);
    const sgoSet = new Set(sgoPdscodes);

    // 2. Use .lean() and projection to fetch only necessary data as pure JS objects
    const potentialUsers = await UserModel.find(
      {},
      "dscode name acnumber ifscCode bankName saosp sgosp travellastMatchedsao travellastMatchedsgo"
    ).lean();

    const closingEntries = [];
    const userUpdates = [];

    // Format date with IST timezone to prevent "one day prior" recording bugs
    const dateOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = new Intl.DateTimeFormat('en-CA', dateOptions).format(new Date());

    for (const user of potentialUsers) {
      // O(1) memory check instead of awaiting the DB
      if (!saoSet.has(user.dscode) || !sgoSet.has(user.dscode)) {
        continue;
      }

      const saosp = Number(user.saosp || 0);
      const sgosp = Number(user.sgosp || 0);

      const lastMatchedSao = Number(user.travellastMatchedsao || 2000);
      const lastMatchedSgo = Number(user.travellastMatchedsgo || 1000);

      if (saosp < 2000 || sgosp < 1000) continue;

      const newMatchedSao = saosp - lastMatchedSao;
      const newMatchedSgo = sgosp - lastMatchedSgo;
      const newMatchingSP = Math.min(newMatchedSao, newMatchedSgo);

      if (newMatchingSP <= 0) continue;

      const originalAmount = newMatchingSP * 10; 
      const finalAmount = originalAmount * 0.95; 
      const charges = 0; 
      const payamount = finalAmount * 0.15;

      // Prepare payload for insertMany
      closingEntries.push({
        dsid: user.dscode,
        name: user.name || "N/A",
        acnumber: user.acnumber || "N/A",
        ifscCode: user.ifscCode || "N/A",
        bankName: user.bankName || "N/A",
        amount: finalAmount.toFixed(2),
        charges: charges.toFixed(2),
        payamount: payamount.toFixed(2),
        date: formattedDate,
      });

      // Prepare payload for bulkWrite
      userUpdates.push({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              travellastMatchedsao: String(saosp),
              travellastMatchedsgo: String(sgosp)
            }
          }
        }
      });
    }

    // 3. Execute bulk operations in exactly two queries
    if (closingEntries.length > 0) {
      await TravelfundModel.insertMany(closingEntries);
      await UserModel.bulkWrite(userUpdates);
    }

    return new Response(
      JSON.stringify({
        message: `Travel fund process completed successfully. Payouts generated for ${closingEntries.length} users.`,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error generating travel fund:", error);
    return new Response(
      JSON.stringify({
        message: "Something went wrong during the travel fund process.",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}