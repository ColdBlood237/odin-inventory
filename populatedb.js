#! /usr/bin/env node

console.log(
  'This script populates some test items and categories to your database. Specified database as argument - e.g.: node populatedb "mongodb+srv://cooluser:coolpassword@cluster0.lz91hw2.mongodb.net/local_library?retryWrites=true&w=majority"'
);

// Get arguments passed on command line
const userArgs = process.argv.slice(2);

const Item = require("./models/item");
const Category = require("./models/category");

const categories = [];
const items = [];

const mongoose = require("mongoose");
mongoose.set("strictQuery", false); // Prepare for Mongoose 7

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
  console.log("Debug: About to connect");
  await mongoose.connect(mongoDB);
  console.log("Debug: Should be connected?");
  await createCategories();
  await createItems();
  console.log("Debug: Closing mongoose");
  mongoose.connection.close();
}

// We pass the index to the ...Create functions so that, for example,
// category[0] will always be the Fantasy category, regardless of the order
// in which the elements of promise.all's argument complete.
async function categoryCreate(index, name, description) {
  const category = new Category({ name: name, description: description });
  await category.save();
  categories[index] = category;
  console.log(`Added category: ${name}`);
}

async function itemCreate(index, name, description, category, price, stock) {
  const itemDetail = {
    name: name,
    description: description,
    price: price,
    stock: stock,
  };

  if (category != false) itemDetail.category = category;

  const item = new Item(itemDetail);
  await item.save();
  items[index] = item;
  console.log(`Added item: ${name}`);
}

async function createCategories() {
  console.log("Adding categories");
  await Promise.all([
    categoryCreate(
      0,
      "Fantasy",
      "Everything your eyes can't see but your soul can comprehend."
    ),
    categoryCreate(
      1,
      "Science Fiction",
      "Will get there soon, by slightly erasing the line between science and magic."
    ),
    categoryCreate(2, "Animes", "We want them, we love them, we need them."),
  ]);
}

async function createItems() {
  console.log("Adding items");
  await Promise.all([
    itemCreate(
      0,
      "Berserk",
      "This is a masterpiece.",
      [categories[2]],
      14.99,
      17
    ),
    itemCreate(
      1,
      "Dragon",
      "Mythological beast that spits fire.",
      [categories[0]],
      150000,
      1
    ),
    itemCreate(
      2,
      "Darth Vader",
      "Trust me you don't wanna mess with him.",
      [categories[1]],
      2000000,
      1
    ),
  ]);
}
