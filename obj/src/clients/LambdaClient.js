"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaClient = void 0;
/** @module clients */
/** @hidden */
let _ = require('lodash');
/** @hidden */
let async = require('async');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const pip_services3_commons_node_3 = require("pip-services3-commons-node");
const pip_services3_commons_node_4 = require("pip-services3-commons-node");
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_components_node_2 = require("pip-services3-components-node");
const AwsConnectionResolver_1 = require("../connect/AwsConnectionResolver");
/**
 * Abstract client that calls AWS Lambda Functions.
 *
 * When making calls "cmd" parameter determines which what action shall be called, while
 * other parameters are passed to the action itself.
 *
 * ### Configuration parameters ###
 *
 * - connections:
 *     - discovery_key:               (optional) a key to retrieve the connection from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]]
 *     - region:                      (optional) AWS region
 * - credentials:
 *     - store_key:                   (optional) a key to retrieve the credentials from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/auth.icredentialstore.html ICredentialStore]]
 *     - access_id:                   AWS access/client id
 *     - access_key:                  AWS access/client id
 * - options:
 *     - connect_timeout:             (optional) connection timeout in milliseconds (default: 10 sec)
 *
 * ### References ###
 *
 * - <code>\*:logger:\*:\*:1.0</code>            (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/log.ilogger.html ILogger]] components to pass log messages
 * - <code>\*:counters:\*:\*:1.0</code>          (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/count.icounters.html ICounters]] components to pass collected measurements
 * - <code>\*:discovery:\*:\*:1.0</code>         (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]] services to resolve connection
 * - <code>\*:credential-store:\*:\*:1.0</code>  (optional) Credential stores to resolve credentials
 *
 * @see [[LambdaFunction]]
 * @see [[CommandableLambdaClient]]
 *
 * ### Example ###
 *
 *     class MyLambdaClient extends LambdaClient implements IMyClient {
 *         ...
 *
 *         public getData(correlationId: string, id: string,
 *             callback: (err: any, result: MyData) => void): void {
 *
 *             let timing = this.instrument(correlationId, 'myclient.get_data');
 *             this.call("get_data" correlationId, { id: id }, (err, result) => {
 *                 timing.endTiming();
 *                 callback(err, result);
 *             });
 *         }
 *         ...
 *     }
 *
 *     let client = new MyLambdaClient();
 *     client.configure(ConfigParams.fromTuples(
 *         "connection.region", "us-east-1",
 *         "connection.access_id", "XXXXXXXXXXX",
 *         "connection.access_key", "XXXXXXXXXXX",
 *         "connection.arn", "YYYYYYYYYYYYY"
 *     ));
 *
 *     client.getData("123", "1", (err, result) => {
 *         ...
 *     });
 */
class LambdaClient {
    constructor() {
        /**
         * The opened flag.
         */
        this._opened = false;
        this._connectTimeout = 10000;
        /**
         * The dependencies resolver.
         */
        this._dependencyResolver = new pip_services3_commons_node_4.DependencyResolver();
        /**
         * The connection resolver.
         */
        this._connectionResolver = new AwsConnectionResolver_1.AwsConnectionResolver();
        /**
         * The logger.
         */
        this._logger = new pip_services3_components_node_1.CompositeLogger();
        /**
         * The performance counters.
         */
        this._counters = new pip_services3_components_node_2.CompositeCounters();
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        this._connectionResolver.configure(config);
        this._dependencyResolver.configure(config);
        this._connectTimeout = config.getAsIntegerWithDefault('options.connect_timeout', this._connectTimeout);
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references) {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._connectionResolver.setReferences(references);
        this._dependencyResolver.setReferences(references);
    }
    /**
     * Adds instrumentation to log calls and measure call time.
     * It returns a CounterTiming object that is used to end the time measurement.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param name              a method name.
     * @returns CounterTiming object to end the time measurement.
     */
    instrument(correlationId, name) {
        this._logger.trace(correlationId, "Executing %s method", name);
        return this._counters.beginTiming(name + ".exec_time");
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
        if (this.isOpen()) {
            if (callback)
                callback();
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
                this._lambda = new aws.Lambda();
                this._opened = true;
                this._logger.debug(correlationId, "Lambda client connected to %s", this._connection.getArn());
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
        // Todo: close listening?
        this._opened = false;
        if (callback)
            callback();
    }
    /**
     * Performs AWS Lambda Function invocation.
     *
     * @param invocationType    an invocation type: "RequestResponse" or "Event"
     * @param cmd               an action name to be called.
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param args              action arguments
     * @param callback          callback function that receives action result or error.
     */
    invoke(invocationType, cmd, correlationId, args, callback) {
        if (cmd == null) {
            let err = new pip_services3_commons_node_2.UnknownException(null, 'NO_COMMAND', 'Missing Seneca pattern cmd');
            if (callback)
                callback(err, null);
            else
                this._logger.error(correlationId, err, 'Failed to call %s', cmd);
            return;
        }
        args = _.clone(args);
        args.cmd = cmd;
        args.correlation_id = correlationId || pip_services3_commons_node_1.IdGenerator.nextShort();
        let params = {
            FunctionName: this._connection.getArn(),
            InvocationType: invocationType,
            LogType: 'None',
            Payload: JSON.stringify(args)
        };
        this._lambda.invoke(params, (err, data) => {
            if (callback == null) {
                if (err)
                    this._logger.error(correlationId, err, 'Failed to invoke lambda function');
                return;
            }
            if (err) {
                err = new pip_services3_commons_node_3.InvocationException(correlationId, 'CALL_FAILED', 'Failed to invoke lambda function').withCause(err);
                if (callback)
                    callback(err, null);
            }
            else {
                let result = data.Payload;
                if (_.isString(result)) {
                    try {
                        result = JSON.parse(result);
                    }
                    catch (err) {
                        err = new pip_services3_commons_node_3.InvocationException(correlationId, 'DESERIALIZATION_FAILED', 'Failed to deserialize result').withCause(err);
                        callback(err, null);
                    }
                }
                callback(null, result);
            }
        });
    }
    /**
     * Calls a AWS Lambda Function action.
     *
     * @param cmd               an action name to be called.
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param params            (optional) action parameters.
     * @param callback          (optional) callback function that receives result object or error.
     */
    call(cmd, correlationId, params = {}, callback) {
        this.invoke('RequestResponse', cmd, correlationId, params, callback);
    }
    /**
     * Calls a AWS Lambda Function action asynchronously without waiting for response.
     *
     * @param cmd               an action name to be called.
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param params            (optional) action parameters.
     * @param callback          (optional) callback function that receives error or null for success.
     */
    callOneWay(cmd, correlationId, params = {}, callback) {
        this.invoke('Event', cmd, correlationId, params, callback);
    }
}
exports.LambdaClient = LambdaClient;
//# sourceMappingURL=LambdaClient.js.map