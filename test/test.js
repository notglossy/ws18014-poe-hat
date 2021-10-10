const ws18014 = require("../ws18014");

var poeHat = new ws18014({
  oledInvertedAuto: true,
  oledInvertedFreq: 10000,
  fanTempOn: 40,
  fanTempOff: 37,
});

console.log("Display should show IP, temp, and Fan status.");

setInterval( function() {

  if (poeHat.displayMode == "default")
  {
    poeHat.displayMode = "custom";
    poeHat.writeLines([
      "***LINE 01***",
      "***LINE 02***",
      "***LINE 03***",
    ]);
    console.log("Display should display custom text.");
  }
  else if (poeHat.displayMode == "custom") {
    poeHat.displayMode = "default";
    console.log("Display should show IP, temp, and Fan status.");
  }

}, 5000);
