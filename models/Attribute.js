import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "text",
    },
    isPreset: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: "",
    },
    values: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
  },
  {
    timestamps: true,
  }
);

const Attribute = mongoose.model("Attribute", attributeSchema);
export default Attribute;
