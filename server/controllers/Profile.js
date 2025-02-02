const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
require("dotenv").config();
const { uploadImageTocloudinary } = require("../utils/imageUploader");
const RatingAndReview = require("../models/RatingAndReview");

exports.updateProfile = async (req, res) => {
  try {
    // fetch data with user id
    const { dateOfBirth, about, contactNumber, gender } = req.body;

    const id = req.user.id;

    //  find profile
    const userDetails = await User.findById(id);

    const profileId = userDetails.additionalDetails;

    const profileDetails = await Profile.findById(profileId);

    // update profile
    profileDetails.DOB = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;

    await profileDetails.save();

    // res
    return res.status(200).json({
      success: true,
      message: "Profile has been uptated successfully",
      data: profileDetails,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "something went wrong while updating the profile!",
    });
  }
};

// delete account handler
exports.deleteAccount = async (req, res) => {
  try {
    // get id
    const id = req.user.id;

    // validation
    const userDetails = await User.findById(id);

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // delete user profile
    await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });

    // deleting user from all enrolled courses
    const userCourses = userDetails.courses;

    userCourses.forEach(async (course) => {
      const res = await Course.findByIdAndUpdate(
        course,
        {
          $pull: {
            studentsEnrolled: userDetails._id,
          },
        },
        {
          new: true,
        }
      ).populate("studentsEnrolled");
    });

    // deleting all reviews of user
    await RatingAndReview.findOneAndDelete({ user: userDetails._id });

    // delete user
    await User.findByIdAndDelete(id);

    // res
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong, User deletion failed",
    });
  }
};

// get all user details handler
exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id;

    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // remove account password from the res
    const user = userDetails.toObject();
    user.password = undefined;

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: user,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "something went wrong while fetching user details",
    });
  }
};

// get all enrolled courses
exports.getEnrolledCourses = async (req, res) => {
  try {
    const id = req.user.id;

    const userDetails = await User.findById(id)
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .populate("courseProgress")
      .exec();

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: userDetails,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "something went wrong while fetching user details",
    });
  }
};

// upload disaply picture
exports.updateDisplayPicture = async (req, res) => {
  try {
    // get id
    const id = req.user.id;

    // find user with that id
    const user = await User.findById(id);
    const image = req.files?.thumbnail;

    // validate user
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // validate image
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "image not found",
      });
    }

    // upload file to cloud
    const uploadDetails = await uploadImageTocloudinary(
      image,
      process.env.FOLDER_NAME
    );

    if(!uploadDetails) {
      return res.status(500).json({
        success : false,
        message: "Something went wrong while uploading the file"
      })
    }

    const userDetails = await User.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        image: uploadDetails?.secure_url,
      },
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Image uploaded to successfully",
      data: userDetails,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "something went wrong while uploading the image",
    });
  }
};

exports.instructorDashboard = async (req, res) => {
  try {
    const { id } = req.user;

    const courseDetails = await Course.find({ instructor: id });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "No courses fouund for this user",
      });
    }

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course?.studentsEnrolled?.length;
      const totalAmountGenerated = totalStudentsEnrolled * course?.price;

      // create a new object with the additional fields
      const courseDataWithStats = {
        _id: course?._id,
        courseTitle: course?.courseTitle,
        courseDescription: course?.courseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated,
      };

      return courseDataWithStats;
    });

    res.status(200).json({
      success: true,
      message: "Fetched Course Data Successfully",
      data: courseData,
    });
  } catch (e) {
    console.log("error : ", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
