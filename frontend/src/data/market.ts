import { createSlice } from '@reduxjs/toolkit';
import { queryMarket } from '../request';
import { RootState } from "../app/store";

export interface RequestError {
  errorInfo: string,
  payload: any,
}

export interface Market {
  marketId: number;
  status: 0 | 1;
  tokenA: number;
  tokenB: number;
  lastPrice: string;
}

interface PropertiesState {
  data: Market[],
  error: RequestError | null

}

const initialState: PropertiesState = {
  data: [],
  error: null
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(queryMarket.fulfilled, (state, action) => {
        state.data = action.payload;
      })
      .addCase(queryMarket.rejected, (state, action) => {
        state.error = {
          errorInfo:`query market info rejected: ${action.payload}`,
          payload: action.payload,
        }
      });
  }
});

export const selectMarketInfo = (state: RootState) => state.market.data;
export default marketSlice.reducer;