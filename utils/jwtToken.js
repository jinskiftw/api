const sendToken = (userData, user, statusCode, res, message) => {
  const token = user.getJWTToken();
  res.set("Authorization", `token ${token}`);
  res.status(statusCode).json({
    success: true,
    message,
    userDetails: userData,
    token,
  });
};
module.exports = sendToken;

