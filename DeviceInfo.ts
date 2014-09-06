///<reference path="typings/node/node.d.ts"/>
///<reference path="typings/xml2js/xml2js.d.ts"/>

import http = require("http");
import xml2js = require("xml2js");

module FritzBox
{
    export class DeviceInfo
    {
        public static retrieve(host: string, cb: (err: any, result: IDeviceInfo) => void) : void
        {
            var parseResponse = (res: string) =>
            {
                xml2js.parseString(res, { explicitArray: false }, (err, xml) =>
                {
                    if (err)
                        cb(err, null);
                    else
                        cb(null, <IDeviceInfo>xml["root"]["device"]);
                });
            };

            var options = {
                host: host,
                port: 49000,
                path: "/igddesc.xml"
            };
            var httpCb = response =>
            {
                var str = "";
                response.on("data", chunk => str += chunk);
                response.on("error", err => cb(err, null));
                response.on("end", () => parseResponse(str));
            }

            http.request(options, httpCb).end();
        }
    }

    export interface Icon
    {
        mimetype: string;
        width: string;
        height: string;
        depth: string;
        url: string;
    }

    export interface IconList
    {
        icon: Icon;
    }

    export interface Service
    {
        serviceType: string;
        serviceId: string;
        controlURL: string;
        eventSubURL: string;
        SCPDURL: string;
    }

    export interface ServiceList
    {
        service: Service;
    }

    export interface Service2
    {
        serviceType: string;
        serviceId: string;
        controlURL: string;
        eventSubURL: string;
        SCPDURL: string;
    }

    export interface ServiceList2
    {
        service: Service2;
    }

    export interface Service3
    {
        serviceType: string;
        serviceId: string;
        controlURL: string;
        eventSubURL: string;
        SCPDURL: string;
    }

    export interface ServiceList3
    {
        service: Service3[];
    }

    export interface Device2
    {
        deviceType: string;
        friendlyName: string;
        manufacturer: string;
        manufacturerURL: string;
        modelDescription: string;
        modelName: string;
        modelNumber: string;
        modelURL: string;
        UDN: string;
        UPC: string;
        serviceList: ServiceList3;
    }

    export interface DeviceList2
    {
        device: Device2;
    }

    export interface Device
    {
        deviceType: string;
        friendlyName: string;
        manufacturer: string;
        manufacturerURL: string;
        modelDescription: string;
        modelName: string;
        modelNumber: string;
        modelURL: string;
        UDN: string;
        UPC: string;
        serviceList: ServiceList2;
        deviceList: DeviceList2;
    }

    export interface DeviceList
    {
        device: Device;
    }

    export interface IDeviceInfo
    {
        deviceType: string;
        friendlyName: string;
        manufacturer: string;
        manufacturerURL: string;
        modelDescription: string;
        modelName: string;
        modelNumber: string;
        modelURL: string;
        UDN: string;
        iconList: IconList;
        serviceList: ServiceList;
        deviceList: DeviceList;
        presentationURL: string;
    }
}

export = FritzBox;
