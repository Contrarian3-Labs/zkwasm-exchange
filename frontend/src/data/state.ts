import { RootState } from "../app/store";
import { createStateSlice, PropertiesState, ConnectState } from "zkwasm-minirollup-browser";

export interface PlayerInfo {
  nonce: number;
  data: {
    counter: number;
    positions: {
      [key: string]: { // key is asset id
        balance: number;
        lock_balance: number;
      };
    };
  };
}

export interface GlobalState {
  counter: number;
  total_fee: number;
  market_id_counter: number;
  order_id_counter: number;
  trade_id_counter: number;
  event_id_counter: number;
  orders: Order[];
  trades: Trade[];
  markets: Market[];
}

export interface UserState {
  player: PlayerInfo | null,
  state: GlobalState,
}

export interface Market {
  market_id: number;
  status: number;
  token_a: number;
  token_b: number;
  last_deal_price: number;
}

export interface Order {
  id: number;
  type_: number;
  status: number;
  pid: number[];
  market_id: number;
  flag: number;
  lock_balance: number;
  lock_fee: number;
  price: number;
  b_token_amount: number;
  a_token_amount: number;
  already_deal_amount: number;
}

export interface Trade {
  trade_id: number;
  a_order_id: number;
  b_order_id: number;
  a_actual_amount: number;
  b_actual_amount: number;
}

const initialState: PropertiesState<PlayerInfo, GlobalState, any> = {
    connectState: ConnectState.Init,
    isConnected: true,
    userState: null,
    lastError: null,
    config: null,
};

export const propertiesSlice = createStateSlice(initialState);

export const selectConnectState = (state: RootState) => state.exchange.connectState;
export const selectUserState = (state: RootState) => state.exchange.userState;

export const { setConnectState } = propertiesSlice.actions;
export default propertiesSlice.reducer;
