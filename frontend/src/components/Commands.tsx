import React, { useState } from 'react';
import { MDBBtn, MDBContainer, MDBRow, MDBCol, MDBIcon } from 'mdb-react-ui-kit';
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { sendTransaction, queryStateI, queryState } from "../request";
import { createCommand, LeHexBN } from "zkwasm-minirollup-rpc";
import { selectUserState, Order } from '../data/state';
import { address2BigUint64Array, getNonce } from "../utils/transaction";
import { AccountSlice } from "zkwasm-minirollup-browser";
import { ResultModal } from "../modals/ResultModal";
import AddTokenModal from "../modals/AddTokenModal";
import UpdateTokenModal from "../modals/UpdateTokenModal";
import WithdrawTokenModal from "../modals/WithdrawTokenModal";
import AddLimitOrderModal from "../modals/AddLimitOrderModal";
import AddMarketOrderModal from "../modals/AddMarketOrderModal";
import CancelOrderModal from "../modals/CancelOrderModal";
import AddMarketModal from "../modals/AddMarketModal";
import CloseMarketModal from "../modals/CloseMarketModal";
import TransferModal from "../modals/TransferModal";
import DepositTokenModal from "../modals/DepositTokenModal";
import { selectMarketInfo } from "../data/market";
import { checkHelper } from "../utils/transaction";
import { Market } from "../data/market";

const PRECISION = BigInt(1e9);
const MAX_64_BIT = BigInt('9223372036854775807');
export const FEE = 3;
export const FEE_TOKEN_INDEX = 0;
const TYPE_LIMIT = 0;
const TYPE_MARKET = 1;
const MARKET_STATUS_CLOSE = 0;
// Order status
const STATUS_LIVE = 0;
export const FLAG_BUY = 1;
const FLAG_SELL = 0;
const CMD_ADD_TOKEN = 1n;
const CMD_UPDATE_TOKEN = 12n;
const CMD_ADD_MARKET = 2n;
const CMD_DEPOSIT_TOKEN = 3n;
const CMD_ADD_LIMIT_ORDER = 5n;
const CMD_ADD_MARKET_ORDER = 6n;
const CMD_CANCEL_ORDER = 7n;
const CMD_CLOSE_MARKET = 8n;
const CMD_TRANSFER = 9n;
const CMD_WITHDRAW = 10n;
const CMD_ADD_TRADE = 11n;
const SEVER_ADMIN_KEY = "1234567";

