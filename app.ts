"use strict";

import fb = require("./CallMonitor");
import util = require("util");

var cm = new fb.CallMonitor("192.168.178.1", 1012);

cm.on("ring", rr =>
{
    console.log(util.format(rr));
    console.log(rr.callerId + " calling...");
});

cm.on("call", rr => console.log(util.format(rr)));
cm.on("pickup", rr => console.log(util.format(rr)));
cm.on("hangUp", rr => console.log(util.format(rr)));

cm.connect();
