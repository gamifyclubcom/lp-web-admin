import { colors } from '@material-ui/core';
import { createTheme } from '@material-ui/core/styles';

const theme = createTheme({
  palette: {
    background: {
      default: '#fff',
      paper: colors.common.white,
    },
    primary: {
      contrastText: '#fff',
      main: '#4B1D54 ',
      dark: '#3B1548',
      light: '#914D98',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: '#6b778c',
    },
  },
});

export default theme;
