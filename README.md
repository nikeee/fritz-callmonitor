# node-fritzbox

Sample:
```
"use strict";

import fb = require("./CallMonitor");

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

cm.connect();
```
