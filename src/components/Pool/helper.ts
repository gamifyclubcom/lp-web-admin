import Decimal from 'decimal.js';
import { round } from '../../shared/helper';
import * as Types from '../../types';
import { PublicKey } from '@solana/web3.js';
import { WRAPPED_SOL_MINT } from '@project-serum/serum/lib/token-instructions';

export const handlePoolData = (data: Types.Pool) => {
  data.token_ratio = round(data.token_ratio, 2);
  return {
    id: data._id,
    join_pool_start: data.join_pool_start,
    join_pool_end: data.join_pool_end,
    pool_start: data.pool_start,
    root_admin: data.root_admin,
    logo: data.logo,
    thumbnail: data.thumbnail,
    tag_line: data.tag_line,
    name: data.name,
    website: data.website,
    liquidity_percentage: data.liquidity_percentage,
    audit_link: data.audit_link,
    token: {
      token_address: data.token_address,
      token_decimals: data.token_decimals,
      token_name: data.token_name,
      token_symbol: data.token_symbol,
      token_total_supply: data.token_total_supply,
    },
    token_economic: data.token_economic,
    twitter: data.twitter,
    telegram: data.telegram,
    medium: data.medium,
    campaign: {
      max_allocation_all_phases: new Decimal(data.max_allocation_all_phases)
        .mul(data.token_ratio)
        .toNumber(),
      claim_at: data.claim_at,
      early_join_phase: {
        is_active: data.early_phase_is_active,
        max_total_alloc: new Decimal(data.early_phase_max_total_alloc || 0)
          .mul(data.token_ratio)
          .toNumber(),
      },
      public_phase: {
        is_active: true,
        max_individual_alloc: new Decimal(
          data.public_phase_max_individual_alloc
        )
          .mul(data.token_ratio)
          .toNumber(),
      },
    },
    description: data.description,
    token_to: data.token_to,
    slug: data.slug,
    token_ratio: data.token_ratio,
    early_join_duration: data.early_join_duration,
    claimable_percentage: data.claimable_percentage,
  };
};

export const handleOffchainPoolData = (data: Types.FormOffchainValues) => {
  return {
    id: data._id,
    pool_start: data.pool_start,
    logo: data.logo,
    thumbnail: data.thumbnail,
    tag_line: data.tag_line,
    name: data.name,
    website: data.website,
    token: {
      token_address: data.token_address,
      token_decimals: data.token_decimals,
      token_name: data.token_name,
      token_symbol: data.token_symbol,
      token_total_supply: data.token_total_supply,
    },
    token_economic: data.token_economic,
    twitter: data.twitter,
    telegram: data.telegram,
    medium: data.medium,
    description: data.description,
    slug: data.slug,
    liquidity_percentage: data.liquidity_percentage,
    audit_link: data.audit_link,
    claimable_percentage: data.claimable_percentage,
  };
};
export const handleOnchainPoolData = (data: Types.FormOnchainValues) => {
  data.token_ratio = round(data.token_ratio, 2);
  return {
    id: data._id,
    join_pool_start: data.join_pool_start,
    join_pool_end: data.join_pool_end,
    campaign: {
      max_allocation_all_phases: new Decimal(data.max_allocation_all_phases)
        .mul(data.token_ratio)
        .toNumber(),
      claim_at: data.claim_at,
      early_join_phase: {
        is_active: data.early_phase_is_active,
        max_total_alloc: new Decimal(data.early_phase_max_total_alloc || 0)
          .mul(data.token_ratio)
          .toNumber(),
      },
      public_phase: {
        is_active: true,
        max_individual_alloc: new Decimal(
          data.public_phase_max_individual_alloc
        )
          .mul(data.token_ratio)
          .toNumber(),
      },
    },
    token_ratio: data.token_ratio,
    early_join_duration: data.early_join_duration,
  };
};

