"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandableLambdaClient = void 0;
/** @module clients */
const LambdaClient_1 = require("./LambdaClient");
/**
 * Abstract client that calls commandable AWS Lambda Functions.
 *
 * Commandable services are generated automatically for [[https://pip-services3-node.github.io/pip-services3-commons-node/interfaces/commands.icommandable.html ICommandable objects]].
 * Each command is exposed as action determined by "cmd" parameter.
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
 *
 * ### Example ###
 *
 *     class MyLambdaClient extends CommandableLambdaClient implements IMyClient {
 *         ...
 *
 *         public getData(correlationId: string, id: string,
 *             callback: (err: any, result: MyData) => void): void {
 *
 *             this.callCommand(
 *                 "get_data",
 *                 correlationId,
 *                 { id: id },
 *                 (err, result) => {
 *                     callback(err, result);
 *                 }
 *             );
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
class CommandableLambdaClient extends LambdaClient_1.LambdaClient {
    /**
     * Creates a new instance of this client.
     *
     * @param name a service name.
     */
    constructor(name) {
        super();
        this._name = name;
    }
    /**
     * Calls a remote action in AWS Lambda function.
     * The name of the action is added as "cmd" parameter
     * to the action parameters.
     *
     * @param cmd               an action name
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param params            command parameters.
     * @param callback          callback function that receives result or error.
     */
    callCommand(cmd, correlationId, params, callback) {
        let timing = this.instrument(correlationId, this._name + '.' + cmd);
        this.call(cmd, correlationId, params, (err, result) => {
            timing.endTiming();
            if (callback)
                callback(err, result);
        });
    }
}
exports.CommandableLambdaClient = CommandableLambdaClient;
//# sourceMappingURL=CommandableLambdaClient.js.map