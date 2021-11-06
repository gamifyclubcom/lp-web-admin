export type FormValues = {
  early_phase_is_active: boolean;
  exclusive_phase_is_active: boolean;
  fcfs_stake_phase_is_active: boolean;

  claim_at: string;
  join_pool_start: string;
  join_pool_end: string;
  early_join_duration: number;
  exclusive_join_duration: number;
  fcfs_stake_join_duration: number;

  new_claim_at: string;
  new_join_pool_start: string;
  new_join_pool_end: string;
  new_exclusive_join_duration: number;
  new_early_join_duration: number;
  new_fcfs_stake_join_duration: number;
};

export function getUpdatePoolV4TimingParams({
  data,
  earlyJoinIsActive,
  exclusiveJoinIsActive,
  fcfsStakersJoinIsActive,getValues
}: {
  data: FormValues;
  earlyJoinIsActive: boolean;
  exclusiveJoinIsActive: boolean;
  fcfsStakersJoinIsActive: boolean;
  getValues: any
}) {
  let earlyJoinStartAt: Date | null = null;
  let earlyJoinEndAt: Date | null = null;
  let exclusiveJoinStartAt: Date | null = null;
  let exclusiveJoinEndAt: Date | null = null;
  let fcfsStakeJoinStartAt: Date | null = null;
  let fcfsStakeJoinEndAt: Date | null = null;
  let publicJoinStartAt: Date | null = null;
  let publicJoinEndAt: Date | null = null;
  let claimAt: Date | null = null;
  let needUpdate = false;

  publicJoinEndAt = new Date(data.new_join_pool_end);
  claimAt = new Date(data.new_claim_at);
  if (
    new Date(data.new_join_pool_end).getTime() !== new Date(data.join_pool_end).getTime() ||
    new Date(data.new_claim_at).getTime() !== new Date(data.claim_at).getTime()
  ) {
    needUpdate = true;
  }
  if (earlyJoinIsActive) {
    earlyJoinStartAt = new Date(data.new_join_pool_start);
    earlyJoinEndAt = new Date(new Date(data.new_join_pool_start).getTime() + data.new_early_join_duration * 60 * 1000);
    publicJoinStartAt = earlyJoinEndAt;
    if (
      new Date(data.join_pool_start).getTime() !== new Date(data.new_join_pool_start).getTime() ||
      new Date(data.new_early_join_duration).getTime() !== new Date(data.early_join_duration).getTime()
    ) {
      needUpdate = true;
    }
  } else if (exclusiveJoinIsActive) {
    exclusiveJoinStartAt = new Date(data.new_join_pool_start);
    exclusiveJoinEndAt = new Date(
      new Date(data.new_join_pool_start).getTime() + data.new_exclusive_join_duration * 60 * 1000
    );
    publicJoinStartAt = exclusiveJoinEndAt;
    if (
      new Date(data.join_pool_start).getTime() !== new Date(data.new_join_pool_start).getTime() ||
      new Date(data.new_exclusive_join_duration).getTime() !== new Date(data.exclusive_join_duration).getTime()
    ) {
      needUpdate = true;
    }
    if (fcfsStakersJoinIsActive) {
      fcfsStakeJoinStartAt = exclusiveJoinEndAt;
      fcfsStakeJoinEndAt = new Date(
        fcfsStakeJoinStartAt.getTime() + getValues('new_fcfs_stake_join_duration') * 60 * 1000
      );
      publicJoinStartAt = fcfsStakeJoinEndAt;
      if (getValues('new_fcfs_stake_join_duration') !== data.fcfs_stake_join_duration) {
        needUpdate = true;
      }
    }
  } else {
    publicJoinStartAt = new Date(data.new_join_pool_start);
    if (new Date(data.join_pool_start).getTime() !== new Date(data.new_join_pool_start).getTime()) {
      needUpdate = true;
    }
  }

  return {
    needUpdate,
    earlyJoinEndAt,
    exclusiveJoinEndAt,
    fcfsStakeJoinEndAt,
    earlyJoinStartAt,
    exclusiveJoinStartAt,
    fcfsStakeJoinStartAt,
    publicJoinStartAt,
    publicJoinEndAt,
    claimAt
  };
}

export function getUpdatePoolV3TimingParams({
  data,
  exclusiveJoinIsActive,
  fcfsStakersJoinIsActive,getValues
}: {
  data: FormValues;
  exclusiveJoinIsActive: boolean;
  fcfsStakersJoinIsActive: boolean;
  getValues: any
}) {
  let earlyJoinStartAt: Date | null = null;
  let earlyJoinEndAt: Date | null = null;
  let fcfsStakeJoinStartAt: Date | null = null;
  let fcfsStakeJoinEndAt: Date | null = null;
  let publicJoinStartAt: Date | null = null;
  let publicJoinEndAt: Date | null = null;
  let claimAt: Date | null = null;
  let needUpdate = false;

  publicJoinEndAt = new Date(data.new_join_pool_end);
  claimAt = new Date(data.new_claim_at);
  if (
    new Date(data.new_join_pool_end).getTime() !== new Date(data.join_pool_end).getTime() ||
    new Date(data.new_claim_at).getTime() !== new Date(data.claim_at).getTime()
  ) {
    needUpdate = true;
  }if (exclusiveJoinIsActive) {
    earlyJoinStartAt = new Date(data.new_join_pool_start);
    earlyJoinEndAt = new Date(
      new Date(data.new_join_pool_start).getTime() + data.new_exclusive_join_duration * 60 * 1000
    );
    publicJoinStartAt = earlyJoinEndAt;
    if (
      new Date(data.join_pool_start).getTime() !== new Date(data.new_join_pool_start).getTime() ||
      new Date(data.new_exclusive_join_duration).getTime() !== new Date(data.exclusive_join_duration).getTime()
    ) {
      needUpdate = true;
    }
    if (fcfsStakersJoinIsActive) {
      fcfsStakeJoinStartAt = earlyJoinEndAt;
      fcfsStakeJoinEndAt = new Date(
        fcfsStakeJoinStartAt.getTime() + getValues('new_fcfs_stake_join_duration') * 60 * 1000
      );
      publicJoinStartAt = fcfsStakeJoinEndAt;
      if (getValues('new_fcfs_stake_join_duration') !== data.fcfs_stake_join_duration) {
        needUpdate = true;
      }
    }
  } else {
    publicJoinStartAt = new Date(data.new_join_pool_start);
    if (new Date(data.join_pool_start).getTime() !== new Date(data.new_join_pool_start).getTime()) {
      needUpdate = true;
    }
  }

  return {
    needUpdate,
    earlyJoinEndAt,
    fcfsStakeJoinEndAt,
    earlyJoinStartAt,
    fcfsStakeJoinStartAt,
    publicJoinStartAt,
    publicJoinEndAt,
    claimAt
  };
}
