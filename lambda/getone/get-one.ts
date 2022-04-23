import {
    DynamoDBClient,
  } from '@aws-sdk/client-dynamodb';
  import {
    DynamoDBDocumentClient,
    GetCommand,
  } from '@aws-sdk/lib-dynamodb';
import OpenAPIBackend from 'openapi-backend';
import * as definition from '../routes.json'
import { Document } from 'openapi-backend';

// const doc = <Document>yaml.load(fs.readFileSync('../routes.yml', 'utf8'));
const api = new OpenAPIBackend({ definition: <Document>definition, quick: true });

api.register({
    getOne: async (c, event: any, context: any) => {
        const documentClient = DynamoDBDocumentClient.from(
            new DynamoDBClient({}),
        );
      
        try {
          const response = await documentClient.send(
              new GetCommand({
                TableName: process.env.TABLE_NAME,
                Key: {
                  [process.env.PRIMARY_KEY!]: event.pathParameters.requestedItemId
                }
              })
          );
          return { statusCode: 200, body: JSON.stringify(response.Item) };
        } catch (dbError) {
          return { statusCode: 500, body: JSON.stringify(dbError) };
        }
    },
    notFound: async (c, event: any, context: any) => ({
        statusCode: 404,
        body: JSON.stringify({ error: 'not found' }),
      }),
    validationFail: async (c, event: any, context: any) => ({
        statusCode: 400,
        body: JSON.stringify({ error: c.validation.errors }),
    }),
});

api.init();

export const handler = async (event: any, context: any) : Promise<any> => {
    return await api.handleRequest(
        {
          method: event.httpMethod,
          path: event.path,
          query: event.queryStringParameters,
          body: event.body,
          headers: event.headers,
        },
        event,
        context,
      );
};