export const handdlePoolDataToCreatePoolV2 = (
  data: Types.Pool,
  payer: PublicKey,
  platform: PublicKey
) => {
  return {
    campaign: {
      max_allocation_all_phases: new Decimal(data.max_allocation_all_phases)
        .mul(data.token_ratio)
        .toNumber(),
      claim_at: new Date(data.claim_at),
      exclusive_join_phase: {
        is_active: data.early_phase_is_active,
        max_total_alloc: new Decimal(data.early_phase_max_total_alloc || 0)
          .mul(data.token_ratio)
          .toNumber(),
      },
      public_phase: {
        max_individual_alloc: new Decimal(
          data.public_phase_max_individual_alloc
        )
          .mul(data.token_ratio)
          .toNumber(),
      },
    },
    join_pool_start: new Date(data.join_pool_start),
    join_pool_end: new Date(data.join_pool_end),
    token_ratio: data.token_ratio,
    early_join_duration: data.early_join_duration,
    payer: payer,
    root_admin: new PublicKey(data.root_admin),
    platform: platform,
    token_to:
      data.token_to === 'SOL' ? WRAPPED_SOL_MINT : new PublicKey(data.token_to),
    token: new PublicKey(data.token_address),
  };
};

export const handdlePoolDataToUpdatePoolV2 = (
  data: Types.FormOnchainValues,
  payer: PublicKey
) => {
  return {
    campaign: {
      max_allocation_all_phases: new Decimal(data.max_allocation_all_phases)
        .mul(data.token_ratio)
        .toNumber(),
      claim_at: new Date(data.claim_at),
      exclusive_join_phase: {
        is_active: data.early_phase_is_active,
        max_total_alloc: new Decimal(data.early_phase_max_total_alloc || 0)
          .mul(data.token_ratio)
          .toNumber(),
      },
      public_phase: {
        max_individual_alloc: new Decimal(
          data.public_phase_max_individual_alloc
        )
          .mul(data.token_ratio)
          .toNumber(),
      },
    },
    join_pool_start: new Date(data.join_pool_start),
    join_pool_end: new Date(data.join_pool_end),
    token_ratio: data.token_ratio,
    early_join_duration: data.early_join_duration,
    payer: payer,
  };
};

export const handdlePoolDataToCreatePoolV3 = (
  data: Types.Pool,
  payer: PublicKey,
  platform: PublicKey
) => {
  return {
    campaign: {
      max_allocation_all_phases: new Decimal(data.max_allocation_all_phases)
        .mul(data.token_ratio)
        .toNumber(),
      claim_at: new Date(data.claim_at),
      exclusive_join_phase: {
        is_active: data.early_phase_is_active,
        max_total_alloc: new Decimal(data.early_phase_max_total_alloc || 0)
          .mul(data.token_ratio)
          .toNumber(),
      },
      public_phase: {
        max_individual_alloc: new Decimal(
          data.public_phase_max_individual_alloc
        )
          .mul(data.token_ratio)
          .toNumber(),
      },
      fcfs_stake_phase: {
        multiplication_rate: data.fcfs_stake_phase_multiplication_rate,
        is_active: data.fcfs_stake_phase_is_active,
      },
    },
    join_pool_start: new Date(data.join_pool_start),
    join_pool_end: new Date(data.join_pool_end),
    token_ratio: data.token_ratio,
    early_join_duration: data.early_join_duration,
    payer: payer,
    root_admin: new PublicKey(data.root_admin),
    platform: platform,
    token_to:
      data.token_to === 'SOL' ? WRAPPED_SOL_MINT : new PublicKey(data.token_to),
    token: new PublicKey(data.token_address),
    fcfs_stake_join_duration: data.fcfs_stake_duration,
  };
};

export const handdlePoolDataToUpdatePoolV3 = (
  data: Types.FormOnchainValues,
  payer: PublicKey
) => {
  return {
    campaign: {
      max_allocation_all_phases: new Decimal(data.max_allocation_all_phases)
        .mul(data.token_ratio)
        .toNumber(),
      claim_at: new Date(data.claim_at),
      exclusive_join_phase: {
        is_active: data.early_phase_is_active,
        max_total_alloc: new Decimal(data.early_phase_max_total_alloc || 0)
          .mul(data.token_ratio)
          .toNumber(),
      },
      public_phase: {
        max_individual_alloc: new Decimal(
          data.public_phase_max_individual_alloc
        )
          .mul(data.token_ratio)
          .toNumber(),
      },
      fcfs_stake_phase: {
        multiplication_rate: data.fcfs_stake_phase_multiplication_rate || 0,
        is_active: data.fcfs_stake_phase_is_active,
      },
    },
    join_pool_start: new Date(data.join_pool_start),
    join_pool_end: new Date(data.join_pool_end),
    token_ratio: data.token_ratio,
    early_join_duration: data.early_join_duration,
    payer: payer,
    fcfs_stake_join_duration: data.fcfs_stake_duration,
  };
};

