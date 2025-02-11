import { Socket } from "node:net";
import { EventEmitter } from "node:events";
import { createInterface } from "node:readline";

/**
 * We used to use moment for this:
 * ```js
 * moment(sp[0], "DD.MM.YY HH:mm:ss");
 * ```
 * However, we don't want moment for just parsing a date. So we use regex, since the Fritz!Box has a well-defined constant format.
 */
const datePattern = /(\d{2})\.(\d{2})\.(\d{2})\s+?(\d{2}):(\d{2}):(\d{2})/gi;

export class CallMonitor extends EventEmitter {
	private readonly socket: Socket;

	constructor(
		private readonly host: string,
		private readonly port: number = 1012,
	) {
		super();
		this.socket = new Socket();
	}

	public connect() {
		const s = this.socket;

		s.on("connect", () => {
			const reader = createInterface({
				input: this.socket,
			});
			reader.on("line", l => this.processLine(l));
			s.once("close", () => reader.close());
			this.emit("connect");
		});
		s.on("end", () => this.emit("end"));
		s.on("timeout", () => this.emit("timeout"));
		s.on("error", err => this.emit("error", err));
		s.on("close", had_error => this.emit("close", had_error));

		s.connect(this.port, this.host);
	}

	public end() {
		this.socket.end()
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
	public on(event: string, listener: (...args: unknown[]) => void): this;
	public on(event: string, listener: (...args: any[]) => void): this {
		return super.on(event, listener) as this;
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
		const res: PhoneEventBase = {
			rawData: line,
			date: date,
			connectionId: connectionId,
		};
		switch (eventKind) {
			case EventKind.HangUp:
				return {
					...res,
					kind: eventKind,
					callDuration: Number.parseInt(splitLines[3]),
				};
			case EventKind.Call:
				return {
					...res,
					kind: eventKind,
					extension: splitLines[3],
					caller: splitLines[4],
					callee: splitLines[5]
				};
			case EventKind.PickUp:
				return {
					...res,
					kind: eventKind,
					extension: splitLines[3],
					phoneNumber: splitLines[4]
				};
			case EventKind.Ring:
				return {
					...res,
					kind: eventKind,
					caller: splitLines[3],
					callee: splitLines[4]
				};
		}
	}

	private parseLine(line: string): PhoneEvent | null {
		if (!line)
			return null;

		const sp = line.split(";");
		if (sp.length < 4)
			return null;

		const dateMatch = datePattern.exec(sp[0]);

		let date: Date;
		if (dateMatch !== null) {
			// Destructuring inspired by:
			// https://stackoverflow.com/a/37280770
			const [/* intentional empty space */, dayOfMonth, month1Based, year, hours, minutes, seconds] = dateMatch;

			date = new Date(
				Number(year) + 2000, // 2-digits-based year to 4-digits-based year; fixes wrong century in date
				Number(month1Based) - 1, // convert 1-based to 0-based
				Number(dayOfMonth), // 1-based
				Number(hours),
				Number(minutes),
				Number(seconds),
				0, // ms
			);
		} else {
			date = new Date();
		}

		const evt = CallMonitor.eventTypeFromString(sp[1]);
		if (evt === undefined)
			return null; // invalid event type

		const connId = Number.parseInt(sp[2]);
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

export enum EventKind {
	Call = 0,
	Ring = 1,
	PickUp = 2,
	HangUp = 4
}
