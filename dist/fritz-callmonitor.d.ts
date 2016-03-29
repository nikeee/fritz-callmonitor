// Generated by dts-bundle v0.2.0
// Dependencies for this module:
//   ../typings/node/node.d.ts

declare module 'fritz-callmonitor' {
    import events = require("events");
    module FritzBox {
        class CallMonitor extends events.EventEmitter {
            constructor(host: string);
            constructor(host: string, port: number);
            connect(): void;
            end(): void;
            on(event: "call", listener: (data: CallEvent) => void): CallMonitor;
            on(event: "ring", listener: (data: RingEvent) => void): CallMonitor;
            on(event: "pickup", listener: (data: PickupEvent) => void): CallMonitor;
            on(event: "hangup", listener: (data: HangUpEvent) => void): CallMonitor;
            on(event: string, listener: Function): CallMonitor;
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
}
