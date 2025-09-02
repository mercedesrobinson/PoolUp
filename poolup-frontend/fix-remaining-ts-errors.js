// Comprehensive fix for all remaining TypeScript errors
const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'screens');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(screensDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix specific screen issues
  if (file === 'AccountabilityPartners.tsx') {
    // Fix API method calls with wrong parameter counts
    content = content.replace(/api\.getAccountabilityPartners\(userId\)/g, 'api.getAccountabilityPartners()');
    content = content.replace(/api\.sendEncouragement\(partnerId, message\)/g, 'api.sendEncouragement(partnerId, message, userId, poolId)');
    content = content.replace(/api\.removeAccountabilityPartner\(partnerId\)/g, 'api.removeAccountabilityPartner(partnerId, userId)');
  }
  
  if (file === 'Leaderboard.tsx') {
    // Fix arithmetic operations on potentially undefined values
    content = content.replace(/user\.total_contributed \+ user\.total_earned/g, '(Number(user?.total_contributed) || 0) + (Number(user?.total_earned) || 0)');
  }
  
  if (file === 'NotificationSettings.tsx') {
    // Fix API method calls
    content = content.replace(/api\.saveNotificationSettings\(userId, settings\)/g, 'api.saveNotificationSettings(userId, settings)');
  }
  
  if (file === 'PoolDetail.tsx') {
    // Fix property access and missing properties
    content = content.replace(/poolId: pool\.id/g, 'poolId: pool?.id');
    content = content.replace(/id: user\.id,\s*name: user\.name,\s*email: user\.email,\s*authProvider: user\.authProvider/g, 
      'id: user?.id, name: user?.name, email: user?.email, authProvider: user?.authProvider, created_at: new Date().toISOString(), updated_at: new Date().toISOString()');
    
    // Fix Socket.IO useEffect
    content = content.replace(/useEffect\(\(\) => \{\s*const socket = io\(SERVER\);\s*socket\.on\('message', \(message\) => \{\s*if\(message\.poolId === poolId\) setMessages\(prev => \[\.\.\.prev, message\]\);\s*\}\);\s*return \(\) => socket\.disconnect\(\);\s*\}, \[\]\);/g,
      `useEffect(() => {
        const socket = io(SERVER);
        socket.on('message', (message) => {
          if(message.poolId === poolId) setMessages(prev => [...prev, message]);
        });
        return () => {
          socket.disconnect();
        };
      }, []);`);
  }
  
  if (file === 'PremiumUpgrade.tsx') {
    // Fix fontWeight type issues
    content = content.replace(/fontWeight: '600'/g, 'fontWeight: "600" as const');
    content = content.replace(/fontWeight: '700'/g, 'fontWeight: "700" as const');
    content = content.replace(/fontWeight: 'bold'/g, 'fontWeight: "bold" as const');
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed remaining TypeScript errors in ${file}`);
});

console.log('All remaining TypeScript error fixes applied');
