export type PoolAdministrators = {
  root_admin: string;
};

export type Token = {
  token_address: string;
  token_decimals: number;
  token_name: string;
  token_symbol: string;
  token_total_supply: number;
  token_liquidity_lock: number;
};

export type PoolCampaign = {
  max_allocation_all_phases: number;
  number_whitelisted_user: number;
  claim_at: string;
  early_join_phase: PoolPhase;
  public_phase: PoolPhase;
};

export type Fees = {
  numerator: number;
  denominator: number;
};

export type Rates = {
  numerator: number;
  denominator: number;
};

export type PoolPhase = {
  is_active: boolean;
  max_total_alloc: number;
  max_individual_alloc: number;
  sold_allocation: number;
  number_joined_user: number;
  start_at: string;
  end_at: string;
};

export type PoolContractData = {
  is_initialized: boolean;
  nonce: string;
  id: string;
  token_x: string;
  token_y: string;
  fees?: Fees;
  token_ratio?: number; // token ratio
  campaign: PoolCampaign;
  is_active: boolean;
  platform: string;
  admins: PoolAdministrators;
};
export type PoolTier = {
  is_active: boolean;
  max_individual_amount: number;
  number_of_users: number;
  weight: number;
};
export type Pool = {
  _id?: string;
  version: number;
  exclusive_snapshot_time?: Date;
  exclusive_level1?: PoolTier;
  exclusive_level2?: PoolTier;
  exclusive_level3?: PoolTier;
  exclusive_level4?: PoolTier;
  exclusive_level5?: PoolTier;
} & PoolOffchain &
  PoolOnchain &
  PoolToken;

export type PoolToken = {
  token_address: string;
  token_decimals: number;
  token_name: string;
  token_symbol: string;
  token_total_supply: string;
  token_liquidity_lock: number;
};

export type PoolOffchain = {
  program_id: string;
  logo?: string;
  thumbnail?: string;
  name: string;
  slug?: string;
  website?: string;
  token_economic?: string;
  twitter?: string;
  pool_start: string;
  telegram?: string;
  contract_address: string;
  medium?: string;
  description?: string;
  tag_line?: string;
  token_to: string;
  audit_link?: string;
  liquidity_percentage?: number;
  claimable_percentage?: number;
  flags?: {
    /**
     * Check pool ready join or not
     * got this from pool version 4 or greater
     * by pass if pool voting time is already ended and absolute vote (total vote up - total vote down > min vote)
     */
    is_ready?: boolean;

    /**
     * Check pool is finalize participants or not
     */
    is_finalize_participants?: boolean;

    /**
     * Check cron finalize participants is running or not
     */
    is_cron_running?: boolean;
  };
};

export type PoolOnchain = {
  is_active: boolean;
  is_initialized: boolean;
  id: string;
  token_x: string;
  token_y: string;
  token_ratio: number;
  platform: string;
  root_admin: string;
  max_allocation_all_phases: number;
  claim_at: string;
  join_pool_start: string;
  join_pool_end: string;
  early_phase_is_active: boolean;
  early_join_duration: number;
  early_phase_max_total_alloc: number;
  public_phase_max_individual_alloc: number;
  fcfs_stake_phase_is_active: boolean;
  fcfs_stake_phase_multiplication_rate?: number;
  fcfs_stake_duration?: number;
  exclusive_phase_is_active: boolean;
  exclusive_join_duration: number;
  exclusive_phase_max_total_alloc: number;
  fees: number;
  sold_amount: number;
  voting_phase_is_active: boolean;
  voting_start: string;
  voting_end: string;
  max_voting_days: number;
  is_enough_vote: boolean;
};

export type Pools = Pool[];

export type WhitelistedUser = {
  poolId: string;
  userPoolMemberAccount: string;
  userAccount: string;
  isWhitelisted: boolean;
  name: string;
  email: string;
  wallet_address: string;
  is_private: boolean;
  count_down: boolean;
};

export type WhitelistUsers = WhitelistedUser[];

export type ServerError = {
  code: string | number;
  message: string;
};

export type Admin = {
  _id: string;
  id: string;
  avatar: string;
  address: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type TokenInfo = {
  address: string;
  symbol: string;
  name: string;
  amount: number | undefined;
};

export type Admins = Admin[];

export type FormOnchainValues = PoolOnchain & { _id?: string };
export type FormOffchainValues = PoolOffchain & PoolToken & { _id?: string };
