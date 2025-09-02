// Final fix script for remaining TypeScript errors
const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix route.params undefined issues with proper null coalescing
  content = content.replace(/const \{ (\w+) \} = route\.params \|\| \{\};/g, 'const { $1 } = route?.params || {};');
  content = content.replace(/const \{ (\w+), (\w+) \} = route\.params \|\| \{\};/g, 'const { $1, $2 } = route?.params || {};');
  content = content.replace(/const \{ (\w+), (\w+), (\w+) \} = route\.params \|\| \{\};/g, 'const { $1, $2, $3 } = route?.params || {};');
  
  // Fix arithmetic operations with proper type checking
  content = content.replace(/(\w+)\.total_contributed \+ (\w+)\.total_contributed/g, '(Number($1?.total_contributed) || 0) + (Number($2?.total_contributed) || 0)');
  content = content.replace(/user\.total_contributed \+ user\.total_earned/g, '(Number(user?.total_contributed) || 0) + (Number(user?.total_earned) || 0)');
  
  // Fix user property access in Badges screen
  if (file === 'Badges.tsx') {
    content = content.replace(/const \{ user \} = route\.params \|\| \{\};/, 'const { user } = route?.params || {};\n  \n  if (!user) {\n    return (\n      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>\n        <Text>Loading user data...</Text>\n      </View>\n    );\n  }');
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Applied final fixes to ${file}`);
});

console.log('Final TypeScript error fixes applied to all screen files');
