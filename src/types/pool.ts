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
  rate?: number; // token ratio
  campaign: PoolCampaign;
  is_active: boolean;
  platform: string;
  admins: PoolAdministrators;
};
