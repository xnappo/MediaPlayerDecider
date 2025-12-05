# Box Recommendation Tool - Google Apps Script

## Files Created:
- **Code.gs** - Backend logic for data and calculations
- **Index.html** - Frontend web interface

## How to Deploy:

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Delete the default Code.gs content and paste the content from `Code.gs`
4. Click the "+" next to Files and add an HTML file named "Index"
5. Paste the content from `Index.html`
6. Click "Deploy" > "New deployment"
7. Select type: "Web app"
8. Set "Execute as": Me
9. Set "Who has access": Anyone
10. Click "Deploy"
11. Copy the web app URL and share it!

## How It Works:

1. Users see 9 sliders (one for each feature)
2. Each slider ranges from 1 (Most Important) to 10 (Least Important)
3. Default value is 5 (moderate importance)
4. When user clicks "Get Recommendation", the app:
   - Inverts importance scores (1 becomes weight 10, 10 becomes weight 1)
   - Multiplies each box's rating by the feature's weight
   - Sums up the weighted scores
   - Recommends the box with the highest total score
5. Results show all boxes ranked with visual score bars

## Features from boxes.csv:
- Full quality audio (may be PCM decode on box)
- Passthrough audio
- Modern video codec support
- Conversions of all formats to LLDV/DV
- Single box for streaming and local media
- Robustness
- OS/Software Control
- Vendor support
- Cost
