// @ts-nocheck
import { validate as uuidValidate, version as uuidVersion } from "uuid";

/**
 *
 * Validates UUID format and optionally it's version
 *
 * @param {string} uuid
 * @param {number | null} expectedVersion if null we don't validate version
 *
 */
export default function (uuid, expectedVersion = null) {
  const isGoodUUID = uuidValidate(uuid);
  if (!expectedVersion) {
    return isGoodUUID;
  }

  const expVerInt = parseInt(expectedVersion);
  return expVerInt && isGoodUUID && uuidVersion(uuid) === expVerInt;
}
