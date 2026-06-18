const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
  {
    countryName: {
      type: String,
      required: true,
    },

    capital: {
      type: String,
      required: true,
    },

    population: {
      type: Number,
      required: true,
    },

    flag: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Country", countrySchema);
