import axios from './axios-adapter';
import { useQuery } from 'react-query';

export const indexWhitelistedUsers = (params: any): Promise<any> =>
  axios.get('whitelists/index', { params });

export const useIndexWhitelistedUsers = (params?: any) => {
  return useQuery(['indexWhitelistedUsers', params], () =>
    indexWhitelistedUsers({ ...params })
  );
};
