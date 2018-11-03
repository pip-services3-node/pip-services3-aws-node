"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module log */
/** @hidden */
let async = require('async');
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const connect_1 = require("../connect");
const pip_services3_components_node_2 = require("pip-services3-components-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
/**
 * Logger that writes log messages to AWS Cloud Watch Log.
 *
 * ### Configuration parameters ###
 *
 * - stream:                        (optional) Cloud Watch Log stream (default: context name)
 * - group:                         (optional) Cloud Watch Log group (default: context instance ID or hostname)
 * - connections:
 *     - discovery_key:               (optional) a key to retrieve the connection from [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]]
 *     - region:                      (optional) AWS region
 * - credentials:
 *     - store_key:                   (optional) a key to retrieve the credentials from [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/auth.icredentialstore.html ICredentialStore]]
 *     - access_id:                   AWS access/client id
 *     - access_key:                  AWS access/client id
 * - options:
 *     - interval:        interval in milliseconds to save current counters measurements (default: 5 mins)
 *     - reset_timeout:   timeout in milliseconds to reset the counters. 0 disables the reset (default: 0)
 *
 * ### References ###
 *
 * - <code>\*:context-info:\*:\*:1.0</code>      (optional) [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/classes/info.contextinfo.html ContextInfo]] to detect the context id and specify counters source
 * - <code>\*:discovery:\*:\*:1.0</code>         (optional) [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]] services to resolve connections
 * - <code>\*:credential-store:\*:\*:1.0</code>  (optional) Credential stores to resolve credentials
 *
 * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/classes/count.counter.html Counter]] (in the Pip.Services components package)
 * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/classes/count.cachedcounters.html CachedCounters]] (in the Pip.Services components package)
 * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/classes/log.compositelogger.html CompositeLogger]] (in the Pip.Services components package)

 *
 * ### Example ###
 *
 *     let logger = new Logger();
 *     logger.config(ConfigParams.fromTuples(
 *         "stream", "mystream",
 *         "group", "mygroup",
 *         "connection.region", "us-east-1",
 *         "connection.access_id", "XXXXXXXXXXX",
 *         "connection.access_key", "XXXXXXXXXXX"
 *     ));
 *     logger.setReferences(References.fromTuples(
 *         new Descriptor("pip-services", "logger", "console", "default", "1.0"),
 *         new ConsoleLogger()
 *     ));
 *
 *     logger.open("123", (err) => {
 *         ...
 *     });
 *
 *     logger.setLevel(LogLevel.debug);
 *
 *     logger.error("123", ex, "Error occured: %s", ex.message);
 *     logger.debug("123", "Everything is OK.");
 */
class CloudWatchLogger extends pip_services3_components_node_1.CachedLogger {
    /**
     * Creates a new instance of this logger.
     */
    constructor() {
        super();
        this._connectionResolver = new connect_1.AwsConnectionResolver();
        this._client = null; //AmazonCloudWatchLogsClient
        this._connectTimeout = 30000;
        this._group = "undefined";
        this._stream = null;
        this._lastToken = null;
        this._logger = new pip_services3_components_node_2.CompositeLogger();
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        super.configure(config);
        this._connectionResolver.configure(config);
        this._group = config.getAsStringWithDefault('group', this._group);
        this._stream = config.getAsStringWithDefault('stream', this._stream);
        this._connectTimeout = config.getAsIntegerWithDefault("options.connect_timeout", this._connectTimeout);
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     * @see [[https://rawgit.com/pip-services-node/pip-services3-commons-node/master/doc/api/interfaces/refer.ireferences.html IReferences]] (in the Pip.Services commons package)
     */
    setReferences(references) {
        super.setReferences(references);
        this._logger.setReferences(references);
        this._connectionResolver.setReferences(references);
        let contextInfo = references.getOneOptional(new pip_services3_commons_node_2.Descriptor("pip-services", "context-info", "default", "*", "1.0"));
        if (contextInfo != null && this._stream == null)
            this._stream = contextInfo.name;
        if (contextInfo != null && this._group == null)
            this._group = contextInfo.contextId;
    }
    /**
     * Writes a log message to the logger destination.
     *
     * @param level             a log level.
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param error             an error object associated with this message.
     * @param message           a human-readable message to log.
     */
    write(level, correlationId, ex, message) {
        if (this._level < level) {
            return;
        }
        super.write(level, correlationId, ex, message);
    }
    /**
     * Checks if the component is opened.
     *
     * @returns true if the component has been opened and false otherwise.
     */
    isOpen() {
        return this._timer != null;
    }
    /**
     * Opens the component.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    open(correlationId, callback) {
        if (this.isOpen()) {
            callback(null);
            return;
        }
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
                this._client = new aws.CloudWatchLogs({ apiVersion: '2014-03-28' });
                let params = {
                    logGroupName: this._group
                };
                this._client.createLogGroup(params, (err, data) => {
                    if (err && err.code != "ResourceAlreadyExistsException") {
                        callback(err);
                    }
                    else {
                        callback();
                    }
                });
            },
            (callback) => {
                let paramsStream = {
                    logGroupName: this._group,
                    logStreamName: this._stream
                };
                this._client.createLogStream(paramsStream, (err, data) => {
                    if (err) {
                        if (err.code == "ResourceAlreadyExistsException") {
                            let params = {
                                logGroupName: this._group,
                                logStreamNamePrefix: this._stream,
                            };
                            this._client.describeLogStreams(params, (err, data) => {
                                if (data.logStreams.length > 0) {
                                    this._lastToken = data.logStreams[0].uploadSequenceToken;
                                }
                                callback(err);
                            });
                        }
                        else {
                            callback(err);
                        }
                    }
                    else {
                        this._lastToken = null;
                        callback(err);
                    }
                });
            },
            (callback) => {
                if (this._timer == null) {
                    this._timer = setInterval(() => { this.dump(); }, this._interval);
                }
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
        this.save(this._cache, (err) => {
            if (this._timer)
                clearInterval(this._timer);
            this._cache = [];
            this._timer = null;
            this._client = null;
            if (callback)
                callback(null);
        });
    }
    formatMessageText(message) {
        let result = "";
        result += "[" + (message.source ? message.source : "---") + ":" +
            (message.correlation_id ? message.correlation_id : "---") + ":" + message.level + "] " +
            message.message;
        if (message.error != null) {
            if (!message.message) {
                result += "Error: ";
            }
            else {
                result += ": ";
            }
            result += message.error.message;
            if (message.error.stack_trace) {
                result += " StackTrace: " + message.error.stack_trace;
            }
        }
        return result;
    }
    /**
     * Saves log messages from the cache.
     *
     * @param messages  a list with log messages
     * @param callback  callback function that receives error or null for success.
     */
    save(messages, callback) {
        if (!this.isOpen() || messages == null || messages.length == 0) {
            if (callback)
                callback(null);
            return;
        }
        if (this._client == null) {
            let err = new pip_services3_commons_node_1.ConfigException("cloudwatch_logger", 'NOT_OPENED', 'CloudWatchLogger is not opened');
            if (err != null) {
                callback(err);
                return;
            }
        }
        let events = [];
        messages.forEach(message => {
            events.push({
                timestamp: message.time.getTime(),
                message: this.formatMessageText(message)
            });
        });
        let params = {
            logEvents: events,
            logGroupName: this._group,
            logStreamName: this._stream,
            sequenceToken: this._lastToken
        };
        async.series([
            (callback) => {
                // get token again if saving log from another container
                let describeParams = {
                    logGroupName: this._group,
                    logStreamNamePrefix: this._stream,
                };
                this._client.describeLogStreams(describeParams, (err, data) => {
                    if (data.logStreams.length > 0) {
                        this._lastToken = data.logStreams[0].uploadSequenceToken;
                    }
                    callback();
                });
            },
            (callback) => {
                this._client.putLogEvents(params, (err, data) => {
                    if (err) {
                        if (this._logger)
                            this._logger.error("cloudwatch_logger", err, "putLogEvents error");
                    }
                    else {
                        this._lastToken = data.nextSequenceToken;
                    }
                    callback();
                });
            }
        ]);
    }
}
exports.CloudWatchLogger = CloudWatchLogger;
//# sourceMappingURL=CloudWatchLogger.js.map