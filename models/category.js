const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  category_id: String,
  title: String,
}, { collection: "categories" });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
