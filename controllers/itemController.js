const { body, validationResult } = require("express-validator");
const Item = require("../models/item");
const asyncHandler = require("express-async-handler");
const Category = require("../models/category");

exports.index = asyncHandler(async (req, res, next) => {
  res.render("index");
});

exports.item_list = asyncHandler(async (req, res, next) => {
  const allItems = await Item.find({}, "name category price")
    .sort({ name: 1 })
    .populate("category")
    .exec();

  res.render("item_list", { title: "All Items", item_list: allItems });
});

exports.item_detail = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id).populate("category").exec();
  res.render("item_detail", { item: item });
});

exports.item_create_get = asyncHandler(async (req, res, next) => {
  const allCategories = await Category.find().exec();
  res.render("item_form", { categories: allCategories });
});

exports.item_create_post = [
  body("name", "Name must not be empty").trim().isLength({ min: 1 }).escape(),
  body("description", "Description must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("category", "Category must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("price", "Price must not be empty").trim().isLength({ min: 1 }).escape(),
  body("stock", "Stock must not be empty").trim().isLength({ min: 1 }).escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const item = new Item({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      stock: req.body.stock,
    });

    if (!errors.isEmpty()) {
      const allCategories = await Category.find().exec();

      // Mark our selected category as checked.
      for (const category of allCategories) {
        if (item.category.indexOf(category._id) > -1) {
          category.checked = "true";
        }
      }

      res.render("item_form", {
        categories: allCategories,
        item: item,
        errors: errors,
      });
    } else {
      const itemExists = await Item.findOne({ name: req.body.name }).exec();

      if (itemExists) {
        res.redirect(itemExists.url);
      } else {
        await item.save();
        res.redirect(item.url);
      }
    }
  }),
];
exports.item_delete_get = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id);
  res.render("item_delete", { item: item });
});

exports.item_delete_post = asyncHandler(async (req, res, next) => {
  await Item.findByIdAndDelete(req.body.itemid);
  res.redirect("/inventory/items");
});

exports.item_update_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: item update GET");
});

exports.item_update_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: item update POST");
});
