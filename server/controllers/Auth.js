const User = require("../models/User");
const Otp = require("../models/Otp");
const Profile = require("../models/Profile");
const optGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mailSender = require("../utils/mailsender");
const updatePasswordEmailBody = require("../mail/tamplates/passwordUpdate");
const {passwordUpdated} = require("../mail/tamplates/passwordUpdate")

// sendOTP
exports.sendOTP = async (req, res) => {
  try {
    // fetch email from req body
    const { email } = req.body;

    // check if user already exist
    const checkUserPresent = await User.findOne({ email: email });

    // if user exist
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already rugistered",
      });
    }

    // generaate OTP
    const otp = optGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // check for unique otp
    let result = await Otp.findOne({ otp: otp });

    while (result) {
      otp = optGenerator(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await Otp.findOne({ otp: otp });
    }

    const otpPayload = {
      email,
      otp,
    };

    // create a entry in db for OTP
    const otpBody = await Otp.create(otpPayload);

    // return response successfull
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });
  } catch (e) {
    console.log("error in generating otp", e);
    return res.status(500).json({
      success: false,
      message: "error occurred while generating otp : " + e.message,
    });
  }
};

// sign up
exports.signUp = async (req, res) => {
  try {
    // fetch data from req body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    // validate data
    if (
      !firstName ||
      !lastName ||
      !accountType ||
      !email ||
      !password ||
      !confirmPassword ||
      // !contactNumber ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message:
          "not all fields are filled, Kindly fill all the fields and try again!",
      });
    }

    // match both passwords
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "passwords do not match, please try again!",
      });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User is already rugistered",
      });
    }

    // find most recent otp for corrousponding user
    const recentOtp = await Otp.findOne({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    // validate OTP
    if (recentOtp?.length === 0) {
      // otp not found
      return res.status(400).json({
        success: false,
        message: "Otp not found",
      });
    } else if (otp !== recentOtp.otp) {
      return res.status(400).json({
        success: false,
        message: "invalid otp",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create entry in DB
    const profileDetails = await Profile.create({
      gender: null,
      DOB: null,
      about: null,
      contactNumber: null,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `http://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    // return res
    return res.status(200).json({
      success: true,
      message: "User is registered successfully",
      user,
    });
  } catch (e) {
    console.log("error occurred while creating new user entry", e);
    res.status(500).json({
      success: false,
      message: "User cannot be registered, please try again!",
    });
  }
};

// login
exports.login = async (req, res) => {
  try {
    // fetch data from req body
    const { email, password } = req.body;

    // validate data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message:
          "All feilds are required please fill all the fields and try again!",
      });
    }

    // check if user exists
    const tempUser = await User.findOne({ email }).populate("additionalDetails courses");

    if (!tempUser) {
      return res.status(401).json({
        success: false,
        message: "User is not rugistered! please sign up",
      });
    }

    const user = tempUser.toObject(); // to make object mutable
    console.log("user : ", user);

    // generate jwt after password matching
    if (await bcrypt.compare(password, user.password)) {
      const paylaod = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };

      const token = jwt.sign(paylaod, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      user.token = token;
      user.password = undefined;

      // create cookie and send res
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "Logged in successfully",
      });

    } else {
      res.status(401).json({
        success: false,
        message: "password is incorrect!",
      });
    }
  } catch (e) {
    console.log("error occurred while loggin in", e);
    return res.status(500).json({
      success: false,
      message: "Login failure, please try again!",
    });
  }
};

// Controller for Changing Password
exports.changePassword = async (req, res) => {
  try {
    // get user id
    const id = req.user.id;
    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body;

    // Get user data from db
    const userDetails = await User.findById(id);

    // validate user
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    
    // If old password does not match, return a 401 (Unauthorized) error
    if (!isPasswordMatch) {
      return res
      .status(401)
      .json({ success: false, message: "The password is incorrect" });
    }
    

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      id,
      { password: encryptedPassword },
      { new: true }
    );

    // Send notification email
    try {

      const mailBody = passwordUpdated(
        updatedUserDetails.email,
        `${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
      )

      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        mailBody
      );

      console.log("email res : ", emailResponse);

    } catch (error) {

      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });

    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
};
