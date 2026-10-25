/**
 * Face Descriptor Matching Utilities
 * Standard 128-dimensional embeddings comparison using Euclidean Distance
 */

/**
 * Calculates Euclidean distance between two 128-dimensional face descriptor vectors
 * Distance < 0.6 is typically considered a match; lower means closer/more confident
 * @param {number[]} desc1 
 * @param {number[]} desc2 
 * @returns {number} Euclidean distance
 */
function calculateEuclideanDistance(desc1, desc2) {
  if (!Array.isArray(desc1) || !Array.isArray(desc2)) {
    throw new Error('Descriptors must be arrays');
  }

  if (desc1.length !== desc2.length) {
    throw new Error(`Descriptor lengths do not match: ${desc1.length} vs ${desc2.length}`);
  }

  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Matches a probe descriptor against an enrolled descriptor
 * @param {number[]} probeDescriptor 
 * @param {number[]} enrolledDescriptor 
 * @param {number} threshold - Default 0.55
 * @returns {{isMatch: boolean, distance: number, confidence: number}}
 */
function matchFaceDescriptors(probeDescriptor, enrolledDescriptor, threshold = 0.55) {
  if (!enrolledDescriptor || !probeDescriptor) {
    return {
      isMatch: false,
      distance: 1.0,
      confidence: 0,
      reason: 'Missing descriptor vector'
    };
  }

  const distance = calculateEuclideanDistance(probeDescriptor, enrolledDescriptor);
  const isMatch = distance <= threshold;

  // Confidence score from 0% to 100%
  // Distance 0.0 -> 100%, Distance at threshold -> ~60%, Distance >= 1.0 -> 0%
  const confidence = Math.max(0, Math.min(100, Math.round((1 - (distance / (threshold * 1.5))) * 100)));

  return {
    isMatch,
    distance: Math.round(distance * 1000) / 1000,
    confidence,
    threshold
  };
}

module.exports = {
  calculateEuclideanDistance,
  matchFaceDescriptors
};
