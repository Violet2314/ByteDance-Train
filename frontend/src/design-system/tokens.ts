import { ThemeConfig } from 'antd'

export const antTheme: ThemeConfig = {
  token: {
    colorPrimary: '#7CAA6D',
    colorSuccess: '#C8DFC0',
    colorWarning: '#EED8B5',
    colorError: '#D9B3AD',
    colorInfo: '#7B9CB8',
    colorTextBase: '#3A3A3A',
    colorTextSecondary: '#6B6B6B',
    colorBgBase: '#FDFCF9',
    colorBgContainer: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      borderRadius: 9999,
      controlHeight: 40,
      paddingContentHorizontal: 24,
      fontWeight: 600,
    },
    Card: {
      borderRadiusLG: 16,
      boxShadowTertiary: '0 2px 10px rgba(124,170,109,0.06)',
    },
    Input: {
      borderRadius: 9999,
      colorBorder: '#E5E8E3',
      hoverBorderColor: '#D4D9D0',
      activeBorderColor: '#7CAA6D',
    },
    Tag: {
      borderRadiusSM: 9999,
    },
  },
}
