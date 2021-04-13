/** @module connect */
import { ConfigParams } from 'pip-services3-commons-node';
import { ConfigException } from 'pip-services3-commons-node';
/**
 * Contains connection parameters to authenticate against Amazon Web Services (AWS)
 * and connect to specific AWS resource.
 *
 * The class is able to compose and parse AWS resource ARNs.
 *
 * ### Configuration parameters ###
 *
 * - access_id:     application access id
 * - client_id:     alternative to access_id
 * - access_key:    application secret key
 * - client_key:    alternative to access_key
 * - secret_key:    alternative to access_key
 *
 * In addition to standard parameters [[https://pip-services3-node.github.io/pip-services3-components-node/classes/auth.credentialparams.html CredentialParams]] may contain any number of custom parameters
 *
 * @see [[AwsConnectionResolver]]
 *
 * ### Example ###
 *
 *     let connection = AwsConnectionParams.fromTuples(
 *         "region", "us-east-1",
 *         "access_id", "XXXXXXXXXXXXXXX",
 *         "secret_key", "XXXXXXXXXXXXXXX",
 *         "service", "s3",
 *         "bucket", "mybucket"
 *     );
 *
 *     let region = connection.getRegion();                     // Result: "us-east-1"
 *     let accessId = connection.getAccessId();                 // Result: "XXXXXXXXXXXXXXX"
 *     let secretKey = connection.getAccessKey();               // Result: "XXXXXXXXXXXXXXX"
 *     let pin = connection.getAsNullableString("bucket");      // Result: "mybucket"
 */
export declare class AwsConnectionParams extends ConfigParams {
    /**
     * Creates an new instance of the connection parameters.
     *
     * @param values 	(optional) an object to be converted into key-value pairs to initialize this connection.
     */
    constructor(values?: any);
    /**
     * Gets the AWS partition name.
     *
     * @returns the AWS partition name.
     */
    getPartition(): string;
    /**
     * Sets the AWS partition name.
     *
     * @param value a new AWS partition name.
     */
    setPartition(value: string): void;
    /**
     * Gets the AWS service name.
     *
     * @returns the AWS service name.
     */
    getService(): string;
    /**
     * Sets the AWS service name.
     *
     * @param value a new AWS service name.
     */
    setService(value: string): void;
    /**
     * Gets the AWS region.
     *
     * @returns the AWS region.
     */
    getRegion(): string;
    /**
     * Sets the AWS region.
     *
     * @param value a new AWS region.
     */
    setRegion(value: string): void;
    /**
     * Gets the AWS account id.
     *
     * @returns the AWS account id.
     */
    getAccount(): string;
    /**
     * Sets the AWS account id.
     *
     * @param value the AWS account id.
     */
    setAccount(value: string): void;
    /**
     * Gets the AWS resource type.
     *
     * @returns the AWS resource type.
     */
    getResourceType(): string;
    /**
     * Sets the AWS resource type.
     *
     * @param value a new AWS resource type.
     */
    setResourceType(value: string): void;
    /**
     * Gets the AWS resource id.
     *
     * @returns the AWS resource id.
     */
    getResource(): string;
    /**
     * Sets the AWS resource id.
     *
     * @param value a new AWS resource id.
     */
    setResource(value: string): void;
    /**
     * Gets the AWS resource ARN.
     * If the ARN is not defined it automatically generates it from other properties.
     *
     * @returns the AWS resource ARN.
     */
    getArn(): string;
    /**
     * Sets the AWS resource ARN.
     * When it sets the value, it automatically parses the ARN
     * and sets individual parameters.
     *
     * @param value a new AWS resource ARN.
     */
    setArn(value: string): void;
    /**
     * Gets the AWS access id.
     *
     * @returns the AWS access id.
     */
    getAccessId(): string;
    /**
     * Sets the AWS access id.
     *
     * @param value the AWS access id.
     */
    setAccessId(value: string): void;
    /**
     * Gets the AWS client key.
     *
     * @returns the AWS client key.
     */
    getAccessKey(): string;
    /**
     * Sets the AWS client key.
     *
     * @param value a new AWS client key.
     */
    setAccessKey(value: string): void;
    /**
     * Creates a new AwsConnectionParams object filled with key-value pairs serialized as a string.
     *
     * @param line 		a string with serialized key-value pairs as "key1=value1;key2=value2;..."
     * 					Example: "Key1=123;Key2=ABC;Key3=2016-09-16T00:00:00.00Z"
     * @returns			a new AwsConnectionParams object.
     */
    static fromString(line: string): AwsConnectionParams;
    /**
     * Validates this connection parameters
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @returns a ConfigException or null if validation passed successfully.
     */
    validate(correlationId: string): ConfigException;
    /**
     * Retrieves AwsConnectionParams from configuration parameters.
     * The values are retrieves from "connection" and "credential" sections.
     *
     * @param config 	configuration parameters
     * @returns			the generated AwsConnectionParams object.
     *
     * @see [[mergeConfigs]]
     */
    static fromConfig(config: ConfigParams): AwsConnectionParams;
    /**
     * Retrieves AwsConnectionParams from multiple configuration parameters.
     * The values are retrieves from "connection" and "credential" sections.
     *
     * @param configs 	a list with configuration parameters
     * @returns			the generated AwsConnectionParams object.
     *
     * @see [[fromConfig]]
     */
    static mergeConfigs(...configs: ConfigParams[]): AwsConnectionParams;
}
