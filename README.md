# fritz-callmonitor [![Build Status](https://travis-ci.com/nikeee/fritz-callmonitor.svg?branch=master)](https://travis-ci.com/nikeee/fritz-callmonitor) [![npm version](https://badge.fury.io/js/fritz-callmonitor.svg)](http://badge.fury.io/js/fritz-callmonitor) ![Dependency Status](https://david-dm.org/nikeee/fritz-callmonitor.svg) ![License](https://img.shields.io/npm/l/fritz-callmonitor.svg)

Provides a Node.js wrapper for the call monitor api of the AVM Fritz!Box. Written in TypeScript.

## Installation
```Shell
npm install fritz-callmonitor
```

### TypeScript Usage
You need TypeScript 2. Just install the NPM package and you're ready to go!

## Enabling the API
The network API is disabled by default. To use this, call `#96*5*` on a phone which is managed by the FRITZ!Box.

## Sample

```TypeScript
"use strict";

import { CallMonitor, EventKind } from "fritz-callmonitor";

const cm = new CallMonitor("192.168.178.1", 1012);

cm.on("ring", rr => {
	console.dir(rr);
	console.log(`${rr.caller} calling...`);
});

cm.on("call", rr => console.dir(rr));
cm.on("pickup", rr => console.dir(rr));
cm.on("hangup", rr => console.dir(rr));

cm.on("phone", evt => {
    // gets called on every phone event
    switch(evt.kind) {
        case EventKind.Ring:
        case EventKind.Call:
            console.log(`${evt.caller} -> ${evt.callee}`);
            break;
    }
});

cm.on("close", () => console.log("Connection closed."));
cm.on("connect", () => console.log("Connected to device."));
cm.on("error", err => console.dir(err));

cm.connect();
```
