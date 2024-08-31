// mileage.js

// Function to convert miles to kilometers
function milesToKilometers(miles,round=false) {
    const distance= miles * 1.60934;
    return (round)?Math.round(distance):distance;
  }
  
  // Function to convert kilometers to miles
  function kilometersToMiles(kilometers,round=false) {
    const distance=kilometers / 1.60934;
    return (round)?Math.round(distance):distance;
 
  }
  
  module.exports = { milesToKilometers, kilometersToMiles };
  