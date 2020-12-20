/*
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */
import { expect } from 'chai';
import { MongoDBPersistenceAdapter } from '../../../lib/attributes/persistence/MongoDbPersistenceAdapter';
import { JsonProvider } from '../../mocks/JsonProvider';

describe('MongoDBPersistenceAdapter', () => {

    const options = {
        collectionName: 'alexa',
        mongoURI: process.env.MONGO_URL
    };

    const item = {
        test: 'test'
    };

    const requestEnvelope = JsonProvider.requestEnvelope();
    requestEnvelope.context.System.device.deviceId = 'deviceId';
    requestEnvelope.context.System.user.userId = 'userId';

    it('should be able to get an item from table', async (done) => {

        const adapter = new MongoDBPersistenceAdapter(options);

        const result = await adapter.getAttributes(requestEnvelope);

        expect(result).deep.equal({});
        done();
    });

    it('should be able to put an item to table', async (done) => {
        const adapter = new MongoDBPersistenceAdapter(options);

        await adapter.saveAttributes(requestEnvelope, item);

        const result = await adapter.getAttributes(requestEnvelope);

        expect(result).deep.equal(item);
        done();
    });

    it('should be able to delete an item from table', async (done) => {
        const adapter = new MongoDBPersistenceAdapter(options);

        await adapter.deleteAttributes(requestEnvelope);
        const result = await adapter.getAttributes(requestEnvelope);

        expect(result).deep.equal({});
        done();
    });

    it('should return an empty object when getting item that does not exist in table', async (done) => {
        const adapter = new MongoDBPersistenceAdapter(options);

        const mockRequestEnvelope = JsonProvider.requestEnvelope();
        mockRequestEnvelope.context.System.user.userId = 'NonExistentKey';

        const result = await adapter.getAttributes(mockRequestEnvelope);
        expect(result).deep.equal({});
        done();
    });
});
