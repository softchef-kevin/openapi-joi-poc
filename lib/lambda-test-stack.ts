import * as cdk from 'aws-cdk-lib';
import * as pathLib from 'path';
import {
  Construct,
} from 'constructs';
import {
  AttributeType,
  Table,
} from 'aws-cdk-lib/aws-dynamodb';
import {
  Effect,
  Policy,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import {
  NodejsFunction,
} from "aws-cdk-lib/aws-lambda-nodejs";
import {
  RestApi,
  HttpMethod,
} from '@softchef/cdk-restapi';

export class LambdaTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoTable = new Table(this, 'lambda-test-items', {
      partitionKey: {
        name: 'itemId',
        type: AttributeType.STRING
      },
      tableName: 'lambda-test-items',

      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
    });

    const policy = new Policy(this, 'S3BucketAndDynamoDbPolicy', {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'dynamodb:*',
          ],
          resources: [
            `${dynamoTable.tableArn}/index/*`,
            `${dynamoTable.tableArn}`,
          ],
        }),
      ]
    })

    const getAllLambda = new NodejsFunction(this, 'lambda-test-getAllLambda', {
      entry: lambdaAssetPath('lambda/getall/get-all.ts'),
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: 'itemId'
      },
    });
    const getOneLambda = new NodejsFunction(this, 'getOneLambda', {
      entry: lambdaAssetPath('lambda/getone/get-one.ts'),
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: 'itemId'
      },
    });

    getAllLambda.role?.attachInlinePolicy(policy)
    getOneLambda.role?.attachInlinePolicy(policy)

    const api = new RestApi(this, 'lambda-test-api', {
      enableCors: true,
      deployOptions: { stageName: 'Prod' },
      resources: [
        {
          path: '/items',
          httpMethod: HttpMethod.GET,
          lambdaFunction: getAllLambda,
        },
        {
          path: '/items/{itemId}',
          httpMethod: HttpMethod.GET,
          lambdaFunction: getOneLambda,
        },
      ],
    });

    // Show Api Id
    new cdk.CfnOutput(this, 'lambda-test-apiId', {
      value: api.restApiId,
    });
  }
}

function lambdaAssetPath(path: string): string {
  return pathLib.resolve(__dirname, '..', path)
}