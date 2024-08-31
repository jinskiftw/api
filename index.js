const express = require("express");
const Agenda = require('agenda');

require("dotenv").config();
const connectDB = require("./config/db");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const carRoutes = require("./routes/carRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const vehicleLogRoutes = require("./routes/vehicleLogRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const planRoutes = require("./routes/planRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const blogRoutes = require("./routes/blogRoutes");

const HandleError = require('./middleware/catchAsyncError');
const expressWs = require('express-ws');
const jwt = require("jsonwebtoken");
const userModel = require("./models/userModel");
const ConnectionsManager = require('./utils/WebsocketConnections');
let cron = require('node-cron');
const app = express();
const testCron=require("./schedule/ReminderJob");
 
// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));


app.use(cors());

connectDB();
const PORT = process.env.PORT;

app.use("/api/user", userRoutes);
app.use("/api/user", carRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/vehicle-log", vehicleLogRoutes);
app.use("/api", notificationRoutes);
app.use("/api", paymentRoutes);
app.use("/api/blog", blogRoutes);
 



app.use(HandleError);

const connections = new Map();

 
app.get("/", (req, res) => {
    

 

    res.send("<h1>Backend API is working!</h1>");
    
});
 
 
  

app.listen(PORT, function () {
    console.log(`Server is listening on port ${PORT}`);
});