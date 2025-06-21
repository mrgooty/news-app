import defaultParameters from '../config/aiParameters.js';

// Initialize with a deep copy of the defaults to prevent mutation of the original object.
let currentParameters = JSON.parse(JSON.stringify(defaultParameters));

/**
 * A utility function to determine if an item is a non-array object.
 * @param {*} item The item to check.
 * @returns {boolean} True if the item is an object, false otherwise.
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deeply merges two objects.
 * @param {object} target The target object to merge into.
 * @param {object} source The source object to merge from.
 * @returns {object} The merged object.
 */
function mergeDeep(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

/**
 * Retrieves the current AI parameters.
 * @returns {object} The current parameters.
 */
function getParameters() {
  return currentParameters;
}

/**
 * Updates the AI parameters by merging in new values.
 * @param {object} newParams - The new parameters to merge.
 * @returns {object} The updated parameters.
 */
function updateParameters(newParams) {
  currentParameters = mergeDeep(currentParameters, newParams);
  return currentParameters;
}

export const aiParameterService = {
  get: getParameters,
  update: updateParameters,
}; 