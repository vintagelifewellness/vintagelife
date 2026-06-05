import mongoose, { Schema } from "mongoose";

const CandFClosingSchema = new Schema({
    dsid: { type: String, required: true },
    name: { type: String, required: true },
    acnumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
    amount: { type: String, required: true },
    charges: { type: String, default: "0" },
    payamount: { type: String, required: true },
    lastmatchpoint: { type: String, default: "0" },
    usepoint: { type: String, default: "0" },

    utr: { type: String, },
    invalidresn: { type: String },
    invalidstatus: { type: Boolean, required: true, default: false },
    date: { type: String, required: true },
    status: { type: Boolean, default: false },
    invalidstatus: { type: Boolean, default: false },
    defaultdata: { type: String, default: "candf_only" }
}, { timestamps: true });


const CandFHistoryModel = mongoose.models.CandFHistory || mongoose.model("CandFHistory", CandFClosingSchema);

export default CandFHistoryModel;