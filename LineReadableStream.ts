///<reference path="typings/node/node.d.ts"/>

// This is a TypeScript port of bluesmoon's line-input-stream
// Project site: https://github.com/bluesmoon/node-line-input-stream

/**
 * @autor Niklas Mollenhauer <holzig@outlook.com>
 * @autor Philip Tellis <philip@bluesmoon.info>
 * @example
 * // creates a new instance
 * var lis = new LineReadableStream(underlyingStream);
 */

import events = require("events");
import Stream = require("stream");
import util = require("util");

class LineReadableStream extends Stream.Readable
{
    public get underlyingStream(): Stream.Readable  
    {
        return this._underlyingStream;
    }

    public get readable(): boolean
    {
        return this._underlyingStream.readable;
    }

    public set delimiter(value: string)
    {
        this._delimiter = value;
    }

    /*
    // Does not seem to be available on Stream.Readable
    public get paused(): boolean
    {
        return this._underlyingStream.paused;
    }
    */

    private _underlyingStream: Stream.Readable;
    private _data: string;
    private _delimiter: string;

    private static _implementedEvents = ["line", "end"];

    /**
     * @constructor
     */
    constructor(underlyingStream: Stream.Readable);
    /**
     * @constructor
     */
    constructor(underlyingStream: Stream.Readable, delimiter: string);
    /**
     * @constructor
     */
    constructor(underlyingStream: Stream.Readable, delimiter: string = "\n")
    {
        super();
        if (!underlyingStream)
            throw new Error("LineReadableStream requires an underlying stream");

        this._underlyingStream = underlyingStream;
        this._data = "";
        this._delimiter = delimiter;

        this.initializeEvents();
    }

    private initializeEvents(): void
    {
        this._underlyingStream.on("data", chunk =>
        {
            this._data += chunk;
            var lines = this._data.split(this._delimiter);
            this._data = lines.pop();
            lines.forEach(line => this.emit("line", line));
        });
        this.underlyingStream.on("end", () =>
        {
            if (this._data.length > 0)
            {
                var lines = this._data.split(this._delimiter);
                lines.forEach(line => this.emit("line", line));
            }
            this.emit("end");
        });
    }

    /**
     * Start overriding EventEmitter methods so we can pass through to underlyingStream If we get a request for an event we don't know about, pass it to the underlyingStream
     */
    public on(type: string, listener: Function): events.EventEmitter
    {
        if (LineReadableStream._implementedEvents.indexOf(type) < 0)
            this._underlyingStream.on(type, listener);
        return super.on(type, listener);
    }
    public addListener(type: string, listener: Function): events.EventEmitter
    {
        return this.on(type, listener);
    }

    public removeListener(type: string, listener: Function): events.EventEmitter
    {
        if (LineReadableStream._implementedEvents.indexOf(type) < 0)
            this._underlyingStream.removeListener(type, listener);
        return super.removeListener(type, listener);
    }
    public removeAllListeners(type: string): events.EventEmitter
    {
        if (LineReadableStream._implementedEvents.indexOf(type) < 0)
            this._underlyingStream.removeAllListeners(type);
        return super.removeAllListeners(type);
    }

    public resume(): LineReadableStream
    {
        if (this._underlyingStream.resume)
            this._underlyingStream.resume();
        return this;
    }

    public pause(): LineReadableStream
    {
        if (this._underlyingStream.pause)
            this._underlyingStream.pause();
        return this;
    }

    /*
    // Does not seem to be available on Stream.Readable
    public destroy(): void
    {
        if (this._underlyingStream.destroy)
            this._underlyingStream.destroy();
    }
    */

    public setEncoding(encoding: string): LineReadableStream
    {
        if (this._underlyingStream.setEncoding)
            this._underlyingStream.setEncoding(encoding);
        return this;
    }
}

export = LineReadableStream;
