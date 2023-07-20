const Item = require("../models/item");
const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

exports.index = asyncHandler(async (req, res, next) => {
  res.render("index");
});

exports.item_list = asyncHandler(async (req, res, next) => {
  const allItems = await Item.find({}, "name category price img")
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
  res.render("item_form", {
    title: `Add an item`,
    categories: allCategories,
  });
});

exports.item_create_post = [
  (req, res, next) => {
    if (!(req.body.category instanceof Array)) {
      if (typeof req.body.category === "undefined") req.body.category = [];
      else req.body.category = new Array(req.body.category);
    }
    next();
  },

  body("name", "Name must not be empty").trim().isLength({ min: 1 }).escape(),
  body("description", "Description must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("price", "Price must not be empty").trim().isLength({ min: 1 }).escape(),
  body("stock", "Stock must not be empty").trim().isLength({ min: 1 }).escape(),
  body("category.*").escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const item = new Item({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      stock: req.body.stock,
      img: {
        data: fs.readFileSync(
          path.join(__dirname + "/../uploads/" + req.file.filename)
        ),
        contentType: "image/png",
      },
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
        title: `Add an item`,
        categories: allCategories,
        item: item,
        errors: errors.array(),
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
  const item = await Item.findById(req.params.id).exec();
  res.render("item_delete", { item: item });
});

exports.item_delete_post = asyncHandler(async (req, res, next) => {
  await Item.findByIdAndDelete(req.body.itemid);
  res.redirect("/inventory/items");
});

exports.item_update_get = asyncHandler(async (req, res, next) => {
  const [item, allCategories] = await Promise.all([
    Item.findById(req.params.id).populate("category").exec(),
    Category.find().exec(),
  ]);

  if (item === null) {
    const err = new Error("Item not found");
    err.status = 404;
    return next(err);
  }

  for (const category of allCategories) {
    for (const item_c of item.category) {
      if (category._id.toString() === item_c._id.toString()) {
        category.checked = "true";
      }
    }
  }

  res.render("item_form", {
    title: `Update an item`,
    item: item,
    categories: allCategories,
  });
});

exports.item_update_post = [
  (req, res, next) => {
    if (!(req.body.category instanceof Array)) {
      if (typeof req.body.category === "undefined") req.body.category = [];
      else req.body.category = new Array(req.body.category);
    }
    next();
  },

  body("name", "Name must not be empty").trim().isLength({ min: 1 }).escape(),
  body("description", "Description must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("price", "Price must not be empty").trim().isLength({ min: 1 }).escape(),
  body("stock", "Stock must not be empty").trim().isLength({ min: 1 }).escape(),
  body("category.*").escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const item = new Item({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      stock: req.body.stock,
      img: {
        data: fs.readFileSync(
          path.join(__dirname + "/../uploads/" + req.file.filename)
        ),
        contentType: "image/png",
      },
      _id: req.params.id,
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
        title: `Update an item`,
        item: item,
        categories: allCategories,
        errors: errors.array(),
      });
    } else {
      const itemUpdated = await Item.findByIdAndUpdate(req.params.id, item);
      res.redirect(itemUpdated.url);
    }
  }),
];
