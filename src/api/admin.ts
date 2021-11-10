import axios from './axios-adapter';
import * as Request from '../types/request';

export const fetchAdmin = (id: string): Promise<Request.AdminResponse> =>
  axios.get(`users/${id}`);

export const fetchAdmins = (
  params?: Request.AdminsRequest
): Promise<Request.AdminsResponse> => axios.get('users', { params });

export const createAdmin = (
  params: Request.CreateAdminRequest
): Promise<Request.CreateAdminRequest> => axios.post('users', params);

export const updateAdmin = (
  params: Request.UpdateAdminRequest
): Promise<Request.AdminsResponse> =>
  axios.put(`users?id=${params.id}`, params);

export const deleteAdmin = (
  id: string | undefined
): Promise<Request.AdminsResponse> => axios.delete(`users?id=${id}`);
