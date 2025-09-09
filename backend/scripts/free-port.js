#!/usr/bin/env node
const { execSync } = require('child_process');

const port = process.argv[2] || '3000';

function killPids(pids) {
  if (!pids || pids.length === 0) return false;
  try {
    for (const pid of pids) {
      if (!pid) continue;
      if (process.platform === 'win32') {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      } else {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}

try {
  let pids = [];
  if (process.platform === 'win32') {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = out.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(Number(pid))) pids.push(pid);
    }
  } else {
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' });
    pids = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  if (killPids(pids)) {
    console.log(`Freed port ${port} (killed PIDs: ${pids.join(', ')})`);
  } else {
    console.log(`No processes found on port ${port}`);
  }
} catch (e) {
  console.log(`No processes found on port ${port}`);
}

