import { LineStream, createStream } from "byline";
import { Socket, connect as connectSocket } from "net";
import * as moment from "moment";
import { EventEmitter } from "events";

export class CallMonitor extends EventEmitter {
	private readonly _socket: Socket;

	constructor(host: string);
	constructor(host: string, port: number);
	constructor(private readonly host: string, private readonly port: number = 1012) {
		super();
		this._socket = new Socket();
	}

	public connect() {
		const s = this._socket;
		s.connect(this.port, this.host);
		s.on("connect", args => {
			const reader = createStream(this._socket as NodeJS.ReadableStream, { encoding: "utf-8" });
			reader.on("data", (l: string) => this.processLine(l));
			s.once("end", _ => reader.end());
			this.emit("connect", args);
		});
		s.on("end", args => this.emit("end", args));
		s.on("timeout", args => this.emit("timeout", args));
		s.on("error", err => this.emit("error", err));
		s.on("close", args => this.emit("close", args));
	}

	public end() {
		this._socket.end()
	}

	private processLine(line: string): boolean {
		const data = this.parseLine(line);
		if (data === null)
			return false;

		this.emit("phone", data);
		switch (data.kind) {
			case EventKind.Ring: return this.emit("ring", data);
			case EventKind.Call: return this.emit("call", data);
			case EventKind.PickUp: return this.emit("pickup", data);
			case EventKind.HangUp: return this.emit("hangup", data);
			default: return false;
		}
	}

	public on(event: "phone", listener: (data: PhoneEvent) => void): this;
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

	private createEvent(eventKind: EventKind, date: Date, connectionId: number, line: string, splitLines: string[]): PhoneEvent {
		//TODO: Spread operator; https://github.com/Microsoft/TypeScript/issues/2103
		const res: PhoneEventBase = {
			rawData: line,
			date: date,
			connectionId: connectionId,
		};
		switch (eventKind) {
			case EventKind.HangUp:
				return Object.assign(res, {
					kind: eventKind,
					callDuration: parseInt(splitLines[3])
				});
			case EventKind.Call:
				return Object.assign(res, {
					kind: eventKind,
					extension: splitLines[3],
					caller: splitLines[4],
					callee: splitLines[5]
				});
			case EventKind.PickUp:
				return Object.assign(res, {
					kind: eventKind,
					extension: splitLines[3],
					phoneNumber: splitLines[4]
				});
			case EventKind.Ring:
				return Object.assign(res, {
					kind: eventKind,
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

	private static eventTypeFromString(ev: string): EventKind | undefined {
		switch (ev.toUpperCase()) {
			case "RING": return EventKind.Ring;
			case "CALL": return EventKind.Call;
			case "CONNECT": return EventKind.PickUp;
			case "DISCONNECT": return EventKind.HangUp;
			default: return undefined;
		}
	}
}

export type PhoneEvent = RingEvent | CallEvent | HangUpEvent | PickUpEvent;

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

export const enum EventKind {
	Call = 0,
	Ring = 1,
	PickUp = 2,
	HangUp = 4
}