export default function Commands() {
  const dispatch = useAppDispatch();
  const userState = useAppSelector(selectUserState);
  const l2account = useAppSelector(AccountSlice.selectL2Account);
  const marketInfo = useAppSelector(selectMarketInfo);
  const [infoMessage, setInfoMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [showUpdateTokenModal, setShowUpdateTokenModal] = useState(false);
  const [showWithdrawTokenModal, setShowWithdrawTokenModal] = useState(false);
  const [showAddLimitOrderModal, setShowAddLimitOrderModal] = useState(false);
  const [showAddMarketOrderModal, setShowAddMarketOrderModal] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [showAddMarketModal, setShowAddMarketModal] = useState(false);
  const [showCloseMarketModal, setShowCloseMarketModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDepositTokenModal, setShowDepositTokenModal] = useState(false);

  const nonce = userState?.player?.nonce || 0;

  const addToken = async (tokenIndex: bigint, address: string) => {
    if(!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      setShowAddTokenModal(false);
      return;
    }

    let addr = address2BigUint64Array(address);
    let params = [tokenIndex];
    params.push(...addr);

    const nonce = await getNonce(SEVER_ADMIN_KEY);
    let action = await dispatch(
      sendTransaction({
        cmd: createCommand(BigInt(nonce), CMD_ADD_TOKEN, params),
        prikey: SEVER_ADMIN_KEY,
      })
    );

    if (sendTransaction.fulfilled.match(action)) {
      const infoMessage: string = "Token added successfully!";
      return infoMessage;
    } else if(sendTransaction.rejected.match(action)) {
      throw Error("Error: " +  action.payload);
    }
  }

  const updateToken = async (tokenIndex: bigint, address: string) => {
    if(!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      setShowUpdateTokenModal(false);
      return;
    }

    let addr = address2BigUint64Array(address);
    let params = [tokenIndex];
    params.push(...addr);

    const nonce = await getNonce(SEVER_ADMIN_KEY);
    let action = await dispatch(
      sendTransaction({
        cmd: createCommand(BigInt(nonce), CMD_UPDATE_TOKEN, params),
        prikey: SEVER_ADMIN_KEY,
      })
    );
    if (sendTransaction.fulfilled.match(action)) {
      const infoMessage: string = "Token updated successfully!";
      return infoMessage;
    } else if(sendTransaction.rejected.match(action)) {
      throw Error("Error: " +  action.payload);
    }
  }

  const depositToken = async (pid: string, tokenIdx: bigint, amount: bigint) => {
    if(!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      setShowDepositTokenModal(false);
      return;
    }
    let pid2 = new LeHexBN(pid).toU64Array();
    let params = [pid2[1], pid2[2], tokenIdx, amount];

    const nonce = await getNonce(SEVER_ADMIN_KEY);
    const action = await dispatch(
      sendTransaction({
        cmd: createCommand(BigInt(nonce), CMD_DEPOSIT_TOKEN, params),
        prikey: SEVER_ADMIN_KEY,
      })
    );
    if (sendTransaction.fulfilled.match(action)) {
      const infoMessage: string = "Token deposited successfully!";
      return infoMessage;
    } else if(sendTransaction.rejected.match(action)) {
      throw new Error("Error: " +  action.payload);
    }
  }

  const withdrawToken = async (tokenIndex: bigint, address: string, amount: bigint) => {
    if(!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      setShowWithdrawTokenModal(false);
      return;
    }

    let addr = address2BigUint64Array(address);
    let params = [tokenIndex];
    params.push(...addr);
    params.push(amount);
    let action = await dispatch(
      sendTransaction({
        cmd: createCommand(BigInt(nonce), CMD_WITHDRAW, params),
        prikey: l2account!.getPrivateKey(),
      })
    );
    if (sendTransaction.fulfilled.match(action)) {
      const infoMessage: string = "Token withdrawed successfully!";
      return infoMessage;
    } else if(sendTransaction.rejected.match(action)) {
      let message = "";
      if(String(action.payload).includes("BalanceNotEnough")) {
        const index = tokenIndex.toString();
        const balance = userState!.player!.data.positions[index].balance;
        message = ". Wallet player's balance for Token " + index + ": " + balance;
      }
      throw new Error("Error: " +  action.payload + message);
    }
  }

  const transfer = async (pid: string, tokenIdx: bigint, amount: bigint) => {
    if(!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      setShowTransferModal(false);
      return;
    }

    let pid2 = new LeHexBN(pid).toU64Array();
    let params = [pid2[1], pid2[2], tokenIdx, amount];

    const nonce = await getNonce(SEVER_ADMIN_KEY);
    let action = await dispatch(
      sendTransaction({
        cmd: createCommand(BigInt(nonce), CMD_TRANSFER,  params),
        prikey: SEVER_ADMIN_KEY,
      })
    );
    if (sendTransaction.fulfilled.match(action)) {
      const infoMessage: string = "Token transfered successfully!";
      return infoMessage;
    } else if(sendTransaction.rejected.match(action)) {
      let message = "";
      let state:any = await queryStateI(SEVER_ADMIN_KEY);
      if(String(action.payload).includes("BalanceNotEnough")) {
        const index = tokenIdx.toString();
        const balance = state!.player!.data.positions[index].balance;
        message = ". Server admin's balance for Token " + index + ": " + balance;
      }
      throw new Error("Error: " +  action.payload + message);
    }
  }

  const addTrade = async (aOrderId: bigint, bOrderId: bigint, aActualAmount: bigint, bActualAmount: bigint) => {
    if(!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      return;
    }


    if(aOrderId === 0n || bOrderId === 0n) {
      console.log("add trade, a order or b order is none");
      return;
    }
    let params = [aOrderId, bOrderId, aActualAmount, bActualAmount];
    console.log("add trade, aOrderId, bOrderId", aOrderId, bOrderId);
    const nonce = await getNonce(SEVER_ADMIN_KEY);
    let action = await dispatch(
      sendTransaction({
        cmd: createCommand(BigInt(nonce), CMD_ADD_TRADE, params),
        prikey: SEVER_ADMIN_KEY,
      })
    );
    if (sendTransaction.fulfilled.match(action)) {
      const trades = action.payload.state.trades;
      const latestTrade = trades[trades.length - 1];
      return "Success: latest trade is " + JSON.stringify(latestTrade);
    } else if(sendTransaction.rejected.match(action)) {
      throw Error("Error: " +  action.payload);
    }
  }

  const checkOrders = (
    orders: Order[],
    aOrderId: bigint,
    bOrderId: bigint,
    aActualAmount: bigint,
    bActualAmount: bigint
  ) => {
    const aOrder = orders.filter(order => order.id === Number(aOrderId));
    const bOrder = orders.filter(order => order.id === Number(bOrderId));
    if(aOrder.length === 0 || bOrder.length === 0) {
      console.log("add trade, order not found. aOrderId is " + aOrderId + ", bOrderId is " + bOrderId);
      return false;
    }
    const filteredMarkets = marketInfo.filter(market => market.marketId === aOrder[0].market_id);
    if(filteredMarkets[0].status === MARKET_STATUS_CLOSE) {
      console.log("add trade, market is closed");
      return false;
    }
    if(JSON.stringify(aOrder[0].pid) === JSON.stringify(bOrder[0].pid)) {
      console.log("add trade, a order and b order is from same user");
      return false;
    }
    if(!(aOrder[0].status === STATUS_LIVE && bOrder[0].status === STATUS_LIVE)) {
      console.log("aOrder", aOrder);
      console.log("add trade, a order or b order is not live. The a order status is" + aOrder[0].status + ", b order status is" + bOrder[0].status);
      return false;
    }
    if (aOrder[0].market_id !== bOrder[0].market_id) {
      console.log("add trade, orders are not in the same market");
      return false;
    }
    if (!(aOrder[0].flag === FLAG_BUY && bOrder[0].flag === FLAG_SELL)) {
      console.log("add trade, order types do not match: a order should be buy or b order should be sell");
      return false;
    }
    if (aOrder[0].type_ === TYPE_MARKET && bOrder[0].type_ === TYPE_MARKET) {
      console.log("add trade, a order and b order is market order");
      return false;
    }
    if (!(BigInt(aOrder[0].lock_balance) >= aActualAmount && bOrder[0].lock_balance >= bActualAmount)) {
      console.log("balance not match\n");
      return false;
    }
    return true;
  }

  const matchOrdersGetTradeParams = async (orders: Order[], incomingOrder: Order) => {
    let result = {aOrderId: 0n, bOrderId: 0n, aActualAmount: 0n, bActualAmount: 0n};
    if (incomingOrder.flag === FLAG_BUY) {
      // Buy order: Sort sell orders by price (ascending)
      let sellOrders = orders.filter(order => order.flag === FLAG_SELL);
      sellOrders.sort((a, b) => Number(a.price - b.price));  // Sort sell orders from low to high price

      let price = 0;

      // Traverse the sell orders and match
      for (let sellOrder of sellOrders) {
        // Buy order price >= Sell order price
        if(incomingOrder.type_ === TYPE_LIMIT && sellOrder.type_ === TYPE_LIMIT) {
          if(incomingOrder.price <= sellOrder.price) {
            console.log("both a and b is limit order but not buy price >= sell price \n");
            continue;
          }
        }

        if(incomingOrder.type_ === TYPE_LIMIT) {
          if(sellOrder.type_ === TYPE_LIMIT) {
            price = sellOrder.price;
          } else {
            price = incomingOrder.price;
          }
        } else {
          price = sellOrder.price;
        }

        // Get buy amount and sell amount
        let aActualAmount = 0;
        let bActualAmount = 0;
        if(incomingOrder.type_ === TYPE_LIMIT) {
          aActualAmount = incomingOrder.b_token_amount;
        } else {
          if(incomingOrder.a_token_amount !== 0) {
            aActualAmount = incomingOrder.a_token_amount;
          } else {
            aActualAmount = incomingOrder.b_token_amount;
          }
        }
        if(sellOrder.type_ === TYPE_LIMIT) {
          bActualAmount = sellOrder.b_token_amount;
        } else {
          if(sellOrder.a_token_amount !== 0) {
            bActualAmount = sellOrder.a_token_amount;
          } else {
            bActualAmount = sellOrder.b_token_amount;
          }
        }

        // Calculate the buy orders' expected amount based on the price
        let aAmount = BigInt(price * bActualAmount) / PRECISION;

        if (aAmount > MAX_64_BIT) {
          console.log("price * b_token_amount overflow\n");
          continue;
        }

        // Ensure aAmount matches buy order's expected amount
        if (aAmount !== BigInt(aActualAmount)) {
          console.log("(price * sell order's expected amount) does not match buy order's expected amount\n");
          continue;
        }

        const res = checkOrders(
          orders,
          BigInt(incomingOrder.id),
          BigInt(sellOrder.id),
          BigInt(aActualAmount),
          BigInt(bActualAmount)
        );
        if(!res) {
          continue;
        }
        result = {
          aOrderId: BigInt(incomingOrder.id),
          bOrderId: BigInt(sellOrder.id),
          aActualAmount: BigInt(aActualAmount),
          bActualAmount: BigInt(bActualAmount)
        };
        break;  // Stop once a match is found
      }
      return result;
    } else if (incomingOrder.flag === FLAG_SELL) {
      // Sell order: Sort buy orders by price (descending)
      let buyOrders = orders.filter(order => order.flag === FLAG_BUY);
      buyOrders.sort((a, b) => Number(b.price - a.price));  // Sort buy orders from high to low price

      let price = 0;

      // Traverse the buy orders and match
      for (let buyOrder of buyOrders) {
        // Buy order price >= Sell order price
        if(incomingOrder.type_ === TYPE_LIMIT && buyOrder.type_ === TYPE_LIMIT) {
          if(buyOrder.price <= incomingOrder.price) {
            console.log("both a and b is limit order but not buy price >= sell price \n");
            continue;
          }
        }

        if(buyOrder.type_ === TYPE_LIMIT) {
          if(incomingOrder.type_ === TYPE_LIMIT) {
            price = incomingOrder.price;
          } else {
            price = buyOrder.price;
          }
        } else {
          price = incomingOrder.price;
        }

        // Get buy amount and sell amount
        let aActualAmount = 0;
        let bActualAmount = 0;
        if(buyOrder.type_ === TYPE_LIMIT) {
          aActualAmount = buyOrder.b_token_amount;
        } else {
          if(buyOrder.a_token_amount !== 0) {
            aActualAmount = buyOrder.a_token_amount;
          } else {
            aActualAmount = buyOrder.b_token_amount;
          }
        }
        if(incomingOrder.type_ === TYPE_LIMIT) {
          bActualAmount = incomingOrder.b_token_amount;
        } else {
          if(incomingOrder.a_token_amount !== 0) {
            bActualAmount = incomingOrder.a_token_amount;
          } else {
            bActualAmount = incomingOrder.b_token_amount;
          }
        }

        // Calculate the buy orders' expected amount based on the price
        let aAmount = BigInt(price * bActualAmount) / PRECISION;

        if (aAmount > MAX_64_BIT) {
          console.log("price * b_token_amount overflow\n");
          continue;
        }

        // Ensure aAmount matches buy order's expected amount
        if (aAmount !== BigInt(aActualAmount)) {
          console.log("(price * sell order's expected amount) does not match buy order's expected amount\n");
          continue;
        }
        const res = checkOrders(
          orders,
          BigInt(buyOrder.id),
          BigInt(incomingOrder.id),
          BigInt(aActualAmount),
          BigInt(bActualAmount)
        );
        if(!res) {
          continue;
        }
        result = {
          aOrderId: BigInt(buyOrder.id),
          bOrderId: BigInt(incomingOrder.id),
          aActualAmount: BigInt(aActualAmount),
          bActualAmount: BigInt(bActualAmount)
        };
        break;  // Stop once a match is found
      }
      return result;
    }
  }

  async function orderCheck(
    f: ()=> any,
    market: Market,
    flag: bigint,
    cost: bigint,
    check:(before: any, after: any, market: Market, flag: bigint, cost: bigint) => void) {
    // Query state before placing the market order
    let before = await dispatch(queryState(l2account!.getPrivateKey()));
    const action = await f();

    // Query state after placing the market order
    let after = await dispatch(queryState(l2account!.getPrivateKey()));

    check(before.payload, after.payload, market, flag, cost);

    return action;
  }

  const addMarketOrder = async (marketId: bigint, flag: bigint, bTokenAmount: bigint, aTokenAmount: bigint) => {
    if (!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      setShowAddMarketOrderModal(false);
      return;
    }

    // Send transaction to add market order
    let f = async () => {
      let params = [marketId, flag, bTokenAmount, aTokenAmount];
      let action = await dispatch(
        sendTransaction({
          cmd: createCommand(BigInt(nonce), CMD_ADD_MARKET_ORDER, params),
          prikey: l2account!.getPrivateKey(),
        })
      );
      return action;
    }

    const filteredMarkets = marketInfo.filter(market => BigInt(market.marketId) === marketId);
    if(filteredMarkets.length === 0) {
      setInfoMessage("Market not exist");
      setShowResult(true);
      setShowAddLimitOrderModal(false);
      return;
    }
    const market = filteredMarkets[0];
    let tokenIndex = 0;
    let cost = 0n;
    if (flag === BigInt(FLAG_BUY)) {  // If it's a Buy order
      tokenIndex = market.tokenA;
      if (aTokenAmount !== 0n) {
        cost = aTokenAmount;
      } else {
        cost = bTokenAmount * BigInt(market.lastPrice) / PRECISION;
        console.log("cost", cost)
        if(cost > MAX_64_BIT) {
          throw new Error("cost overflow");
        }
        cost = cost * 2n;
        console.log("cost * 2", cost)
      }
    } else if (flag === BigInt(FLAG_SELL)) {  // If it's a Sell order
      tokenIndex = market.tokenB;
      if (bTokenAmount !== 0n) {
          cost = bTokenAmount;
      } else {
          cost = (aTokenAmount * 2n * PRECISION) / BigInt(market.lastPrice);
      }
    }

    // positions' length is 2 now
    let position = userState!.player!.data.positions[tokenIndex];
    if(BigInt(position.balance) < cost) {
      throw new Error("Insufficient balance. cost is " + cost + ". balance is " + position.balance);
    }
    let newLockBalance = BigInt(position.lock_balance) + cost;
    if(newLockBalance > MAX_64_BIT) {
      throw new Error("lock_balance overflow");
    }

    position = userState!.player!.data.positions[FEE_TOKEN_INDEX];
    if(position.balance < FEE) {
      throw new Error("Insufficient fee balance");
    }
    newLockBalance = BigInt(position.lock_balance + FEE);
    if(BigInt(newLockBalance) > MAX_64_BIT) {
      throw new Error("fee lock_balance overflow");
    }

    const action = await orderCheck(f, market, flag, cost, checkHelper);

    let successMessage = "";
    if (sendTransaction.fulfilled.match(action)) {
      // Return success message along with the result
      const orders = action.payload.state.orders;
      const latestOrder = orders[orders.length - 1];
      successMessage += "Success: latest order is " + JSON.stringify(latestOrder) + "\n";

      // Try match orders. If matched, get addTrade parameters
      const params = await matchOrdersGetTradeParams(orders, latestOrder);
      const addTradeResult = await addTrade(params!.aOrderId, params!.bOrderId, params!.aActualAmount, params!.bActualAmount);
      if(addTradeResult) {
        successMessage += " " + addTradeResult;
      }
      return successMessage;
    } else if (sendTransaction.rejected.match(action)) {
      let message = "";
      const index = tokenIndex.toString();
      const balance = userState!.player!.data.positions[index].balance;
      const lockBalance = userState!.player!.data.positions[index].balance;
      message = ". Wallet player's balance for Token " + index + ": " + balance + ". Wallet player's lock balance for Token " + index + ": " + lockBalance;
      throw new Error("Error: " +  action.payload + message);
    }
  };

  const addLimitOrder = async (marketId: bigint, flag: bigint, limitPrice: bigint, amount: bigint) => {
    if (!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      setShowAddLimitOrderModal(false);
      return;
    }

    // Send transaction to add limit order
    let f = async () => {
      let params = [marketId, flag, limitPrice, amount];
      let action = await dispatch(
        sendTransaction({
          cmd: createCommand(BigInt(nonce), CMD_ADD_LIMIT_ORDER, params),
          prikey: l2account!.getPrivateKey(),
        })
      );
      return action;
    }

    // comment because of no market data in state
    const filteredMarkets = marketInfo.filter(market => BigInt(market.marketId) === marketId);
    if(filteredMarkets.length === 0) {
      setInfoMessage("Market not exist");
      setShowResult(true);
      setShowAddLimitOrderModal(false);
      return;
    }
    const market = filteredMarkets[0];
    let tokenIndex = 0;
    let cost = 0n;
    if (flag === BigInt(FLAG_BUY)) {  // If it's a Buy order
      tokenIndex = market.tokenA;
      cost = amount * limitPrice / PRECISION;
      if(cost > MAX_64_BIT) {
        throw new Error("cost overflow");
      }
    } else if (flag === BigInt(FLAG_SELL)) {  // If it's a Sell order
      tokenIndex = market.tokenB;
      cost = amount;
    }

    // positions' length is 2 now
    let position = userState!.player!.data.positions[tokenIndex];
    if(BigInt(position.balance) < cost) {
      throw new Error("Insufficient balance");
    }
    let newLockBalance = BigInt(position.lock_balance) + cost;
    if(newLockBalance > MAX_64_BIT) {
      throw new Error("lock_balance overflow");
    }

    position = userState!.player!.data.positions[FEE_TOKEN_INDEX];
    if(position.balance < FEE) {
      throw new Error("Insufficient fee balance");
    }
    newLockBalance = BigInt(position.lock_balance + FEE);
    if(BigInt(newLockBalance) > MAX_64_BIT) {
      throw new Error("fee lock_balance overflow");
    }

    // Validate if the state has changed correctly
    const action = await orderCheck(f, market, flag, cost, checkHelper);

    let successMessage = "";
    if (sendTransaction.fulfilled.match(action)) {
      // Return success message along with the result
      const orders = action.payload.state.orders;
      const latestOrder = orders[orders.length - 1];
      successMessage += "Success: latest order is " + JSON.stringify(latestOrder) + "\n";

      // Try match orders. If matched, get addTrade parameters
      const params = await matchOrdersGetTradeParams(orders, latestOrder);
      const addTradeResult = await addTrade(params!.aOrderId, params!.bOrderId, params!.aActualAmount, params!.bActualAmount);
      if(addTradeResult) {
        successMessage += " " + addTradeResult;
      }
      return successMessage;
    } else if (sendTransaction.rejected.match(action)) {
      let message = "";
      const index = tokenIndex.toString();
      const balance = userState!.player!.data.positions[index].balance;
      const lockBalance = userState!.player!.data.positions[index].balance;
      message = ". Wallet player's balance for Token " + index + ": " + balance + ". Wallet player's lock balance for Token " + index + ": " + lockBalance;
      throw new Error("Error: " +  action.payload + message);
    }
  };

  const cancelOrder = async (orderId: bigint) => {
    if(!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      setShowCancelOrderModal(false);
      return;
    }

    let params = [orderId];
    let action = await dispatch(
      sendTransaction({
        cmd: createCommand(BigInt(nonce), CMD_CANCEL_ORDER, params),
        prikey: l2account!.getPrivateKey(),
      })
    );
    if (sendTransaction.fulfilled.match(action)) {
      const orders = action.payload.state.orders;
      const status = orders[Number(orderId) - 1].status;
      //| status | uint8 | live/match/partial_match/partial_cancel/cancel |
      // status 4 means cancel
      return "Success: orderId " + orderId +"'s status is " + status;
    } else if(sendTransaction.rejected.match(action)) {
      throw Error("Error: " +  action.payload);
    }
  }

  const addMarket = async (tokenAIdx: bigint, tokenBIdx: bigint, lastPrice: bigint) => {
    if(!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      setShowAddMarketModal(false);
      return;
    }

    let params = [tokenAIdx, tokenBIdx, lastPrice];
    const nonce = await getNonce(SEVER_ADMIN_KEY);
    let action = await dispatch(
      sendTransaction({
        cmd: createCommand(BigInt(nonce), CMD_ADD_MARKET, params),
        prikey: SEVER_ADMIN_KEY,
      })
    );
    if (sendTransaction.fulfilled.match(action)) {
      const counter = action.payload.state.market_id_counter;
      return "Success: market counter is " + counter;
    } else if(sendTransaction.rejected.match(action)) {
      throw Error("Error: " +  action.payload);
    }
  }

  const closeMarket = async (marketId: bigint) => {
    if(!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
      setShowCloseMarketModal(false);
      return;
    }

    let params = [marketId];
    const nonce = await getNonce(SEVER_ADMIN_KEY);
    let action = await dispatch(
      sendTransaction({
        cmd: createCommand(BigInt(nonce), CMD_CLOSE_MARKET, params),
        prikey: SEVER_ADMIN_KEY,
      })
    );
    if (sendTransaction.fulfilled.match(action)) {
      return "Market closed successfully!";
    } else if(sendTransaction.rejected.match(action)) {
      throw Error("Error: " +  action.payload);
    }
  }

  return (
    <>
      {/* Command Buttons */ }
      <MDBContainer>
        <MDBRow className="justify-content-start mt-4">
          {/* Token Management Commands */}
          <MDBCol md="3">
            <MDBBtn onClick={() => setShowAddTokenModal(true)} color="success" block>
              <MDBIcon icon="plus-circle" /> Add Token
            </MDBBtn>
          </MDBCol>
          <MDBCol md="3">
            <MDBBtn onClick={() => setShowUpdateTokenModal(true)} color="info" block>
              <MDBIcon icon="refresh" /> Update Token
            </MDBBtn>
          </MDBCol>
          <MDBCol md="3">
            <MDBBtn onClick={() => setShowDepositTokenModal(true)} color="primary" block>
              <MDBIcon icon="arrow-up" /> Deposit Token
            </MDBBtn>
          </MDBCol>
          <MDBCol md="3">
            <MDBBtn onClick={() => setShowWithdrawTokenModal(true)} color="danger" block>
              <MDBIcon icon="arrow-down" /> Withdraw Token
            </MDBBtn>
          </MDBCol>
        </MDBRow>

        <MDBRow className="justify-content-start mt-4">
          {/* Transfer and Deposit Commands */}
          <MDBCol md="3">
            <MDBBtn onClick={() => setShowTransferModal(true)} color="success" block>
              <MDBIcon icon="exchange-alt" /> Transfer Token
            </MDBBtn>
          </MDBCol>
        </MDBRow>

        <MDBRow className="justify-content-start mt-4">
          {/* Market Management Commands */}
          <MDBCol md="3">
            <MDBBtn onClick={() => setShowAddMarketModal(true)} color="info" block>
              <MDBIcon icon="building" /> Add Market
            </MDBBtn>
          </MDBCol>
          <MDBCol md="3">
            <MDBBtn onClick={() => setShowCloseMarketModal(true)} color="warning" block>
              <MDBIcon icon="times" /> Close Market
            </MDBBtn>
          </MDBCol>
        </MDBRow>

        <MDBRow className="justify-content-start mt-4">
          {/* Order Management Commands */}
          <MDBCol md="3">
            <MDBBtn onClick={() => setShowAddLimitOrderModal(true)} color="primary" block>
              <MDBIcon icon="plus" /> Add Limit Order
            </MDBBtn>
          </MDBCol>
          <MDBCol md="3">
            <MDBBtn onClick={() => setShowAddMarketOrderModal(true)} color="primary" block>
              <MDBIcon icon="plus" /> Add Market Order
            </MDBBtn>
          </MDBCol>
          <MDBCol md="3">
            <MDBBtn onClick={() => setShowCancelOrderModal(true)} color="danger" block>
              <MDBIcon icon="trash" /> Cancel Order
            </MDBBtn>
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      {/* Modals */}
      <AddTokenModal
        show={showAddTokenModal}
        onClose={() => setShowAddTokenModal(false)}
        handler={addToken}
      />
      <UpdateTokenModal
        show={showUpdateTokenModal}
        onClose={() => setShowUpdateTokenModal(false)}
        handler={updateToken}
      />
      <WithdrawTokenModal
        show={showWithdrawTokenModal}
        onClose={() => setShowWithdrawTokenModal(false)}
        handler={withdrawToken}
      />
      <AddLimitOrderModal
        show={showAddLimitOrderModal}
        onClose={() => setShowAddLimitOrderModal(false)}
        handler={addLimitOrder}
      />
      <AddMarketOrderModal
        show={showAddMarketOrderModal}
        onClose={() => setShowAddMarketOrderModal(false)}
        handler={addMarketOrder}
      />
      <CancelOrderModal
        show={showCancelOrderModal}
        onClose={() => setShowCancelOrderModal(false)}
        handler={cancelOrder}
      />
      <AddMarketModal
        show={showAddMarketModal}
        onClose={() => setShowAddMarketModal(false)}
        handler={addMarket}
      />
      <CloseMarketModal
        show={showCloseMarketModal}
        onClose={() => setShowCloseMarketModal(false)}
        handler={closeMarket}
      />
      <TransferModal
        show={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        handler={transfer}
      />
      <DepositTokenModal
        show={showDepositTokenModal}
        onClose={() => setShowDepositTokenModal(false)}
        handler={depositToken}
      />
      <ResultModal
        infoMessage={infoMessage}
        show={showResult}
        onClose={() => setShowResult(false)}
      />
    </>
  );
}