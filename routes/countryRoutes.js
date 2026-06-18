const express = require("express");
const router = express.Router();

const {
  getCountries,
  getCountryById,
  createCountry,
  updateCountry,
  deleteCountry,
} = require("../controllers/countryController");

const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public routes
router.get("/", getCountries);
router.get("/:id", getCountryById);

// Protected routes (require valid JWT and upload middleware for flags)
router.post("/", auth, upload.single("flag"), createCountry);
router.put("/:id", auth, upload.single("flag"), updateCountry);
router.delete("/:id", auth, deleteCountry);

module.exports = router;
