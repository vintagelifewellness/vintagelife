// app/api/newclosing/bonanza/route.js

import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import MonthsModel from "@/model/3monthsboonanza";

export async function GET(req) {
  try {
    await dbConnect();

    // 1. Fetch the latest bonanza configuration
    const bonanzaData = await MonthsModel.findOne().sort({ createdAt: -1 });
    if (!bonanzaData) {
      return Response.json({ success: false, message: "No bonanza data found" }, { status: 404 });
    }

    // 2. Map level requirements for fast lookup
    const levelsMap = {};
    for (const levelEntry of bonanzaData.levels) {
      levelsMap[levelEntry.level] = {
        sao: parseFloat(levelEntry.sao || "0"),
        sgo: parseFloat(levelEntry.sgo || "0"),
      };
    }

    // 3. Batch fetch all users in the bonanza list to optimize performance
    const dsids = bonanzaData.UserDetails.map(detail => detail.dsid);
    const usersFromDb = await UserModel.find({ dscode: { $in: dsids } });
    
    // Create a lookup Map (dscode -> user object)
    const userMap = new Map(usersFromDb.map(user => [user.dscode, user]));

    const qualifiedUsers = [];

    // 4. Process each user detail
    for (const detail of bonanzaData.UserDetails) {
      const dsid = detail.dsid;
      const prevSaosp = parseFloat(detail.saosp || "0");
      const prevSgosp = parseFloat(detail.sgosp || "0");
      const bonanzaLevel = detail.userlevel || "";

      const levelRequirement = levelsMap[bonanzaLevel];
      if (!levelRequirement) continue;

      const user = userMap.get(dsid);
      if (!user) continue;

      // Current values from UserModel
      const userSaosp = parseFloat(user.saosp || "0");
      const userSgosp = parseFloat(user.sgosp || "0");

      // 5. Calculate targets using Math.floor to ignore fractional differences (like the 0.5 issue)
      const targetSaosp = Math.floor(prevSaosp + levelRequirement.sao);
      const targetSgosp = Math.floor(prevSgosp + levelRequirement.sgo);

      // 6. Qualification Check
      // Now: 849 >= 849 will return TRUE
      if (userSaosp >= targetSaosp && userSgosp >= targetSgosp) {
        qualifiedUsers.push({
          username: user.name,
          dsid: dsid,
          mobile: user.mobileNo,
          level: bonanzaLevel,
          userSaosp: userSaosp,
          userSgosp: userSgosp,
          targetSaosp: targetSaosp,
          targetSgosp: targetSgosp
        });
      }
    }

    // 7. Return the final structured data
    return Response.json(
      {
        success: true,
        title: bonanzaData.title,
        datefrom: bonanzaData.datefrom,
        dateto: bonanzaData.dateto,
        users: qualifiedUsers,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}