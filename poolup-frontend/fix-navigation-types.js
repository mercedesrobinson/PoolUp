// Quick fix script for navigation typing issues
const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix navigation.navigate calls with type assertions
  content = content.replace(/navigation\.navigate\('Chat', \{ poolId: ([^}]+) \}\)/g, 'navigation.navigate("Chat" as any, { poolId: $1 })');
  content = content.replace(/navigation\.navigate\('([^']+)', \{([^}]+)\}\)/g, 'navigation.navigate("$1" as any, {$2})');
  
  // Fix function parameter typing
  content = content.replace(/export default function (\w+)\(\{ navigation, route \}\)/g, 'export default function $1({ navigation, route }: any)');
  
  // Fix user property access
  content = content.replace(/const \{ user \} = route\.params \|\| \{\};/g, 'const { user } = route.params || {};\n  if (!user) return null;');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed navigation types in ${file}`);
});

console.log('Navigation type fixes applied to all screen files');
