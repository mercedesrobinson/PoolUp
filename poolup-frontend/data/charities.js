// Charitable organizations available for penalty donations
export const CHARITIES = [
  {
    id: 'tequity_in_action',
    name: 'TEquity in Action',
    description: 'Teaching students of color how to code and building equity in tech',
    website: 'https://www.tequityinaction.org',
    category: 'Education & Technology',
    icon: '💻',
    color: '#4285F4'
  },
  {
    id: '350_org',
    name: '350.org',
    description: 'Global grassroots climate action group',
    website: 'https://350.org',
    category: 'Climate Justice',
    icon: '🌍',
    color: '#228B22'
  },
  {
    id: 'aclu',
    name: 'ACLU (American Civil Liberties Union)',
    description: 'Defends civil rights and liberties (free speech, racial justice, LGBTQ+ rights)',
    website: 'https://www.aclu.org',
    category: 'Civil Rights',
    icon: '⚖️',
    color: '#0066CC'
  },
  {
    id: 'black_womens_health_imperative',
    name: "Black Women's Health Imperative",
    description: 'Advocates for health equity for Black women and girls',
    website: 'https://bwhi.org',
    category: 'Health Equity',
    icon: '💪',
    color: '#800080'
  },
  {
    id: 'color_of_change',
    name: 'Color of Change',
    description: 'Works for racial justice in media, politics, and policy',
    website: 'https://colorofchange.org',
    category: 'Racial Justice',
    icon: '✊',
    color: '#000000'
  },
  {
    id: 'doctors_without_borders',
    name: 'Doctors Without Borders',
    description: 'Provides emergency medical care in crisis zones worldwide',
    website: 'https://www.doctorswithoutborders.org',
    category: 'Healthcare',
    icon: '⚕️',
    color: '#E31837'
  },
  {
    id: 'equal_justice_initiative',
    name: 'Equal Justice Initiative (EJI)',
    description: 'Founded by Bryan Stevenson, focuses on ending mass incarceration and racial inequality',
    website: 'https://eji.org',
    category: 'Racial Justice',
    icon: '🏛️',
    color: '#8B4513'
  },
  {
    id: 'glsen',
    name: 'GLSEN',
    description: 'Advocates for safe, inclusive schools for LGBTQ+ students',
    website: 'https://www.glsen.org',
    category: 'LGBTQ+ Rights',
    icon: '🏫',
    color: '#9932CC'
  },
  {
    id: 'naacp_ldf',
    name: 'NAACP Legal Defense Fund (LDF)',
    description: 'Litigation and advocacy for racial justice',
    website: 'https://www.naacpldf.org',
    category: 'Racial Justice',
    icon: '⚖️',
    color: '#FFD700'
  },
  {
    id: 'planned_parenthood',
    name: 'Planned Parenthood',
    description: 'Comprehensive reproductive health services and advocacy',
    website: 'https://www.plannedparenthood.org',
    category: 'Reproductive Rights',
    icon: '🩺',
    color: '#FF69B4'
  },
  {
    id: 'splc',
    name: 'Southern Poverty Law Center (SPLC)',
    description: 'Fights hate and extremism, promotes civil rights',
    website: 'https://www.splcenter.org',
    category: 'Civil Rights',
    icon: '🛡️',
    color: '#8B0000'
  },
  {
    id: 'sunrise_movement',
    name: 'Sunrise Movement Education Fund',
    description: 'Youth-led movement advocating for climate justice and a Green New Deal',
    website: 'https://www.sunrisemovement.org',
    category: 'Climate Justice',
    icon: '🌅',
    color: '#FFD700'
  },
  {
    id: 'transgender_law_center',
    name: 'Transgender Law Center',
    description: 'Legal advocacy for transgender and gender nonconforming people',
    website: 'https://transgenderlawcenter.org',
    category: 'LGBTQ+ Rights',
    icon: '🏳️‍⚧️',
    color: '#55CDFC'
  },
  {
    id: 'trevor_project',
    name: 'Trevor Project',
    description: 'Crisis intervention and suicide prevention for LGBTQ+ youth',
    website: 'https://www.thetrevorproject.org',
    category: 'LGBTQ+ Rights',
    icon: '🌈',
    color: '#FF8C00'
  }
];

export const getCharityById = (id) => {
  return CHARITIES.find(charity => charity.id === id);
};

export const getCharitiesByCategory = (category) => {
  return CHARITIES.filter(charity => charity.category === category);
};

export const CHARITY_CATEGORIES = [
  'Education & Technology',
  'Civil Rights',
  'LGBTQ+ Rights',
  'Racial Justice',
  'Climate Justice',
  'Reproductive Rights',
  'Health Equity',
  'Healthcare'
];
