# ws18014
ws18014 is a npm package for the [WaveShare PoE HAT (B)](https://www.waveshare.com/poe-hat-b.htm) which recreates functions of the Python example code. This package was designed as a quick and easy way to test and use the features of this hat for those who are more comfortable with JavaScript.

### Ported Python Features
- Displays current IP address (eth0).
- Displays current cpu temperature.
- Displays fan status, and powers fan on / off at set temperatures.

### Additional Features
- Screen Inversion: Invert the screen contents (white on black -> black on white).
- Auto Inversion: Invert the screen automatically at regular intervals to prevent OLED burn-in.
- Adjustable Fan Trigger Thresholds: Dynamically change the temperatures which activate/deactivate the fan.
- Manual Fan Trigger: Manually trigger the fan outside of the automatic settings.
- Custom Fonts: Pass custom JSON fonts from the npm registery.

# Getting Started

### Requirements
- [Node.js](https://nodejs.org/) 12+
- Raspberry PI 3B+/4B
- [WaveShare PoE HAT (B)](https://www.waveshare.com/poe-hat-b.htm)
- 802.3af POE Compliant Router / Switch

### Enabling I2C
The I2C interface is required to use the OLED display and control the fan. It is important to first enable the i2c interface for this module to properly work.

Open a terminal of Raspberry Pi and run:
```sh
sudo raspi-config
```
Make sure to select: **Interfacing Options -> I2C -> Yes**

### Enabling Fan Control
The PoE Hat(B) has a switch for manually controlling the fan. To enable I2C control of the fan, put the swtich in the **P0** position.
![Fan Switch Reference Image](https://www.waveshare.com/img/devkit/accBoard/PoE-HAT-B/PoE-HAT-B-details-9.jpg)
### Installation
From your project folder run:
```sh 
npm install ws18014
```

### Examples
Basic use with default options:
```javascript
const ws18014 = require("ws18014");

var poeHat = new ws18014();
// You should now see the IP, CPU temperature, and fan status.
```
Setup with auto inversion and custom fan temperatures:
```javascript
const ws18014 = require("ws18014");

let opts = {
    oledInvertedAuto: true,
    oledInvertedFreq: 60000,
    fanTempOn: 40,
    fanTempOff: 37,
}

var poeHat = new ws18014(opts);
```
Setup with custom text:
```javascript
const ws18014 = require("ws18014");

var poeHat = new ws18014({mode:"custom"});

poeHat.writeLines([
  "***LINE 01***",
  "***LINE 02***",
  "***LINE 03***",
]);
```

## Options / Methods

When initializing the module, you can pass some of the following paramters in the setup object:

| Option | Default | Description |
| ------ | ------ | ------ |
| **oledUpdateFreq** :number | 1000 | Value in ms to update the contents of the display in default mode. |
| **charLines** :number | 3 | Maximum lines of text to draw to screen. |
| **lineHeight** :number | 11 | Pixel height of each line of text. |
| **oledInverted** :boolean | false | Whether or not to start with the display inverted. |
| **oledInvertedAuto** :boolean | false | Enables cycling inversion of display to prevent burn in.  |
| **oledInvertedFreq** :number | 30000 | Frequency in ms that the display is inverted. |
| **fanTempOn** :number | 70 | Temperature in celsius at which the fan is turned on. |
| **fanTempOff** :number | 50 | Temperature in celsius at which the fan is turned off. |
| **displayMode** :string | "default" | Starting mode for module. Options are "default" and "custom". Default mode shows IP, CPU temperature, and fan status. Custom mode will begin with a blank screen and wait for contented paseed via the writeLines() method. |

### Methods
After initialization, the following methods are available.

| Method | Description |
| ------ | ------ |
| invert(val:boolean) | Toggles the inversion of the screen. Optionally, a boolean can be passed as an argument to activate/deactivate this feature. |
| autoInvert:boolean | Activates and deactivates the auto inversion feature. Returns current status of the feature. |
| fanPower:boolean | Activates and deactivates the fan. Returns current status of the fan. |
| writeLines(lines:array,blank:boolean) | Writes array of strings to the display. Each item in the array will be written as a line. If blank is true, the display will be erased before the lines are written. |
| displayMode:string | Changes how the module handles the display.  Options are “default” and “custom”. Default mode shows IP, CPU temperature, and fan status. Custom mode will begin with a blank screen and wait for contented paseed via the writeLines() method. All other values will be interpreted as "default".  |

### Advanced

This package relies on the [i2c-bus](https://www.npmjs.com/package/i2c-bus) and [oled-i2c-bus](https://www.npmjs.com/package/oled-i2c-bus) packages.

These pacakges are exposed via ws18014.I2C and ws18014.OLED respectively.

## License
MIT
