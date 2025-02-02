const Category = require("../models/Category");

function getRandomInt(max) {
  const randomNum = Math.floor(Math.random() * max);
  return randomNum;
}

// create Tag handler function
exports.createCategory = async (req, res) => {
  console.log("req recieved");
  try {
    // read data from req body
    const { name, description } = req.body;

    // validate data
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check if category already exists
    const checkExist = await Category.findOne({ name: name });
    if (checkExist) {
      return res.status(400).json({
        success: false,
        message: "This category already exists",
      });
    }

    // create entry in db
    const categoryDetails = await Category.create({
      name: name,
      description: description,
    });

    console.log("category details", categoryDetails);

    // res
    return res.status(200).json({
      success: true,
      message: "category created successfully",
    });
  } catch (e) {
    // failure
    return res.status(500).json({
      success: false,
      message: `Error occurred while creating category `,
      error: e?.message,
    });
  }
};

// get all Tags handler function
exports.showAllCategories = async (req, res) => {
  try {
    // get all tags
    const allCategories = await Category.find(
      {},
      { name: true, description: true }
    );

    // res
    return res.status(200).json({
      success: true,
      message: "All Categories returned successfully",
      data: allCategories,
    });
  } catch (e) {
    // failure
    return res.status(500).json({
      success: false,
      message: `Error occurred while showing all Categories  ${e?.message}`,
    });
  }
};

// category page details
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;

    // Get courses for the specified category
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: [
          { path: "instructor", select: "firstName lastName email image" },
          { path: "ratingAndReviews" },
        ],
      })
      .exec();

    // If category not found
    if (!selectedCategory) {
      console.log("Category not found.");
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // No courses with given category
    if (!selectedCategory.courses || selectedCategory.courses.length === 0) {
      console.log("No courses found for the selected category.");
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      });
    }

    res.status(200).json({
      success: true,
      data: selectedCategory.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAllCategoryAndCourses = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate()
      .select("name description courses")
      .populate({
        path: "courses",
        select: "courseTitle courseDescription instructor price thumbnail",
        populate: {
          path: "instructor",
          select: "firstName lastName email image",
        },
      })
      .exec();

    if (!categories) {
      return res.status(404).json({
        success: false,
        message: "No categories found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Fetched all categories Successfully",
      data: categories,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching all categories and courses",
      error: e?.message,
    });
  }
};
