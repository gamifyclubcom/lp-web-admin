import * as Types from './index';
import { PoolContractData, Token } from './pool';
export interface LoginRequest {
  address: string;
  publicKey: string;
  signature: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationResponse {
  // prevPage?: number | null;
  // nextPage?: number | null;
  // hasNextPage: boolean;
  // hasPrevPage: boolean;
  page: number;
  limit: number;
  // pagingCounter: number;
  totalDocs: number;
  totalPages: number;
  docs: any[];
}

export interface PoolsRequest {
  page?: number;
  limit?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface ParticipantsRequest {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PoolsResponse extends PaginationResponse {
  docs: Types.Pools;
}

export interface ParticipantsResponse extends PaginationResponse {
  docs: Types.WhitelistUsers;
}

export interface PoolRequest {
  id: string;
}

export type PoolTransformedResponse = Types.Pool;

export type PoolResponse = {
  _id: string;
  logo?: string;
  name: string;
  slug?: string;
  website?: string;
  token_economic?: string;
  twitter?: string;
  pool_start: string;
  telegram?: string;
  medium?: string;
  description?: string;
  tag_line?: string;
  contract_address: string;
  // fields that store in contract
  // token info
  token: Token;
  // token is used to buy token symbol
  token_to: string;
  data: PoolContractData;
  join_pool_start: string;
  join_pool_end: string;
  program_id: string;
};

export type CreatePoolRequest = Types.Pool;
export type CreatePoolResponse = Types.Pool;

export interface AddUserToWhitelistRequest {
  poolId: string;
  userAccount: string[];
}

export interface RemoveUserToWhitelistRequest {
  poolId: string;
  userAccounts: string[];
}

export interface AddUserToWhitelistResponse {
  rawTransaction: string;
}

export type UpdatePoolRequest = Partial<Types.Pool>;
export type UpdatePoolResponse = {
  status: string;
};
export type ChangePoolAdmin = {
  pool_id: string;
  new_root_admin: string;
};

export interface TransferAdminResponse {
  rawTransaction: string;
}

export type AdminResponse = Types.Admin;

export interface AdminsRequest {
  search?: string;
  page?: number;
  limit?: number;
}
export interface AdminsResponse extends PaginationResponse {
  docs: Types.Admins;
}

export type CreateAdminRequest = Types.Admin;

export type UpdateAdminRequest = Types.Admin;
