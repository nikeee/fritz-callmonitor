///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/moment/moment.d.ts"/>
///<reference path="typings/byline/byline.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var byline = require("byline");
var net = require("net");
var moment = require("moment");
var events = require("events");
var FritzBox;
(function (FritzBox) {
    "use strict";
    var CallMonitor = (function (_super) {
        __extends(CallMonitor, _super);
        function CallMonitor(host, port) {
            if (port === void 0) { port = 1012; }
            _super.call(this);
            this.host = host;
            this.port = port;
            this._connected = false;
        }
        CallMonitor.prototype.connect = function () {
            var _this = this;
            if (this._connected)
                return;
            this._socket = net.connect(this.port, this.host);
            this._socket.on("connect", function (args) { return _this.emit("connect", args); });
            this._socket.on("end", function (args) { return _this.emit("end", args); });
            this._socket.on("timeout", function (args) { return _this.emit("timeout", args); });
            this._socket.on("error", function (err) { return _this.emit("error", err); });
            this._socket.on("close", function (args) { return _this.emit("close", args); });
            this._reader = byline.createStream(this._socket, { encoding: "utf-8" });
            this._reader.on("data", function (l) { return _this.processLine(l); });
            this._connected = true;
        };
        CallMonitor.prototype.end = function () {
            this._socket.end();
        };
        CallMonitor.prototype.processLine = function (line) {
            var data = this.parseLine(line);
            if (!data)
                return;
            switch (data.eventType) {
                case 1 /* Ring */:
                    this.ring(data);
                    return;
                case 0 /* Call */:
                    this.call(data);
                    return;
                case 2 /* Pickup */:
                    this.pickup(data);
                    return;
                case 3 /* HangUp */:
                    this.hangUp(data);
                    return;
                default:
                    return;
            }
        };
        CallMonitor.prototype.on = function (event, listener) {
            return _super.prototype.on.call(this, event, listener);
        };
        CallMonitor.prototype.ring = function (data) {
            var ev = {
                originalData: data.originalData,
                date: data.date,
                eventType: data.eventType,
                connectionId: data.connectionId,
                caller: data.fourth,
                callee: data.fifth
            };
            _super.prototype.emit.call(this, "ring", ev);
        };
        CallMonitor.prototype.call = function (data) {
            var ev = {
                originalData: data.originalData,
                date: data.date,
                eventType: data.eventType,
                connectionId: data.connectionId,
                extension: data.fourth,
                caller: data.fifth,
                callee: data.sixth
            };
            _super.prototype.emit.call(this, "call", ev);
        };
        CallMonitor.prototype.pickup = function (data) {
            var ev = {
                originalData: data.originalData,
                date: data.date,
                eventType: data.eventType,
                connectionId: data.connectionId,
                extension: data.fourth,
                phoneNumber: data.fifth
            };
            _super.prototype.emit.call(this, "pickup", ev);
        };
        CallMonitor.prototype.hangUp = function (data) {
            var ev = {
                originalData: data.originalData,
                date: data.date,
                eventType: data.eventType,
                connectionId: data.connectionId,
                callDuration: parseInt(data.fourth)
            };
            _super.prototype.emit.call(this, "hangUp", ev);
        };
        /*
        Call:
        Date;CALL;ConnectionId;Extension;CallerId;CalledPhoneNumber;

        Ring:
        Date;RING;ConnectionId;CallerId;CalledPhoneNumber;

        Pickup:
        Date;CONNECT;ConnectionId;Extension;Number;

        HangUp:
        Date;DISCONNECT;ConnectionId;DurationInSeconds;
        */
        CallMonitor.prototype.parseLine = function (line) {
            if (!line)
                return null;
            var sp = line.split(";");
            if (sp.length < 4)
                return null;
            var d = moment(sp[0], "DD.MM.YY HH:mm:ss");
            var date = d.isValid() ? d.toDate() : new Date();
            var evt = CallMonitor.eventTypeFromString(sp[1]);
            if (evt === null)
                return null; // invalid event type, return null
            var connId = parseInt(sp[2]);
            var res = {
                originalData: line,
                eventType: evt,
                date: date,
                connectionId: connId,
                fourth: sp[3]
            };
            if (sp.length > 3)
                res.fifth = sp[4];
            if (sp.length > 4)
                res.sixth = sp[5];
            return res;
        };
        CallMonitor.eventTypeFromString = function (ev) {
            switch (ev.toUpperCase()) {
                case "RING":
                    return 1 /* Ring */;
                case "CALL":
                    return 0 /* Call */;
                case "CONNECT":
                    return 2 /* Pickup */;
                case "DISCONNECT":
                    return 3 /* HangUp */;
                default:
                    return null;
            }
        };
        return CallMonitor;
    })(events.EventEmitter);
    FritzBox.CallMonitor = CallMonitor;
    (function (EventType) {
        EventType[EventType["Call"] = 0] = "Call";
        EventType[EventType["Ring"] = 1] = "Ring";
        EventType[EventType["Pickup"] = 2] = "Pickup";
        EventType[EventType["HangUp"] = 3] = "HangUp";
    })(FritzBox.EventType || (FritzBox.EventType = {}));
    var EventType = FritzBox.EventType;
})(FritzBox || (FritzBox = {}));
module.exports = FritzBox;
//# sourceMappingURL=fritz-callmonitor.js.map