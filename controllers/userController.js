const UserModel = require("../models/userModel");
const  {Car:CarModel} = require("../models/carDetail");
const CarRecordModel = require("../models/carRecords");

const bcrypt = require("bcrypt");
const {sendEmail} = require("../utils/sendEmail");
const sendToken = require('../utils/jwtToken');
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendResetPasswordEmail = require("../utils/sendResetPassword");
const crypto = require("crypto");
const userModel = require("../models/userModel");
const {PaymentLogModel} = require("../models/paymentLogModel");

const registerUser = catchAsyncError(async (req, res, next) => {
  
    try {
       
        const { fullName, email, password, confirmPassword, role } = req.body;

        // if (password !== confirmPassword) {
        //     return next(new ErrorHandler("password does not match.", 400, res));
        // }

        const user = await UserModel.findOne({ email });
       // console.log(user);
        if (user)
            return next(new ErrorHandler("user already exsits with this email id", 400, res));

        if (!password) {
            return next(new ErrorHandler("please enter a password", 400, res));

        }
        // if (!confirmPassword) {
        //     return next(new ErrorHandler("please enter a confirm password", 400, res));

        // }

        const hashPassword = await bcrypt.hash(password, 10);

        const token = crypto
        .createHash('sha256')
        .update(email)
        .digest('hex');
        
        const data = await UserModel.create({
            fullName,
            token,
            isActive:(role=='admin'),
            email,
            password: hashPassword,
            role: role || 'user',
            isVerified:(role=='admin'),
        });

        await sendEmail(email,data);

        const userData = await data.save();
        const successMsg=(role=='admin')?'User created succesfully':'Please check your email to confirm your registration';
        return res.status(201).json({ success: true, message: successMsg, userData })
    }
    catch (err) {
        if (err.name === 'ValidationError') {
            return next(new ErrorHandler(err.message, 400, err.message));
           //res.status(400).json({ error: error.message });
          }
        console.log(err); 
        next(err)
    }
});

const loginUser = catchAsyncError(async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ErrorHandler("Plase enter email and password", 400, res));
        }
        const user = await UserModel.findOne({ email }).select("+password");
        //console.log(user,"usersyeyey");
        if (!user) {
            return next(new ErrorHandler("Please register first", 401, res));
        }
        else if (user.role !== 'user') {
            return next(new ErrorHandler("Please register first", 401, res));
        } else if (!user.isVerified) {
            return next(new ErrorHandler("Account is not verified.", 401, res));
        }
        else 
        if(!user.isActive)
        {
            return next(new ErrorHandler("Account is not activated .", 401, res));
        }
        else {
            const validPassword = await bcrypt.compare(password, user.password);
            if (false) {
                return res.status(400).json({ message: "please enter valid password" })
            }
        }

        const responseData = {
            userName: user.fullName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            planId:user.planId,
            planStartDate:user.planStartDate,
            planExpiryDate:user.planExpiryDate
        };
        sendToken(
            responseData,
            user,
            200, res, "Login successful.");
    }
    catch (err) {
        console.log(err)
        next(err)
    }
});


const updateUser = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user._id; // Replace with logic to get user ID from authentication
    
        const { fullName, email, address,preferences } = req.body; // Extract optional data from request body
        const { profileTitle } = req.body; // Extract optional data from request body
        const profileImage = req.file ? req.file.filename : null; // Get image path if uploaded
        
        // Perform additional validation or processing on the data
    
        const updateData = {
          ...(fullName && { fullName }), // Include only non-empty values
          ...(email && { email }), 
          ...(address && { address }),
          ...(preferences && {preferences}),
          ...(profileTitle && {profile_description:profileTitle.profile_description,profile_title:profileTitle.profile_title}),
    
          ...(profileImage && { profileImage }),
        };
         
        console.log(updateData);  
        console.log("profileImage is ",updateData,req.file,profileImage );
        const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true }); // Update user document
    
        if (!updatedUser) {
          return res.status(404).json({ success: false, message: 'User not found.' });
        }
    
        res.json({ success: true, message: 'Profile updated successfully!', user: updatedUser });
      } catch (error) {
        console.error(error);
    
        // Delete uploaded image if it exists
        if (filePath) {
          try {
            await fs.promises.unlink(filePath);
          } catch (deleteError) {
            console.error('Error deleting image:', deleteError);
          }
        }
    
        res.status(500).json({ success: false, message: 'Update failed.' });
      }
});

const adminLogin = catchAsyncError(async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400, res));
        }

        const user = await UserModel.findOne({ email }).select("+password");

        if (!user) {
            return next(new ErrorHandler("Invalid email", 401, res));
        } else if (!user.isVerified) {
            return next(new ErrorHandler("Account is not verified admin.", 401, res));
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ message: "Please enter a valid password" });
        }

        if (user.role !== 'admin') {
            return next(new ErrorHandler("Only Admins only.", 403, res));
        }

        const responseData = {
            userName: user.fullName,
            email: user.email,
            role: user.role,
        };

        sendToken(responseData, user, 200, res, "Admin login successful.");
    } catch (err) {
        console.log(err);
        next(err);
    }
});

