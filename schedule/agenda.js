const Agenda = require('agenda');
const moment = require('moment');
const ejs = require('ejs');
const {sendHtmlEmail} = require('../utils/sendEmail.js');
const agenda = new Agenda({ db: { address: process.env.MONGO_URI } });
const path=require('path');
const addNotification=require("../utils/NotificationService");


agenda.define('send reminder email', async job => {
    const carRecord =require('../models/carRecords.js');
    const { carRecordId } = job.attrs.data;
    console.log("agenda carRecordId ",carRecordId); 
    // Code to send reminder email
    const recordModel=await carRecord.findOne({_id:carRecordId}); 
    if(!recordModel || recordModel.isHistory)
    {
        return   ; 
    }
    console.log(`Reminder woo`);
    console.log("recordModel is ",recordModel);
    console.log("woo carRecordId is",carRecordId); 
    console.log("job is ",job);
    await recordModel.populate('categoryId');
    await recordModel.populate('userId');
    const url=`${process.env.FRONTEND_URL}/car/${recordModel.carId}/vehicle_log`;
    if(recordModel.occurance_type=='mileage')
    {
        var text=`due in <span class="bluetxt">${recordModel.mileageWithUnit} miles</span> `;
    }
    else 
    { 
        let logDate=moment(recordModel.logDate)
 
      
        var text=`due on <span class="bluetxt">${logDate.format('MMMM DD, YYYY')}</span> `;
    }
    addNotification(recordModel.userId._id,"#","Reminder Notification",`A new notecard is due on ${moment(recordModel.logDate).format("MMMM Do")} [${recordModel.categoryId.title}]`,recordModel.carId );
    const label=`We are notifying you of your upcoming notecard ${text} . Please click the button below to navigate the notecard`;
    recordModel.logDate=(recordModel.logDate)?moment(recordModel.logDate).format('MMMM DD, YYYY'):'';
    ejs.renderFile(path.join(__dirname,'..', 'views','email', 'cardReminder.ejs'), { recordModel,url,label }, (err, html) => {
        console.log("err is",err); 
        console.log("html is",html);
        console.log("email sent is ",recordModel.userId.email); 
        sendHtmlEmail(recordModel.userId.email,'Wheelman: Reminder- Items Due',html);

    });

   
});

// Start Agenda
(async function() {
    await agenda.start();
})();

module.exports = agenda;
