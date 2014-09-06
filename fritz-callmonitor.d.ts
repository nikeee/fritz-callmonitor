/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/moment/moment.d.ts" />
/// <reference path="line-readable-stream.d.ts" />
import events = require("events");
declare module FritzBox {
    class CallMonitor extends events.EventEmitter {
        private host;
        private port;
        private _reader;
        private _connected;
        private _socket;
        constructor(host: string, port: number);
        public connect(): void;
        public end(): void;
        private processLine(line);
        public on(event: "call", listener: (data: CallEvent) => void): CallMonitor;
        public on(event: "ring", listener: (data: RingEvent) => void): CallMonitor;
        public on(event: "pickup", listener: (data: PickupEvent) => void): CallMonitor;
        public on(event: "hangUp", listener: (data: HangUpEvent) => void): CallMonitor;
        public on(event: string, listener: Function): events.EventEmitter;
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
