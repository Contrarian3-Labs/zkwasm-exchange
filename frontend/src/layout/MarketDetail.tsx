/* eslint-disable */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import {
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBIcon
} from 'mdb-react-ui-kit';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { selectConnectState } from "../data/state";
import {
  queryInitialState,
  queryState,
  queryMarket,
  queryToken,
  queryStateI
} from "../request";
import { UserState } from "../data/state";
import { AccountSlice, ConnectState } from "zkwasm-minirollup-browser";
import {
  useMediaQuery,
} from "polymarket-ui";
import TradingPanel from "../components/TradingPanel";
import { Comments } from "../components/Comments";
import { selectMarketInfo } from "../data/market";
import MarketChart from "../components/MarketChart";
import OrderBook from "../components/OrderBook";
import Nav from "../components/Nav";
import Footer from "../components/Foot";

// 定义错误边界组件的Props和State类型
interface RouterErrorBoundaryProps {
  children: React.ReactNode;
}

interface RouterErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// 路由错误边界组件
class RouterErrorBoundary extends React.Component<RouterErrorBoundaryProps, RouterErrorBoundaryState> {
  constructor(props: RouterErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): RouterErrorBoundaryState {
    // 当发生路由错误时更新状态
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      // 回退UI
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-6">
            <MDBCard>
              <MDBCardBody className="text-center">
                <MDBIcon 
                  fas 
                  icon="exclamation-triangle" 
                  size="3x" 
                  className="text-warning mb-3"
                />
                <h3>Route Error</h3>
                <p>Please refresh the page or return to the home page</p>
                <MDBBtn color="primary" onClick={() => window.location.href = '/'}>
                  Back to Home
                </MDBBtn>
              </MDBCardBody>
            </MDBCard>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 安全的导航组件
// interface SafeNavigateWrapperProps {
//   children: React.ReactNode;
// }

// const SafeNavigateWrapper: React.FC<SafeNavigateWrapperProps> = ({ children }) => {
//   try {
//     return <>{children}</>;
//   } catch (error) {
//     console.error("Navigation error:", error);
//     return (
//       <div className="text-center p-4">
//         <p>Navigation error, please refresh the page</p>
//         <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
//           Back to Home
//         </button>
//       </div>
//     );
//   }
// };

// hardcode admin for test
export const server_admin_key = "1234567";

export function MarketDetail() {
  // 使用错误边界包裹以下代码
  return (
    <RouterErrorBoundary>
      <MarketDetailContent />
    </RouterErrorBoundary>
  );
}

function MarketDetailContent() {
  const { marketId } = useParams();
  const dispatch = useAppDispatch();
  
  // 使用备用导航方法
  const handleNavigate = useCallback((path: string) => {
    try {
      // 尝试使用React Router的navigate
      const navigate = useNavigate();
      navigate(path);
    } catch (error) {
      console.error("Navigation error:", error);
      // 降级为window.location
      window.location.href = path;
    }
  }, []);
  
  // 返回到市场列表
  const handleBackToList = useCallback(() => {
    handleNavigate('/');
  }, [handleNavigate]);
  
  const connectState = useAppSelector(selectConnectState);
  const l2account = useAppSelector(AccountSlice.selectL2Account);
  const marketInfo = useAppSelector(selectMarketInfo);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const [activeTab, setActiveTab] = useState("1");
  const [adminState, setAdminState] = useState<UserState | null>(null);
  const [playerState, setPlayerState] = useState<UserState | null>(null);
  const [inc, setInc] = useState(0);

  // 转换市场ID参数为数字
  const selectedMarketId = useMemo(() => {
    return marketId ? parseInt(marketId, 10) : null;
  }, [marketId]);

  // 获取当前选中市场的信息
  const selectedMarketInfo = useMemo(() => {
    if (selectedMarketId === null) return null;
    return marketInfo.find(market => market.marketId === selectedMarketId) || null;
  }, [selectedMarketId, marketInfo]);
  
  // 处理价格，确保是有效的数字
  const marketPrice = useMemo(() => {
    // 使用默认值75，或者如果selectedMarketInfo存在则使用其lastPrice
    if (!selectedMarketInfo) return 75;
    
    // 确保lastPrice是数字
    const price = Number(selectedMarketInfo.lastPrice);
    return isNaN(price) ? 75 : price;
  }, [selectedMarketInfo]);

  // 获取市场数据
  async function updateState() {
    try {
      console.log("开始更新市场详情数据...");
      
      try {
        await dispatch(queryMarket());
      } catch (error) {
        console.error("更新市场数据失败:", error);
      }
      
      try {
        await dispatch(queryToken());
      } catch (error) {
        console.error("更新代币数据失败:", error);
      }

      // get admin to show admin balance
      try {
        console.log("获取管理员状态...");
        const state = await queryStateI(server_admin_key);
        console.log("(Data-QueryAdminState)", state);
        setAdminState(state);
      } catch (error) {
        console.error("获取管理员状态失败:", error);
      }
      
      if (connectState == ConnectState.Idle) {
        try {
          const action = await dispatch(queryState(l2account!.getPrivateKey()));
          setPlayerState(action.payload);
        } catch (error) {
          console.error("获取玩家状态失败:", error);
        }
      } else if (connectState == ConnectState.Init) {
        try {
          await dispatch(queryInitialState("1"));
        } catch (error) {
          console.error("获取初始状态失败:", error);
        }
      }
      
      console.log("市场详情数据更新完成");
    } catch (error) {
      console.error("市场详情更新错误:", error);
    }

    setInc(inc + 1);
  }

  // 初始化数据
  useEffect(() => {
    updateState();
  }, []);

  // 定期更新数据
  useEffect(() => {
    const timer = setTimeout(() => {
      updateState();
    }, 3000);
    
    // 清理计时器
    return () => clearTimeout(timer);
  }, [inc]);

  // 处理标签点击
  const handleTabClick = (value: string) => {    
    if (value === activeTab) return;    
    setActiveTab(value);  
  };

  // 如果市场不存在，显示错误信息并提供返回链接
  if (selectedMarketId !== null && !selectedMarketInfo) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Nav handleTabClick={handleTabClick} />
        <div className="container mx-auto px-4 py-6">
          <MDBCard>
            <MDBCardBody className="text-center">
              <MDBIcon 
                fas 
                icon="exclamation-triangle" 
                size="3x" 
                className="text-warning mb-3"
              />
              <h3>Market Not Found</h3>
              <p>The market with ID {selectedMarketId} does not exist or has been removed.</p>
              <MDBBtn color="primary" onClick={handleBackToList}>
                Back to Market List
              </MDBBtn>
            </MDBCardBody>
          </MDBCard>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Nav handleTabClick={handleTabClick} />
      <div className="container mx-auto px-4 py-6 pb-[120px] lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧市场图表和信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 市场导航和标题 */}
            <MDBCard className="mb-4">
              <MDBCardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <MDBBtn 
                    color="light" 
                    size="sm" 
                    onClick={handleBackToList}
                    className="d-flex align-items-center"
                  >
                    <MDBIcon fas icon="arrow-left" className="me-1" /> Back to Market List
                  </MDBBtn>
                  <h4 className="mb-0">
                    Market {selectedMarketId} 
                    {selectedMarketInfo && 
                      ` (Token ${selectedMarketInfo.tokenA} / Token ${selectedMarketInfo.tokenB})`
                    }
                  </h4>
                  <div style={{ width: '80px' }}></div> {/* 右侧占位，保持布局平衡 */}
                </div>
              </MDBCardBody>
            </MDBCard>
            
            {/* 市场图表 */}
            <MDBCard className="mb-4">
              <MDBCardBody>
                <MarketChart selectedMarket={selectedMarketId} />
                
                {/* 订单簿 */}
                <OrderBook selectedMarket={selectedMarketId} />
              </MDBCardBody>
            </MDBCard>
            
            {/* 评论区 */}
            {/* <MDBCard className="comments-container">
              <MDBCardBody>
                <Comments />
              </MDBCardBody>
            </MDBCard> */}
          </div>
          
          {/* 右侧交易面板 - 仅在桌面显示 */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <div className="trading-panel">
                <TradingPanel 
                  selectedMarket={selectedMarketId} 
                  setSelectedMarket={(id) => {
                    if (id !== null) {
                      const path = `/market/${id}`;
                      handleNavigate(path);
                    }
                  }} 
                  currentPrice={marketPrice} 
                  maxAmount={1000} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 移动端交易面板 */}
      {isMobile && (
        <div className="trading-panel fixed bottom-0 left-0 right-0 z-50">
          <TradingPanel 
            selectedMarket={selectedMarketId} 
            setSelectedMarket={(id) => {
              if (id !== null) {
                const path = `/market/${id}`;
                handleNavigate(path);
              }
            }} 
            currentPrice={marketPrice} 
            maxAmount={1000} 
            isMobileView={true} 
          />
        </div>
      )}
      <Footer />
    </div>
  );
} 