import Rental from "../models/Rental.js";
import { getDbStatus } from "../config/db.js";
import memoryStore from "../config/store.js";

// @desc    Get all rental items with category filter
// @route   GET /api/rentals
export const getRentals = async (req, res, next) => {
  try {
    const { category } = req.query;

    if (getDbStatus()) {
      const filter = {};
      if (category && category !== "All") {
        filter.category = new RegExp(`^${category}$`, "i");
      }
      const rentals = await Rental.find(filter).sort({ id: 1 });
      return res.json({
        success: true,
        count: rentals.length,
        rentals,
      });
    } else {
      let rentals = [...memoryStore.rentals];
      if (category && category !== "All") {
        rentals = rentals.filter(
          (r) => r.category.toLowerCase() === category.toLowerCase()
        );
      }
      return res.json({
        success: true,
        count: rentals.length,
        rentals,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get single rental item
// @route   GET /api/rentals/:id
export const getRentalById = async (req, res, next) => {
  try {
    const rentalId = Number(req.params.id);

    if (getDbStatus()) {
      let rental = await Rental.findOne({ id: rentalId });
      if (!rental && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        rental = await Rental.findById(req.params.id);
      }
      if (!rental) {
        return res.status(404).json({ success: false, message: "Rental item not found" });
      }
      return res.json({ success: true, rental });
    } else {
      const rental = memoryStore.rentals.find((r) => r.id === rentalId) || memoryStore.rentals[0];
      return res.json({ success: true, rental });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Book a rental item
// @route   POST /api/rentals/book
export const bookRental = async (req, res, next) => {
  try {
    const { rentalId, userName, userEmail, userPhone, startDate, endDate, days, totalCost } = req.body;

    const booking = {
      userId: req.user?._id || null,
      userName: userName?.trim() || req.user?.name || "Customer",
      userEmail: userEmail?.trim() || req.user?.email || "customer@example.com",
      userPhone: userPhone?.trim() || req.user?.phone || "",
      startDate,
      endDate,
      days: Number(days) || 1,
      totalCost: Number(totalCost) || 500,
      status: "Confirmed",
    };

    if (getDbStatus()) {
      const rental = await Rental.findOne({ id: Number(rentalId) });
      if (rental) {
        booking.deposit = rental.deposit;
        rental.bookings.push(booking);
        await rental.save();
      }
    } else {
      const rental = memoryStore.rentals.find((r) => r.id === Number(rentalId));
      if (rental) {
        if (!rental.bookings) rental.bookings = [];
        rental.bookings.push(booking);
      }
    }

    res.status(201).json({
      success: true,
      message: "Rental booking confirmed!",
      booking,
    });
  } catch (error) {
    next(error);
  }
};
