import { BASE_URL, request } from './client';

export const privacy = {
  updateUserPhoto: async (userId: string, profileImageUrl: string) => {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, imageUrl: profileImageUrl } as any;
  },
  updatePrivacy: async (userId: string, isPublic: boolean, allowEncouragement: boolean) => {
    await new Promise((r) => setTimeout(r, 400));
    return { success: true } as any;
  },

  // Solo goal privacy (mock)
  getSoloGoalPrivacySettings: async (userId: string) => ({
    shareProgress: true,
    shareMilestones: true,
    shareGoalCompletion: true,
  }) as any,
  updateSoloGoalPrivacySettings: async (userId: string, settings: any) => ({ success: true } as any),
  saveSoloGoalPrivacySettings: async (userId: string, poolId: string, settings: any) => ({ success: true } as any),
};

