import axios from './axios-adapter';
import * as Request from '../types/request';
import {
  Actions,
  getJoinPoolStartAndEndTimeV3,
  getJoinPoolStartAndEndTimeV4,
  IPoolV4ContractData,
} from '@gamify/onchain-program-sdk';
import { getConnection, round } from '../shared/helper';
import * as _ from 'lodash';
import { PublicKey } from '@solana/web3.js';
import { Decimal } from 'decimal.js';

export const fetchPool = async (
  id: string
): Promise<Request.PoolTransformedResponse> => {
  const data = (await axios.get(`admin/pools/${id}`)) as any;
  const onchainPool = await new Actions(getConnection()).readPool(
    new PublicKey(data.contract_address)
  );
  const clone: any = _.clone(onchainPool);
  clone.campaign.claim_at = onchainPool.campaign.claim_at.toISOString();
  clone.campaign.early_join_phase.start_at =
    onchainPool.campaign.early_join_phase.start_at.toISOString();
  clone.campaign.early_join_phase.end_at =
    onchainPool.campaign.early_join_phase.end_at.toISOString();
  clone.campaign.public_phase.start_at =
    onchainPool.campaign.public_phase.start_at.toISOString();
  clone.campaign.public_phase.end_at =
    onchainPool.campaign.public_phase.end_at.toISOString();
  if ((onchainPool.campaign as any).exclusive_phase) {
    clone.campaign.exclusive_phase.start_at = (
      onchainPool.campaign as any
    ).exclusive_phase.start_at.toISOString();
    clone.campaign.exclusive_phase.end_at = (
      onchainPool.campaign as any
    ).exclusive_phase.end_at.toISOString();
    if ((onchainPool.campaign as any).exclusive_phase.snapshot_at) {
      clone.campaign.exclusive_phase.snapshot_at = (
        onchainPool.campaign as any
      ).exclusive_phase.snapshot_at.toISOString();
    }
  }
  if ((onchainPool.campaign as any).fcfs_stake_phase) {
    clone.campaign.fcfs_stake_phase.start_at = (
      onchainPool.campaign as any
    ).fcfs_stake_phase.start_at.toISOString();
    clone.campaign.fcfs_stake_phase.end_at = (
      onchainPool.campaign as any
    ).fcfs_stake_phase.end_at.toISOString();
  }
  if ((onchainPool as any).voting) {
    clone.voting.start_at = (onchainPool as any).voting.start_at.toISOString();
    clone.voting.end_at = (onchainPool as any).voting.end_at.toISOString();
  }
  if (!_.isEqual(data.data, clone)) {
    syncPool(id);
  }

  data.data = onchainPool;

  return tranformData(data);
};

export const syncPool = async (
  id: string
): Promise<Request.PoolTransformedResponse> => {
  console.log('sync onchain...');
  const data = await axios.post(`admin/pools/${id}/sync`);
  return tranformData(data);
};

export const fetchPools = async (
  params?: Request.PoolsRequest
): Promise<Request.PoolsResponse> => {
  const res = (await axios.get('admin/pools', {
    params: { ...params },
  })) as any;
  if (!res?.docs) {
    return {
      page: params?.page || 0,
      limit: params?.limit || 5,
      totalDocs: 0,
      totalPages: 0,
      docs: [],
    };
  }
  res.docs = res.docs.map((el: any) => {
    return {
      ...el,
      token_address: el.token.token_address,
      token_decimals: el.token.token_decimals,
      token_name: el.token.token_name,
      token_symbol: el.token.token_symbol,
      token_total_supply: el.token.token_total_supply,
      token_liquidity_lock: el.token.token_liquidity_lock,
      token_to: el.token_to,
      is_initialized: el.data?.is_initialized,
      id: el._id,
      token_x: el.data?.token_x,
      token_y: el.data?.token_y,
      token_ratio: el.data?.rate,
      early_phase_is_active: el.data?.campaign.early_join_phase.is_active,
      platform: el.data?.platform,
      is_active: el.data?.is_active,
      root_admin: el.data?.admins.root_admin,
      max_allocation_all_phases: round(
        new Decimal(el.data?.campaign.max_allocation_all_phases)
          .div(el.data?.rate)
          .toNumber(),
        el.token_to_decimals || 9
      ),
      claim_at: el.data?.campaign.claim_at,
      early_phase_max_total_alloc: round(
        new Decimal(el.data?.campaign.early_join_phase.max_total_alloc)
          .div(el.data?.rate)
          .toNumber(),
        el.token_to_decimals || 9
      ),
      public_phase_max_individual_alloc: round(
        new Decimal(el.data?.campaign.public_phase.max_individual_alloc)
          .div(el.data?.rate)
          .toNumber(),
        el.token_to_decimals || 9
      ),
      version: el.data.version,
      fcfs_stake_phase_is_active: el.data?.campaign.fcfs_stake_phase?.is_active,
      fcfs_stake_phase_multiplication_rate:
        el.data?.campaign.fcfs_stake_phase?.multiplication_rate || 0,
      exclusive_join_duration:
        (new Date(el.data.campaign.exclusive_phase?.end_at).getTime() -
          new Date(el.data.campaign.exclusive_phase?.start_at).getTime()) /
        (60 * 1000),
      exclusive_phase_is_active: el.data.campaign.exclusive_phase?.is_active,
      exclusive_phase_max_total_alloc: round(
        new Decimal(el.data?.campaign.exclusive_phase?.max_total_alloc || 0)
          .div(el.data?.rate)
          .toNumber(),
        el.token_to_decimals || 9
      ),
    };
  });
  return res;
};

