/**
 * PintPerfect app colors based on Guinness theme
 * Primary colors: Black, White, and Deep Green
 */

// Guinness-inspired color palette
const guinnessGreen = '#0C6E4F';
const guinnessBlack = '#000000';
const guinnessGold = '#B58D3D';
const guinnessWhite = '#FFFFFF';
const guinnessCreamy = '#F4EFE1';

export const Colors = {
  light: {
    text: guinnessBlack,
    background: guinnessWhite,
    tint: guinnessGreen,
    icon: guinnessBlack,
    tabIconDefault: '#687076',
    tabIconSelected: guinnessGreen,
    card: guinnessCreamy,
    border: '#E6E6E6',
    rating: guinnessGold,
  },
  dark: {
    text: guinnessWhite,
    background: guinnessBlack,
    tint: guinnessGreen,
    icon: guinnessWhite,
    tabIconDefault: '#9BA1A6',
    tabIconSelected: guinnessGreen,
    card: '#242424',
    border: '#333333',
    rating: guinnessGold,
  },
};
