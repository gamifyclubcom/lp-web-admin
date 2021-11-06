import { ENV as ChainID } from '@solana/spl-token-registry';
import { ESolletEnv, PoolStatusType } from './enum';

export type TAllocationLevel = 1 | 2 | 3 | 4 | 5;

export interface IPoolStatus {
  type: PoolStatusType;
  diff: string;
  message: string;
}

export interface ISolletChain {
  name: ESolletEnv;
  endpoint: string;
  chainID: ChainID;
}

export interface IAllocationLevel {
  level: TAllocationLevel;
  color: string;
  textColor: string;
  title: string;
  minAllocation: number;
  allocationRatio: number;
}
