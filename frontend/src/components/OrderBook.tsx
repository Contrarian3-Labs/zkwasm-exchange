import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { MDBTypography } from 'mdb-react-ui-kit';
import { OrderBookUI, OrderItem } from "polymarket-ui";
import { useAppSelector } from '../app/hooks';
import { selectUserState, Order } from '../data/state';
import { selectMarketInfo } from "../data/market";
import { ResultModal } from "../modals/ResultModal";

interface OrderBookProps {
  title?: string;
  selectedMarket?: number | null;
}

export const OrderBook: React.FC<OrderBookProps> = ({ 
  title = "Order Book",
  selectedMarket = 1
}) => {
  const userState = useAppSelector(selectUserState);
  const marketInfo = useAppSelector(selectMarketInfo);
  const [infoMessage, setInfoMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [prePriceMap, setPrePriceMap] = useState<Record<string, number>>({});
  const [lastPriceMap, setLastPriceMap] = useState<Record<string, number>>({});
  const prevMarketInfoRef = useRef<typeof marketInfo>([]);

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

  const handleOrderClick = useCallback((order: OrderItem, type: "ask" | "bid") => {
    console.log(`${type} order clicked:`, order);
    setInfoMessage(`${type} order clicked: ${JSON.stringify(order)}`);
    setShowResult(true);
  }, []);

  // 活跃市场
  const activeMarkets = useMemo(() => 
    marketInfo.filter(market => market.status === 1), 
    [marketInfo]
  );

  // 订单簿属性
  const orderBookProps = useMemo(() => {
    // 如果没有活跃市场或没有选中市场，返回默认订单簿配置
    if (activeMarkets.length === 0 || !selectedMarket) {
      return {
        title,
        asks: [
          { price: 62, quantity: 30000, total: 18600 },
          { price: 61, quantity: 25000, total: 15250 },
          { price: 60, quantity: 5000, total: 3000 },
        ],
        bids: [
          { price: 39, quantity: 225200, total: 87828 },
          { price: 38, quantity: 30000, total: 11400 },
          { price: 37, quantity: 45000, total: 16650 },
        ],
        summary: {
          lastPrice: 39,
          spread: 21,
          priceDirection: "up" as "up" | "down" | "neutral",
        },
        config: {
          priceUnit: "$",
          quantityLabel: "Quantity",
          totalLabel: "Total",
          askColor: "text-red-500",
          bidColor: "text-green-500",
        },
        onOrderClick: handleOrderClick
      };
    }

    // 找到选中的市场
    const market = activeMarkets.find(m => m.marketId === selectedMarket);
    if (!market) {
      return {
        title,
        asks: [
          { price: 62, quantity: 30000, total: 18600 },
          { price: 61, quantity: 25000, total: 15250 },
          { price: 60, quantity: 5000, total: 3000 },
        ],
        bids: [
          { price: 39, quantity: 225200, total: 87828 },
          { price: 38, quantity: 30000, total: 11400 },
          { price: 37, quantity: 45000, total: 16650 },
        ],
        summary: {
          lastPrice: 39,
          spread: 21,
          priceDirection: "up" as "up" | "down" | "neutral",
        },
        config: {
          priceUnit: "$",
          quantityLabel: "Quantity",
          totalLabel: "Total",
          askColor: "text-red-500",
          bidColor: "text-green-500",
        },
        onOrderClick: handleOrderClick
      };
    }

    // 获取该市场的订单
    const marketId = market.marketId;
    const marketOrders = groupedOrders[marketId] || [];
    
    // 处理卖单（asks）
    let asks = marketOrders.filter((order: any) => order.flag === 0).sort((a, b) => a.price - b.price);
    asks = asks.map((ask) => {
      let quantity = ask.b_token_amount ? ask.b_token_amount : ask.a_token_amount;
      let price = ask.price;
      let total = parseFloat(((price * quantity) / 100).toFixed(2));
      return {
        price,
        quantity,
        total
      }
    });
    
    // 处理买单（bids）
    let bids = marketOrders.filter((order: any) => order.flag === 1).sort((a, b) => b.price - a.price);
    bids = bids.map((bid) => {
      let quantity = bid.b_token_amount ? bid.b_token_amount : bid.a_token_amount;
      let price = bid.price;
      let total = parseFloat(((price * quantity) / 100).toFixed(2));
      return {
        price,
        quantity,
        total
      }
    });

    // 计算价格方向
    const priceDirection: "up" | "down" | "neutral" =
      lastPriceMap[marketId] > prePriceMap[marketId] ? "up" : 
      lastPriceMap[marketId] < prePriceMap[marketId] ? "down" : "neutral";

    return {
      title: title || `Market ${marketId}`,
      asks,
      bids,
      summary: {
        lastPrice: Number(market.lastPrice),
        spread: asks.length && bids.length ? Number((asks[0].price - bids[0].price).toFixed(2)) : 0,
        priceDirection
      },
      config: {
        priceUnit: "$",
        quantityLabel: "Quantity",
        totalLabel: "Total",
        askColor: "text-red-500",
        bidColor: "text-green-500",
      },
      onOrderClick: handleOrderClick
    };
  }, [activeMarkets, groupedOrders, handleOrderClick, lastPriceMap, prePriceMap, selectedMarket, title]);

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
      <div className="order-book-section">
        <MDBTypography tag="h5" className="mb-3 text-center font-weight-bold">
          {title}
        </MDBTypography>
        <div className="order-book-container">
          <OrderBookUI {...orderBookProps} />
        </div>
      </div>
      <ResultModal
        infoMessage={infoMessage}
        show={showResult}
        onClose={() => setShowResult(false)}
      />
    </>
  );
};

export default OrderBook; 