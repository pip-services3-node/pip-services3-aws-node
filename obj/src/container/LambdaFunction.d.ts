import { IReferences } from 'pip-services3-commons-node';
import { DependencyResolver } from 'pip-services3-commons-node';
import { Schema } from 'pip-services3-commons-node';
import { Container } from 'pip-services3-container-node';
import { CounterTiming } from 'pip-services3-components-node';
import { CompositeCounters } from 'pip-services3-components-node';
/**
 * Abstract AWS Lambda function, that acts as a container to instantiate and run components
 * and expose them via external entry point.
 *
 * When handling calls "cmd" parameter determines which what action shall be called, while
 * other parameters are passed to the action itself.
 *
 * Container configuration for this Lambda function is stored in <code>"./config/config.yml"</code> file.
 * But this path can be overriden by <code>CONFIG_PATH</code> environment variable.
 *
 * ### Configuration parameters ###
 *
 * - dependencies:
 *     - controller:                  override for Controller dependency
 * - connections:
 *     - discovery_key:               (optional) a key to retrieve the connection from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]]
 *     - region:                      (optional) AWS region
 * - credentials:
 *     - store_key:                   (optional) a key to retrieve the credentials from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/auth.icredentialstore.html ICredentialStore]]
 *     - access_id:                   AWS access/client id
 *     - access_key:                  AWS access/client id
 *
 * ### References ###
 *
 * - <code>\*:logger:\*:\*:1.0</code>            (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/log.ilogger.html ILogger]] components to pass log messages
 * - <code>\*:counters:\*:\*:1.0</code>          (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/count.icounters.html ICounters]] components to pass collected measurements
 * - <code>\*:discovery:\*:\*:1.0</code>         (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]] services to resolve connection
 * - <code>\*:credential-store:\*:\*:1.0</code>  (optional) Credential stores to resolve credentials
 *
 * @see [[LambdaClient]]
 *
 * ### Example ###
 *
 *     class MyLambdaFunction extends LambdaFunction {
 *         private _controller: IMyController;
 *         ...
 *         public constructor() {
 *             base("mygroup", "MyGroup lambda function");
 *             this._dependencyResolver.put(
 *                 "controller",
 *                 new Descriptor("mygroup","controller","*","*","1.0")
 *             );
 *         }
 *
 *         public setReferences(references: IReferences): void {
 *             base.setReferences(references);
 *             this._controller = this._dependencyResolver.getRequired<IMyController>("controller");
 *         }
 *
 *         public register(): void {
 *             registerAction("get_mydata", null, (params, callback) => {
 *                 let correlationId = params.correlation_id;
 *                 let id = params.id;
 *                 this._controller.getMyData(correlationId, id, callback);
 *             });
 *             ...
 *         }
 *     }
 *
 *     let lambda = new MyLambdaFunction();
 *
 *     service.run((err) => {
 *         console.log("MyLambdaFunction is started");
 *     });
 */
export declare abstract class LambdaFunction extends Container {
    /**
     * The performanc counters.
     */
    protected _counters: CompositeCounters;
    /**
     * The dependency resolver.
     */
    protected _dependencyResolver: DependencyResolver;
    /**
     * The map of registred validation schemas.
     */
    protected _schemas: {
        [id: string]: Schema;
    };
    /**
     * The map of registered actions.
     */
    protected _actions: {
        [id: string]: any;
    };
    /**
     * The default path to config file.
     */
    protected _configPath: string;
    /**
     * Creates a new instance of this lambda function.
     *
     * @param name          (optional) a container name (accessible via ContextInfo)
     * @param description   (optional) a container description (accessible via ContextInfo)
     */
    constructor(name?: string, description?: string);
    private getConfigPath;
    private getParameters;
    private captureErrors;
    private captureExit;
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
     * Runs this lambda function, loads container configuration,
     * instantiate components and manage their lifecycle,
     * makes this function ready to access action calls.
     *
     * @param callback callback function that receives error or null for success.
     */
    run(callback?: (err: any) => void): void;
    /**
     * Registers all actions in this lambda function.
     *
     * This method is called by the service and must be overriden
     * in child classes.
     */
    protected abstract register(): void;
    /**
     * Registers an action in this lambda function.
     *
     * @param cmd           a action/command name.
     * @param schema        a validation schema to validate received parameters.
     * @param action        an action function that is called when action is invoked.
     */
    protected registerAction(cmd: string, schema: Schema, action: (params: any, callback: (err: any, result: any) => void) => void): void;
    private execute;
    private handler;
    /**
     * Gets entry point into this lambda function.
     *
     * @param event     an incoming event object with invocation parameters.
     * @param context   a context object with local references.
     */
    getHandler(): (event: any, context: any) => void;
    /**
     * Calls registered action in this lambda function.
     * "cmd" parameter in the action parameters determin
     * what action shall be called.
     *
     * This method shall only be used in testing.
     *
     * @param params action parameters.
     * @param callback callback function that receives action result or error.
     */
    act(params: any, callback: (err: any, result: any) => void): void;
}
