import { IConfigurable } from 'pip-services3-commons-node';
import { IReferenceable } from 'pip-services3-commons-node';
import { IReferences } from 'pip-services3-commons-node';
import { ConfigParams } from 'pip-services3-commons-node';
import { ConnectionResolver } from 'pip-services3-components-node';
import { CredentialResolver } from 'pip-services3-components-node';
import { AwsConnectionParams } from './AwsConnectionParams';
/**
 * Helper class to retrieve AWS connection and credential parameters,
 * validate them and compose a [[AwsConnectionParams]] value.
 *
 * ### Configuration parameters ###
 *
 * - connections:
 *     - discovery_key:               (optional) a key to retrieve the connection from [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]]
 *     - region:                      (optional) AWS region
 *     - partition:                   (optional) AWS partition
 *     - service:                     (optional) AWS service
 *     - resource_type:               (optional) AWS resource type
 *     - resource:                    (optional) AWS resource id
 *     - arn:                         (optional) AWS resource ARN
 * - credentials:
 *     - store_key:                   (optional) a key to retrieve the credentials from [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/auth.icredentialstore.html ICredentialStore]]
 *     - access_id:                   AWS access/client id
 *     - access_key:                  AWS access/client id
 *
 * ### References ###
 *
 * - <code>\*:discovery:\*:\*:1.0</code>         (optional) [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]] services to resolve connections
 * - <code>\*:credential-store:\*:\*:1.0</code>  (optional) Credential stores to resolve credentials
 *
 * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/classes/connect.connectionparams.html ConnectionParams]] (in the Pip.Services components package)
 * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]] (in the Pip.Services components package)
 *
 * ### Example ###
 *
 *     let config = ConfigParams.fromTuples(
 *         "connection.region", "us-east1",
 *         "connection.service", "s3",
 *         "connection.bucket", "mybucket",
 *         "credential.access_id", "XXXXXXXXXX",
 *         "credential.access_key", "XXXXXXXXXX"
 *     );
 *
 *     let connectionResolver = new AwsConnectionResolver();
 *     connectionResolver.configure(config);
 *     connectionResolver.setReferences(references);
 *
 *     connectionResolver.resolve("123", (err, connection) => {
 *         // Now use connection...
 *     });
 */
export declare class AwsConnectionResolver implements IConfigurable, IReferenceable {
    /**
     * The connection resolver.
     */
    protected _connectionResolver: ConnectionResolver;
    /**
     * The credential resolver.
     */
    protected _credentialResolver: CredentialResolver;
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
     * Resolves connection and credental parameters and generates a single
     * AWSConnectionParams value.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives AWSConnectionParams value or error.
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]] (in the Pip.Services components package)
     */
    resolve(correlationId: string, callback: (err: any, connection: AwsConnectionParams) => void): void;
}
