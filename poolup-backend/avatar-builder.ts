import { v4 as uuid } from 'uuid';

interface HairStyle {
  name: string;
  emoji: string;
}

interface EyeStyle {
  name: string;
  emoji: string;
}

interface Accessory {
  name: string;
  emoji: string;
}

interface Outfit {
  name: string;
  emoji: string;
}

interface Avatar {
  id: string;
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  eyeStyle: EyeStyle;
  accessories: Accessory[];
  outfit: Outfit;
  background: string;
  createdAt: string;
}

// Avatar builder system - Duolingo/Bitmoji style with inclusive representation
export const AVATAR_OPTIONS = {
  skinTones: [
    '#FDBCB4', // Light pink
    '#F1C27D', // Light peach
    '#E0AC69', // Medium tan
    '#D4A574', // Olive
    '#C68642', // Medium brown
    '#B07C4A', // Warm brown
    '#8D5524', // Dark brown
    '#6B4226', // Deep brown
    '#5C4033', // Very dark brown
    '#4A2C2A'  // Darkest brown
  ],
  hairStyles: [
    { name: 'short_straight', emoji: '👦' },
    { name: 'long_straight', emoji: '👧' },
    { name: 'curly_short', emoji: '👨‍🦱' },
    { name: 'curly_long', emoji: '👩‍🦱' },
    { name: 'afro', emoji: '🧑🏿‍🦱' },
    { name: 'locs', emoji: '🧑🏾' },
    { name: 'braids', emoji: '👩🏾‍🦱' },
    { name: 'waves', emoji: '🧑🏽' },
    { name: 'bald', emoji: '👨‍🦲' },
    { name: 'ponytail', emoji: '👱‍♀️' },
    { name: 'bun', emoji: '👩‍💼' },
    { name: 'pixie', emoji: '👩‍🎤' }
  ],
  hairColors: [
    '#2C1B18', // Black
    '#3C2415', // Dark brown
    '#724832', // Brown
    '#8B4513', // Saddle brown
    '#A0522D', // Sienna
    '#CD853F', // Peru
    '#DEB887', // Burlywood
    '#F4A460', // Sandy brown
    '#FFE4B5', // Moccasin (blonde)
    '#DC143C', // Red
    '#800080', // Purple
    '#0000FF', // Blue
    '#008000', // Green
    '#FFC0CB'  // Pink
  ],
  eyeStyles: [
    { name: 'normal', emoji: '👀' },
    { name: 'wink', emoji: '😉' },
    { name: 'glasses', emoji: '🤓' },
    { name: 'sunglasses', emoji: '😎' },
    { name: 'heart_eyes', emoji: '😍' },
    { name: 'sleepy', emoji: '😴' }
  ],
  accessories: [
    { name: 'none', emoji: '' },
    { name: 'hat', emoji: '🎩' },
    { name: 'cap', emoji: '🧢' },
    { name: 'headband', emoji: '👸' },
    { name: 'earrings', emoji: '💎' },
    { name: 'necklace', emoji: '📿' },
    { name: 'watch', emoji: '⌚' },
    { name: 'ring', emoji: '💍' }
  ],
  outfits: [
    { name: 'casual', emoji: '👕' },
    { name: 'formal', emoji: '👔' },
    { name: 'sporty', emoji: '🏃‍♂️' },
    { name: 'party', emoji: '🎉' },
    { name: 'beach', emoji: '🏖️' },
    { name: 'winter', emoji: '🧥' },
    { name: 'business', emoji: '💼' },
    { name: 'artistic', emoji: '🎨' }
  ],
  backgrounds: [
    '#FFE4E1', // Misty rose
    '#E6E6FA', // Lavender
    '#F0F8FF', // Alice blue
    '#F5FFFA', // Mint cream
    '#FFF8DC', // Cornsilk
    '#FFE4B5', // Moccasin
    '#FFEFD5', // Papaya whip
    '#F0FFF0', // Honeydew
    '#F8F8FF', // Ghost white
    '#FDF5E6'  // Old lace
  ]
};

