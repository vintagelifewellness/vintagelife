import dbConnect from "@/lib/dbConnect";
import CnfModel from "@/model/c&fusers"; 
import CandFClosingHistoryModel from "@/model/C&FClosingHistory"; 

export async function POST(req) {
    try {
        await dbConnect();
        const cnfUsers = await CnfModel.find({ status: "1" });
        let processedCount = 0;

        for (const user of cnfUsers) {
            const usePoint = Number(user.Usepoint || 0);
            const lastMatchPoint = Number(user.Lastmatchpoint || 0);
            
            // 1. Difference calculate karo (Isme purana carry forward automatically shamil hoga)
            const difference = usePoint - lastMatchPoint;

            // Agar difference 100 se kam hai, toh koi payout nahi banega, isliye skip karo
            if (difference < 100) continue;

            // 🧮 2. Payout aur Carry Forward ka logic (100 ke multiples mein)
            const payoutApplicablePoint = Math.floor(difference / 100) * 100; // e.g., 220 -> 200
            const carryForwardPoint = difference % 100; // e.g., 220 -> 20

            // 🚀 3. History record create karo
            const closingEntry = new CandFClosingHistoryModel({
                dsid: user.dscode,
                name: user.name || user.cfName || "N/A",
                acnumber: user.acnumber || "N/A",
                ifscCode: user.ifscCode || "N/A",
                bankName: user.bankName || "N/A",
                
                amount: String(difference), // Total point difference dikhane ke liye (e.g., 220)
                payamount: String(payoutApplicablePoint), // Actual paisa/point jo milega (e.g., 200)
                charges: "0",
                
                lastmatchpoint: String(lastMatchPoint),
                usepoint: String(usePoint),
                
                // Naye fields jo humne model me add kiye the
                payoutApplicablePoint: String(payoutApplicablePoint),
                carryForwardPoint: String(carryForwardPoint),

                closingType: "CandF_Points", 
                date: new Date().toISOString().split("T")[0],
                status: false,
                defaultdata: "candfHistory"
            });

            await closingEntry.save();
            
            // 🚨 MAGIC TRICK: Yahan dhyaan do!
            // Hum 'Lastmatchpoint' ko 'usePoint' nahi bana rahe hain. 
            // Hum purane point mein sirf wo point jod rahe hain jiska paisa de diya (e.g., 954 + 200 = 1154).
            // Isse bacha hua 20 point (Carry Forward) database mein safe rahega aur agle payout mein apne aap count hoga!
            user.Lastmatchpoint = lastMatchPoint + payoutApplicablePoint;
            
            await user.save();
            processedCount++;
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Closing Done! ${processedCount} C&F records generated.` 
        }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false, 
            message: error.message 
        }), { status: 500 });
    }
}