import { createSlice } from '@reduxjs/toolkit';
import { queryToken } from '../request';
import { RootState } from "../app/store";

export interface RequestError {
  errorInfo: string,
  payload: any,
}

export interface Token {
  tokenIdx: number,
  address: string
}

interface PropertiesState {
  data: Token[],
  error: RequestError | null

}

const initialState: PropertiesState = {
  data: [],
  error: null
};

const tokenSlice = createSlice({
  name: 'token',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(queryToken.fulfilled, (state, action) => {
        state.data = action.payload;
      })
      .addCase(queryToken.rejected, (state, action) => {
        state.error = {
          errorInfo:`query token info rejected: ${action.payload}`,
          payload: action.payload,
        }
      });
  }
});

export const selectTokenInfo = (state: RootState) => state.token.data;
export default tokenSlice.reducer;