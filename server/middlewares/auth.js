const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

// auth
exports.auth = async (req, res, next) => {
  try {

    // extract token from bearer token
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization").replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    // verify the token
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decode;
    } catch (e) {
      // varification failed
      return res.status(401).json({
        success: false,
        message: "token is invalid",
      });
      
    }
    next();
  } catch (e) {
    console.log(e)
    return res.status(401).json({
      success: false,
      message: "Soemthing went wrong while validating the token",
    });
  }
};

// isStudent
exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Student") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for students",
      });
    }
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: "User role cannot be varified",
    });
  }
};

// isInstructor
exports.isInstructor = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Instructor") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Instructor",
      });
    }
    
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: "User role cannot be varified",
    });
  }
};

// isAdmin
exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Admin") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for Admin",
      });
    }
    
    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: "User role cannot be varified",
    });
  }
};
