/**
* @autor Niklas Mollenhauer <holzig@outlook.com>
* @autor Philip Tellis <philip@bluesmoon.info>
* @example
* // creates a new instance
* var lis = new LineReadableStream(underlyingStream);
*/
import events = require("events");
import Stream = require("stream");
declare class LineReadableStream extends Stream.Readable {
    public underlyingStream : Stream.Readable;
    public readable : boolean;
    public delimiter : string;
    private _underlyingStream;
    private _data;
    private _delimiter;
    private static _implementedEvents;
    /**
    * @constructor
    */
    constructor(underlyingStream: Stream.Readable);
    /**
    * @constructor
    */
    constructor(underlyingStream: Stream.Readable, delimiter: string);
    private initializeEvents();
    /**
    * Start overriding EventEmitter methods so we can pass through to underlyingStream If we get a request for an event we don't know about, pass it to the underlyingStream
    */
    public on(type: string, listener: Function): events.EventEmitter;
    public addListener(type: string, listener: Function): events.EventEmitter;
    public removeListener(type: string, listener: Function): events.EventEmitter;
    public removeAllListeners(type: string): events.EventEmitter;
    public resume(): LineReadableStream;
    public pause(): LineReadableStream;
    public setEncoding(encoding: string): LineReadableStream;
}
export = LineReadableStream;
