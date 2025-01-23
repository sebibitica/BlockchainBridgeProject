import type { ThemeVars } from '@mysten/dapp-kit'

export const darkTheme: ThemeVars = {
    blurs: {
      modalOverlay: 'blur(0)'
    },
    backgroundColors: {
      primaryButton: '#163d6d',
      primaryButtonHover: '#123157',
      outlineButtonHover: '#123157',
      modalOverlay: 'rgba(243, 243, 245, 0.1)',
      modalPrimary: '#163d6d',
      modalSecondary: '#123157',
      iconButton: 'transparent',
      iconButtonHover: '#123157',
      dropdownMenu: '#163d6d',
      dropdownMenuSeparator: '#123157',
      walletItemSelected: '#163d6d',
      walletItemHover: '#123157'
    },
    borderColors: {
      outlineButton: '#123157'
    },
    colors: {
      primaryButton: '#f3f3f5',
      outlineButton: '#f3f3f5',
      iconButton: '#f3f3f5',
      body: '#f3f3f5',
      bodyMuted: 'rgba(243, 243, 245, 0.7)',
      bodyDanger: '#FF794B'
    },
    radii: {
      small: '6px',
      medium: '8px',
      large: '12px',
      xlarge: '16px'
    },
    shadows: {
      primaryButton: '0px 4px 12px rgba(22, 61, 109, 0.1)',
      walletItemSelected: '0px 2px 6px rgba(22, 61, 109, 0.05)'
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      bold: '600'
    },
    fontSizes: {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    },
    typography: {
      fontFamily: 'inherit',
      fontStyle: 'normal',
      lineHeight: '1.3',
      letterSpacing: '1'
    }
  }