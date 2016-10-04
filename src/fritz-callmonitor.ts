import { LineStream, createStream } from "byline";
import { Socket, connect as connectSocket } from "net";
import * as moment from "moment";
import { EventEmitter } from "events";

export class CallMonitor extends EventEmitter {
	private _reader: LineStream;
	private _connected: boolean = false;
	private _socket: Socket;

	constructor(host: string);
	constructor(host: string, port: number);
	constructor(private host: string, private port: number = 1012) {
		super();
	}

	public connect() {
		if (this._connected)
			return;

		this._socket = connectSocket(this.port, this.host);
		this._socket.on("connect", args => this.emit("connect", args));
		this._socket.on("end", args => this.emit("end", args));
		this._socket.on("timeout", args => this.emit("timeout", args));
		this._socket.on("error", err => this.emit("error", err));
		this._socket.on("close", args => this.emit("close", args));

		this._reader = createStream(this._socket as NodeJS.ReadableStream, { encoding: "utf-8" });
		this._reader.on("data", (l: string) => this.processLine(l));

		this._connected = true;
	}

	public end() {
		this._socket.end();
	}

	private processLine(line: string): boolean {
		const data = this.parseLine(line);
		if (data === null)
			return false;

		// super.emit("phoneevent", data);
		switch (data.eventType) {
			case EventType.Ring: return super.emit("ring", data);
			case EventType.Call: return super.emit("call", data);
			case EventType.PickUp: return super.emit("pickup", data);
			case EventType.HangUp: return super.emit("hangup", data);
			default: return false;
		}
	}

	// public on(event: "phoneevent", listener: (data: PhoneEvent) => void): this;
	public on(event: "call", listener: (data: CallEvent) => void): this;
	public on(event: "ring", listener: (data: RingEvent) => void): this;
	public on(event: "pickup", listener: (data: PickUpEvent) => void): this;
	public on(event: "hangup", listener: (data: HangUpEvent) => void): this;
	public on(event: string, listener: Function): this;
	public on(event: string, listener: Function): this {
		return <this>super.on(event, listener);
	}

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

	private createEvent(eventType: EventType, date: Date, connectionId: number, line: string, splitLines: string[]): PhoneEvent {
		//TODO: Spread operator; https://github.com/Microsoft/TypeScript/issues/2103
		const res: PhoneEventBase = {
			originalData: line,
			date: date,
			connectionId: connectionId,
		};
		switch (eventType) {
			case EventType.HangUp:
				return Object.assign(res, {
					eventType: eventType,
					callDuration: parseInt(splitLines[3])
				});
			case EventType.Call:
				return Object.assign(res, {
					eventType: eventType,
					extension: splitLines[3],
					caller: splitLines[4],
					callee: splitLines[5]
				});
			case EventType.PickUp:
				return Object.assign(res, {
					eventType: eventType,
					extension: splitLines[3],
					phoneNumber: splitLines[4]
				});
			case EventType.Ring:
				return Object.assign(res, {
					eventType: eventType,
					caller: splitLines[3],
					callee: splitLines[4]
				});
		}
	}

	private parseLine(line: string): PhoneEvent | null {
		if (!line)
			return null;

		const sp = line.split(";");
		if (sp.length < 4)
			return null;
		const d = moment(sp[0], "DD.MM.YY HH:mm:ss");

		const date = d.isValid() ? d.toDate() : new Date();

		const evt = CallMonitor.eventTypeFromString(sp[1]);
		if (evt === undefined)
			return null; // invalid event type

		const connId = parseInt(sp[2]);
		return this.createEvent(evt, date, connId, line, sp);
	}

	private static eventTypeFromString(ev: string): EventType | undefined {
		switch (ev.toUpperCase()) {
			case "RING": return EventType.Ring;
			case "CALL": return EventType.Call;
			case "CONNECT": return EventType.PickUp;
			case "DISCONNECT": return EventType.HangUp;
			default: return undefined;
		}
	}
}

export type PhoneEvent = RingEvent | CallEvent | HangUpEvent | PickUpEvent;

export interface PhoneEventBase {
	date: Date;
	connectionId: number;
	originalData: string;
}

export interface RingEvent extends PhoneEventBase {
	eventType: EventType.Ring;
	caller: string;
	callee: string;
}

export interface CallEvent extends PhoneEventBase {
	eventType: EventType.Call;
	extension: string;
	caller: string;
	callee: string;
}

export interface PickUpEvent extends PhoneEventBase {
	eventType: EventType.PickUp;
	extension: string;
	phoneNumber: string;
}

export interface HangUpEvent extends PhoneEventBase {
	eventType: EventType.HangUp;
	callDuration: number;
}

export const enum EventType {
	Call = 0,
	Ring = 1,
	PickUp = 2,
	HangUp = 4
}
