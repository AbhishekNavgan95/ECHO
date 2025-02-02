const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const uploadImageTocloudinary = require("../utils/imageUploader");
const Section = require("../models/Section");
const SubSection = require("../models/Subsection");
const CourseProgress = require("../models/CourseProgress");

// create Course
exports.createCourse = async (req, res) => {
  try {
    // fetch data
    const {
      courseName,
      courseDescription,
      whatYouWillLearn,
      instructions,
      price,
      category,
      tag,
    } = req.body;

    // fetch thumnail
    const thumbnail = req.files?.thumbnail;

    // validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !instructions ||
      !price ||
      !category ||
      !thumbnail ||
      !tag
    ) {
      return res.status(400).json({
        success: false,
        message: "All feilds are required",
      });
    }

    // get instructor details for adding in course collection
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId);

    // if instructor does not exist
    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor details not found",
      });
    }

    // check given tag is valid or not
    const CategoryDetails = await Category.findById(category);

    if (!CategoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Category details not found",
      });
    }

    // upload file to cloud
    const thumbnailImage =
      await uploadImageTocloudinary.uploadImageTocloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      );

    // create new entry for course
    const newCourse = await Course.create({
      courseTitle: courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn,
      price,
      category: CategoryDetails._id,
      thumbnail: thumbnailImage.secure_url,
      tag,
      instructions,
    });

    // add new course to the user schema of instructor
    await User.findByIdAndUpdate(
      {
        _id: instructorDetails._id,
      },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      {
        new: true,
      }
    );

    // update the Tag schema #TODO
    await Category.findByIdAndUpdate(
      { _id: CategoryDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    // res
    return res.status(200).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (e) {
    console.log("error occurred while creating new course ", e);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating new course",
    });
  }
};

// edit course
exports.editCourse = async (req, res) => {
  try {
    const {
      courseId,
      courseName,
      courseDescription,
      whatYouWillLearn,
      instructions,
      price,
      category,
      tag,
    } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course Id is required",
      });
    }

    // get instructor details for adding in course collection
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId);

    // if instructor does not exist
    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor details not found",
      });
    }

    // check given tag is valid or not
    const CategoryDetails = await Category.findById(category);
 
    if (!CategoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Category details not found",
      });
    }

    let thumbnailImage;
    if (req.files) {
      const thumnail = req.files.thumbnail;
      thumbnailImage = await uploadImageTocloudinary.uploadImageTocloudinary(
        thumnail,
        process.env.FOLDER_NAME
      );
    }

    // create new entry for course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        courseTitle: courseName,
        courseDescription: courseDescription,
        instructor: instructorDetails._id,
        whatYouWillLearn: whatYouWillLearn,
        price,
        category: CategoryDetails._id,
        thumbnail: thumbnailImage?.secure_url,
        tag: tag,
        instructions: instructions,
      },
      {
        new: true,
      }
    )
      .populate({
        path: "instructor",
        select: "firstName lastName email image",
        populate: {
          select: "contactNumber",
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    if (updatedCourse) {
      return res.status(200).json({
        success: true,
        message: "Course Updated Successfully...",
        updatedCourse,
      });
    }
  } catch (e) {
    console.log("error : ", e);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the course!!!",
      error: e?.message,
    });
  }
};

// make course public
exports.makeCoursePublic = async (req, res) => {
  try {
    const { courseId, status } = req.body;

    // validate data
    if (!courseId || !status) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // search course
    const courseDetails = await Course.findByIdAndUpdate(
      courseId,
      { status: status },
      { new: true }
    )
      .populate({
        path: "instructor",
        select: "firstName lastName email image",
        populate: {
          select: "contactNumber",
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "course updated successfully",
      data: courseDetails,
    });
  } catch (e) {
    console.log("Error : ", e);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the course status",
    });
  }
};

// get All courses
exports.showAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      {},
      {
        courseTitle: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate({
        path: "instructor",
        select: "firstName lastName email image",
        populate: {
          select: "contactNumber",
          path: "additionalDetails",
        },
      })
      .exec();
    return res.status(200).json({
      success: true,
      message: "data for all courses is fetched successfull",
      data: allCourses,
    });
  } catch (e) {
    console.log("error occurred while getting all courses ", e);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching all courses",
    });
  }
};

