import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  author: { type: String, required: true },
  rating: { type: Number, default: 5 },
  comment: { type: String, required: true },
  date: { type: String, default: () => new Date().toLocaleDateString("en-GB") },
});

const bookSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      default: "Mountaineering Books",
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    oldPrice: {
      type: Number,
    },
    rating: {
      type: String,
      default: "4.8",
    },
    reviews: {
      type: String,
      default: "128",
    },
    badge: {
      type: String,
      default: "",
    },
    offers: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: true,
    },
    fallbackImage: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    reviewsList: [reviewSchema],
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model("Book", bookSchema);
export default Book;
