"use strict";

import fb = require("./CallMonitor");
import fb2 = require("./DeviceInfo");

var cm = new fb.CallMonitor("192.168.178.1", 1012);

cm.on("ring", rr =>
{
    console.dir(rr);
    console.log(rr.callerId + " calling...");
});

cm.on("call", rr => console.dir(rr));
cm.on("pickup", rr => console.dir(rr));
cm.on("hangUp", rr => console.dir(rr));

cm.connect();

fb2.DeviceInfo.retrieve("192.168.178.1", (err, data) =>
{
    if(!err)
        console.log(data.friendlyName);
});
