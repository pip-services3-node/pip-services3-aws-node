/** @module clients */
/** @hidden */
let _ = require('lodash');
/** @hidden */
let async = require('async');

import { IOpenable } from 'pip-services3-commons-node';
import { IConfigurable } from 'pip-services3-commons-node';
import { IReferenceable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { IdGenerator } from 'pip-services3-commons-node';
import { UnknownException } from 'pip-services3-commons-node';
import { InvocationException } from 'pip-services3-commons-node';
import { DependencyResolver } from 'pip-services3-commons-node';
import { CompositeLogger } from 'pip-services3-components-node';
import { CompositeCounters } from 'pip-services3-components-node';
import { Timing } from 'pip-services3-components-node';

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
export abstract class LambdaClient implements IOpenable, IConfigurable, IReferenceable {
    /**
     * The reference to AWS Lambda Function.
     */
    protected _lambda: any;
    /**
     * The opened flag.
     */
    protected _opened: boolean = false;
    /**
     * The AWS connection parameters
     */
    protected _connection: AwsConnectionParams;
    private _connectTimeout: number = 10000;

    /**
     * The dependencies resolver.
     */
    protected _dependencyResolver: DependencyResolver = new DependencyResolver();
    /**
     * The connection resolver.
     */
    protected _connectionResolver: AwsConnectionResolver = new AwsConnectionResolver();
    /**
     * The logger.
     */
    protected _logger: CompositeLogger = new CompositeLogger();
    /**
     * The performance counters.
     */
    protected _counters: CompositeCounters = new CompositeCounters();

    /**
     * Configures component by passing configuration parameters.
     * 
     * @param config    configuration parameters to be set.
     */
    public configure(config: ConfigParams): void {
        this._connectionResolver.configure(config);
		this._dependencyResolver.configure(config);

        this._connectTimeout = config.getAsIntegerWithDefault('options.connect_timeout', this._connectTimeout);
    }

    /**
	 * Sets references to dependent components.
	 * 
	 * @param references 	references to locate the component dependencies. 
     */
    public setReferences(references: IReferences): void {
        this._logger.setReferences(references);
        this._counters.setReferences(references);
        this._connectionResolver.setReferences(references);
        this._dependencyResolver.setReferences(references);
    }

    /**
     * Adds instrumentation to log calls and measure call time.
     * It returns a Timing object that is used to end the time measurement.
     * 
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param name              a method name.
     * @returns Timing object to end the time measurement.
     */
    protected instrument(correlationId: string, name: string): Timing {
        this._logger.trace(correlationId, "Executing %s method", name);
        return this._counters.beginTiming(name + ".exec_time");
    }

    /**
	 * Checks if the component is opened.
	 * 
	 * @returns true if the component has been opened and false otherwise.
     */
    public isOpen(): boolean {
        return this._opened;
    }

    /**
	 * Opens the component.
	 * 
	 * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    public open(correlationId: string, callback: (err?: any) => void): void {
        if (this.isOpen()) {
            if (callback) callback();
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
    public close(correlationId: string, callback?: (err?: any) => void): void {
        // Todo: close listening?
        this._opened = false;
        if (callback) callback();
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
    protected invoke(invocationType: string, cmd: string, correlationId: string, args: any,
        callback?: (err: any, result: any) => void): void {

        if (cmd == null) {
            let err = new UnknownException(null, 'NO_COMMAND', 'Missing Seneca pattern cmd');
            if (callback) callback(err, null);
            else this._logger.error(correlationId, err, 'Failed to call %s', cmd);
            return;
        }

        args = _.clone(args);
        args.cmd = cmd;
        args.correlation_id = correlationId || IdGenerator.nextShort();

        let params = {
            FunctionName: this._connection.getArn(),
            InvocationType: invocationType,
            LogType: 'None',
            Payload: JSON.stringify(args)
        }                        
                        
        this._lambda.invoke(params, (err, data) => {
            if (callback == null) {
                if (err) this._logger.error(correlationId, err, 'Failed to invoke lambda function');
                return;
            }
            
            if (err) {
                err = new InvocationException(
                    correlationId, 
                    'CALL_FAILED', 
                    'Failed to invoke lambda function'
                ).withCause(err);

                if (callback) callback(err, null);
            } else {
                let result: any = data.Payload;
                if (_.isString(result)) {
                    try {
                        result = JSON.parse(result);
                    } catch (err) {
                        err = new InvocationException(
                            correlationId,
                            'DESERIALIZATION_FAILED',
                            'Failed to deserialize result'
                        ).withCause(err);

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
    protected call(cmd: string, correlationId: string, params: any = {},
        callback?: (err: any, result: any) => void): void {
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
    protected callOneWay(cmd: string, correlationId: string, params: any = {},
        callback?: (err: any) => void): void {
        this.invoke('Event', cmd, correlationId, params, callback);
    }

}