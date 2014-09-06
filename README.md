# node-fritzbox
Provides a node.js wrapper for the call monitor api of the AVM Fritz!Box. Written in TypeScript.

Installation:
```
npm install fritz-callmonitor
```

Usage with TypeScript:
Copy the `fritz-callmonitor.d.ts` from `node_modules/fritz-callmonitor` to your TypeScript directory and make a reference using `///`.

# Enabling the API
The network API is disabled by default. To use this, call `#96*5*` on a phone which is managed by a FRITZ!Box.

## Sample

```TypeScript
"use strict";

import fb = require("fritz-callmonitor");

var cm = new fb.CallMonitor("192.168.178.1", 1012);

cm.on("ring", rr =>
{
    console.dir(rr);
    console.log(rr.caller + " calling...");
});

cm.on("call", rr => console.dir(rr));
cm.on("pickup", rr => console.dir(rr));
cm.on("hangUp", rr => console.dir(rr));

cm.on("close", () => console.log("Connection closed."));
cm.on("connect", () => console.log("Connected to device."));
cm.on("error", err => console.dir(err));

cm.connect();
```
