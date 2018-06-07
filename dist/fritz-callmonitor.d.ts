/// <reference types="node" />
import { EventEmitter } from "events";
export declare class CallMonitor extends EventEmitter {
    private readonly host;
    private readonly port;
    private readonly _socket;
    constructor(host: string);
    constructor(host: string, port: number);
    connect(): void;
    end(): void;
    private processLine(line);
    on(event: "phone", listener: (data: PhoneEvent) => void): this;
    on(event: "call", listener: (data: CallEvent) => void): this;
    on(event: "ring", listener: (data: RingEvent) => void): this;
    on(event: "pickup", listener: (data: PickUpEvent) => void): this;
    on(event: "hangup", listener: (data: HangUpEvent) => void): this;
    on(event: string, listener: Function): this;
    private createEvent(eventKind, date, connectionId, line, splitLines);
    private parseLine(line);
    private static eventTypeFromString(ev);
}
export declare type PhoneEvent = RingEvent | CallEvent | HangUpEvent | PickUpEvent;
export interface PhoneEventBase {
    date: Date;
    connectionId: number;
    rawData: string;
}
export interface RingEvent extends PhoneEventBase {
    kind: EventKind.Ring;
    caller: string;
    callee: string;
}
export interface CallEvent extends PhoneEventBase {
    kind: EventKind.Call;
    extension: string;
    caller: string;
    callee: string;
}
export interface PickUpEvent extends PhoneEventBase {
    kind: EventKind.PickUp;
    extension: string;
    phoneNumber: string;
}
export interface HangUpEvent extends PhoneEventBase {
    kind: EventKind.HangUp;
    callDuration: number;
}
export declare const enum EventKind {
    Call = 0,
    Ring = 1,
    PickUp = 2,
    HangUp = 4,
}
