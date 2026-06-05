import mongoose, { Schema } from "mongoose";

const PointHistorySchema = new Schema({
  cfCode: { 
    type: String, 
    required: true 
  },
  cfName: { 
    type: String 
  }, 
  date: { 
    type: Date, 
    default: Date.now 
  },
  addedPoints: { 
    type: Number 
  },
  oldBalance: { 
    type: Number 
  }, 
  newBalance: { 
    type: Number 
  }, 
  remarks: { 
    type: String 
  },

  orderId: { 
    type: String, 
    default: null 
  },
  transactionType: { 
    type: String, 
    enum: ["Credited", "Debited"], 
    default: "Credited" 
  } 
});

const PointHistoryModel = mongoose.models.PointHistory || mongoose.model("PointHistory", PointHistorySchema);

export default PointHistoryModel;