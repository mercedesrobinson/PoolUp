// Quick fix script to add route.params null safety
const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix route.params undefined issues
  content = content.replace(/route\.params\?\.(\w+)/g, 'route.params?.$1');
  content = content.replace(/route\.params\.(\w+)/g, 'route.params?.$1');
  content = content.replace(/const { (\w+) } = route\.params;/g, 'const { $1 } = route.params || {};');
  content = content.replace(/const { (\w+), (\w+) } = route\.params;/g, 'const { $1, $2 } = route.params || {};');
  content = content.replace(/const { (\w+), (\w+), (\w+) } = route\.params;/g, 'const { $1, $2, $3 } = route.params || {};');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed route params in ${file}`);
});

console.log('Route params fixes applied to all screen files');
