import mongoose, { Schema, models } from "mongoose";

const BillSchema = new Schema(
  {
    nama: {
      type: String,
      required: true,
    },
    kelas: {
      type: String,
      required: true,
    },
    nisn: {
      type: String,
      required: true,
    },
    bulan: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
    bank: {
      type: String,
      default: "",
    },
    nominal: {
      type: Number,
      default: 0,
    },
    proofs: {
      type: [String],
      default: [],
    },
    proof: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Bill = models.Bill || mongoose.model("Bill", BillSchema);

export default Bill;