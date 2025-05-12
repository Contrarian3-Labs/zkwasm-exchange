import React, { useCallback, useState } from "react";
import {
  MDBContainer,
  MDBNavbar,
  MDBCol
} from 'mdb-react-ui-kit';
import { ResultModal } from "../modals/ResultModal";
import { TradingPanelUI } from "polymarket-ui";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { AccountSlice } from "zkwasm-minirollup-browser";
import { sendTransaction, queryState } from "../request";
import { createCommand } from "zkwasm-minirollup-rpc";
import { selectUserState, Order } from '../data/state';
import { selectMarketInfo } from "../data/market";
import { Market } from "../data/market";
import { checkHelper, getNonce, formatErrorMessage } from "../utils/transaction";

const FLAG_BUY = 1;
const FLAG_SELL = 0;
const PRECISION = BigInt(1e9);
const MAX_64_BIT = BigInt('9223372036854775807');
const FEE = 3;
const FEE_TOKEN_INDEX = 0;
const TYPE_LIMIT = 0;
const TYPE_MARKET = 1;
const MARKET_STATUS_CLOSE = 0;
// Order status
const STATUS_LIVE = 0;
const CMD_ADD_LIMIT_ORDER = 5n;
const CMD_ADD_MARKET_ORDER = 6n;
const CMD_ADD_TRADE = 11n;
const SEVER_ADMIN_KEY = "1234567";

interface TradingPanelProps {
  currentPrice: number;
  maxAmount: number;
  isMobileView?: boolean;
  selectedMarket: number | null;
  setSelectedMarket: React.Dispatch<React.SetStateAction<number | null>>;
}

const TradingPanel: React.FC<TradingPanelProps> = ({
  currentPrice,
  maxAmount,
  isMobileView = false,
  selectedMarket,
  setSelectedMarket
}) => {
  const dispatch = useAppDispatch();
  const [selectedTab, setSelectedTab] = useState<"buy" | "sell">("buy");
  const [selectedOption, setSelectedOption] = useState<"yes" | "no">("yes");
  const [tradeType, setTradeType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toString());
  const [amount, setAmount] = useState<string>("0");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const l2account = useAppSelector(AccountSlice.selectL2Account);
  const marketInfo = useAppSelector(selectMarketInfo);
  const userState = useAppSelector(selectUserState);
  const nonce = userState?.player?.nonce || 0;

  const addTrade = useCallback(async (aOrderId: bigint, bOrderId: bigint, aActualAmount: bigint, bActualAmount: bigint) => {
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
  }, [dispatch, l2account]);

  const checkOrders = useCallback((
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
  }, [marketInfo]);
  
  const matchOrdersGetTradeParams = useCallback(async (orders: Order[], incomingOrder: Order) => {
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
  }, [checkOrders]);
  
  const orderCheck = useCallback(async (
    f: ()=> any,
    market: Market,
    flag: bigint,
    cost: bigint,
    check:(before: any, after: any, market: Market, flag: bigint, cost: bigint) => void
  ) => {
    // Query state before placing the market order
    let before = await dispatch(queryState(l2account!.getPrivateKey()));
    const action = await f();

    // Query state after placing the market order
    let after = await dispatch(queryState(l2account!.getPrivateKey()));

    check(before.payload, after.payload, market, flag, cost);

    return action;
  }, [dispatch, l2account]);

  const addMarketOrder = useCallback(async (marketId: bigint, flag: bigint, bTokenAmount: bigint, aTokenAmount: bigint) => {
    if (!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
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

    // comment because of no market data in state
    const filteredMarkets = marketInfo.filter(market => BigInt(market.marketId) === marketId);
    if(filteredMarkets.length === 0) {
      setInfoMessage("Market not exist");
      setShowResult(true);
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
  }, [addTrade, dispatch, l2account, marketInfo, matchOrdersGetTradeParams, nonce, orderCheck, userState]);

  const addLimitOrder = useCallback(async (marketId: bigint, flag: bigint, limitPrice: bigint, amount: bigint) => {
    if (!l2account) {
      setInfoMessage("Please connect wallet before any transactions!");
      setShowResult(true);
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
  }, [addTrade, dispatch, l2account, marketInfo, matchOrdersGetTradeParams, nonce, orderCheck, userState]);
  
  const handleTabChange = useCallback((tab: "buy" | "sell") => {
    setSelectedTab(tab);
  }, []);

  const handleOptionChange = useCallback((option: "yes" | "no") => {
    setSelectedOption(option);
  }, []);

  const handleTradeTypeChange = useCallback((type: "market" | "limit") => {
    setTradeType(type);
    setIsDropdownOpen(false);
  }, []);

  const handleLimitPriceChange = useCallback((value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setLimitPrice(value);
    }
  }, []);

  const handleAmountChange = useCallback((value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, []);

  const handleQuickAmountClick = useCallback((value: number) => {
    setAmount(prev => {
      const currentAmount = parseFloat(prev) || 0;
      const newAmount = currentAmount + value;
      return Math.min(newAmount, maxAmount!).toString();
    });
  }, [maxAmount]);

  const handleSubmit = useCallback(async () => {
    try {
      console.log(`${selectedTab} order submitted:`, {
        amount: parseFloat(amount),
        price: currentPrice,
        total: (parseFloat(amount || "0") * currentPrice) / 100,
      });

      let flag = 0;
      if(selectedTab === "buy") {
        flag = 1;
      } else {
        flag = 0;
      }

      if(!selectedMarket) {
        setInfoMessage("No existing markets or no market is selected!");
        setShowResult(true);
      } else {
        if(tradeType === "limit") {
          const result = await addLimitOrder(BigInt(selectedMarket), BigInt(flag), BigInt(limitPrice), BigInt(amount));
          if(result) {
            setInfoMessage(result);
            setShowResult(true);
          }
        } else {
          let bTokenAmount = "0";
          let aTokenAmount = "0";
          if(selectedTab === "buy") {
            aTokenAmount = amount;
          } else {
            bTokenAmount = amount;
          }
          const result = await addMarketOrder(BigInt(selectedMarket), BigInt(flag), BigInt(bTokenAmount), BigInt(aTokenAmount));
          if(result) {
            setInfoMessage(result);
            setShowResult(true);
          }
        }
      }
    } catch (error) {
      const err = formatErrorMessage(error);
      setInfoMessage(err);
      setShowResult(true);
    }
  }, [amount, selectedTab, currentPrice, addLimitOrder, addMarketOrder, limitPrice, selectedMarket, tradeType]);

  const TradingPanelProps = {
    currentPrice: 75,
    selectedTab,
    selectedOption,
    tradeType,
    limitPrice,
    amount,
    maxAmount,
    isDropdownOpen,
    isMoreMenuOpen,
    onTabChange: handleTabChange,
    onOptionChange: handleOptionChange,
    onTradeTypeChange: handleTradeTypeChange,
    onLimitPriceChange: handleLimitPriceChange,
    setIsDropdownOpen,
    onAmountChange: handleAmountChange,
    onQuickAmountClick: handleQuickAmountClick,
    onSubmit: handleSubmit,
    setIsMoreMenuOpen,
  }

  return (
    <>
    <MDBNavbar expand='lg' light bgColor='light'>
      <MDBContainer fluid>
        <MDBCol md="12">
          <TradingPanelUI {...TradingPanelProps} isMobileView={isMobileView} />
        </MDBCol>
      </MDBContainer>
    </MDBNavbar>
    <ResultModal
      infoMessage={infoMessage}
      show={showResult}
      onClose={() => setShowResult(false)}
    />
    </>
  );
}

export default TradingPanel;