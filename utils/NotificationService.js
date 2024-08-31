// notificationsService.js
const NotificationModel = require('../models/notificationModel')

async function addNotification(userId, url, title,description,carId=null) {
  try {
    const notification = await NotificationModel.create({
      userId,
      url,
      title,
      description,
      carId
    });

    // Your additional logic to send the notification (e.g., via WebSocket)
    // ...

    console.log(`Notification added for user ${userId}`);
    return notification;
  } catch (error) {
    console.error('Error while adding notification:', error);
    throw error;
  }
}

module.exports = addNotification;