const deleteUser = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const user = await UserModel.findById(userId);

        if (!user) {
            return next(new ErrorHandler("User does not exist", 400, res));
        }

        user.isVerified = false;
        await user.save();

        const deletedUser = await UserModel.findByIdAndDelete(userId);

        if (!deletedUser) {
            return next(new ErrorHandler("user does not exist", 400, res));
        }
        return res.status(200).json({ message: 'User deleted successfully' });

    }
    catch (err) {
        next(err)
    }
})

const forgotPassword = catchAsyncError(async (req, res, next) => {
    const user = await UserModel.findOne({ email: req.body.email, role: req.body.role });
    if (!user) {
        return next(new ErrorHandler("user not found", 404, res));
    }
    const resetToken = await user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false });

    //console.log(resetToken, "resetToken");
    const resetPasswordUrl = `${process.env.ADMINEND_URL}/user/reset-password/${resetToken}`;
    const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you have not requested this email, please ignore it.`;

    try {
        await sendResetPasswordEmail({
            email: user.email,
            subject: `Wheelman password recovery`,
            message,
        });
        res.status(200).json({
            success: true,
            message: `Email send ${user.email} successfully`,
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await UserModel.save({ validateBeforeSave: false });
        next(error);
    }
});

const resetPasswordWithToken = catchAsyncError(async (req, res) => {
    const token = req.params.tokens;
    res.render('resetPassword.ejs', { token, error: '' });
})

const resetPassword = catchAsyncError(async (req, res, next) => {
    try { 

        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.body.token)
            .digest('hex');
        const token = req.body.token;
        const password = req.body.password;
        const confirmPassword = req.body.confirm_password;


        if (!password || !confirmPassword) {
            const error = 'Both Password and confirm_password are required';
            return res.render('resetPassword.ejs', { token, error });
        }

        if (password.length < 8) {
            const error = 'Password must be at least 8 characters';
            return res.render('resetPassword.ejs', { token, error });
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

        if (!passwordRegex.test(password)) {
            const error = 'Password must contain at least one letter and one number';
            return res.render('resetPassword.ejs', { token, error });
        }

        if (password !== confirmPassword) {
            const error = 'Passwords do not match';
            return res.render('resetPassword.ejs', { token, error });
        }

        const user = await UserModel.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            const error = 'Invalid or expired token';
            return res.render('resetPassword.ejs', { token, error });

        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.isVerified = true;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.render('success.ejs');
    } catch (error) {
        console.log('errr', error);
        res.render('resetPassword.ejs', { token: req.body.token || '', error: error.message });
    }
});

const apiForgotPassword = catchAsyncError(async (req, res, next) => {
    const user = await UserModel.findOne({ email: req.body.email, role: req.body.role });
    console.log("user is ",user);
    if (!user) {
        return next(new ErrorHandler("user not found", 404, res));
    }
    const resetToken = await user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false });

    //console.log(resetToken, "resetToken");
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/user/reset-password/${resetToken}`;
    const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you have not requested this email, please ignore it.`;

    try {
        await sendResetPasswordEmail({
            email: user.email,
            subject: `Wheelman password recovery`,
            message,
        });
        res.status(200).json({
            success: true,
            message: `Email send ${user.email} successfully`,
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        next(error);
    }
});
const apiResetPassword = catchAsyncError(async (req, res, next) => {
    try { 
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.body.token)
            .digest('hex');
        const token = req.body.token;
        const password = req.body.password;
        const confirmPassword = req.body.confirm_password;


        if (!password || !confirmPassword) {
            res.status(200).json({
                success: false,
                message: 'Both Password and confirm_password are required',
                token:token
            });
        }

        if (password.length < 8) {
            res.status(200).json({
                success: false,
                message: 'Password must be at least 8 characters',
                token:token
            });
        }
            

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

        if (!passwordRegex.test(password)) {
            res.status(200).json({
                success: false,
                message:'Password must contain at least one letter and one number',
                token:token
            });
        }

        if (password !== confirmPassword) {
            res.status(200).json({
                success: false,
                message: 'Passwords do not match',
                token:token
            });
        }

        const user = await UserModel.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            res.status(200).json({
                success: false,
                message: 'Invalid or expired token',
                token:token
            });

        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.isVerified = true;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message:"Password has been reset"
        });
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message,
            token:token
        });
    }
});

const getUser = catchAsyncError(async (req, res, next) => {
    try {
        const {searchUser,sort}=req.query ;
       
        const pipeline=[
            {
                $match: {
                    role: 'user',
                    $or: [
                        { email: { $regex: searchUser, $options: 'i' } }, // Case-insensitive search by email
                        { fullName: { $regex: searchUser, $options: 'i' } } // Case-insensitive search by full name
                    ]

                }
            },
            {
                $lookup: {
                    from: 'cars',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'cars'
                }
            },
            {      $lookup: {
                from: 'carrecords', // The name of the CarRecords collection
                localField: '_id',
                foreignField: 'userId',
                as: 'carRecords',
              },
            },
        
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    email: 1,
                    createdAt: 1,
                    role: 1,
                    isVerified: 1,
                    planId:1,
                    planStartDate:1,
                    planExpiryDate:1,
                    countCar: { $size: '$cars' },
                    'carRecordsCount': { $size: '$carRecords' },
                }
            }
        ];

       
          if(sort)
          {
              const sortField = Object.keys(sort);            
              sortOrder ={[sortField[0]]:sort[sortField].ascending === 'true' ? 1 : -1}; 
              pipeline.push({
                $sort: sortOrder
              });
          }
        const users = await UserModel.aggregate(pipeline);

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.log('error', error);
        next(error);
    }
});
const updateIsVerified = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const { isVerified } = req.body;

        if (isVerified === undefined) {
            return next(new ErrorHandler("Please provide isVerified status", 400, res));
        }

        const updatedUser = await UserModel.findByIdAndUpdate(userId, { isVerified }, { new: true });

        if (!updatedUser) {
            return next(new ErrorHandler("User not found", 404, res));
        }
        return res.status(200).json({ message: 'User status updated successfully', data: updatedUser });

    } catch (error) {
        next(error);
    }
});

const dashboardCounts = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const { isVerified } = req.body;
        const users = await UserModel.find({}, '_id').lean();
        const userIds = users.map(user => user._id);

        const countUser = await UserModel.countDocuments({ role: 'user' });
        // const countCar = await CarModel.countDocuments();
        const countCar = await CarModel.countDocuments({ userId: { $in: userIds } });
        // const countCarRecord = await CarRecordModel.countDocuments();
        const countCarRecord = await CarRecordModel.countDocuments({ userId: { $in: userIds } });
        const revenueTotal = await PaymentLogModel.sumDocuments();

        // const carList = await CarModel.find().populate('userId', 'fullName').sort({ createdAt: -1 }).limit(5);
        const carRecord = await CarModel.find()
        .populate({
            path: 'userId',
            select: 'fullName', // Include only the fields you need from the user
            match: {} // Optionally, add match conditions if needed
        })
        .sort({ createdAt: -1 }) // Sort by creation date in descending order
        .limit(5) // Limit to 5 latest entries
        .exec();

        // Filter out any cars that don't have a populated user
        const carList = carRecord.filter(car => car.userId !== null);

        const transactionList = [];
        const subscribedTotal=await UserModel.totalSubscribed();
        console.log("subscribedTotalsubscribedTotal is ",subscribedTotal);
        const responseData = {
            user_count: countUser,
            total_subscribed:subscribedTotal,
            car_count: countCar,
            carrecord_count: countCarRecord,
            total_revenue: revenueTotal/100,
            car_list: carList,
            tranaction_list: transactionList
        }
 
        return res.status(200).json({ message: 'Dashboard Data fetched successfuly', data: responseData });

    } catch (error) {
        next(error);
    }
});

const userProfile=catchAsyncError(async (req, res, next)=>{
    console.log(req.user)
    const model=await userModel.findOne({_id:req.user._id});
    await model.populate('paymentId'); 

 //   model.paymentId = model.paymentId.toObject(); // Convert to plain object

    return res.status(200).json({message:"Auth User retrieved successfuly",data:model.toObject({virtuals:true})});
});

const verifyUserAccount=catchAsyncError(async (req, res, next)=>{
    const {token} =  req.body;
    try{
        const user = await UserModel.findOne({
            token
        });

        if (!user || !token) {
            res.status(200).json({
                success: false,
                message: 'Invalid or expired token',
                token:token
            });
            return ;
        }
        console.log(user);
        user.token="";
        user.isActive=true; 
        user.isVerified=true; 
        await user.save(); 
        res.status(200).json({
            success: true,
            message: 'Your email has been verified successfully',
            token:token,
            user
        });
        
    }catch (error) {
        next(error)
    }


});

module.exports = {
    updateUser,
    verifyUserAccount,
    registerUser,
    loginUser,
    deleteUser,
    forgotPassword,
    resetPasswordWithToken,
    resetPassword,
    apiForgotPassword,
    apiResetPassword,
    getUser,
    adminLogin,
    updateIsVerified,
    dashboardCounts,
    userProfile
};
