// Test interface for Box Recommendation Tool
// Run this with: node test_rankings.js

// Sample box data (same structure as boxes.html JSON)
const boxData = {
  featureKeys: [
    'speed', 'audio_qual', 'audio_pass', 'video_codec', 'video_convert',
    'box_single', 'robust', 'os_control', 'vendor', 'cost'
  ],
  features: [
    'Speed',
    'Full quality audio (may be PCM decode on box)',
    'Passthrough audio',
    'Modern video codec support',
    'Conversions of all formats to LLDV/DV',
    'Single box for streaming and local media',
    'Robustness',
    'OS/Software Control',
    'Vendor support',
    'Cost'
  ],
  boxes: {
    'Shield': {
      speed: 1, audio_qual: 1, audio_pass: 1, video_codec: 10, video_convert: 10,
      box_single: 1, robust: 1, os_control: 1, vendor: 8, cost: 8
    },
    'Fire Cube 3': {
      speed: 8, audio_qual: 4, audio_pass: 4, video_codec: 1, video_convert: 1,
      box_single: 1, robust: 1, os_control: 8, vendor: 1, cost: 5
    },
    'Homatics Box R 4K Plus': {
      speed: 5, audio_qual: 1, audio_pass: 1, video_codec: 1, video_convert: 1,
      box_single: 1, robust: 4, os_control: 2, vendor: 8, cost: 6
    },
    'Apple TV': {
      speed: 2, audio_qual: 1, audio_pass: 10, video_codec: 1, video_convert: 1,
      box_single: 4, robust: 1, os_control: 10, vendor: 1, cost: 5
    },
    'Onn': {
      speed: 5, audio_qual: 7, audio_pass: 10, video_codec: 1, video_convert: 1,
      box_single: 1, robust: 1, os_control: 1, vendor: 3, cost: 1
    },
    'Google Streamer': {
      speed: 5, audio_qual: 7, audio_pass: 10, video_codec: 1, video_convert: 1,
      box_single: 1, robust: 1, os_control: 1, vendor: 3, cost: 2
    },
    'Two box solutions': {
      speed: 3, audio_qual: 1, audio_pass: 1, video_codec: 1, video_convert: 1,
      box_single: 10, robust: 1, os_control: 1, vendor: 1, cost: 10
    }
  }
};

// Convert JSON object format to array format for algorithm
function getBoxesAsArrays() {
  const keys = boxData.featureKeys;
  const result = {};
  for (const boxName in boxData.boxes) {
    const boxObj = boxData.boxes[boxName];
    result[boxName] = keys.map(key => boxObj[key]);
  }
  return { features: boxData.features, boxes: result };
}

// Test case: user importance ratings (1=most important, 10=least important)
const testCases = [
  {
    name: "Test 1: All features equally important (5)",
    userWeights: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
  },
  {
    name: "Test 2: Speed most important, cost least important",
    userWeights: [1, 5, 5, 5, 5, 5, 5, 5, 5, 10]
  },
  {
    name: "Test 3: Audio quality critical (passthrough=1, full audio=1)",
    userWeights: [5, 1, 1, 5, 5, 5, 5, 5, 5, 5]
  },
  {
    name: "Test 4: Video features critical (codec support=1, LLDV conversion=1)",
    userWeights: [5, 5, 5, 1, 1, 5, 5, 5, 5, 5]
  },
  {
    name: "Test 5: All features most important",
    userWeights: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: "Test 6: Only cost matters (cost=1, everything else=10)",
    userWeights: [10, 10, 10, 10, 10, 10, 10, 10, 10, 1]
  }
];

// Algorithm (matches Code.gs)
function calculateRecommendation(userWeights) {
  const data = getBoxesAsArrays();
  const rawScores = {};
  
  // Calculate weighted score for each box
  for (const boxName in data.boxes) {
    const boxScores = data.boxes[boxName];
    let totalScore = 0;
    let criticalMissCount = 0;
    
    for (let i = 0; i < boxScores.length; i++) {
      // Importance: 1 (most important) -> weight 10, 10 (least) -> weight 1
      const weight = 11 - userWeights[i];
      // Device ratings already use 1=best, 10=worst in data
      const ratingLowIsBest = boxScores[i];
      totalScore += ratingLowIsBest * weight;
      
      // Penalize for critical features missing: user marks as 1 (most important) but box doesn't have it (10)
      if (userWeights[i] === 1 && ratingLowIsBest === 10) {
        criticalMissCount++;
      }
    }
    
    // Add penalty for each critical missing feature (big penalty per miss to affect ranking)
    totalScore += criticalMissCount * 50;
    
    rawScores[boxName] = totalScore;
  }
  
  // Find min and max scores for normalization
  const scores = Object.values(rawScores);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range = maxScore - minScore;
  
  // Normalize to 1-10 scale (1 = best, 10 = worst)
  const normalizedResults = {};
  for (const boxName in rawScores) {
    if (range === 0) {
      normalizedResults[boxName] = 5.5;
    } else {
      // Map: lowest raw score (best) -> 1, highest raw score (worst) -> 10
      normalizedResults[boxName] = 1 + (9 * (rawScores[boxName] - minScore) / range);
    }
  }
  
  return { raw: rawScores, normalized: normalizedResults };
}

// Calculate star ratings (no deduction needed, penalty already in score)
function calculateStars(boxName, normalizedScore) {
  // Convert score to match quality percentage (1 = 100%, 10 = 0%)
  const matchQuality = Math.max(0, Math.min(100, ((11 - normalizedScore) / 9) * 100));
  
  // Convert to 5-star rating (0-100% maps to 0-5 stars)
  const stars = Math.round(matchQuality / 20);
  
  return stars;
}

// Run tests
console.log("=".repeat(80));
console.log("BOX RECOMMENDATION TOOL - TEST SUITE");
console.log("=".repeat(80));
console.log("\nDevice Ratings (1=best, 10=worst):");
console.log(JSON.stringify(boxData.boxes, null, 2));
console.log("\n");

testCases.forEach(testCase => {
  console.log("\n" + "=".repeat(80));
  console.log(testCase.name);
  console.log("=".repeat(80));
  console.log("\nUser Importance Ratings (1=most important, 10=least):");
  boxData.features.forEach((feature, i) => {
    console.log(`  ${feature}: ${testCase.userWeights[i]}`);
  });
  
  const results = calculateRecommendation(testCase.userWeights);
  
  console.log("\nRaw Scores (lower is better):");
  Object.entries(results.raw)
    .sort((a, b) => a[1] - b[1])
    .forEach(([box, score]) => {
      console.log(`  ${box}: ${score}`);
    });
  
  console.log("\nNormalized Scores (1=best, 10=worst):");
  const sorted = Object.entries(results.normalized)
    .sort((a, b) => a[1] - b[1]);
  
  sorted.forEach(([box, score]) => {
    const stars = calculateStars(box, score);
    const starDisplay = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    console.log(`  ${box}: ${score.toFixed(2)} ${starDisplay}`);
  });
  
  console.log(`\n🏆 Winner: ${sorted[0][0]}`);
});

console.log("\n" + "=".repeat(80));
