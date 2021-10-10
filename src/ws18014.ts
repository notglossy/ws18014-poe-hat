/**
 * Module dependencies.
 */
const i2cDriver = require("i2c-bus"),
  oledDriver = require("oled-i2c-bus"),
  defaultFont = require("oled-font-5x7"),
  fs = require("fs"),
  os = require("os");

/**
 * Module exports.
 */
module.exports = class ws18014 {
  I2C: any;
  OLED_ADDRESS: number;
  OLED_WIDTH: number;
  OLED_HEIGHT: number;
  OLED_UPDATE_FREQ: number;
  OLED: any;
  FONT: any;
  CHAR_LINES: number;
  LINE_HEIGHT: number;
  OLED_INVERTED: boolean;
  OLED_INVERTED_AUTO: boolean;
  OLED_INVERTED_FREQ: number;
  FAN_ADDRESS: number;
  FAN_TEMP_ON: number;
  FAN_TEMP_OFF: number;
  FAN_COMMAND_ON: number;
  FAN_COMMAND_OFF: number;
  FAN_TEMP_UNIT: string;
  FAN_RUNNING: boolean;
  TEMP_FREQUENCY: number;
  CURRENT_TEMP: number;
  NETWORK_INTERFACES: any;
  NETWORK_INTERFACE_NAME: string;
  INTERVAL_INVERSION: NodeJS.Timer;
  INTERVAL_SCREEN: NodeJS.Timer;
  INTERVAL_TEMP: NodeJS.Timer;
  MODE: string;

  constructor(opts?: {
    oledAddress?: number;
    oledWidth?: number;
    oledHeight?: number;
    oledUpdateFreq?: number;
    font?: any;
    charLines?: number;
    lineHeight?: number;
    oledInverted?: boolean;
    oledInvertedAuto?: boolean;
    oledInvertedFreq?: number;
    fanAddress?: number;
    fanTempOn?: number;
    fanTempOff?: number;
    networkInterfaceName?: string;
    displayMode?: string;
  }) {
    if (typeof opts == "undefined") {
      opts = {};
    }
    this.I2C = i2cDriver.openSync(1);
    this.OLED_ADDRESS = opts.oledAddress || 0x3c;
    this.OLED_WIDTH = opts.oledWidth || 128;
    this.OLED_HEIGHT = opts.oledHeight || 32;
    this.OLED_UPDATE_FREQ = opts.oledUpdateFreq || 1000;
    this.OLED = new oledDriver(this.I2C, {
      width: this.OLED_WIDTH,
      height: this.OLED_HEIGHT,
      address: this.OLED_ADDRESS,
    });
    this.FONT = opts.font || defaultFont;
    this.CHAR_LINES = opts.charLines || 3;
    this.LINE_HEIGHT = opts.lineHeight || 11;
    this.OLED_INVERTED = opts.oledInverted || false;
    this.OLED_INVERTED_AUTO = opts.oledInvertedAuto || false;
    this.OLED_INVERTED_FREQ = opts.oledInvertedFreq || 30000; // 5 minutes
    this.FAN_ADDRESS = opts.fanAddress || 0x20;
    this.FAN_TEMP_ON = opts.fanTempOn || 70;
    this.FAN_TEMP_OFF = opts.fanTempOff || 50;
    this.FAN_COMMAND_ON = 0xfe;
    this.FAN_COMMAND_OFF = 0x01;
    this.FAN_TEMP_UNIT = "C";
    this.FAN_RUNNING = false;
    this.TEMP_FREQUENCY = 500;
    this.CURRENT_TEMP = 0;
    this.NETWORK_INTERFACES = os.networkInterfaces();
    this.NETWORK_INTERFACE_NAME = opts.networkInterfaceName || "eth0";
    this.INTERVAL_INVERSION;
    this.INTERVAL_SCREEN;
    this.INTERVAL_TEMP = setInterval(
      this.tempCycle.bind(this),
      this.TEMP_FREQUENCY
    );
    this.MODE = opts.displayMode || "default";

    if (this.OLED_INVERTED_AUTO) {
      this.INTERVAL_INVERSION = setInterval(
        this.invert.bind(this),
        this.OLED_INVERTED_FREQ
      );
    }

    if (this.MODE !== "custom" && this.MODE !== "default") {
      this.MODE = "default";
    } else if (this.MODE === "default") {
      this.INTERVAL_SCREEN = setInterval(
        this.defaultCycle.bind(this),
        this.OLED_UPDATE_FREQ
      );
    } else if (this.MODE === "custom") {
      this.OLED.clearDisplay();
    }
  }

  /**
   * Toggles inversion, or sets inversion with true/false.
   */
  invert(val: boolean): void {
    if (arguments.length) {
      this.OLED_INVERTED = Boolean(val);
    } else {
      this.OLED_INVERTED = !this.OLED_INVERTED;
    }

    this.OLED.invertDisplay(this.OLED_INVERTED);
  }

  /**
   * Enables or disables auto inversion with true/false.
   */
  get autoInvert(): boolean {
    return this.OLED_INVERTED_AUTO;
  }

  set autoInvert(val: boolean) {
    this.OLED_INVERTED_AUTO = Boolean(val);

    if (this.OLED_INVERTED_AUTO) {
      this.INTERVAL_INVERSION = setInterval(
        this.invert.bind(this),
        this.OLED_INVERTED_FREQ
      );
    } else {
      clearInterval(this.INTERVAL_INVERSION);
    }
  }

  /**
   * Creates the default content from the WaveShare Python examples..
   */
  defaultCycle(): void {
    let ip: string =
      this.NETWORK_INTERFACES[this.NETWORK_INTERFACE_NAME][0].address;

    let temp: number = Math.round(this.CURRENT_TEMP * 1e1) / 1e1;

    let power: string = true == this.FAN_RUNNING ? "ON" : "OFF";

    if (this.FAN_TEMP_UNIT === "F") {
      temp = 32 + Math.round(1.8 * this.CURRENT_TEMP * 1e1) / 1e1;
    }

    let lines: string[] = [
      "eth: " + ip,
      "Temp: " + temp + this.FAN_TEMP_UNIT,
      "Fan: " + power,
    ];

    this.writeLines(lines, true);
  }

  /**
   * Retrieves the temperture and uses this info to activate the fan.
   */
  tempCycle(): void {
    this.CURRENT_TEMP =
      Number(fs.readFileSync("/sys/class/thermal/thermal_zone0/temp")) / 1000;

    if (this.CURRENT_TEMP >= this.FAN_TEMP_ON) {
      this.fanPower = true;
    } else if (this.CURRENT_TEMP <= this.FAN_TEMP_OFF) {
      this.fanPower = false;
    }
  }

  /**
   * Toggles fan power, returns fan power status.
   */
  get fanPower(): boolean {
    return this.FAN_RUNNING;
  }

  set fanPower(val: boolean) {
    let power: boolean = Boolean(val);

    if (power) {
      this.I2C.sendByte(this.FAN_ADDRESS, this.FAN_COMMAND_ON, function () {
        //console.log("Fan: POWER ON");
      });
    } else {
      this.I2C.sendByte(this.FAN_ADDRESS, this.FAN_COMMAND_OFF, function () {
        //console.log("Fan: POWER OFF");
      });
    }

    this.FAN_RUNNING = power;
  }

  /**
   * Writes lines of characters to the OLED.
   */
  writeLines(lines: string[], blank: boolean): void {
    let i: number = 0,
      y: number = 1;

    if (blank) {
      this.OLED.clearDisplay();
    }

    while (i < this.CHAR_LINES) {
      this.OLED.setCursor(1, y);
      this.OLED.writeString(this.FONT, 1, lines[i], 1, true);
      i++;
      y += this.LINE_HEIGHT;
    }
  }

  /**
   * Handles dyanamic mode change.
   */

  get displayMode(): string {
    return this.MODE;
  }

  set displayMode(val: string) {
    //console.log(val);
    if (val === this.MODE) {
      // nothing to do here
      return;
    } else if (val !== "custom" && val !== "default") {
      // if unknown, set to default
      this.MODE = "default";
    } else {
      this.MODE = val;
    }

    if (this.MODE === "default") {
      // if default, start the interval
      this.OLED.clearDisplay();
      this.INTERVAL_SCREEN = setInterval(this.defaultCycle.bind(this));
      this.defaultCycle();
    } else if (this.MODE === "custom") {
      // if custom, blank the display for use
      clearInterval(this.INTERVAL_SCREEN);
      this.OLED.clearDisplay();
    }
  }
};
