// Quick fix script to replace radius object usage with radius.medium
const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace borderRadius: radius with borderRadius: radius.medium
  content = content.replace(/borderRadius:\s*radius(?!\.)/g, 'borderRadius: radius.medium');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
});

console.log('Style fixes applied to all screen files');
