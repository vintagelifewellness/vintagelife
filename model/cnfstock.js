import mongoose, { Schema } from "mongoose";

const CnfStockSchema = new Schema(

    {
        dscode: { type: String, required: true }, 
        productDetails: [
            {
                product: { type: String, },
                quantity: { type: String, },
                price: { type: String },
                sp: { type: String }
            }
        ],

    },
    { timestamps: true }
);

const CnfStockModel =
    mongoose.models.CnfStock || mongoose.model("CnfStock", CnfStockSchema);

export default CnfStockModel