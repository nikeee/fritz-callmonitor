﻿///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/moment/moment.d.ts"/>

"use strict";

import LineReadableStream = require("./LineReadableStream");
import net = require("net");
import moment = require("moment");
import events = require("events");

module FritzBox
{
    export class CallMonitor extends events.EventEmitter
    {
        private _reader: LineReadableStream;
        private _connected: boolean;
        private _socket: net.Socket;

        constructor(private host: string, private port: number)
        {
            super();
        }

        public connect()
        {
            if (this._connected)
                return;

            this._socket = net.connect(this.port, this.host);
            this._socket.on("end", args => this.emit("end", args));
            this._socket.on("connect", args => this.emit("connect", args));

            this._reader = new LineReadableStream(this._socket, "\r\n");
            this._reader.on("line", l => this.processLine(l));
            this._connected = true;
        }

        public disconnect()
        {
            if (this._connected)
                this._socket.end();
        }

        private processLine(line: string): void
        {
            var data = this.parseLine(line);
            if (!data)
                return;

            switch (data.eventType)
            {
                case EventType.Ring:
                    this.ring(data);
                    return;
                case EventType.Call:
                    this.call(data);
                    return;
                case EventType.Pickup:
                    this.pickup(data);
                    return;
                case EventType.HangUp:
                    this.hangUp(data);
                    return;
                default:
                    return;
            }
        }

        public on(event: "call", listener: (data: CallEvent) => void): CallMonitor;
        public on(event: "ring", listener: (data: RingEvent) => void): CallMonitor;
        public on(event: "pickup", listener: (data: PickupEvent) => void): CallMonitor;
        public on(event: "hangUp", listener: (data: HangUpEvent) => void): CallMonitor;
        public on(event: string, listener: Function): events.EventEmitter;
        public on(event: string, listener: Function): events.EventEmitter
        {
            return super.on(event, listener);
        }

        private ring(data: CallEventData): void
        {
            var ev: RingEvent = {
                originalData: data.originalData,
                date: data.date,
                eventType: data.eventType,
                connectionId: data.connectionId,
                callerId: data.fourth,
                calledNumber: data.fifth
            };
            super.emit("ring", ev);
        }

        private call(data: CallEventData): void
        {
            var ev: CallEvent = {
                originalData: data.originalData,
                date: data.date,
                eventType: data.eventType,
                connectionId: data.connectionId,
                extension: data.fourth,
                callerId: data.fifth,
                calledNumber: data.sixth
            };
            super.emit("call", ev);
        }

        private pickup(data: CallEventData): void
        {
            var ev: PickupEvent = {
                originalData: data.originalData,
                date: data.date,
                eventType: data.eventType,
                connectionId: data.connectionId,
                extension: data.fourth,
                phoneNumber: data.fifth
            };
            super.emit("pickup", ev);
        }

        private hangUp(data: CallEventData): void
        {
            var ev: HangUpEvent = {
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

        private parseLine(line: string): CallEventData
        {
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

            var res: CallEventData = {
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

        private static eventTypeFromString(ev: string): EventType
        {
            switch (ev.toUpperCase())
            {
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

    interface CallEventData
    {
        originalData: string;
        eventType: EventType;
        date: Date;
        connectionId: number;

        fourth: string;
        fifth?: string;
        sixth?: string;
    }

    export interface PhoneEvent
    {
        eventType: EventType;
        date: Date;
        connectionId: number;
        originalData: string;
    }

    export interface RingEvent extends PhoneEvent
    {
        callerId: string;
        calledNumber: string;
    }

    export interface CallEvent extends PhoneEvent
    {
        //Extension;CallerId;CalledPhoneNumber;
        extension: string;
        callerId: string;
        calledNumber: string;
    }

    export interface PickupEvent extends PhoneEvent
    {
        extension: string;
        phoneNumber: string;
    }

    export interface HangUpEvent extends PhoneEvent
    {
        // DurationInSeconds;
        callDuration: number;
    }

    export enum EventType
    {
        Call,
        Ring,
        Pickup,
        HangUp
    }


}

export = FritzBox;
