import BN from "bn.js";
import { queryStateI } from "../request";
import { FLAG_BUY } from "../components/Commands";
import { Market } from "../data/market";
import { FEE, FEE_TOKEN_INDEX } from "../components/Commands";

export function removeHexPrefix(value: string): string {
  return value.startsWith("0x") ? value.slice(2) : value;
}

export function formatAddress(address: string) {
  // Remove the "0x" prefix if it exists
  let cleanAddress = removeHexPrefix(address);

  // Ensure the address is 40 characters long by padding with leading zeros
  while (cleanAddress.length < 40) {
    cleanAddress = "0" + cleanAddress;
  }

  // Ensure it's exactly 40 characters
  if (cleanAddress.length !== 40) {
    throw new Error("Invalid address, cannot pad to 40 characters.");
  }

  // Re-add the "0x" prefix
  return "0x" + cleanAddress;
}

// Validate if the index is in valid scope
export const validateIndex = (index: number, maxLength: number = 32) => {
  return index >= 0 && index < 2 ** maxLength;
};

export function validateHexString (value: string, maxLength: number = 64) {
  // Create a dynamic regular expression based on the maxLength parameter
  const regex = new RegExp(`^(0x)?[0-9a-fA-F]{1,${maxLength}}$`);

 // Check if the value is a valid hex string (optional 0x prefix)
 if (!regex.test(value)) {
   throw new Error(`Invalid input. Must be a valid hex string with up to ${maxLength} characters.`);
 }

 return null; // Return null if valid
};

export const formatErrorMessage = (error: any): string => {
  const fullMessage = error.message || "Unknown error";

  const message = fullMessage.replace(/\([^)]*\)/g, "");

  if (message) {
    return message;
  } else {
    return fullMessage.Error;
  }
};

function bytesToHex(bytes: Array<number>): string  {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function address2BigUint64Array(address: string): BigUint64Array {
  address = address.startsWith("0x") ? address.slice(2): address;
  let addressBN = new BN(address, 16);
  let a = addressBN.toArray("be", 20); // 20 bytes = 160 bits and split into 4, 8, 8

  console.log("address is", address);
  console.log("address be is", a);


  /*
(32 bit amount | 32 bit highbit of address)
(64 bit mid bit of address (be))
(64 bit tail bit of address (be))
   */


  let firstLimb = BigInt('0x' + bytesToHex(a.slice(0,4).reverse()));
  let sndLimb = BigInt('0x' + bytesToHex(a.slice(4,12).reverse()));
  let thirdLimb = BigInt('0x' + bytesToHex(a.slice(12, 20).reverse()));
  return new BigUint64Array([firstLimb<<32n, sndLimb, thirdLimb]);
}

export async function getNonce(processingKey: string): Promise<bigint> {
  let state:any = await queryStateI(processingKey);
  let nonce = 0n;
  if (state.player) {
    nonce = BigInt(state.player.nonce);
  }
  return nonce;
}

export const checkHelper = (before: any, after: any, market: Market, flag: bigint, cost: bigint) => {
  if(("order_id_counter" in before.state?before.state["order_id_counter"]:0) + 1 !== ("order_id_counter" in after.state?after.state["order_id_counter"]:0)) {
    throw new Error("Client check error: order_id_counter before adding order is " + before.state?.order_id_counter + ", order_id_counter after adding order is " + after.state?.order_id_counter);
  }

  let tokenIdx = 0;
  if (flag === BigInt(FLAG_BUY)) {
    tokenIdx = market.tokenA;
  } else {
    tokenIdx = market.tokenB;
  }
  if(tokenIdx === 0) {
    if (BigInt(after.player.data.positions[tokenIdx].lock_balance - before.player.data.positions[tokenIdx].lock_balance) !== cost + BigInt(FEE)) {
      throw new Error("Client check error: feetokenIndex is " + FEE_TOKEN_INDEX +", feeTokenIndex' lock_balance before adding order is " + after.player.data.positions[tokenIdx].lock_balance + ", feeTokenIndex' lock_balance after adding order is " + before.player.data.positions[tokenIdx].lock_balance);
    }
    if (BigInt(before.player.data.positions[tokenIdx].balance - after.player.data.positions[tokenIdx].balance) !== cost + BigInt(FEE)) {
      throw new Error("Client check error: feetokenIndex is " + FEE_TOKEN_INDEX +", feeTokenIndex' balance before adding order is " + after.player.data.positions[tokenIdx].balance + ", feeTokenIndex' balance after adding order is " + before.player.data.positions[tokenIdx].balance);
    }
  } else {
    if (BigInt(after.player.data.positions[tokenIdx].lock_balance - before.player.data.positions[tokenIdx].lock_balance) !== cost) {
      throw new Error("Client check error: tokenIndex is " + tokenIdx +", tokenIndex' lock_balance before adding order is " + after.player.data.positions[tokenIdx].lock_balance + ", tokenIndex' lock_balance after adding order is " + before.player.data.positions[tokenIdx].lock_balance);
    }
    if (BigInt(before.player.data.positions[tokenIdx].balance - after.player.data.positions[tokenIdx].balance) !== cost) {
      throw new Error("Client check error: tokenIndex is " + tokenIdx +", tokenIndex' balance before adding order is " + after.player.data.positions[tokenIdx].balance + ", tokenIndex' balance after adding order is " + before.player.data.positions[tokenIdx].balance);
    }

    let feeTokenIndex = 0;
    if (BigInt(after.player.data.positions[feeTokenIndex].lock_balance) - BigInt(before.player.data.positions[feeTokenIndex].lock_balance) !== BigInt(FEE)) {
      throw new Error("Client check error: feetokenIndex is " + FEE_TOKEN_INDEX +", feeTokenIndex' lock_balance before adding order is " + after.player.data.positions[feeTokenIndex].lock_balance + ", feeTokenIndex' lock_balance after adding order is " + before.player.data.positions[feeTokenIndex].lock_balance);
    }
    if (BigInt(before.player.data.positions[feeTokenIndex].balance) - BigInt(after.player.data.positions[feeTokenIndex].balance) !== BigInt(FEE)) {
      throw new Error("Client check error: feetokenIndex is " + FEE_TOKEN_INDEX +", feeTokenIndex' balance before adding order is " + before.player.data.positions[feeTokenIndex].balance  + ", feeTokenIndex' balance after adding order is " + after.player.data.positions[feeTokenIndex].balance);
    }
  }
}

// extract and simplify error messages for loginL1AccountAsync
export function extractErrorMessage(errorMessage: string): string {
  const regex = /Try adding the chain using wallet_addEthereumChain first./;
  const match = errorMessage.match(regex);
  if (match) {
    const chainIdMatch = errorMessage.match(/"chainId":\s?"(0x[0-9a-fA-F]+)"/);
    if (chainIdMatch) {
      return `Please manually add the correct network (Chain ID: ${chainIdMatch[1]}) to MetaMask before proceeding.`;
    }
  }
  return errorMessage;
}