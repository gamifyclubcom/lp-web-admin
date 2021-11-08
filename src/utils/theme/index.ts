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
      main: '#1C0045 ',
      dark: '#130030',
      light: '#49336a',
    },
    secondary: {
      contrastText: '#fff',
      main: '#3232DC ',
      dark: '#23239a',
      light: '#5b5be3',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: '#6b778c',
    },
  },
});

export default theme;
