import axios from './axios-adapter';
import * as Request from '../types/request';

export const login = (
  params: Record<string, unknown>
): Promise<Request.LoginResponse> => {
  return axios.post('auth/sign-in', params);
};

export const logout = () => {
  return axios.delete('/auth/logout');
};
