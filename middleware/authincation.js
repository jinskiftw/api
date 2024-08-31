
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("./catchAsyncError");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");

exports.isAuthincated = catchAsyncError(async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log("authHeader",authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new ErrorHandler("Please login to access this", 401, res));
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return next(new ErrorHandler("Please fill right token here", 401, res));
  }
  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById({_id:decodedData.id});
    if (!user) {
      return next(new ErrorHandler("Invalid token", 401, res));
    }
    req.user = user
    next();
  } catch (error) {
    return next(new ErrorHandler("Invalid token", 401, res));
  }
});
