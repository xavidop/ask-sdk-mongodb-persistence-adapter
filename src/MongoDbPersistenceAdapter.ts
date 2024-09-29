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
/* eslint-disable  @typescript-eslint/no-explicit-any */

import {
    createAskSdkError,
    PersistenceAdapter,
} from 'ask-sdk-core';
import { RequestEnvelope } from 'ask-sdk-model';
import { Db, DeleteResult, MongoClient, UpdateResult, Document } from 'mongodb';
import {
    PartitionKeyGenerator,
    PartitionKeyGenerators
} from './PartitionKeyGenerators';

/**
 * Implementation of PersistenceAdapter using MongoDB.
 */
export class MongoDBPersistenceAdapter implements PersistenceAdapter {
    protected collectionName: string;
    protected databaseName: string | undefined;
    protected mongoURI: string | undefined;
    protected mongoDBClient: MongoClient | undefined;
    protected partitionKeyGenerator: PartitionKeyGenerator;
    protected mongoDB: Db | undefined;

    constructor(config: {
        collectionName: string,
        databaseName?: string,
        mongoURI?: string,
        mongoDBClient?: MongoClient,
        partitionKeyGenerator?: PartitionKeyGenerator;
    }) {
        this.collectionName = config.collectionName;
        this.databaseName = config.databaseName;
        this.mongoURI = config.mongoURI;
        this.mongoDBClient = config.mongoDBClient;
        this.partitionKeyGenerator = config.partitionKeyGenerator ? config.partitionKeyGenerator : PartitionKeyGenerators.personId;

    }

    private async getMongoDBClient() {
        if (!this.mongoDBClient){
            this.mongoDBClient = await MongoClient.connect(this.mongoURI!);
        } else {
            if (!this.mongoDB) {
                await this.mongoDBClient.connect();
            }
        }

        this.mongoDB = this.databaseName ? this.mongoDBClient.db(this.databaseName) : this.mongoDBClient.db(this.collectionName);
    }

    /**
     * Retrieves persistence attributes from MongoDB.
     * @param {RequestEnvelope} requestEnvelope Request envelope used to generate partition key.
     * @returns {Promise<Object.<string, any>>}
     */
    public async getAttributes(requestEnvelope: RequestEnvelope): Promise<Record<string, any>> {
        const attributesId = this.partitionKeyGenerator(requestEnvelope);
        await this.getMongoDBClient();

        const data = await this.mongoDB!.collection(this.collectionName).findOne<{ attributes: Record<string, any> }>({ id: attributesId });

        if (!data) {
            return {};
        } else {
            return data.attributes;
        }

    }

    /**
     * Saves persistence attributes to MongoDB.
     * @param {RequestEnvelope} requestEnvelope Request envelope used to generate partition key.
     * @param {Object.<string, any>} attributes Attributes to be saved to MongoDB.
     * @return {Promise<void>}
     */
    public async saveAttributes(requestEnvelope: RequestEnvelope, attributes: Record<string, any>): Promise<void> {
        const attributesId = this.partitionKeyGenerator(requestEnvelope);
        await this.getMongoDBClient();

        const saved = await this.mongoDB!.collection(this.collectionName).updateOne({ id: attributesId }, { $set: { id: attributesId, attributes } }, { upsert: true });

        this.checkResult(saved, attributesId);
    }

    /**
     * Delete persistence attributes from MongoDB.
     * @param {RequestEnvelope} requestEnvelope Request envelope used to generate partition key.
     * @return {Promise<void>}
     */
    public async deleteAttributes(requestEnvelope: RequestEnvelope): Promise<void> {
        const attributesId = this.partitionKeyGenerator(requestEnvelope);
        await this.getMongoDBClient();

        const deleted = await this.mongoDB!.collection(this.collectionName).deleteOne({ id: attributesId });

        this.checkResult(deleted, attributesId);
    }

    private checkResult(data: UpdateResult<Document> | DeleteResult, attributesId: string) {
        if (!data.acknowledged) {
            throw createAskSdkError(this.constructor.name, `Could not delete item (${attributesId}) to table (${this.collectionName})`);
        }
    }
}
