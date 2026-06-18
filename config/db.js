const mongoose = require("mongoose");
const Country = require("../models/Country");

const seedDB = async () => {
  try {
    const count = await Country.countDocuments();
    if (count === 0) {
      console.log("No countries found in database. Seeding initial data...");
      const sampleCountries = [
        {
          countryName: "India",
          capital: "New Delhi",
          population: 1400000000,
          flag: "https://flagcdn.com/h240/in.png"
        },
        {
          countryName: "United States",
          capital: "Washington, D.C.",
          population: 331000000,
          flag: "https://flagcdn.com/h240/us.png"
        },
        {
          countryName: "Germany",
          capital: "Berlin",
          population: 83000000,
          flag: "https://flagcdn.com/h240/de.png"
        },
        {
          countryName: "Japan",
          capital: "Tokyo",
          population: 125000000,
          flag: "https://flagcdn.com/h240/jp.png"
        },
        {
          countryName: "United Kingdom",
          capital: "London",
          population: 67000000,
          flag: "https://flagcdn.com/h240/gb.png"
        },
        {
          countryName: "Australia",
          capital: "Canberra",
          population: 25000000,
          flag: "https://flagcdn.com/h240/au.png"
        },
        {
          countryName: "Canada",
          capital: "Ottawa",
          population: 38000000,
          flag: "https://flagcdn.com/h240/ca.png"
        },
        {
          countryName: "France",
          capital: "Paris",
          population: 67000000,
          flag: "https://flagcdn.com/h240/fr.png"
        }
      ];
      await Country.insertMany(sampleCountries);
      console.log("Seeding completed successfully.");
    }
  } catch (error) {
    console.error("Database seeding error:", error.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");
    await seedDB();
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
