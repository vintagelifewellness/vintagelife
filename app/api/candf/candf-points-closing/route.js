import dbConnect from "@/lib/dbConnect";
import CnfModel from "@/model/c&fusers"; 
// 🚨 Purana hatao, naya Model import karo
import CandFClosingHistoryModel from "@/model/C&FClosingHistory"; 

export async function POST(req) {
    try {
        await dbConnect();
        const cnfUsers = await CnfModel.find({ status: "1" });
        let processedCount = 0;

        for (const user of cnfUsers) {
            const usePoint = Number(user.Usepoint || 0);
            const lastMatchPoint = Number(user.Lastmatchpoint || 0);
            const difference = usePoint - lastMatchPoint;

            if (difference <= 0) continue;

            // 🚀 Ab data naye model "CandFClosingHistoryModel" me jayega
            const closingEntry = new CandFClosingHistoryModel({
                dsid: user.dscode,
                name: user.name || user.cfName || "N/A",
                acnumber: user.acnumber || "N/A",
                ifscCode: user.ifscCode || "N/A",
                bankName: user.bankName || "N/A",
                amount: String(difference),
                charges: "0",
                payamount: String(difference),
                lastmatchpoint: String(lastMatchPoint),
                usepoint: String(usePoint),
                closingType: "CandF_Points", 
                date: new Date().toISOString().split("T")[0],
                status: false,
                defaultdata: "candfHistory" // Purane se alag pehchan
            });

            await closingEntry.save();
            user.Lastmatchpoint = usePoint;
            await user.save();
            processedCount++;
        }

        return new Response(JSON.stringify({ success: true, message: `Closing Done! ${processedCount} C&F records generated.` }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}