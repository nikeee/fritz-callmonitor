import { LineStream, createStream } from "byline";
import * as net from "net";
import * as moment from "moment";
import { EventEmitter } from "events";

export class CallMonitor extends EventEmitter {
	private _reader: LineStream;
	private _connected: boolean = false;
	private _socket: net.Socket;

	constructor(host: string);
	constructor(host: string, port: number);
	constructor(private host: string, private port: number = 1012) {
		super();
	}

	public connect() {
		if (this._connected)
			return;

		this._socket = net.connect(this.port, this.host);
		this._socket.on("connect", args => this.emit("connect", args));
		this._socket.on("end", args => this.emit("end", args));
		this._socket.on("timeout", args => this.emit("timeout", args));
		this._socket.on("error", err => this.emit("error", err));
		this._socket.on("close", args => this.emit("close", args));

		this._reader = createStream(this._socket, { encoding: "utf-8" });
		this._reader.on("data", (l: string) => this.processLine(l));

		this._connected = true;
	}

	public end() {
		this._socket.end();
	}

	private processLine(line: string): void {
		const data = this.parseLine(line);
		if (!data)
			return;

		switch (data.eventType) {
			case EventType.Ring:
				return this.ring(data);
			case EventType.Call:
				return this.call(data);
			case EventType.Pickup:
				return this.pickup(data);
			case EventType.HangUp:

				return this.hangUp(data);
			default:
				return;
		}
	}

	public on(event: "call", listener: (data: CallEvent) => void): this;
	public on(event: "ring", listener: (data: RingEvent) => void): this;
	public on(event: "pickup", listener: (data: PickupEvent) => void): this;
	public on(event: "hangup", listener: (data: HangUpEvent) => void): this;
	public on(event: string, listener: Function): this;
	public on(event: string, listener: Function): this {
		return <this>super.on(event, listener);
	}

	private ring(data: CallEventData): void {
		const ev: RingEvent = {
			originalData: data.originalData,
			date: data.date,
			eventType: data.eventType,
			connectionId: data.connectionId,
			caller: data.fourth,
			callee: data.fifth
		};
		super.emit("ring", ev);
	}

	private call(data: CallEventData): void {
		const ev: CallEvent = {
			originalData: data.originalData,
			date: data.date,
			eventType: data.eventType,
			connectionId: data.connectionId,
			extension: data.fourth,
			caller: data.fifth,
			callee: data.sixth
		};
		super.emit("call", ev);
	}

	private pickup(data: CallEventData): void {
		const ev: PickupEvent = {
			originalData: data.originalData,
			date: data.date,
			eventType: data.eventType,
			connectionId: data.connectionId,
			extension: data.fourth,
			phoneNumber: data.fifth
		};
		super.emit("pickup", ev);
	}

	private hangUp(data: CallEventData): void {
		const ev: HangUpEvent = {
			originalData: data.originalData,
			date: data.date,
			eventType: data.eventType,
			connectionId: data.connectionId,
			callDuration: parseInt(data.fourth)
		};
		super.emit("hangUp", ev);
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

	private parseLine(line: string): CallEventData {
		if (!line)
			return null;

		const sp = line.split(";");
		if (sp.length < 4)
			return null;
		const d = moment(sp[0], "DD.MM.YY HH:mm:ss");

		const date = d.isValid() ? d.toDate() : new Date();

		const evt = CallMonitor.eventTypeFromString(sp[1]);
		if (evt === null)
			return null; // invalid event type, return null

		const connId = parseInt(sp[2]);

		const res: CallEventData = {
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
	}

	private static eventTypeFromString(ev: string): EventType {
		switch (ev.toUpperCase()) {
			case "RING":
				return EventType.Ring;
			case "CALL":
				return EventType.Call;
			case "CONNECT":
				return EventType.Pickup;
			case "DISCONNECT":
				return EventType.HangUp;
			default:
				return null; // Invalid event type, return null
		}
	}
}

interface CallEventData {
	originalData: string;
	eventType: EventType;
	date: Date;
	connectionId: number;

	fourth: string;
	fifth?: string;
	sixth?: string;
}

export interface PhoneEvent {
	eventType: EventType;
	date: Date;
	connectionId: number;
	originalData: string;
}

export interface RingEvent extends PhoneEvent {
	caller: string;
	callee: string;
}

export interface CallEvent extends PhoneEvent {
	extension: string;
	caller: string;
	callee: string;
}

export interface PickupEvent extends PhoneEvent {
	extension: string;
	phoneNumber: string;
}

export interface HangUpEvent extends PhoneEvent {
	callDuration: number;
}

export enum EventType {
	Call,
	Ring,
	Pickup,
	HangUp
}
