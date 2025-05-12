const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const provinceSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: Number,
    required: true,
  },
  codename: {
    type: String,
    required: true,
  },
  division_type: {
    type: String,
    required: true,
  },
  phone_code: {
    type: Number,
    required: true,
  },
  districts: [
    {
      name: {
        type: String,
        required: true,
      },
      code: {
        type: Number,
        required: true,
      },
      codename: {
        type: String,
        required: true,
      },
      division_type: {
        type: String,
        required: true,
      },
      short_codename: {
        type: String,
        required: true,
      },
      wards: [
        {
          name: {
            type: String,
            required: true,
          },
          code: {
            type: Number,
            required: true,
          },
          code_name: {
            type: String,
            required: true,
          },
          division_type: {
            type: String,
            required: true,
          },
          short_codename: {
            type: String,
            required: true,
          },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Province", provinceSchema);
