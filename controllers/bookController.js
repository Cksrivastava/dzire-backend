import Book from "../models/Book.js";
import { getDbStatus } from "../config/db.js";
import memoryStore from "../config/store.js";

// @desc    Get all books with category filter & search
// @route   GET /api/books
export const getBooks = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    if (getDbStatus()) {
      const filter = {};
      if (category && category !== "All") {
        filter.category = new RegExp(`^${category}$`, "i");
      }
      if (search) {
        filter.$or = [
          { name: new RegExp(search, "i") },
          { author: new RegExp(search, "i") },
          { category: new RegExp(search, "i") },
        ];
      }
      const books = await Book.find(filter).sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: books.length,
        books,
      });
    } else {
      let books = [...memoryStore.books];
      if (category && category !== "All") {
        books = books.filter(
          (b) => b.category.toLowerCase() === category.toLowerCase()
        );
      }
      if (search) {
        const q = search.toLowerCase();
        books = books.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q)
        );
      }
      return res.json({
        success: true,
        count: books.length,
        books,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book details with recommendations
// @route   GET /api/books/:id
export const getBookById = async (req, res, next) => {
  try {
    const bookId = req.params.id;

    if (getDbStatus()) {
      let book = await Book.findOne({ id: bookId });
      if (!book && bookId.match(/^[0-9a-fA-F]{24}$/)) {
        book = await Book.findById(bookId);
      }
      if (!book) {
        return res.status(404).json({ success: false, message: "Book not found" });
      }

      const readersAlsoEnjoyed = await Book.find({
        id: { $ne: book.id },
        category: book.category,
      }).limit(4);

      const relatedAdventures = await Book.find({
        id: { $ne: book.id },
      }).limit(3);

      return res.json({
        success: true,
        book,
        readersAlsoEnjoyed,
        relatedAdventures,
      });
    } else {
      const book = memoryStore.books.find((b) => b.id === bookId) || memoryStore.books[0];
      const readersAlsoEnjoyed = memoryStore.books.filter((b) => b.id !== book.id).slice(0, 4);
      const relatedAdventures = memoryStore.books.filter((b) => b.id !== book.id).slice(0, 3);

      return res.json({
        success: true,
        book,
        readersAlsoEnjoyed,
        relatedAdventures,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add review to book
// @route   POST /api/books/:id/reviews
export const addBookReview = async (req, res, next) => {
  try {
    const { author, rating, comment } = req.body;
    const bookId = req.params.id;

    const newReview = {
      author: author?.trim() || "Verified Reader",
      rating: Number(rating) || 5,
      comment: comment?.trim() || "",
      date: new Date().toLocaleDateString("en-GB"),
    };

    if (getDbStatus()) {
      const book = await Book.findOne({ id: bookId });
      if (!book) {
        return res.status(404).json({ success: false, message: "Book not found" });
      }
      book.reviewsList.push(newReview);
      book.reviews = String(Number(book.reviews || 0) + 1);
      await book.save();

      return res.status(201).json({
        success: true,
        reviews: book.reviewsList,
      });
    } else {
      const book = memoryStore.books.find((b) => b.id === bookId);
      if (book) {
        if (!book.reviewsList) book.reviewsList = [];
        book.reviewsList.push(newReview);
        book.reviews = String(Number(book.reviews || 0) + 1);
      }
      return res.status(201).json({
        success: true,
        reviews: book?.reviewsList || [newReview],
      });
    }
  } catch (error) {
    next(error);
  }
};
