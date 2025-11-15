const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'services', 'ocrService.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the prompt text
const oldPrompt = 'Extract all visible text from this image. Focus on product codes, model numbers, brand names, and any technical specifications. Return only the text you can clearly see, separated by spaces.';

const newPrompt = `Analyze this image and extract information:

1. If there is VISIBLE TEXT (product codes, model numbers, brand names, specifications, labels), list them exactly as shown, separated by spaces.

2. If there is NO VISIBLE TEXT, describe what you see:
   - Product type (e.g., "plastic container", "bottle", "packaging material")
   - Color, shape, size indicators
   - Any identifying features (logo, design, structure)
   - Return in format: "VISUAL: [description]"

3. For shipping/logistics documents, extract LR numbers, tracking codes, transporter names.

Return ONLY the extracted text OR visual description. If completely unclear, return "UNCLEAR".`;

content = content.replace(oldPrompt, newPrompt);

// Update the filter to exclude error words
const oldFilter = '.filter(term => !/^(the|and|or|of|in|on|at|to|for|with|by)$/i.test(term));';
const newFilter = `.filter(term => !/^(the|and|or|of|in|on|at|to|for|with|by|a|an|is|are|i'm|sorry|can't|extract|from|this|image)$/i.test(term));`;

content = content.replace(oldFilter, newFilter);

fs.writeFileSync(filePath, content, 'utf8');
console.log('OCR service updated successfully');
