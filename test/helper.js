/* global require: false, module */
const events = require("events"),
        util = require("util");

class FakeSerialPort extends events.EventEmitter {
    constructor() {
        super ();
        this.bytesWritten = [];
        this.flushed = false;
        this.isOpen = true;
    }

    write(buffer, callback) {
        // Must use array concatenation to handle recording multiple packets
        this.bytesWritten = this.bytesWritten.concat(buffer);
        if (callback && typeof callback === "function") {
            callback();
        }
        // Simulate ACK so user callbacks (pendingCallbacks) are invoked after write
        if (this.device && buffer.length > 4) {
            this.device.simulateAck(buffer[3]);
        }
    };

    flush(callback) {
        this.flushed = true;
        if (callback && typeof callback === "function") {
            callback();
        }
    };

    close(callback) {
        this.isOpen = false;
        if (callback && typeof callback === "function") {
            callback();
        }
    };    
}
module.exports = FakeSerialPort;
