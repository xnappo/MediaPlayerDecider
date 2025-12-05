function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Box Recommendation Tool')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getBoxData() {
  // Primary source: JSON stored in boxes.html (easy to edit/read)
  try {
    var embedded = HtmlService.createHtmlOutputFromFile('boxes').getContent();
    var jsonStr = extractDataFromHtml(embedded, 'box-data');
    if (jsonStr && jsonStr.trim()) {
      var parsed = JSON.parse(jsonStr);
      return convertJsonToBoxData(parsed);
    }
  } catch (e) {
    // ignore and continue to hardcoded fallback
  }

  // Fallback to embedded defaults if boxes.html missing/empty
  return getDefaultBoxData();
}

function convertJsonToBoxData(json) {
  // Convert from {featureKeys, featureLabels, boxes} to {features, boxes: {boxName: [scores]}}
  var features = json.featureLabels || [];
  var keys = json.featureKeys || [];
  var boxes = {};
  
  for (var boxName in json.boxes) {
    var boxObj = json.boxes[boxName];
    boxes[boxName] = keys.map(function(key) {
      var val = boxObj[key];
      return (typeof val === 'number' && !isNaN(val)) ? val : 0;
    });
  }
  
  return { features: features, boxes: boxes };
}

function getDefaultBoxData() {
  // Fallback data matching current boxes
  return {
    features: [
      "Speed",
      "Full quality audio (may be PCM decode on box)",
      "Passthrough audio",
      "Modern video codec support",
      "Conversions of all formats to LLDV/DV",
      "Single box for streaming and local media",
      "Robustness",
      "OS/Software Control",
      "Vendor support",
      "Cost"
    ],
    boxes: {
      "Shield": [1, 1, 1, 10, 10, 1, 1, 1, 8, 8],
      "Fire Cube 3": [8, 4, 4, 1, 1, 1, 1, 8, 1, 5],
      "Homatics Box R 4K Plus": [5, 1, 1, 1, 1, 1, 4, 2, 8, 6],
      "Apple TV": [2, 1, 10, 1, 1, 4, 1, 10, 1, 5],
      "Onn": [5, 7, 10, 1, 1, 1, 1, 1, 3, 1],
      "Google Streamer": [5, 7, 10, 1, 1, 1, 1, 1, 3, 2],
      "Two box solutions": [3, 1, 1, 1, 1, 10, 1, 1, 1, 10]
    }
  };
}

function extractDataFromHtml(html, id) {
  if (!html) return '';
  var regex = new RegExp('<script[^>]*id=["\']' + id + '["\'][^>]*>([\\s\\S]*?)<\\/script>', 'i');
  var match = html.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  return '';
}


function calculateRecommendation(userWeights) {
  var data = getBoxData();
  var rawScores = {};
  
  // Calculate weighted score for each box
  for (var boxName in data.boxes) {
    var boxScores = data.boxes[boxName];
    var totalScore = 0;
    var criticalMissCount = 0;
    
    for (var i = 0; i < boxScores.length; i++) {
      // Importance: 1 (most important) -> weight 10, 10 (least) -> weight 1
      var weight = 11 - userWeights[i];
      // Device ratings already use 1 = best, 10 = worst
      var ratingLowIsBest = boxScores[i];
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
  var scores = Object.values(rawScores);
  var maxScore = Math.max.apply(null, scores);
  var minScore = Math.min.apply(null, scores);
  var range = maxScore - minScore;
  
  // Normalize to 1-10 scale (1 = best, 10 = worst)
  var normalizedResults = {};
  for (var boxName in rawScores) {
    if (range === 0) {
      // All boxes have the same score
      normalizedResults[boxName] = 5.5;
    } else {
      // Map: lowest raw score (best) -> 1, highest raw score (worst) -> 10
      normalizedResults[boxName] = 1 + (9 * (rawScores[boxName] - minScore) / range);
    }
  }
  
  return normalizedResults;
}
