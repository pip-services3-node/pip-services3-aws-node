import { IReferenceable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { IOpenable } from 'pip-services3-commons-node';
import { CachedCounters, Counter } from 'pip-services3-components-node';
import { ConfigParams } from 'pip-services3-commons-node';
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
export declare class CloudWatchCounters extends CachedCounters implements IReferenceable, IOpenable {
    private _logger;
    private _connectionResolver;
    private _connection;
    private _connectTimeout;
    private _client;
    private _source;
    private _instance;
    private _opened;
    /**
     * Creates a new instance of this counters.
     */
    constructor();
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
     * @see [[https://pip-services3-node.github.io/pip-services3-commons-node/interfaces/refer.ireferences.html IReferences]] (in the Pip.Services commons package)
     */
    setReferences(references: IReferences): void;
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
    open(correlationId: string, callback: (err: any) => void): void;
    /**
     * Closes component and frees used resources.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    close(correlationId: string, callback: (err: any) => void): void;
    private getCounterData;
    /**
     * Saves the current counters measurements.
     *
     * @param counters      current counters measurements to be saves.
     */
    protected save(counters: Counter[]): void;
}
