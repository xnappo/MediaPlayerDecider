function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Box Recommendation Tool')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getBoxData() {
  // Get spreadsheet - this should be the ID of your Google Sheet
  // Format: First row = feature names, first column = box names, rest = ratings
  var spreadsheetId = '1gbjglMTevhggevV5L9BOijBAe939sFz6P-v4-QKmGAQ';
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('BoxData');
  
  if (!sheet) {
    // Return default data if sheet doesn't exist
    return getDefaultBoxData();
  }
  
  var data = sheet.getDataRange().getValues();
  
  // First row contains feature names (skip first cell which is empty or "Box")
  var features = data[0].slice(1);
  
  // Build boxes object from remaining rows
  var boxes = {};
  for (var i = 1; i < data.length; i++) {
    var boxName = data[i][0];
    var ratings = data[i].slice(1);
    
    // Convert ratings to numbers and filter out empty cells
    ratings = ratings.map(function(val) {
      return val ? parseInt(val) || 0 : 0;
    });
    
    if (boxName) {
      boxes[boxName] = ratings;
    }
  }
  
  return {
    features: features,
    boxes: boxes
  };
}

function getDefaultBoxData() {
  // Default data fallback if sheet is not found
  return {
    features: [
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
      'Shield': [10, 10, 1, 1, 10, 10, 10, 3, 3],
      'Fire Cube 3': [7, 7, 10, 10, 10, 10, 3, 10, 6],
      'Homatics Box R': [10, 10, 10, 10, 10, 7, 9, 3, 5],
      'Apple TV': [10, 4, 10, 10, 7, 10, 1, 10, 6],
      'Two box solution': [10, 10, 10, 10, 1, 10, 10, 10, 1]
    }
  };
}

function calculateRecommendation(userWeights) {
  var data = getBoxData();
  var rawScores = {};
  
  // Calculate weighted score for each box
  for (var boxName in data.boxes) {
    var boxScores = data.boxes[boxName];
    var totalScore = 0;
    
    for (var i = 0; i < boxScores.length; i++) {
      // Lower importance value (1) means higher weight
      // Weight: 11 - userWeight gives us 10 for importance 1, down to 1 for importance 10
      var weight = 11 - userWeights[i];
      // Box ratings: 10 is best, 1 is worst - multiply directly (higher is better)
      totalScore += boxScores[i] * weight;
    }
    
    rawScores[boxName] = totalScore;
  }
  
  // Find min and max scores for normalization
  var scores = Object.values(rawScores);
  var maxScore = Math.max.apply(null, scores);
  var minScore = Math.min.apply(null, scores);
  var range = maxScore - minScore;
  
  // Normalize to 1-10 scale (1 = best, 10 = worst)
  // Higher raw score is better, so maxScore should map to 1
  var normalizedResults = {};
  for (var boxName in rawScores) {
    if (range === 0) {
      // All boxes have the same score
      normalizedResults[boxName] = 5.5;
    } else {
      // Map: highest raw score (best) -> 1, lowest raw score (worst) -> 10
      normalizedResults[boxName] = 1 + (9 * (maxScore - rawScores[boxName]) / range);
    }
  }
  
  return normalizedResults;
}
