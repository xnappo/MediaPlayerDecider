function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Box Recommendation Tool')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getBoxData() {
  // Primary source: YAML stored in boxes.html (easy to edit/read)
  try {
    var embedded = HtmlService.createHtmlOutputFromFile('boxes').getContent();
    var yaml = extractDataFromHtml(embedded, 'yaml-data');
    if (yaml && yaml.trim()) {
      return parseYamlData(yaml);
    }
  } catch (e) {
    // ignore and continue to hardcoded fallback
  }

  // Fallback to embedded defaults (1 = best, 10 = worst) kept in sync with boxes.html
  var fallbackYaml = [
    '# Boxes and feature ratings (1 = best, 10 = worst)',
    'features:',
    '  - Speed',
    '  - Full quality audio (may be PCM decode on box)',
    '  - Passthrough audio',
    '  - Modern video codec support',
    '  - Conversions of all formats to LLDV/DV',
    '  - Single box for streaming and local media',
    '  - Robustness',
    '  - OS/Software Control',
    '  - Vendor support',
    '  - Cost',
    'boxes:',
    '  Shield:',
    '    Speed: 1',
    '    Full quality audio (may be PCM decode on box): 1',
    '    Passthrough audio: 1',
    '    Modern video codec support: 10',
    '    Conversions of all formats to LLDV/DV: 10',
    '    Single box for streaming and local media: 1',
    '    Robustness: 1',
    '    OS/Software Control: 1',
    '    Vendor support: 8',
    '    Cost: 8',
    '  Fire Cube 3:',
    '    Speed: 8',
    '    Full quality audio (may be PCM decode on box): 4',
    '    Passthrough audio: 4',
    '    Modern video codec support: 1',
    '    Conversions of all formats to LLDV/DV: 1',
    '    Single box for streaming and local media: 1',
    '    Robustness: 1',
    '    OS/Software Control: 8',
    '    Vendor support: 1',
    '    Cost: 5',
    '  Homatics Box R:',
    '    Speed: 5',
    '    Full quality audio (may be PCM decode on box): 1',
    '    Passthrough audio: 1',
    '    Modern video codec support: 1',
    '    Conversions of all formats to LLDV/DV: 1',
    '    Single box for streaming and local media: 1',
    '    Robustness: 4',
    '    OS/Software Control: 2',
    '    Vendor support: 8',
    '    Cost: 6',
    '  Apple TV:',
    '    Speed: 2',
    '    Full quality audio (may be PCM decode on box): 1',
    '    Passthrough audio: 7',
    '    Modern video codec support: 1',
    '    Conversions of all formats to LLDV/DV: 1',
    '    Single box for streaming and local media: 4',
    '    Robustness: 1',
    '    OS/Software Control: 10',
    '    Vendor support: 1',
    '    Cost: 5',
    '  Onn:',
    '    Speed: 5',
    '    Full quality audio (may be PCM decode on box): 7',
    '    Passthrough audio: 10',
    '    Modern video codec support: 1',
    '    Conversions of all formats to LLDV/DV: 1',
    '    Single box for streaming and local media: 1',
    '    Robustness: 1',
    '    OS/Software Control: 1',
    '    Vendor support: 3',
    '    Cost: 1',
    '  Google Streamer:',
    '    Speed: 5',
    '    Full quality audio (may be PCM decode on box): 7',
    '    Passthrough audio: 10',
    '    Modern video codec support: 1',
    '    Conversions of all formats to LLDV/DV: 1',
    '    Single box for streaming and local media: 1',
    '    Robustness: 1',
    '    OS/Software Control: 1',
    '    Vendor support: 3',
    '    Cost: 2',
    '  Two box solutions:',
    '    Speed: 3',
    '    Full quality audio (may be PCM decode on box): 1',
    '    Passthrough audio: 1',
    '    Modern video codec support: 1',
    '    Conversions of all formats to LLDV/DV: 1',
    '    Single box for streaming and local media: 10',
    '    Robustness: 1',
    '    OS/Software Control: 1',
    '    Vendor support: 1',
    '    Cost: 10'
  ].join('\n');
  return parseYamlData(fallbackYaml);
}

function parseYamlData(yaml) {
  if (!yaml) return { features: [], boxes: {} };
  var lines = yaml.replace(/\r/g, '').split('\n');
  var features = [];
  var boxFeatureMaps = {};
  var section = '';
  var currentBox = '';

  lines.forEach(function(line) {
    var raw = line;
    var trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    if (trimmed === 'features:') { section = 'features'; return; }
    if (trimmed === 'boxes:') { section = 'boxes'; currentBox = ''; return; }

    if (section === 'features') {
      if (trimmed.startsWith('- ')) {
        features.push(trimmed.slice(2).trim());
      }
      return;
    }

    if (section === 'boxes') {
      // Box name line: "BoxName:" at indent 0-2
      if (!raw.startsWith('    ') && trimmed.endsWith(':')) {
        currentBox = trimmed.slice(0, -1).trim();
        if (currentBox && !boxFeatureMaps[currentBox]) {
          boxFeatureMaps[currentBox] = {};
        }
        return;
      }
      // Feature line under a box: "  Feature: value"
      if (currentBox && raw.match(/^\s{2,}\S/)) {
        var idx = trimmed.indexOf(':');
        if (idx === -1) return;
        var fname = trimmed.slice(0, idx).trim();
        var valText = trimmed.slice(idx + 1).trim();
        var num = parseInt(valText, 10);
        if (fname && !isNaN(num)) {
          boxFeatureMaps[currentBox][fname] = num;
        }
      }
    }
  });

  // Build arrays in feature order
  var boxes = {};
  Object.keys(boxFeatureMaps).forEach(function(boxName) {
    boxes[boxName] = features.map(function(f) {
      var v = boxFeatureMaps[boxName][f];
      return (typeof v === 'number' && !isNaN(v)) ? v : 0;
    });
  });

  return { features: features, boxes: boxes };
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