// Generate random avatar
export function generateRandomAvatar(): Avatar {
  const randomChoice = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
  
  return {
    id: uuid(),
    skinTone: randomChoice(AVATAR_OPTIONS.skinTones),
    hairStyle: randomChoice(AVATAR_OPTIONS.hairStyles),
    hairColor: randomChoice(AVATAR_OPTIONS.hairColors),
    eyeStyle: randomChoice(AVATAR_OPTIONS.eyeStyles),
    accessories: [randomChoice(AVATAR_OPTIONS.accessories)], // Can have multiple accessories
    outfit: randomChoice(AVATAR_OPTIONS.outfits),
    background: randomChoice(AVATAR_OPTIONS.backgrounds),
    createdAt: new Date().toISOString()
  };
}

// Create custom avatar
export function createCustomAvatar(options: Partial<Avatar>): Avatar {
  const defaultAvatar = generateRandomAvatar();
  
  return {
    ...defaultAvatar,
    ...options,
    id: uuid(),
    createdAt: new Date().toISOString()
  };
}

// Get avatar as emoji representation
export function getAvatarEmoji(avatar: Avatar): string {
  let emoji = avatar.hairStyle.emoji;
  
  // Add accessories
  if (avatar.accessories && avatar.accessories.length > 0) {
    emoji += avatar.accessories.map(acc => acc.emoji).join('');
  }
  
  // Add outfit context
  if (avatar.outfit && avatar.outfit.emoji) {
    emoji += avatar.outfit.emoji;
  }
  
  return emoji;
}

// Validate avatar options
export function validateAvatarOptions(avatar: Partial<Avatar>): boolean {
  if (avatar.skinTone && !AVATAR_OPTIONS.skinTones.includes(avatar.skinTone)) {
    return false;
  }
  
  if (avatar.hairStyle && !AVATAR_OPTIONS.hairStyles.find(h => h.name === avatar.hairStyle?.name)) {
    return false;
  }
  
  if (avatar.hairColor && !AVATAR_OPTIONS.hairColors.includes(avatar.hairColor)) {
    return false;
  }
  
  if (avatar.eyeStyle && !AVATAR_OPTIONS.eyeStyles.find(e => e.name === avatar.eyeStyle?.name)) {
    return false;
  }
  
  if (avatar.outfit && !AVATAR_OPTIONS.outfits.find(o => o.name === avatar.outfit?.name)) {
    return false;
  }
  
  if (avatar.background && !AVATAR_OPTIONS.backgrounds.includes(avatar.background)) {
    return false;
  }
  
  return true;
}

// Get avatar customization options for frontend
export function getAvatarCustomizationOptions() {
  return {
    skinTones: AVATAR_OPTIONS.skinTones.map((color, index) => ({
      id: index,
      color,
      name: `Skin Tone ${index + 1}`
    })),
    hairStyles: AVATAR_OPTIONS.hairStyles.map((style, index) => ({
      id: index,
      ...style
    })),
    hairColors: AVATAR_OPTIONS.hairColors.map((color, index) => ({
      id: index,
      color,
      name: `Hair Color ${index + 1}`
    })),
    eyeStyles: AVATAR_OPTIONS.eyeStyles.map((style, index) => ({
      id: index,
      ...style
    })),
    accessories: AVATAR_OPTIONS.accessories.map((accessory, index) => ({
      id: index,
      ...accessory
    })),
    outfits: AVATAR_OPTIONS.outfits.map((outfit, index) => ({
      id: index,
      ...outfit
    })),
    backgrounds: AVATAR_OPTIONS.backgrounds.map((color, index) => ({
      id: index,
      color,
      name: `Background ${index + 1}`
    }))
  };
}

export type { Avatar, HairStyle, EyeStyle, Accessory, Outfit };