export const handdlePoolDataToCreatePoolV4 = (
  data: Types.Pool,
  payer: PublicKey,
  platform: PublicKey
) => {
  return {
    campaign: {
      max_allocation_all_phases: new Decimal(data.max_allocation_all_phases)
        .mul(data.token_ratio)
        .toNumber(),
      claim_at: new Date(data.claim_at),
      exclusive_join_phase: {
        is_active: data.exclusive_phase_is_active,
        max_total_alloc: new Decimal(data.exclusive_phase_max_total_alloc || 0)
          .mul(data.token_ratio)
          .toNumber(),
      },
      public_phase: {
        max_individual_alloc: new Decimal(
          data.public_phase_max_individual_alloc
        )
          .mul(data.token_ratio)
          .toNumber(),
      },
      fcfs_stake_phase: {
        multiplication_rate: data.fcfs_stake_phase_multiplication_rate,
        is_active: data.exclusive_phase_is_active,
      },
      early_join_phase: {
        is_active: data.early_phase_is_active,
        max_total_alloc: new Decimal(data.early_phase_max_total_alloc || 0)
          .mul(data.token_ratio)
          .toNumber(),
      },
    },
    join_pool_start: new Date(data.join_pool_start),
    join_pool_end: new Date(data.join_pool_end),
    token_ratio: data.token_ratio,
    early_join_duration: data.early_join_duration,
    payer: payer,
    root_admin: new PublicKey(data.root_admin),
    platform: platform,
    token_to:
      data.token_to === 'SOL' ? WRAPPED_SOL_MINT : new PublicKey(data.token_to),
    token: new PublicKey(data.token_address),
    fcfs_stake_join_duration: data.fcfs_stake_duration,
    exclusive_join_duration: data.exclusive_join_duration,
    voting: {
      start_at: new Date(data.voting_start),
      end_at: new Date(data.voting_end),
    },
  };
};

export const handdlePoolDataToUpdatePoolV4 = (
  data: Types.FormOnchainValues,
  payer: PublicKey
) => {
  return {
    campaign: {
      max_allocation_all_phases: new Decimal(data.max_allocation_all_phases)
        .mul(data.token_ratio)
        .toNumber(),
      claim_at: new Date(data.claim_at),
      exclusive_join_phase: {
        is_active: data.exclusive_phase_is_active,
        max_total_alloc: new Decimal(data.exclusive_phase_max_total_alloc || 0)
          .mul(data.token_ratio)
          .toNumber(),
      },
      public_phase: {
        max_individual_alloc: new Decimal(
          data.public_phase_max_individual_alloc
        )
          .mul(data.token_ratio)
          .toNumber(),
      },
      fcfs_stake_phase: {
        multiplication_rate: data.fcfs_stake_phase_multiplication_rate || 0,
        is_active: !!data.exclusive_phase_is_active,
      },
      early_join_phase: {
        is_active: data.early_phase_is_active,
        max_total_alloc: new Decimal(data.early_phase_max_total_alloc || 0)
          .mul(data.token_ratio)
          .toNumber(),
      },
    },
    join_pool_start: new Date(data.join_pool_start),
    join_pool_end: new Date(data.join_pool_end),
    token_ratio: data.token_ratio,
    early_join_duration: data.early_join_duration,
    payer: payer,
    fcfs_stake_join_duration: data.fcfs_stake_duration,
    exclusive_join_duration: data.exclusive_join_duration,
    voting: {
      start_at: new Date(data.voting_start),
      end_at: new Date(data.voting_end),
    },
  };
};
