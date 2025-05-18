/* eslint-disable */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./style.css";
import { selectConnectState } from "../data/state";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { AccountSlice, ConnectState } from "zkwasm-minirollup-browser";
import {
  queryInitialState,
  queryState,
  sendTransaction,
  queryMarket,
  queryToken
} from "../request";
import { createCommand } from "zkwasm-minirollup-rpc";
import { MarketPage } from "../components/MarketPage";
import Footer from "../components/Foot";
import Nav from "../components/Nav";
import Commands from "../components/Commands";
import { PlayerInfo } from "../components/PlayerInfo";
import TokenInfo from "../components/TokenInfo";
import { AdminInfo } from "../components/AdminInfo";
import { TradeInfo } from "../components/TradeInfo";
import MarketList from "../components/MarketList";
import {
  MDBCard,
  MDBCardBody,
  MDBRow,
  MDBCol,
  MDBTypography,
  MDBTabsContent,
  MDBTabsPane
} from 'mdb-react-ui-kit';
import { queryStateI } from "../request";
import { UserState } from "../data/state";
import { selectMarketInfo } from "../data/market";

const CMD_REGISTER_PLAYER = 4n;
// hardcode admin for test
export const server_admin_key = "1234567";

export function Main() {
  const navigate = useNavigate();
  const connectState = useAppSelector(selectConnectState);
  const l2account = useAppSelector(AccountSlice.selectL2Account);
  const dispatch = useAppDispatch();
  const [inc, setInc] = useState(0);
  const [activeTab, setActiveTab] = useState("1");
  const [adminState, setAdminState] = useState<UserState | null>(null);
  const [playerState, setPlayerState] = useState<UserState | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<number | null>(null); // 初始不选择任何市场
  const marketInfo = useAppSelector(selectMarketInfo);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMarkets, setFilteredMarkets] = useState<any[]>([]);
  const [skipNextUpdate, setSkipNextUpdate] = useState(false);
  const [showMarketList, setShowMarketList] = useState(true); // 控制是否显示市场列表

  // 过滤市场的函数
  const filterMarkets = useCallback((query: string, markets: any[]) => {
    if (!query || query.trim() === "") {
      return markets;
    }

    const lowerQuery = query.toLowerCase();
    
    return markets.filter(market => {
      // 搜索市场ID
      if (market.marketId.toString().includes(lowerQuery)) {
        return true;
      }
      
      // 搜索交易对
      const tradingPair = `Token ${market.tokenA} / Token ${market.tokenB}`.toLowerCase();
      if (tradingPair.includes(lowerQuery)) {
        return true;
      }
      
      // 搜索价格
      if (market.lastPrice.toString().includes(lowerQuery)) {
        return true;
      }
      
      // 搜索状态
      const status = market.status === 1 ? "active" : "closed";
      if (status.includes(lowerQuery)) {
        return true;
      }
      
      return false;
    });
  }, []);

  async function updateState() {
    // 如果需要跳过更新（例如刚执行完搜索），则重置标志并返回
    if (skipNextUpdate) {
      setSkipNextUpdate(false);
      return;
    }

    await dispatch(queryMarket());
    await dispatch(queryToken());

    // get admin to show admin balance
    const state = await queryStateI(server_admin_key);
    console.log("(Data-QueryAdminState)", state);
    setAdminState(state);
    if (connectState == ConnectState.Idle) {
      const action = await dispatch(queryState(l2account!.getPrivateKey()));
      setPlayerState(action.payload);
    } else if (connectState == ConnectState.Init) {
      dispatch(queryInitialState("1"));
    }

    // 在更新后重新应用搜索过滤
    if (searchQuery) {
      const markets = marketInfo;
      const filtered = filterMarkets(searchQuery, markets);
      setFilteredMarkets(filtered);
    }

    setInc(inc + 1);
  }

  useEffect(() => {
    const fetchData = async () => {
      await dispatch(queryMarket());
      await dispatch(queryToken());

      // get admin to show admin balance
      const state = await queryStateI(server_admin_key);
      console.log("(Data-QueryAdminState)", state);
      setAdminState(state);

      if (l2account && connectState === ConnectState.Init) {
        const action = await dispatch(queryState(l2account.getPrivateKey()));
        setPlayerState(action.payload);
      } else {
        await dispatch(queryInitialState("1"));
      }
    };

    fetchData();
  }, [l2account]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateState();
    }, 3000);
    
    // 清理计时器
    return () => clearTimeout(timer);
  }, [inc]);


  useEffect(() => {
    if (connectState == ConnectState.InstallPlayer) {
      const command = createCommand(0n, CMD_REGISTER_PLAYER, []);
      dispatch(sendTransaction({
        cmd: command,
        prikey: l2account!.getPrivateKey()
      }));

      // register the server admin
      dispatch(sendTransaction({
        cmd: command,
        prikey: server_admin_key
      }));
    }
  }, [connectState]);

  const handleTabClick = (value: string) => {
    if (value === activeTab) return;
    setActiveTab(value);
  };

  // 当搜索查询改变时
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    // 如果查询为空，重置为显示所有市场
    if (!query || query.trim() === "") {
      setFilteredMarkets(marketInfo);
      return;
    }
    
    // 搜索时设置跳过下一次自动更新，防止搜索结果被覆盖
    setSkipNextUpdate(true);
    
    // 立即过滤市场数据
    const filtered = filterMarkets(query, marketInfo);
    setFilteredMarkets(filtered);
  }, [marketInfo, filterMarkets]);

  // 初始化时设置过滤后的市场
  useEffect(() => {
    // 只有当没有搜索查询时才更新filteredMarkets
    if (!searchQuery) {
      setFilteredMarkets(marketInfo);
    } else {
      // 如果有搜索查询，重新应用过滤
      const filtered = filterMarkets(searchQuery, marketInfo);
      setFilteredMarkets(filtered);
    }
  }, [marketInfo, searchQuery, filterMarkets]);

  // 处理选择市场的逻辑
  const handleSelectMarket = useCallback((marketId: number | null | React.SetStateAction<number | null>) => {
    // 处理函数式更新
    const newMarketId = typeof marketId === 'function' ? marketId(selectedMarket) : marketId;
    setSelectedMarket(newMarketId);
    
    // 当选择市场时，导航到市场详情页
    if (newMarketId !== null) {
      navigate(`/market/${newMarketId}`);
    } else {
      // 如果取消选择，隐藏市场列表
      setShowMarketList(true);
    }
  }, [selectedMarket, navigate]);

  return (
    <>
      <div className={`min-h-screen ${`min-h-screen bg-gray-100 dark:bg-gray-900`}`}>
        <Nav 
          handleTabClick={handleTabClick} 
          searchQuery={searchQuery}
          setSearchQuery={handleSearchQueryChange}
        />
        <div className="container mx-auto px-4 py-6 pb-[120px] lg:pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧市场图表和信息 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 市场列表 - 仅在未选择市场或主动显示列表时显示 */}
              {showMarketList ? (
                <MarketList 
                  selectedMarket={selectedMarket} 
                  setSelectedMarket={handleSelectMarket}
                  filteredMarkets={filteredMarkets}
                />
              ) : (
                <MDBCard>
                  <MDBCardBody className="text-center">
                    <p className="mb-0">Loading market details...</p>
                  </MDBCardBody>
                </MDBCard>
              )}
              


              {/* Tab内容 */}
              <MDBTabsContent style={{ maxHeight: "400px", overflowY: "auto" }}>
                <MDBTabsPane open={activeTab === "1"}>
                  <AdminInfo adminState={adminState} />
                </MDBTabsPane>
                <MDBTabsPane open={activeTab === "2"}>
                  <PlayerInfo playerState={playerState} />
                </MDBTabsPane>
                <MDBTabsPane open={activeTab === "3"}>
                  <TokenInfo />
                </MDBTabsPane>
                <MDBTabsPane open={activeTab === "4"}>
                  <MarketPage selectedMarket={selectedMarket} setSelectedMarket={handleSelectMarket} />
                </MDBTabsPane>
                <MDBTabsPane open={activeTab === "5"}>
                  <TradeInfo playerState={playerState} handleTabClick={handleTabClick} />
                </MDBTabsPane>
              </MDBTabsContent>

              {/* 命令区 */}
              <MDBRow className="mt-4">
                <MDBCol>
                  <MDBCard>
                    <MDBCardBody>
                      <MDBTypography tag="h4" className="mb-3 text-center">
                        Execute Commands
                      </MDBTypography>
                      <Commands />
                    </MDBCardBody>
                  </MDBCard>
                </MDBCol>
              </MDBRow>
            </div>
            

          </div>
        </div>

      </div>
      {/* 页脚 */}
      <Footer />
    </>
  );
}
