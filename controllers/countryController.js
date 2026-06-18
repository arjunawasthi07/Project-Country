const Country = require("../models/Country");
const fs = require("fs");
const path = require("path");

// Get all countries
const getCountries = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.countryName = { $regex: search, $options: "i" };
    }
    const countries = await Country.find(query).sort({ countryName: 1 });
    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single country by ID
const getCountryById = async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);
    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }
    res.json(country);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a country
const createCountry = async (req, res) => {
  try {
    const { countryName, capital, population } = req.body;

    if (!countryName || !capital || !population) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Check if country already exists
    const existing = await Country.findOne({ countryName: { $regex: new RegExp("^" + countryName + "$", "i") } });
    if (existing) {
      return res.status(400).json({ message: "Country already exists" });
    }

    let flagUrl = "";
    if (req.file) {
      flagUrl = req.file.path.startsWith("http") ? req.file.path : "/uploads/" + req.file.filename;
    }

    const country = await Country.create({
      countryName,
      capital,
      population: Number(population),
      flag: flagUrl,
    });

    res.status(201).json({
      message: "Country created successfully",
      country,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update country details
const updateCountry = async (req, res) => {
  try {
    const { countryName, capital, population } = req.body;
    const country = await Country.findById(req.params.id);

    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    if (countryName) country.countryName = countryName;
    if (capital) country.capital = capital;
    if (population) country.population = Number(population);

    if (req.file) {
      // If there is an old local file, delete it
      if (country.flag && !country.flag.startsWith("http")) {
        const oldPath = path.join(__dirname, "../public", country.flag);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (err) {
            console.error("Failed to delete old flag file:", err.message);
          }
        }
      }
      country.flag = req.file.path.startsWith("http") ? req.file.path : "/uploads/" + req.file.filename;
    }

    await country.save();
    res.json({
      message: "Country updated successfully",
      country,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete country
const deleteCountry = async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);
    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    // Delete flag file if local
    if (country.flag && !country.flag.startsWith("http")) {
      const filePath = path.join(__dirname, "../public", country.flag);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Failed to delete flag file:", err.message);
        }
      }
    }

    await Country.findByIdAndDelete(req.params.id);
    res.json({ message: "Country deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCountries,
  getCountryById,
  createCountry,
  updateCountry,
  deleteCountry,
};
