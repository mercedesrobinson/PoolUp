// Quick fix script for remaining TypeScript errors
const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix API calls with missing parameters
  content = content.replace(/api\.getContributionSettings\(userId\)/g, 'api.getContributionSettings(userId, poolId)');
  content = content.replace(/api\.updateContributionSettings\(userId, settings\)/g, 'api.updateContributionSettings(userId, poolId, settings)');
  content = content.replace(/api\.createRecurringContribution\(userId, settings\)/g, 'api.createRecurringContribution(userId, poolId, settings)');
  content = content.replace(/api\.getGroupActivity\(poolId\)/g, 'api.getGroupActivity(poolId, userId)');
  
  // Fix arithmetic operations on possibly undefined values
  content = content.replace(/(\w+)\.(\w+) \+ (\w+)\.(\w+)/g, '(Number($1.$2) || 0) + (Number($3.$4) || 0)');
  content = content.replace(/(\w+) \+ (\w+)\.(\w+)/g, '(Number($1) || 0) + (Number($2.$3) || 0)');
  
  // Fix user property access with null checks
  content = content.replace(/if \(!user\) return null;/g, 'if (!user) {\n    return (\n      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>\n        <Text>Loading...</Text>\n      </View>\n    );\n  }');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed remaining errors in ${file}`);
});

console.log('Remaining error fixes applied to all screen files');
