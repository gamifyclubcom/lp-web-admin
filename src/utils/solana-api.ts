import { Connection, PublicKey } from '@solana/web3.js';
import { AccountLayout, MintLayout, u64 } from '@solana/spl-token';
import { WRAPPED_SOL_MINT } from '@project-serum/serum/lib/token-instructions';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import { Actions } from '@gamify/onchain-program-sdk';

const SOL = 'SOL';

export const getTokenInfo = async (connection: Connection, tokenAddress: string) => {
  try {
    const data = (await connection.getAccountInfo(new PublicKey(tokenAddress)))?.data;

    if (!data) {
      return null;
    }
    const buf = Buffer.from(data);
    if (buf.length !== MintLayout.span) {
      return null;
    }
    const token = MintLayout.decode(buf);
    return {
      decimals: token.decimals,
      supply: new Decimal(u64.fromBuffer(token.supply).toString())
        .div(new Decimal(10).pow(new BN(token.decimals).toString()))
        .toString(),
    };
  } catch (e) {
    console.log(e);
    return null;
  }
};

// TODO move to sdk
export const getTokenDecimals = async (connection: Connection, token: string): Promise<number> => {
  const token_acc = await connection.getAccountInfo(token === SOL ? WRAPPED_SOL_MINT : new PublicKey(token));
  if (!token_acc?.data) {
    throw new Error(`Invalid token`);
  }
  const tokenInfo = MintLayout.decode(token_acc.data);
  return tokenInfo.decimals;
};

export const getTokenBalances = async (connection: Connection, token: string, address: string) => {
  const tokenDecimals = await getTokenDecimals(connection, token);
  const tokenPerAcc = await connection.getAccountInfo(new PublicKey(address));
  if (!tokenPerAcc?.data) {
    throw new Error(`Cannot get account info of address: ${address}`);
  }
  const tokenSalesData = AccountLayout.decode(tokenPerAcc.data);
  return new Decimal(u64.fromBuffer(tokenSalesData.amount).toString()).div(
    new Decimal(10).pow(new BN(tokenDecimals).toString())
  );
};

export const getBalance = async (connection: Connection, action: Actions, address: PublicKey) => {
  const tokenAddress = await action.getSPLMintTokenAccountInfo(address);
  if (!tokenAddress) {
    return new Decimal(await connection.getBalance(address)).div(new Decimal(10).pow(9)).toNumber();
  }

  if (tokenAddress.equals(WRAPPED_SOL_MINT)) {
    const rentBalance = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);
    return new Decimal(await connection.getBalance(address)).minus(rentBalance).div(new Decimal(10).pow(9)).toNumber();
  }

  const tokenDecimals = await action.getTokenDecimalsFromTokenAccount(tokenAddress);
  const tokenAcc = await connection.getAccountInfo(address);
  if (!tokenAcc?.data) {
    throw new Error(`Cannot get account info of address: ${address}`);
  }
  const tokenSalesData = AccountLayout.decode(tokenAcc.data);
  return new Decimal(u64.fromBuffer(tokenSalesData.amount).toString())
    .div(new Decimal(10).pow(tokenDecimals))
    .toNumber();
};
