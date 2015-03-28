/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/byline/byline.d.ts" />
import events = require("events");
declare module FritzBox {
    class CallMonitor extends events.EventEmitter {
        private host;
        private port;
        private _reader;
        private _connected;
        private _socket;
        constructor(host: string);
        constructor(host: string, port: number);
        connect(): void;
        end(): void;
        private processLine(line);
        on(event: "call", listener: (data: CallEvent) => void): CallMonitor;
        on(event: "ring", listener: (data: RingEvent) => void): CallMonitor;
        on(event: "pickup", listener: (data: PickupEvent) => void): CallMonitor;
        on(event: "hangup", listener: (data: HangUpEvent) => void): CallMonitor;
        on(event: string, listener: Function): CallMonitor;
        private ring(data);
        private call(data);
        private pickup(data);
        private hangUp(data);
        private parseLine(line);
        private static eventTypeFromString(ev);
    }
    interface PhoneEvent {
        eventType: EventType;
        date: Date;
        connectionId: number;
        originalData: string;
    }
    interface RingEvent extends PhoneEvent {
        caller: string;
        callee: string;
    }
    interface CallEvent extends PhoneEvent {
        extension: string;
        caller: string;
        callee: string;
    }
    interface PickupEvent extends PhoneEvent {
        extension: string;
        phoneNumber: string;
    }
    interface HangUpEvent extends PhoneEvent {
        callDuration: number;
    }
    enum EventType {
        Call = 0,
        Ring = 1,
        Pickup = 2,
        HangUp = 3,
    }
}
export = FritzBox;
