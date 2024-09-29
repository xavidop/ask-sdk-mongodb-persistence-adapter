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

import { createAskSdkError } from "ask-sdk-core";
import { Device, interfaces, RequestEnvelope, User } from "ask-sdk-model";

/**
 * Type definition of function used by {@link MongoDBPersistenceAdapter} to extract attributes id.
 * @typeParam { RequestEnvelope } requestEnvelope - Request envelope object.
 */
export type PartitionKeyGenerator = (
  requestEnvelope: RequestEnvelope,
) => string;

/**
 * Object containing implementations of {@link PartitionKeyGenerator}.
 */
export const PartitionKeyGenerators = {
  checkSystemExists(requestEnvelope: RequestEnvelope): boolean {
    if (
      requestEnvelope &&
      requestEnvelope.context &&
      requestEnvelope.context.System
    ) {
      return true;
    } else {
      return false;
    }
  },
  getSystem(requestEnvelope: RequestEnvelope): interfaces.system.SystemState {
    return requestEnvelope.context.System;
  },
  getSystemUser(requestEnvelope: RequestEnvelope): User {
    return PartitionKeyGenerators.getSystem(requestEnvelope).user;
  },
  getSystemDevice(requestEnvelope: RequestEnvelope): Device | undefined {
    return PartitionKeyGenerators.getSystem(requestEnvelope).device;
  },
  throwException(partitionUsed: string): void {
    throw createAskSdkError(
      "PartitionKeyGenerators",
      `Cannot retrieve ${partitionUsed} from request envelope!`,
    );
  },

  /**
   * Gets attributes id using user id.
   * @param {RequestEnvelope} requestEnvelope
   * @returns {string}
   */
  userId(requestEnvelope: RequestEnvelope): string {
    if (
      !(
        PartitionKeyGenerators.checkSystemExists(requestEnvelope) &&
        PartitionKeyGenerators.getSystemUser(requestEnvelope) &&
        PartitionKeyGenerators.getSystemUser(requestEnvelope).userId
      )
    ) {
      PartitionKeyGenerators.throwException("user id");
    }

    return PartitionKeyGenerators.getSystemUser(requestEnvelope).userId;
  },

  /**
   * Gets attributes id using device id.
   * @param {RequestEnvelope} requestEnvelope
   * @returns {string}
   */
  deviceId(requestEnvelope: RequestEnvelope): string {
    if (
      !(
        PartitionKeyGenerators.checkSystemExists(requestEnvelope) &&
        PartitionKeyGenerators.getSystemDevice(requestEnvelope) &&
        PartitionKeyGenerators.getSystemDevice(requestEnvelope)?.deviceId
      )
    ) {
      PartitionKeyGenerators.throwException("device id");
    }

    return PartitionKeyGenerators.getSystemDevice(requestEnvelope)!.deviceId;
  },

  /**
   * Gets attributes id using person id.
   * Fallback to fetching attributes id using user id, if personId is not present.
   * @param {RequestEnvelope} requestEnvelope
   * @returns {string}
   */
  personId(requestEnvelope: RequestEnvelope): string {
    if (
      PartitionKeyGenerators.checkSystemExists(requestEnvelope) &&
      requestEnvelope.context.System.person &&
      requestEnvelope.context.System.person.personId
    ) {
      return requestEnvelope.context.System.person.personId;
    }

    return PartitionKeyGenerators.userId(requestEnvelope);
  },
};
