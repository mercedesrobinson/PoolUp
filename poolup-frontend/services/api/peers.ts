export const peers = {
  processPeerTransfer: async (
    poolId: string,
    fromUserId: string,
    toUserId: string,
    amountCents: number,
    message: string = ''
  ) => {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, transferId: Date.now().toString() } as any;
  },
  getUserPeerTransfers: async (userId: string, limit: number = 50) => {
    await new Promise((r) => setTimeout(r, 300));
    return [] as any[];
  },
};

