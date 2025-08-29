const SERVER = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:4000';

async function j(path, opts={}){
  const res = await fetch(`${SERVER}${path}`, {
    headers: { 'Content-Type':'application/json' },
    ...opts
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  guest: (name)=> j('/api/auth/guest', { method:'POST', body: JSON.stringify({ name }) }),
  createPool: (body)=> j('/api/pools', { method:'POST', body: JSON.stringify(body) }),
  listPools: (userId)=> j(`/api/users/${userId}/pools`),
  getPool: (poolId)=> j(`/api/pools/${poolId}`),
  contribute: (poolId, body)=> j(`/api/pools/${poolId}/contributions`, { method:'POST', body: JSON.stringify(body) }),
  messages: (poolId)=> j(`/api/pools/${poolId}/messages`),
  sendMessage: (poolId, body)=> j(`/api/pools/${poolId}/messages`, { method:'POST', body: JSON.stringify(body) }),
};
