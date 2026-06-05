// model/CnfDemand.js
import mongoose from "mongoose";

const RequestedItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    mrp: { type: Number, default: 0 },
    price: { type: Number, required: true },
    rp: { type: Number, required: true },
    quantity: { type: Number, required: true }
});

const CnfDemandSchema = new mongoose.Schema({
    dscode: { type: String, required: true },
    cfName: { type: String, required: true },
    cfType: { type: String },
    requestedPoints: { type: Number, default: 0 },
    
    // Admin ke liye ye 2 main fields yahan add ki hain 👇
    totalPrice: { type: Number, default: 0 },
    totalRp: { type: Number, default: 0 },
    
    requestedItems: [RequestedItemSchema], 
    requestDate: { type: Date, default: Date.now },
    status: { type: String, default: "Pending" } 
}, { timestamps: true });

export default mongoose.models.CnfDemand || mongoose.model("CnfDemand", CnfDemandSchema);