import axios from 'axios';
import { envConfig } from '../config';

const { REACT_APP_API_BASE_URL } = envConfig;

const instance = axios.create({ baseURL: REACT_APP_API_BASE_URL });
instance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken && JSON.parse(accessToken)) {
    config.headers['access-token'] = `${JSON.parse(accessToken)}`;
  }

  return config;
});

instance.interceptors.response.use(
  (response) => {
    const result = response.data;
    if (typeof result === 'object') {
      result.success = true;
    }
    return result;
  },
  (error) => {
    if (error?.response?.data) {
      const result = error.response.data;
      result.success = false;
      return result;
    }

    return null;
  }
);

export default instance;
