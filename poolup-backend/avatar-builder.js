import { v4 as uuid } from 'uuid';

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
    { name: 'sunglasses', emoji: '😎' }
  ],
  accessories: [
    { name: 'none', emoji: '' },
    { name: 'hat', emoji: '🎩' },
    { name: 'cap', emoji: '🧢' },
    { name: 'beanie', emoji: '🧣' },
    { name: 'headband', emoji: '🎀' },
    { name: 'crown', emoji: '👑' },
    { name: 'bandana', emoji: '🏴‍☠️' },
    { name: 'hijab', emoji: '🧕' },
    { name: 'turban', emoji: '👳' }
  ],
  outfits: [
    { name: 'casual', emoji: '👕', color: '#4285F4' },
    { name: 'formal', emoji: '👔', color: '#34A853' },
    { name: 'sporty', emoji: '🏃‍♂️', color: '#EA4335' },
    { name: 'cozy', emoji: '🧥', color: '#FBBC04' },
    { name: 'dress', emoji: '👗', color: '#9C27B0' },
    { name: 'hoodie', emoji: '🧥', color: '#FF5722' },
    { name: 'traditional', emoji: '🥻', color: '#795548' },
    { name: 'artistic', emoji: '🎨', color: '#E91E63' }
  ]
};

export function generateRandomAvatar() {
  return {
    id: uuid(),
    skinTone: AVATAR_OPTIONS.skinTones[Math.floor(Math.random() * AVATAR_OPTIONS.skinTones.length)],
    hairStyle: AVATAR_OPTIONS.hairStyles[Math.floor(Math.random() * AVATAR_OPTIONS.hairStyles.length)],
    hairColor: AVATAR_OPTIONS.hairColors[Math.floor(Math.random() * AVATAR_OPTIONS.hairColors.length)],
    eyeStyle: AVATAR_OPTIONS.eyeStyles[Math.floor(Math.random() * AVATAR_OPTIONS.eyeStyles.length)],
    accessory: AVATAR_OPTIONS.accessories[Math.floor(Math.random() * AVATAR_OPTIONS.accessories.length)],
    outfit: AVATAR_OPTIONS.outfits[Math.floor(Math.random() * AVATAR_OPTIONS.outfits.length)]
  };
}

export function avatarToEmoji(avatar) {
  // Create a fun emoji representation
  const base = avatar.hairStyle.emoji;
  const accessory = avatar.accessory.emoji;
  const outfit = avatar.outfit.emoji;
  
  return `${base}${accessory}${outfit}`;
}

export function avatarToSVG(avatar) {
  // Generate SVG representation for more detailed avatar
  return `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Head -->
      <circle cx="50" cy="40" r="25" fill="${avatar.skinTone}" stroke="#333" stroke-width="2"/>
      
      <!-- Hair -->
      <path d="M25 30 Q50 15 75 30 L75 25 Q50 10 25 25 Z" fill="${avatar.hairColor}"/>
      
      <!-- Eyes -->
      <circle cx="42" cy="38" r="3" fill="#333"/>
      <circle cx="58" cy="38" r="3" fill="#333"/>
      ${avatar.eyeStyle.name === 'glasses' ? '<rect x="35" y="32" width="30" height="12" fill="none" stroke="#333" stroke-width="2" rx="6"/>' : ''}
      
      <!-- Body -->
      <rect x="35" y="65" width="30" height="35" fill="${avatar.outfit.color}" rx="15"/>
      
      <!-- Accessory -->
      ${avatar.accessory.name === 'hat' ? '<ellipse cx="50" cy="20" rx="20" ry="8" fill="#333"/>' : ''}
      ${avatar.accessory.name === 'crown' ? '<polygon points="30,20 35,10 45,15 50,5 55,15 65,10 70,20" fill="#FFD700"/>' : ''}
    </svg>
  `;
}

export function getAvatarPresets() {
  // Return diverse, inclusive preset avatars
  return [
    {
      name: 'Cool Vibes',
      avatar: {
        skinTone: '#8D5524', // Dark brown
        hairStyle: AVATAR_OPTIONS.hairStyles[4], // afro
        hairColor: '#2C1B18', // Black
        eyeStyle: AVATAR_OPTIONS.eyeStyles[3], // sunglasses
        accessory: AVATAR_OPTIONS.accessories[2], // cap
        outfit: AVATAR_OPTIONS.outfits[2] // sporty
      }
    },
    {
      name: 'Scholar',
      avatar: {
        skinTone: '#D4A574', // Olive
        hairStyle: AVATAR_OPTIONS.hairStyles[6], // braids
        hairColor: '#3C2415', // Dark brown
        eyeStyle: AVATAR_OPTIONS.eyeStyles[2], // glasses
        accessory: AVATAR_OPTIONS.accessories[0], // none
        outfit: AVATAR_OPTIONS.outfits[1] // formal
      }
    },
    {
      name: 'Creative Soul',
      avatar: {
        skinTone: '#F1C27D', // Light peach
        hairStyle: AVATAR_OPTIONS.hairStyles[11], // pixie
        hairColor: '#800080', // Purple
        eyeStyle: AVATAR_OPTIONS.eyeStyles[0], // normal
        accessory: AVATAR_OPTIONS.accessories[4], // headband
        outfit: AVATAR_OPTIONS.outfits[7] // artistic
      }
    },
    {
      name: 'Traditional Style',
      avatar: {
        skinTone: '#B07C4A', // Warm brown
        hairStyle: AVATAR_OPTIONS.hairStyles[5], // locs
        hairColor: '#2C1B18', // Black
        eyeStyle: AVATAR_OPTIONS.eyeStyles[0], // normal
        accessory: AVATAR_OPTIONS.accessories[7], // hijab
        outfit: AVATAR_OPTIONS.outfits[6] // traditional
      }
    },
    {
      name: 'Sporty Spirit',
      avatar: {
        skinTone: '#6B4226', // Deep brown
        hairStyle: AVATAR_OPTIONS.hairStyles[7], // waves
        hairColor: '#724832', // Brown
        eyeStyle: AVATAR_OPTIONS.eyeStyles[0], // normal
        accessory: AVATAR_OPTIONS.accessories[3], // beanie
        outfit: AVATAR_OPTIONS.outfits[2] // sporty
      }
    },
    {
      name: 'Elegant Grace',
      avatar: {
        skinTone: '#C68642', // Medium brown
        hairStyle: AVATAR_OPTIONS.hairStyles[10], // bun
        hairColor: '#2C1B18', // Black
        eyeStyle: AVATAR_OPTIONS.eyeStyles[0], // normal
        accessory: AVATAR_OPTIONS.accessories[5], // crown
        outfit: AVATAR_OPTIONS.outfits[4] // dress
      }
    }
  ];
}
