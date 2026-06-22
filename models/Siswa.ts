import mongoose, { Schema, models } from "mongoose";

const SiswaSchema = new Schema(
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
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    ttl: {
      type: String,
      default: "",
    },
    jk: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Siswa = models.Siswa || mongoose.model("Siswa", SiswaSchema);

export default Siswa;
