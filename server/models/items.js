const mongoose = require("mongoose")
const { Schema } = mongoose;

const itemSchema = new Schema({
    ean: { type: String},
  title: { type: String, required: true },
  upc: { type: String},
  gtin : {type : String},
  asin: { type: String },
  description: { type: String },
  brand: { type: String },
  model: { type: String },
  dimension: { type: String }, 
  weight: { type: String },
  category: { type: String },
  currency: { type: String },
  lowest_recorded_price: { type: Number },
  highest_recorded_price: { type: Number },
  images: { type: [String] }, // Array of strings for image URLs
  
  elid: { type: String }
})

const Item = mongoose.model("Item",itemSchema) 
module.exports = Item;