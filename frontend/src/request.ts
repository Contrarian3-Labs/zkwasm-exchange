import { ZKWasmAppRpc } from 'zkwasm-minirollup-rpc';
import { createAsyncThunk } from '@reduxjs/toolkit';

// Get the current URL components
const currentLocation = window.location;
const protocol = currentLocation.protocol; // e.g., 'http:' or 'https:'
const hostname = currentLocation.hostname; // e.g., 'sinka' or 'localhost'

// We assume the rpc is at port 3000
const fullUrl = `${protocol}//${hostname}:3000`
const rpc = new ZKWasmAppRpc(fullUrl);

async function queryConfigI() {
  try {
    const state = await rpc.queryConfig();
    return state;
  } catch (error) {
    throw new Error("QueryStateError: " + String(error));
  }
}

export async function queryStateI(prikey: string) {
  try {
    console.log("开始查询状态，密钥：", prikey);
    const data: any = await rpc.queryState(prikey);
    console.log("查询状态成功，原始响应：", data);
    if (!data || !data.data) {
      console.error("查询状态响应格式不正确", data);
      throw new Error("查询状态响应格式不正确");
    }
    return JSON.parse(data.data);
  } catch (error: any) {
    console.error("查询状态出错:", error);
    
    if (error.response) {
      // 服务器返回了错误状态码
      console.error("服务器响应错误:", error.response);
      if (error.response.status === 500) {
        throw new Error("QueryStateError: 服务器内部错误");
      } else {
        throw new Error(`UnknownError: ${error.response.status} - ${error.response.statusText || '未知错误'}`);
      }
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error("请求已发送但未收到响应:", error.request);
      throw new Error("NetworkError: 未收到服务器响应，请检查网络连接或后端服务是否运行");
    } else if (error.message && error.message.includes("JSON")) {
      // JSON解析错误
      console.error("JSON解析错误:", error);
      throw new Error("JSONParseError: 无法解析服务器响应");
    } else {
      // 其他类型的错误
      console.error("未知错误:", error);
      throw new Error(`UnknownError: ${error.message || '未知错误'}`);
    }
  }
}

export const getConfig = createAsyncThunk(
  'client/getConfig',
  async () => {
    const res: any = await queryConfigI();
    const data = JSON.parse(res.data);
    return data;
  }
)

export const SERVER_TICK_TO_SECOND = 5;

export const sendTransaction = createAsyncThunk(
  'client/sendTransaction',
  async (params: {cmd: BigUint64Array, prikey: string }, { rejectWithValue }) => {
    try {
      const { cmd, prikey } = params;
      const state: any = await rpc.sendTransaction(cmd, prikey);
      console.log("(Data-Transaction)", state);
      return state;
    } catch (err: any) {
      // todo: handle error, unknown error is not meaningful
      return rejectWithValue(err.message || JSON.stringify(err));
    }
  }
);

export const sendExtrinsicTransaction = createAsyncThunk(
  'client/sendExtrinsicTransaction',
  async (params: {cmd: BigUint64Array, prikey: string }, { rejectWithValue }) => {
    try {
      const { cmd, prikey } = params;
      const state: any = await rpc.sendExtrinsic(cmd, prikey);
      console.log("(Data-Transaction)", state);
      return state;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);


export const queryState = createAsyncThunk(
  'client/queryState',
  async (key: string, { rejectWithValue }) => {
    try {
      const state: any = await queryStateI(key);
      console.log("(Data-QueryState)", state);
      return state;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

export const queryInitialState = createAsyncThunk(
  'client/queryInitialState',
  async (key: string, { rejectWithValue }) => {
    try {
      const state: any = await queryStateI(key);
      console.log("(Data-QueryState)", state);
      return state;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

export async function queryMarketI() {
  try {
    const state: any = await rpc.queryData("markets");
    return state.data;
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 500) {
        throw new Error("QueryMarketError");
      } else {
        throw new Error("UnknownError");
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      throw new Error("No response was received from the server, please check your network connection.");
    } else {
      throw new Error("UnknownError");
    }
  }
}

export const queryMarket = createAsyncThunk(
  'client/queryMarket',
  async (_, { rejectWithValue }) => {
    try {
      const state: any = await queryMarketI();
      console.log("(Data-QueryMarket)", state);
      return state;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

export async function queryTokenI() {
  try {
    const state: any = await rpc.queryData("tokens");
    return state.data;
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 500) {
        throw new Error("QueryTokenError");
      } else {
        throw new Error("UnknownError");
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      throw new Error("No response was received from the server, please check your network connection.");
    } else {
      throw new Error("UnknownError");
    }
  }
}

export const queryToken = createAsyncThunk(
  'client/queryToken',
  async (_, { rejectWithValue }) => {
    try {
      const state: any = await queryTokenI();
      console.log("(Data-QueryToken)", state);
      return state;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);