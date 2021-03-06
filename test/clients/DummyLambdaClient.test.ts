let process = require('process');

import { ConfigParams } from 'pip-services3-commons-node';
import { DummyClientFixture } from '../DummyClientFixture';
import { DummyLambdaClient } from './DummyLambdaClient';

let awsAccessId = process.env['AWS_ACCESS_ID'];
let awsAccessKey = process.env['AWS_ACCESS_KEY'];
let lambdaArn = process.env['LAMBDA_ARN'];

suite('DummyLambdaClient', ()=> {
    if (!awsAccessId || !awsAccessKey || !lambdaArn)
        return;
    
    let lambdaConfig = ConfigParams.fromTuples(
        'connection.protocol', 'aws',
        'connection.arn', lambdaArn,
        'credential.access_id', awsAccessId,
        'credential.access_key', awsAccessKey,
        'options.connection_timeout', 30000
    );

    let client: DummyLambdaClient;
    let fixture: DummyClientFixture;

    setup((done) => {
        client = new DummyLambdaClient();
        client.configure(lambdaConfig);

        fixture = new DummyClientFixture(client);

        client.open(null, done);
    });

    teardown((done) => {
        client.close(null, done);
    });

    test('Crud Operations', (done) => {
        fixture.testCrudOperations(done);
    });

});