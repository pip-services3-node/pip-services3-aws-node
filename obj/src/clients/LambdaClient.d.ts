import { IOpenable } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { IReferenceable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { DependencyResolver } from 'pip-services3-commons-node';
import { CompositeLogger } from 'pip-services3-components-node';
import { CompositeCounters } from 'pip-services3-components-node';
import { CounterTiming } from 'pip-services3-components-node';
import { AwsConnectionParams } from '../connect/AwsConnectionParams';
import { AwsConnectionResolver } from '../connect/AwsConnectionResolver';
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
export declare abstract class LambdaClient implements IOpenable, IConfigurable, IReferenceable {
    /**
     * The reference to AWS Lambda Function.
     */
    protected _lambda: any;
    /**
     * The opened flag.
     */
    protected _opened: boolean;
    /**
     * The AWS connection parameters
     */
    protected _connection: AwsConnectionParams;
    private _connectTimeout;
    /**
     * The dependencies resolver.
     */
    protected _dependencyResolver: DependencyResolver;
    /**
     * The connection resolver.
     */
    protected _connectionResolver: AwsConnectionResolver;
    /**
     * The logger.
     */
    protected _logger: CompositeLogger;
    /**
     * The performance counters.
     */
    protected _counters: CompositeCounters;
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config: ConfigParams): void;
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references: IReferences): void;
    /**
     * Adds instrumentation to log calls and measure call time.
     * It returns a CounterTiming object that is used to end the time measurement.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param name              a method name.
     * @returns CounterTiming object to end the time measurement.
     */
    protected instrument(correlationId: string, name: string): CounterTiming;
    /**
     * Checks if the component is opened.
     *
     * @returns true if the component has been opened and false otherwise.
     */
    isOpen(): boolean;
    /**
     * Opens the component.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    open(correlationId: string, callback: (err?: any) => void): void;
    /**
     * Closes component and frees used resources.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    close(correlationId: string, callback?: (err?: any) => void): void;
    /**
     * Performs AWS Lambda Function invocation.
     *
     * @param invocationType    an invocation type: "RequestResponse" or "Event"
     * @param cmd               an action name to be called.
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param args              action arguments
     * @param callback          callback function that receives action result or error.
     */
    protected invoke(invocationType: string, cmd: string, correlationId: string, args: any, callback?: (err: any, result: any) => void): void;
    /**
     * Calls a AWS Lambda Function action.
     *
     * @param cmd               an action name to be called.
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param params            (optional) action parameters.
     * @param callback          (optional) callback function that receives result object or error.
     */
    protected call(cmd: string, correlationId: string, params?: any, callback?: (err: any, result: any) => void): void;
    /**
     * Calls a AWS Lambda Function action asynchronously without waiting for response.
     *
     * @param cmd               an action name to be called.
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param params            (optional) action parameters.
     * @param callback          (optional) callback function that receives error or null for success.
     */
    protected callOneWay(cmd: string, correlationId: string, params?: any, callback?: (err: any) => void): void;
}
