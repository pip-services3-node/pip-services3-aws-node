"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module connect */
/** @hidden */
let _ = require('lodash');
/** @hidden */
let async = require('async');
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_components_node_2 = require("pip-services3-components-node");
const AwsConnectionParams_1 = require("./AwsConnectionParams");
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
class AwsConnectionResolver {
    constructor() {
        /**
         * The connection resolver.
         */
        this._connectionResolver = new pip_services3_components_node_1.ConnectionResolver();
        /**
         * The credential resolver.
         */
        this._credentialResolver = new pip_services3_components_node_2.CredentialResolver();
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        this._connectionResolver.configure(config);
        this._credentialResolver.configure(config);
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references) {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }
    /**
     * Resolves connection and credental parameters and generates a single
     * AWSConnectionParams value.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives AWSConnectionParams value or error.
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]] (in the Pip.Services components package)
     */
    resolve(correlationId, callback) {
        let connection = new AwsConnectionParams_1.AwsConnectionParams();
        let credential = null;
        async.series([
            (callback) => {
                this._connectionResolver.resolve(correlationId, (err, data) => {
                    if (err == null && data != null)
                        connection.append(data);
                    callback(err);
                });
            },
            (callback) => {
                this._credentialResolver.lookup(correlationId, (err, data) => {
                    if (err == null && data != null)
                        connection.append(data);
                    callback(err);
                });
            },
            (callback) => {
                // Force ARN parsing
                connection.setArn(connection.getArn());
                // Perform validation
                let err = connection.validate(correlationId);
                callback(err);
            }
        ], (err) => {
            connection = err == null ? connection : null;
            callback(err, connection);
        });
    }
}
exports.AwsConnectionResolver = AwsConnectionResolver;
//# sourceMappingURL=AwsConnectionResolver.js.map