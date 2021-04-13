"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaFunction = void 0;
/** @module container */
/** @hidden */
let _ = require('lodash');
/** @hidden */
let process = require('process');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const pip_services3_commons_node_3 = require("pip-services3-commons-node");
const pip_services3_commons_node_4 = require("pip-services3-commons-node");
const pip_services3_container_node_1 = require("pip-services3-container-node");
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_components_node_2 = require("pip-services3-components-node");
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
class LambdaFunction extends pip_services3_container_node_1.Container {
    /**
     * Creates a new instance of this lambda function.
     *
     * @param name          (optional) a container name (accessible via ContextInfo)
     * @param description   (optional) a container description (accessible via ContextInfo)
     */
    constructor(name, description) {
        super(name, description);
        /**
         * The performanc counters.
         */
        this._counters = new pip_services3_components_node_2.CompositeCounters();
        /**
         * The dependency resolver.
         */
        this._dependencyResolver = new pip_services3_commons_node_2.DependencyResolver();
        /**
         * The map of registred validation schemas.
         */
        this._schemas = {};
        /**
         * The map of registered actions.
         */
        this._actions = {};
        /**
         * The default path to config file.
         */
        this._configPath = './config/config.yml';
        this._logger = new pip_services3_components_node_1.ConsoleLogger();
    }
    getConfigPath() {
        return process.env.CONFIG_PATH || this._configPath;
    }
    getParameters() {
        let parameters = pip_services3_commons_node_1.ConfigParams.fromValue(process.env);
        return parameters;
    }
    captureErrors(correlationId) {
        // Log uncaught exceptions
        process.on('uncaughtException', (ex) => {
            this._logger.fatal(correlationId, ex, "Process is terminated");
            process.exit(1);
        });
    }
    captureExit(correlationId) {
        this._logger.info(correlationId, "Press Control-C to stop the microservice...");
        // Activate graceful exit
        process.on('SIGINT', () => {
            process.exit();
        });
        // Gracefully shutdown
        process.on('exit', () => {
            this.close(correlationId);
            this._logger.info(correlationId, "Goodbye!");
        });
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references) {
        super.setReferences(references);
        this._counters.setReferences(references);
        this._dependencyResolver.setReferences(references);
        this.register();
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
     * Runs this lambda function, loads container configuration,
     * instantiate components and manage their lifecycle,
     * makes this function ready to access action calls.
     *
     * @param callback callback function that receives error or null for success.
     */
    run(callback) {
        let correlationId = this._info.name;
        let path = this.getConfigPath();
        let parameters = this.getParameters();
        this.readConfigFromFile(correlationId, path, parameters);
        this.captureErrors(correlationId);
        this.captureExit(correlationId);
        this.open(correlationId, callback);
    }
    /**
     * Registers an action in this lambda function.
     *
     * @param cmd           a action/command name.
     * @param schema        a validation schema to validate received parameters.
     * @param action        an action function that is called when action is invoked.
     */
    registerAction(cmd, schema, action) {
        if (cmd == '')
            throw new pip_services3_commons_node_3.UnknownException(null, 'NO_COMMAND', 'Missing command');
        if (action == null)
            throw new pip_services3_commons_node_3.UnknownException(null, 'NO_ACTION', 'Missing action');
        if (!_.isFunction(action))
            throw new pip_services3_commons_node_3.UnknownException(null, 'ACTION_NOT_FUNCTION', 'Action is not a function');
        // Hack!!! Wrapping action to preserve prototyping context
        let actionCurl = (params, callback) => {
            // Perform validation
            if (schema != null) {
                let correlationId = params.correlaton_id;
                let err = schema.validateAndReturnException(correlationId, params, false);
                if (err != null) {
                    callback(err, null);
                    return;
                }
            }
            // Todo: perform verification?
            action.call(this, params, callback);
        };
        this._actions[cmd] = actionCurl;
    }
    execute(event, context) {
        let cmd = event.cmd;
        let correlationId = event.correlation_id;
        if (cmd == null) {
            let err = new pip_services3_commons_node_4.BadRequestException(correlationId, 'NO_COMMAND', 'Cmd parameter is missing');
            context.done(err, null);
            return;
        }
        let action = this._actions[cmd];
        if (action == null) {
            let err = new pip_services3_commons_node_4.BadRequestException(correlationId, 'NO_ACTION', 'Action ' + cmd + ' was not found')
                .withDetails('command', cmd);
            context.done(err, null);
            return;
        }
        action(event, context.done);
    }
    handler(event, context) {
        // If already started then execute
        if (this.isOpen()) {
            this.execute(event, context);
        }
        // Start before execute
        else {
            this.run((err) => {
                if (err)
                    context.done(err, null);
                else
                    this.execute(event, context);
            });
        }
    }
    /**
     * Gets entry point into this lambda function.
     *
     * @param event     an incoming event object with invocation parameters.
     * @param context   a context object with local references.
     */
    getHandler() {
        let self = this;
        // Return plugin function
        return function (event, context) {
            // Calling run with changed context
            return self.handler.call(self, event, context);
        };
    }
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
    act(params, callback) {
        let context = {
            done: callback
        };
        this.getHandler()(params, context);
    }
}
exports.LambdaFunction = LambdaFunction;
//# sourceMappingURL=LambdaFunction.js.map