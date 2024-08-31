const Notification=require("../models/notificationModel")
const catchAsyncError = require("../middleware/catchAsyncError");
const { ObjectId } = require('mongoose').Types;


const listing = catchAsyncError(async (req, res, next) => {
    const { page = 1, pageSize = 50 } = req.query;
 
 
    try {
      const userId =(req.user._id); // Convert to ObjectId
  
      console.log('userId is ',userId) ; 
      const totalRecords = await Notification.countDocuments( {userId } );
      
      console.log("totalRecords is",totalRecords ) ; 
      const records = await Notification.find({userId } ).lean({ virtuals: true }).populate('carId','model manufacturer manufacturerYear')
        .skip((page - 1) * pageSize)
        .sort({ createdAt: -1 })
        .limit(Number(pageSize));
  
        const unreadCount = await Notification.countDocuments({
          userId:  (userId),
          read: false,
          carId: { $exists: true, $ne: null }

        });
      const response = {
        result: records,
        unreadCount,
        page: Number(page),
        totalRecords,
      };
     
      res.json(response);
    } catch (error) {
      //console.log(error);
      console.error('Error fetching records:', error.message);
      res.status(500).json({ error: 'Internal Server Error :'+error.message });
    }
});


const read = catchAsyncError(async (req, res, next)=>{
  const id=req.params.id ; 
  const model=await  Notification.findById(id); 
  model.read=true; 
  model.save() ; 
  res.json({ message: 'Read Notification successfully', notification:model });
})

const deleteNotification = catchAsyncError(async (req, res, next) => {
  try {
    const query = {
        _id: req.params.id
    };

    const notification = await Notification.findOne(query);
    if (!notification) {
        console.log('Notification not found');
        return;
    }

    // Delete the notification record
    const result = await notification.deleteOne(query);

    if (result.deletedCount > 0) {   
        res.status(200).json({ message: "Notification deleted successfully", result });
    }else{
        return next(new ErrorHandler("Notification counld not deleted", 404, res));
    }
            

  } catch (err) {
      next(err);
  }
});

module.exports = { listing,read, deleteNotification};