export const createPool = (params: Request.CreatePoolRequest): Promise<any> =>
  axios.post('pools', params);
export const commitCreatePool = (
  params: Request.CreatePoolRequest & { contract_address: string }
): Promise<any> => axios.post('admin/pools/commit', params);

export const addUserToWhitelist = (
  params: Request.AddUserToWhitelistRequest
): Promise<Request.AddUserToWhitelistResponse> =>
  axios.post('whitelists/add/batch', params);

export const removeUserToWhitelist = (
  params: Request.RemoveUserToWhitelistRequest
): Promise<any> => axios.post('whitelists/remove', params);

export const indexWhitelistedUsers = (params: any): Promise<any> =>
  axios.get('whitelists/index', { params });

export const confirmWhitelistedUser = (
  params: Request.AddUserToWhitelistRequest
): Promise<any> => axios.post('whitelists/confirm', params);

export const updateOffchainPool = (
  params: Request.UpdatePoolRequest
): Promise<Request.UpdatePoolResponse> => {
  return axios.put(`admin/pools/${params.id}/off-chain`, params);
};

export const updateOnchainPool = (
  params: Request.UpdatePoolRequest
): Promise<Request.UpdatePoolResponse> => {
  return axios.put(`admin/pools/${params.id}/on-chain`, params);
};

export const changePoolAdmin = (params: Request.ChangePoolAdmin): any => {
  return axios.post(`admin/pools/change-admin`, params);
};

export const activatePool = (
  id: string
): Promise<Request.UpdatePoolResponse> => {
  return axios.post(`admin/pools/${id}/activate`);
};

export const fetchParticipants = (
  params: Request.ParticipantsRequest
): Promise<Request.ParticipantsResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        page: 0,
        limit: 5,
        // pagingCounter: number,
        totalDocs: 0,
        totalPages: 0,
        docs: [],
      });
    });
  });
};

export const exportJoinedUsersList = async (poolAddress: string) => {
  return axios.get(`pool-participants/export/${poolAddress}`);
};

export const verifyParticipantsProgress = async (poolAddress: string) => {
  return axios.get(`pool-participants/verify-progress/${poolAddress}`);
};

