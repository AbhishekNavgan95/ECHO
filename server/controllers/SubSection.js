const SubSection = require("../models/Subsection");
const Section = require("../models/Section");
const { uploadImageTocloudinary } = require("../utils/imageUploader");
require("dotenv").config();

// create Subsection
exports.createSubSection = async (req, res) => {
  try {
    // fetch data and video
    const { sectionId, title, timeDuration, description } = req.body;

    const video = req.files.video;

    // validate data
    if (!sectionId || !title || !timeDuration || !description) {
      return res.status(400).json({
        success: false,
        message: "Alll fields are required",
      });
    }

    // check if section exists
    const ifsection = await Section.findById(sectionId);
    if (!ifsection) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }

    // upload video to cloud
    const uploadDetils = await uploadImageTocloudinary(
      video,
      process.env.FOLDER_NAME
    );

    if(!uploadDetils) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong while uploading the file"
      })
    }

    // create subsection and enter in db along with url recieved from cloud
    const subSectionDetails = await SubSection.create({
      title: title,
      timeDuration: timeDuration,
      description: description,
      videoUrl: uploadDetils.secure_url,
    });

    // update subsection into Section schema
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: subSectionDetails._id,
        },
      },
      { new: true }
    )
      .populate("subSection")
      .exec();

    // res
    return res.status(200).json({
      success: true,
      message: "Subsection created successfully",
      data: updatedSection,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the section",
    });
  }
};

exports.updateSubSection = async (req, res) => {
  try {
    // fetch data and video
    const { subSectionId, sectionId, title, timeDuration, description } = req.body;

    const video = req.files.video;

    const ifsection = await Section.findById(sectionId);
    if (!ifsection) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }

    // upload video to cloud
    const uploadDetils = await uploadImageTocloudinary(
      video,
      process.env.FOLDER_NAME
    );

    if(!uploadDetils) {
      return res.status(500).json({
        success : false,
        message: "Something went wrong while uploading the file"
      })
    }

    // create subsection and enter in db along with url recieved from cloud
    const subSectionDetails = await SubSection.findByIdAndUpdate(
      subSectionId,
      {
        title: title || SubSection.title,
        timeDuration: timeDuration || SubSection.timeDuration,
        description: description || SubSection.timeDuration, 
        videoUrl: uploadDetils?.secure_url || SubSection.videoUrl,
      },
      { new: true }
    );

          // update subsection into Section schema
    const updatedSection = await Section.findById(sectionId)
      .populate("subSection")
      .exec();

    // res
    return res.status(200).json({
      success: true,
      message: "Subsection Updated successfully",
      data: updatedSection,
    });
  } catch (e) {
    console.log("error while updating the subSection", e);
    return res.status(500).json({
      success : false,
      message: "Something went wrong while updating the subsection"
    })
  }
};

exports.deleteSubSection = async (req, res) => {
  try {

    const {subSectionId, sectionId} = req.body;

    if(!subSectionId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    const isSubSectionExist = await SubSection.findById(subSectionId);
    const isSectionExist = await Section.findById(sectionId);
    
    if(!isSubSectionExist) {
      return res.status(404).json({
        success : false,
        message: "Subsection didn't exist"
      })
    }

    if(!isSectionExist) {
      return res.status(404).json({
        success : false,
        message: "Section didn't exist"
      })
    }

    await SubSection.findByIdAndDelete(subSectionId);
    const updatedSection = await Section.findByIdAndUpdate(sectionId , 
      {
        $pull: {
          subSection: subSectionId,
        }
      },
      {
        new : true,
      }
      ).populate("subSection").exec();

      if(updatedSection) {
        return res.status(200).json({
          success: true,
          message: "SubSection deleted Sucessfully",
          data: updatedSection
        })
      }
} catch(e) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the SubSection"
    })
  }
}