// get course details
exports.getCourseDetails = async (req, res) => {
  try {
    // get id
    const { courseId } = req.body;

    // find course details
    const courseDetails = await Course.findById(courseId)
      .populate({
        path: "instructor",
        select: "firstName lastName email image",
        populate: {
          path: "additionalDetails",
          select: "about",
        },
      })
      .populate({
        path: "category",
        select: "name description",
      })
      .populate({
        path: "ratingAndReviews",
        populate: {
          path: "user",
          select: "firstName image lastName"
        }
      })
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
          select: "description duraiton title"
        },
      })
      .exec();

    // validation
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: "Could not find the course with the course id " + courseId,
      });
    }

    // res
    return res.status(200).json({
      success: true,
      message: "Course found",
      data: courseDetails,
    });
  } catch (e) {
    console.log("Something went wrong while getting all courses ", e);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while getting all courses",
    });
  }
};

// get list of course for a given instructor
exports.getInstructorCourses = async (req, res) => {
  try {
    // get the instructor id
    const instructorId = req?.user?.id;

    if (!instructorId) {
      return res.status(400).json({
        success: false,
        message: "Instructor id is required",
      });
    }

    // find all courses for this instructor
    const instructorCourses = await Course.find({
      instructor: instructorId,
    })
      .populate({
        path: "instructor",
        select: "firstName lastName email image",
        populate: {
          select: "contactNumber",
          path: "additionalDetails",
        },
      })
      .populate({
        path: "category",
        select: "_id name",
      })
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .sort({ createdAt: -1 })
      .exec();

    if (!instructorCourses) {
      res.status(404).json({
        success: false,
        message: "No courses found for specified instructor",
      });
    }

    res.status(200).json({
      success: true,
      message: "Counses fetched Successfully",
      data: instructorCourses,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the courses",
    });
  }
};

//Delete Course
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Unenroll students from the course
    const studentsEnrolled = course.studentsEnrolled;
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      });
    }

    // Delete sections and sub-sections
    const courseSections = course.courseContent;
    for (const sectionId of courseSections) {
      // Delete sub-sections of the section
      const section = await Section.findById(sectionId);
      if (section) {
        const subSections = section.subSection;
        for (const subSectionId of subSections) {
          await SubSection.findByIdAndDelete(subSectionId);
        }
      }

      // Delete the section
      await Section.findByIdAndDelete(sectionId);
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId);

    //Delete course id from Category
    await Category.findByIdAndUpdate(course.category._id, {
      $pull: { courses: courseId },
    });

    //Delete course id from Instructor
    await User.findByIdAndUpdate(course.instructor._id, {
      $pull: { courses: courseId },
    });

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error?.message,
    });
  }
};

//get full course details
exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Course Id is required",
      });
    }

    const courseDetails = await Course.findById({ _id: courseId })
      .populate({
        path: "instructor",
        select: "firstName lastName email image",
        populate: {
          select: "contactNumber",
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    const courseProgressCount = await CourseProgress.findOne({
      courseId: courseId,
      userId: userId,
    });


    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration);
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    // const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        // totalDuration,
        totalDurationInSeconds, // remove this and add above line
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    });
  } catch (error) {
    console.log("error : ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.searchCourse = async (req, res) => {
  try {
    const { searchParam } = req.body;

    const courses = await Course.find({
      $or: [
        {courseTitle : {$regex : searchParam , $options : "i"}},
        // {courseDescription : {$regex : searchParam , $options : "i"}}, // gives lots of unnecessory courses by matching words from description
        {tag : {$regex : searchParam , $options : "i"}},
      ]
    })
    
    if(!courses) {
      return res.status(404).json({
        success: false,
        message: "No courses found"
      })
    }
    
    res.status(200).json({
      success: true,
      message: "Fetched Courses successfully",
      data : courses
    })
  } catch(e) {
    console.log("error : ", e);
    res.status(500).json({
      success: false,
      message: "Could not find any courses"
    })
  }
};