const tranformData = (data: any) => {
  return {
    ...data,
    token_address: data.token.token_address,
    token_decimals: data.token.token_decimals,
    token_name: data.token.token_name,
    token_symbol: data.token.token_symbol,
    token_total_supply: data.token.token_total_supply,
    token_liquidity_lock: data.token.token_liquidity_lock,
    token_to: data.token_to,
    is_initialized: data.data.is_initialized,
    id: data._id,
    early_join_duration:
      (new Date(data.data.campaign.early_join_phase.end_at).getTime() -
        new Date(data.data.campaign.early_join_phase.start_at).getTime()) /
      (60 * 1000),
    token_x: data.data.token_x,
    token_y: data.data.token_y,
    token_ratio: data.data.rate,
    early_phase_is_active: data.data.campaign.early_join_phase.is_active,
    platform: data.data.platform,
    is_active: data.data.is_active,
    root_admin: data.data.admins.root_admin,
    max_allocation_all_phases: round(
      new Decimal(data.data?.campaign.max_allocation_all_phases)
        .div(data.data?.rate)
        .toNumber(),
      data.token_to_decimals || 9
    ),
    claim_at: data.data.campaign.claim_at,
    early_phase_max_total_alloc: round(
      new Decimal(data.data?.campaign.early_join_phase.max_total_alloc)
        .div(data.data?.rate)
        .toNumber(),
      data.token_to_decimals || 9
    ),
    public_phase_max_individual_alloc: round(
      new Decimal(data.data?.campaign.public_phase.max_individual_alloc)
        .div(data.data?.rate)
        .toNumber(),
      data.token_to_decimals || 9
    ),
    ...(data.data?.campaign?.exclusive_phase && {
      ...(data.data?.campaign.exclusive_phase.snapshot_at && {
        exclusive_snapshot_time:
          data.data?.campaign.exclusive_phase.snapshot_at,
      }),
      exclusive_level1: {
        ...data.data?.campaign.exclusive_phase.level1,
        max_individual_amount: convertToTokenToUnit(
          data.data?.campaign.exclusive_phase.level1.max_individual_amount,
          data.data?.rate,
          9
        ),
      },
      exclusive_level2: {
        ...data.data?.campaign.exclusive_phase.level2,
        max_individual_amount: convertToTokenToUnit(
          data.data?.campaign.exclusive_phase.level2.max_individual_amount,
          data.data?.rate,
          9
        ),
      },
      exclusive_level3: {
        ...data.data?.campaign.exclusive_phase.level3,
        max_individual_amount: convertToTokenToUnit(
          data.data?.campaign.exclusive_phase.level3.max_individual_amount,
          data.data?.rate,
          9
        ),
      },
      exclusive_level4: {
        ...data.data?.campaign.exclusive_phase.level4,
        max_individual_amount: convertToTokenToUnit(
          data.data?.campaign.exclusive_phase.level4.max_individual_amount,
          data.data?.rate,
          9
        ),
      },
      exclusive_level5: {
        ...data.data?.campaign.exclusive_phase.level5,
        max_individual_amount: convertToTokenToUnit(
          data.data?.campaign.exclusive_phase.level5.max_individual_amount,
          data.data?.rate,
          9
        ),
      },
    }),
    ...getJoinPoolStartEnd(data.data),
    version: data.data.version || 1,
    fcfs_stake_phase_is_active: data.data?.campaign.fcfs_stake_phase?.is_active,
    fcfs_stake_phase_multiplication_rate:
      data.data?.campaign.fcfs_stake_phase?.multiplication_rate || 0,
    fcfs_stake_duration:
      (new Date(data.data.campaign.fcfs_stake_phase?.end_at).getTime() -
        new Date(data.data.campaign.fcfs_stake_phase?.start_at).getTime()) /
      (60 * 1000),
    exclusive_join_duration:
      (new Date(data.data.campaign.exclusive_phase.end_at).getTime() -
        new Date(data.data.campaign.exclusive_phase.start_at).getTime()) /
      (60 * 1000),
    exclusive_phase_is_active: data.data.campaign.exclusive_phase.is_active,
    exclusive_phase_max_total_alloc: round(
      new Decimal(data.data?.campaign.exclusive_phase.max_total_alloc)
        .div(data.data?.rate)
        .toNumber(),
      data.token_to_decimals || 9
    ),
    fees: data.data?.fees || 0,
    sold_amount: convertToTokenToUnit(
      new Decimal(data.data?.campaign?.early_join_phase?.sold_allocation || 0)
        .add(data.data?.campaign?.exclusive_phase?.sold_allocation || 0)
        .add(data.data?.campaign?.fcfs_stake_phase?.sold_allocation || 0)
        .add(data.data?.campaign?.public_phase?.sold_allocation || 0)
        .toNumber(),
      data.data?.rate,
      9
    ),
    voting_phase_is_active: data.data?.voting?.is_active,
    voting_start: data.data?.voting?.start_at,
    voting_end: data.data?.voting?.end_at,
    max_voting_days: data.data?.voting?.max_voting_days,
    is_enough_vote:
      new Decimal(data.data?.voting?.required_absolute_vote || 0).toNumber() <=
      new Decimal(data.data?.voting?.total_vote_up || 0)
        .minus(data.data?.voting?.total_vote_down || 0)
        .toNumber(),
  } as any;
};

export const getJoinPoolStartEnd = (poolData: IPoolV4ContractData) => {
  let join_pool_start;
  let join_pool_end;
  if (!poolData?.version) {
    join_pool_start = poolData.campaign.early_join_phase.is_active
      ? poolData.campaign.early_join_phase.start_at
      : poolData.campaign.public_phase.start_at;
    join_pool_end = poolData.campaign.public_phase.end_at;
  } else if (poolData.version === 2) {
    join_pool_start = poolData.campaign.exclusive_phase.is_active
      ? poolData.campaign.exclusive_phase.start_at
      : poolData.campaign.public_phase.start_at;
    join_pool_end = poolData.campaign.public_phase.end_at;
  } else if (poolData.version === 3) {
    const res = getJoinPoolStartAndEndTimeV3(poolData as any);
    join_pool_start = res.join_pool_start;
    join_pool_end = res.join_pool_end;
  } else if (poolData.version === 4) {
    const res = getJoinPoolStartAndEndTimeV4(poolData as IPoolV4ContractData);
    join_pool_start = res.join_pool_start;
    join_pool_end = res.join_pool_end;
  }

  return { join_pool_start, join_pool_end };
};

export const fetchLatestPlatform = () => {
  return axios.get(`platform/latest`);
};

const convertToTokenToUnit = (amount: number, rate: number, decimals: number) =>
  new Decimal(amount)
    .div(new Decimal(rate))
    .toDecimalPlaces(decimals)
    .toNumber();
