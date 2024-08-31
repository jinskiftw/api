const express = require("express");
const { isAuthincated } = require("../middleware/authincation");
const {
  registerUser,
  loginUser,
  forgotPassword,
  deleteUser,
  resetPasswordWithToken,
  resetPassword,
  apiForgotPassword,
  apiResetPassword,
  getUser,
  adminLogin,
  updateIsVerified,
  dashboardCounts,
  verifyUserAccount,
  updateUser,
  userProfile
} = require("../controllers/userController");
const { profileImageUpload} = require('../utils/multer') ;

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/adminLogin", adminLogin);
router.put("/forgetpassword", forgotPassword);
router.delete("/deleteUser/:userId", deleteUser);
router.get("/password/reset/:tokens", resetPasswordWithToken);
router.post("/password/reset", resetPassword);
router.put("/forget-password", apiForgotPassword);
router.post("/reset-password", apiResetPassword);
router.get("/getuser", getUser);
router.patch('/updateUserAccount/:userId', updateIsVerified);
router.get("/dashboardCounts",dashboardCounts);

router.post("/verifyUserAccount",verifyUserAccount);
router.post("/updateUser",isAuthincated,profileImageUpload.single('profileImage'),updateUser);
router.get("/profile",isAuthincated,userProfile);





module.exports = router;
 