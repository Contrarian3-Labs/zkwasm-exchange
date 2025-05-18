import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { MarketChartUI, ChartData } from "polymarket-ui";
import { useAppSelector } from '../app/hooks';
import { selectUserState, Order } from '../data/state';
import { selectMarketInfo } from "../data/market";
import { ResultModal } from "../modals/ResultModal";

interface MarketChartProps {
  title?: string;
  selectedMarket?: number | null;
}

export const MarketChart: React.FC<MarketChartProps> = ({ 
  selectedMarket = 1
}) => {
  const userState = useAppSelector(selectUserState);
  const marketInfo = useAppSelector(selectMarketInfo);
  const [selectedTimeRange, setSelectedTimeRange] = useState("1W");
  const [infoMessage, setInfoMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const prevMarketInfoRef = useRef<typeof marketInfo>([]);
  const [prePriceMap, setPrePriceMap] = useState<Record<string, number>>({});
  const [lastPriceMap, setLastPriceMap] = useState<Record<string, number>>({});

  // 获取市场标题
  const title = useMemo(() => {
    if (!selectedMarket) return "Market title";
    const market = marketInfo.find(m => m.marketId === selectedMarket);
    return market ? `Market ${market.marketId}` : "Market title";
  }, [marketInfo, selectedMarket]);

  // 获取订单数据
  const orders = useMemo(() => userState?.state?.orders ?? [], [userState?.state?.orders]);

  // 按市场ID分组订单
  const groupedOrders = useMemo(() => {
    return orders.reduce((acc: { [key: number]: any[] }, order) => {
      if (!acc[order.market_id]) acc[order.market_id] = [];
      acc[order.market_id].push(order);
      return acc;
    }, {});
  }, [orders]);

  const handleTimeRangeChange = useCallback((range: string) => {
    setSelectedTimeRange(range);
    // 在实际实现中，这里会根据时间范围获取新数据
  }, []);

  const handleBookmark = useCallback(() => {
    setInfoMessage("Bookmark clicked");
    setShowResult(true);
    // 实现书签逻辑
  }, []);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setInfoMessage("Share clicked");
    setShowResult(true);
    // 实现分享逻辑
  }, []);

  const handleCopy = useCallback(() => {
    setInfoMessage("Copy clicked");
    setShowResult(true);
    // 实现复制逻辑
  }, []);

  // 活跃市场
  const activeMarkets = useMemo(() => 
    marketInfo.filter(market => market.status === 1), 
    [marketInfo]
  );

  // 生成图表数据
  const generateChartData = useCallback((orders: Order[]): ChartData[] => {
    const data: ChartData[] = [];
    const now = new Date();
    let price;
    for (let i = orders.length - 1; i >= 0; i--) {
      const date = new Date(now);
      if(orders.length === 0) {
        price = 0;
      } else {
        price = orders[i].price;
      }
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString(),
        price
      });
    }
    return data;
  }, []);

  // 图表属性数组
  const marketChartProps = useMemo(() => {
    // 如果没有活跃市场，返回默认图表配置
    if (activeMarkets.length === 0 || !selectedMarket) {
      return {
        title,
        mainValue: 39,
        changeValue: 7.8,
        chartData: generateChartData([]),
        selectedTimeRange,
        onTimeRangeChange: handleTimeRangeChange,
        actions: {
          onBookmark: handleBookmark,
          onShare: handleShare,
          onCopy: handleCopy,
        }
      };
    }

    // 找到选中的市场
    const market = activeMarkets.find(m => m.marketId === selectedMarket);
    if (!market) {
      return {
        title,
        mainValue: 39,
        changeValue: 7.8,
        chartData: generateChartData([]),
        selectedTimeRange,
        onTimeRangeChange: handleTimeRangeChange,
        actions: {
          onBookmark: handleBookmark,
          onShare: handleShare,
          onCopy: handleCopy,
        }
      };
    }

    // 获取该市场的订单
    const marketId = market.marketId;
    const marketOrders = groupedOrders[marketId] || [];
    
    // 计算主值和变化值
    let mainValue;
    let changeValue;
    
    // 使用价格历史记录来计算价格变化
    const currentPrice = Number(market.lastPrice);
    const previousPrice = prePriceMap[marketId] || 0;
    const priceChange = currentPrice - previousPrice;
    
    if(marketOrders.length !== 0) {
      let lastOrder = marketOrders[marketOrders.length - 1];
      let firstOrder = marketOrders[0];
      mainValue = lastOrder.price;
      changeValue = mainValue - firstOrder.price;
    } else {
      mainValue = currentPrice;
      changeValue = priceChange;
    }
    
    // 使用lastPriceMap和prePriceMap来确定价格趋势
    const priceDirection = lastPriceMap[marketId] > prePriceMap[marketId] ? "up" : 
                          lastPriceMap[marketId] < prePriceMap[marketId] ? "down" : "neutral";

    return {
      title,
      mainValue,
      changeValue,
      chartData: generateChartData(marketOrders),
      selectedTimeRange,
      onTimeRangeChange: handleTimeRangeChange,
      actions: {
        onBookmark: handleBookmark,
        onShare: handleShare,
        onCopy: handleCopy,
      },
      priceDirection // 添加价格趋势信息
    };
  }, [
    activeMarkets, 
    groupedOrders, 
    handleBookmark, 
    handleCopy, 
    handleShare, 
    handleTimeRangeChange, 
    selectedMarket, 
    selectedTimeRange, 
    title, 
    generateChartData,
    prePriceMap,
    lastPriceMap
  ]);

  useEffect(() => {
    const prevMarketInfo = prevMarketInfoRef.current;

    const newPrePriceMap: Record<string, number> = {};
    const newLastPriceMap: Record<string, number> = {};

    marketInfo.forEach((market) => {
      const prevMarket = prevMarketInfo.find(m => m.marketId === market.marketId);
      const prevPrice = Number(prevMarket?.lastPrice ?? 0);

      newPrePriceMap[market.marketId] = prevPrice;
      newLastPriceMap[market.marketId] = Number(market.lastPrice);
    });

    setPrePriceMap(newPrePriceMap);
    setLastPriceMap(newLastPriceMap);

    prevMarketInfoRef.current = marketInfo;
  }, [marketInfo]);

  return (
    <>
      <div className="market-chart-container mb-4">
        <MarketChartUI {...marketChartProps as any} />
      </div>
      <ResultModal
        infoMessage={infoMessage}
        show={showResult}
        onClose={() => setShowResult(false)}
      />
    </>
  );
};

export default MarketChart; 