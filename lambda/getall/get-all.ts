import {
    DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import OpenAPIBackend from 'openapi-backend';
import * as definition from '../routes.json'
import { Document } from 'openapi-backend';

// const doc = <Document>yaml.load(fs.readFileSync('../routes.yml', 'utf8'));
const api = new OpenAPIBackend({ definition: <Document>definition, quick: true });

api.register({
    getAll: async (c, event: any, context: any) => {
        try {
            const documentClient = DynamoDBDocumentClient.from(
                new DynamoDBClient({}),
            );
            const response = await documentClient.send(
                new ScanCommand({
                    TableName: process.env.TABLE_NAME,
                })
            );
            return { statusCode: 200, body: JSON.stringify(response.Items), }
        } catch (dbError) {
            console.error(dbError)
            return { statusCode: 500, body: JSON.stringify(dbError), }
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