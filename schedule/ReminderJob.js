const carRecord=require("../models/carRecords.js");
const {PaymentLogModel : payment} =require("../models/paymentLogModel.js");

let cron = require('node-cron');

 
async function fetchRecordsInChunks() {
    const chunkSize = 50;
    let skip = 0;

    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    
 
      const recordsChunk = await carRecord.find({
        endDate: {
          $gte: currentDate,
          $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000), // Next day
          
           
        },
        isHistory:false
      }).skip(skip).limit(chunkSize);
      
    
      for (const record of recordsChunk) {
        // Add your condition here
        
          // Update the isProcessed field to true
          if(!record.occurance_type)
          {
            record.isHistory=true; 
            record.save();
          }
          else 
          {
          //  await  record.processReminder();
          }
          
    
      } 
  
      // Process the current chunk of records
   //   console.log(recordsChunk);
   
     
  }


  async function fetchPaymentInChunks() {
    const chunkSize = 50;
    let skip = 0;

    const currentDate = new Date();
    const timeAgo = new Date(currentDate.getTime() - 60 * 1 * 1000);

      const recordsChunk = await payment.find({
        
        status:'open', 
      }).skip(skip).limit(chunkSize);
      
 
   return recordsChunk ;
  

   
     
  }

const reminderCron=(wss)=>{
  cron.schedule('* * * * *', () => {
    console.log("weoo") ;
    fetchRecordsInChunks();
 
    wss.getAllConnections().forEach((ws) => {
        console.log("done");
        ws.send(JSON.stringify({ type: 'notification', message: "notification from scheduler" }));
    });
    
     
    });
}

const paymentCron=async ()=>{
  const pendingPayments= await fetchPaymentInChunks();
  for (const record of pendingPayments)
  {
     

    record.processPayment() ; 
    
  }
}
const testCron=(wss)=>{
 // reminderCron(wss);
  paymentCron();
        
}

module.exports=testCron;