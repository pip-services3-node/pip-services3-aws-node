"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudWatchCounters = void 0;
/** @module count */
/** @hidden */
let async = require('async');
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_components_node_2 = require("pip-services3-components-node");
const connect_1 = require("../connect");
const pip_services3_components_node_3 = require("pip-services3-components-node");
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const CloudWatchUnit_1 = require("./CloudWatchUnit");
/**
 * Performance counters that periodically dumps counters to AWS Cloud Watch Metrics.
 *
 * ### Configuration parameters ###
 *
 * - connections:
 *     - discovery_key:         (optional) a key to retrieve the connection from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]]
 *     - region:                (optional) AWS region
 * - credentials:
 *     - store_key:             (optional) a key to retrieve the credentials from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/auth.icredentialstore.html ICredentialStore]]
 *     - access_id:             AWS access/client id
 *     - access_key:            AWS access/client id
 * - options:
 *     - interval:              interval in milliseconds to save current counters measurements (default: 5 mins)
 *     - reset_timeout:         timeout in milliseconds to reset the counters. 0 disables the reset (default: 0)
 *
 * ### References ###
 *
 * - <code>\*:context-info:\*:\*:1.0</code>      (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/classes/info.contextinfo.html ContextInfo]] to detect the context id and specify counters source
 * - <code>\*:discovery:\*:\*:1.0</code>         (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]] services to resolve connections
 * - <code>\*:credential-store:\*:\*:1.0</code>  (optional) Credential stores to resolve credentials
 *
 * @see [[https://pip-services3-node.github.io/pip-services3-components-node/classes/count.counter.html Counter]] (in the Pip.Services components package)
 * @see [[https://pip-services3-node.github.io/pip-services3-components-node/classes/count.cachedcounters.html CachedCounters]] (in the Pip.Services components package)
 * @see [[https://pip-services3-node.github.io/pip-services3-components-node/classes/log.compositelogger.html CompositeLogger]] (in the Pip.Services components package)
 *
 * ### Example ###
 *
 *     let counters = new CloudWatchCounters();
 *     counters.config(ConfigParams.fromTuples(
 *         "connection.region", "us-east-1",
 *         "connection.access_id", "XXXXXXXXXXX",
 *         "connection.access_key", "XXXXXXXXXXX"
 *     ));
 *     counters.setReferences(References.fromTuples(
 *         new Descriptor("pip-services", "logger", "console", "default", "1.0"),
 *         new ConsoleLogger()
 *     ));
 *
 *     counters.open("123", (err) => {
 *         ...
 *     });
 *
 *     counters.increment("mycomponent.mymethod.calls");
 *     let timing = counters.beginTiming("mycomponent.mymethod.exec_time");
 *     try {
 *         ...
 *     } finally {
 *         timing.endTiming();
 *     }
 *
 *     counters.dump();
 */
