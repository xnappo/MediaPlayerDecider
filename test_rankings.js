// Test interface for Box Recommendation Tool
// Run this with: node test_rankings.js

// Sample box data (same structure as boxes.html)
const boxData = {
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
    'Shield': [1, 1, 1, 10, 10, 1, 1, 1, 8, 8],
    'Fire Cube 3': [8, 4, 4, 1, 1, 1, 1, 8, 1, 5],
    'Homatics Box R': [5, 1, 1, 1, 1, 1, 4, 2, 8, 6],
    'Apple TV': [2, 1, 7, 1, 1, 4, 1, 10, 1, 5],
    'Onn': [5, 7, 10, 1, 1, 1, 1, 1, 3, 1],
    'Google Streamer': [5, 7, 10, 1, 1, 1, 1, 1, 3, 2],
    'Two box solutions': [3, 1, 1, 1, 1, 10, 1, 1, 1, 10]
  }
};

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
  const rawScores = {};
  
  // Calculate weighted score for each box
  for (const boxName in boxData.boxes) {
    const boxScores = boxData.boxes[boxName];
    let totalScore = 0;
    
    for (let i = 0; i < boxScores.length; i++) {
      // Importance: 1 (most important) -> weight 10, 10 (least) -> weight 1
      const weight = 11 - userWeights[i];
      // Device ratings already use 1=best, 10=worst in data
      const ratingLowIsBest = boxScores[i];
      totalScore += ratingLowIsBest * weight;
    }
    
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

// Calculate star ratings with deduction logic
function calculateStars(boxName, normalizedScore, userWeights) {
  // Convert score to match quality percentage (1 = 100%, 10 = 0%)
  const matchQuality = Math.max(0, Math.min(100, ((11 - normalizedScore) / 9) * 100));
  
  // Convert to 5-star rating (0-100% maps to 0-5 stars)
  let stars = Math.round(matchQuality / 20);
  
  // Deduct one star if user marked any feature as most important (1) and the box doesn't have it (10)
  for (let i = 0; i < boxData.features.length; i++) {
    const userImportance = userWeights[i];
    const boxRating = boxData.boxes[boxName][i];
    if (userImportance === 1 && boxRating === 10) {
      stars = Math.max(0, stars - 1);
      break; // Only deduct once per box
    }
  }
  
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
    const stars = calculateStars(box, score, testCase.userWeights);
    const starDisplay = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    console.log(`  ${box}: ${score.toFixed(2)} ${starDisplay}`);
  });
  
  console.log(`\n🏆 Winner: ${sorted[0][0]}`);
});

console.log("\n" + "=".repeat(80));