class CloudWatchCounters extends pip_services3_components_node_2.CachedCounters {
    /**
     * Creates a new instance of this counters.
     */
    constructor() {
        super();
        this._logger = new pip_services3_components_node_3.CompositeLogger();
        this._connectionResolver = new connect_1.AwsConnectionResolver();
        this._connectTimeout = 30000;
        this._client = null; //AmazonCloudWatchClient
        this._opened = false;
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        super.configure(config);
        this._connectionResolver.configure(config);
        this._source = config.getAsStringWithDefault('source', this._source);
        this._instance = config.getAsStringWithDefault('instance', this._instance);
        this._connectTimeout = config.getAsIntegerWithDefault("options.connect_timeout", this._connectTimeout);
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     * @see [[https://pip-services3-node.github.io/pip-services3-commons-node/interfaces/refer.ireferences.html IReferences]] (in the Pip.Services commons package)
     */
    setReferences(references) {
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
        let contextInfo = references.getOneOptional(new pip_services3_commons_node_1.Descriptor("pip-services", "context-info", "default", "*", "1.0"));
        if (contextInfo != null && this._source == null)
            this._source = contextInfo.name;
        if (contextInfo != null && this._instance == null)
            this._instance = contextInfo.contextId;
    }
    /**
     * Checks if the component is opened.
     *
     * @returns true if the component has been opened and false otherwise.
     */
    isOpen() {
        return this._opened;
    }
    /**
     * Opens the component.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    open(correlationId, callback) {
        if (this._opened) {
            if (callback)
                callback(null);
            return;
        }
        this._opened = true;
        async.series([
            (callback) => {
                this._connectionResolver.resolve(correlationId, (err, connection) => {
                    this._connection = connection;
                    callback(err);
                });
            },
            (callback) => {
                let aws = require('aws-sdk');
                aws.config.update({
                    accessKeyId: this._connection.getAccessId(),
                    secretAccessKey: this._connection.getAccessKey(),
                    region: this._connection.getRegion()
                });
                aws.config.httpOptions = {
                    timeout: this._connectTimeout
                };
                this._client = new aws.CloudWatch({ apiVersion: '2010-08-01' });
                callback();
            }
        ], callback);
    }
    /**
     * Closes component and frees used resources.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    close(correlationId, callback) {
        this._opened = false;
        this._client = null;
        if (callback)
            callback(null);
    }
    getCounterData(counter, now, dimensions) {
        let value = {
            MetricName: counter.name,
            Timestamp: counter.time,
            Dimensions: dimensions,
            Unit: CloudWatchUnit_1.CloudWatchUnit.None,
        };
        switch (counter.type) {
            case pip_services3_components_node_1.CounterType.Increment:
                value['Value'] = counter.count;
                value.Unit = CloudWatchUnit_1.CloudWatchUnit.Count;
                break;
            case pip_services3_components_node_1.CounterType.Interval:
                value.Unit = CloudWatchUnit_1.CloudWatchUnit.Milliseconds;
                //value.Value = counter.average;
                value['StatisticValues'] = {
                    SampleCount: counter.count,
                    Maximum: counter.max,
                    Minimum: counter.min,
                    Sum: counter.count * counter.average
                };
                break;
            case pip_services3_components_node_1.CounterType.Statistics:
                //value.Value = counter.average;
                value['StatisticValues'] = {
                    SampleCount: counter.count,
                    Maximum: counter.max,
                    Minimum: counter.min,
                    Sum: counter.count * counter.average
                };
                break;
            case pip_services3_components_node_1.CounterType.LastValue:
                value['Value'] = counter.last;
                break;
            case pip_services3_components_node_1.CounterType.Timestamp:
                value['Value'] = counter.time.getTime();
                break;
        }
        return value;
    }
    /**
     * Saves the current counters measurements.
     *
     * @param counters      current counters measurements to be saves.
     */
    save(counters) {
        if (this._client == null)
            return;
        let dimensions = [];
        dimensions.push({
            Name: "InstanceID",
            Value: this._instance
        });
        let now = new Date();
        let data = [];
        counters.forEach(counter => {
            data.push(this.getCounterData(counter, now, dimensions));
            if (data.length >= 20) {
                async.series([
                    (callback) => {
                        this._client.putMetricData(params, function (err, data) {
                            if (err) {
                                if (this._logger)
                                    this._logger.error("cloudwatch_counters", err, "putMetricData error");
                            }
                            callback(err);
                        });
                    },
                    (callback) => {
                        data = [];
                        callback();
                    }
                ]);
            }
        });
        var params = {
            MetricData: data,
            Namespace: this._source
        };
        if (data.length > 0) {
            this._client.putMetricData(params, function (err, data) {
                if (err) {
                    if (this._logger)
                        this._logger.error("cloudwatch_counters", err, "putMetricData error");
                }
            });
        }
    }
}
exports.CloudWatchCounters = CloudWatchCounters;
//# sourceMappingURL=CloudWatchCounters.js.map