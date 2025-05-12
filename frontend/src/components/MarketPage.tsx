import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardHeader,
  MDBTabs,
  MDBTabsContent,
  MDBTabsItem,
  MDBTabsLink,
  MDBTabsPane
} from 'mdb-react-ui-kit';
import { selectUserState, Order } from '../data/state';
import { useAppSelector } from '../app/hooks';
import { selectMarketInfo } from "../data/market";
import { MarketChartUI, ChartData, OrderBookUI, OrderItem } from "polymarket-ui";
import { ResultModal } from "../modals/ResultModal";

export const typeMap: { [key: number]: string } = {
  0: "Limit Order",
  1: "Market Order"
}

export const statusMap: { [key: number]: string } = {
  0: 'Live',
  1: 'Match',
  2: 'Partial Match',
  3: 'Partial Cancel',
  4: 'Cancel',
};

interface MarketPageProps {
  selectedMarket: number | null;
  setSelectedMarket: React.Dispatch<React.SetStateAction<number | null>>;
}

export const MarketPage: React.FC<MarketPageProps> = ({
  selectedMarket,
  setSelectedMarket
}) => {
  const userState = useAppSelector(selectUserState);
  const marketInfo = useAppSelector(selectMarketInfo);
  const [selectedTimeRange, setSelectedTimeRange] = useState("ALL");
  const [infoMessage, setInfoMessage] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [activeTab, setActiveTab] = useState("orderbook");
  const [prePriceMap, setPrePriceMap] = useState<Record<string, number>>({});
  const [lastPriceMap, setLastPriceMap] = useState<Record<string, number>>({});
  const prevMarketInfoRef = useRef<typeof marketInfo>([]);

  // get orders data
  const orders = useMemo(() => userState?.state?.orders ?? [], [userState?.state?.orders]);

  // group orders by marketId
  const groupedOrders = useMemo(() => {
    return orders.reduce((acc: { [key: number]: any[] }, order) => {
      if (!acc[order.market_id]) acc[order.market_id] = [];
      acc[order.market_id].push(order);
      return acc;
    }, {});
  }, [orders]);

  const handleTabClick = (tab: string) => {
    if (tab !== activeTab) setActiveTab(tab);
  };

  const handleMarketClick = (marketId: number) => {
    setSelectedMarket(marketId === selectedMarket ? null : marketId); // Toggle market selection
  };

  const handleTimeRangeChange = useCallback((range: string) => {
    setSelectedTimeRange(range);
    // In a real implementation, this would fetch new data based on the time range
  }, []);

  const handleBookmark = useCallback(() => {
    setInfoMessage("Bookmark clicked");
    setShowResult(true);
    // Implement bookmark logic
  }, []);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setInfoMessage("Share clicked");
    setShowResult(true);
    // Implement share logic
  }, []);

  const handleCopy = useCallback(() => {
    setInfoMessage("Copy clicked");
    setShowResult(true);
    // Implement copy logic
  }, []);

  const activeMarkets = marketInfo.filter(market => market.status === 1);

  const handleOrderClick = useCallback((order: OrderItem, type: "ask" | "bid") => {
    console.log(`${type} order clicked:`, order);
  }, []);

  // Mock data generator
  // no data in state from back end now
  const generateMockChartData = (orders: Order[]): ChartData[] => {
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
  };

  const orderBookPropsArray = useMemo(() => {
    return activeMarkets.map((market) => {
      const marketId = market.marketId;
      const marketOrders = groupedOrders[marketId] || [];
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

      // Calculate price direction
      const priceDirection: "up" | "down" | "neutral" =
      lastPriceMap[marketId] > prePriceMap[marketId] ? "up" : lastPriceMap[marketId] < prePriceMap[marketId] ? "down" : "neutral";

      return {
        title: "Market " + marketId,
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
      }
    });
  }, [activeMarkets, groupedOrders, lastPriceMap, prePriceMap, handleOrderClick]);

  const marketChartPropsArray = useMemo(() => {
    return activeMarkets.map((market) => {
      const marketId = market.marketId;
      const marketOrders = groupedOrders[marketId] || [];
      let mainValue;
      let changeValue;
      if(marketOrders.length !== 0) {
        let lastOrder = marketOrders[marketOrders.length - 1];
        let firstOrder = marketOrders[0];
        mainValue = lastOrder.price;
        changeValue = mainValue - firstOrder.price
      } else {
        mainValue = 0;
        changeValue = 0;
      }
      return {
        title: "Market " + marketId,
        mainValue,
        changeValue,
        chartData: generateMockChartData(marketOrders),
        selectedTimeRange,
        onTimeRangeChange: handleTimeRangeChange,
        actions: {
          onBookmark: handleBookmark,
          onShare: handleShare,
          onCopy: handleCopy,
        }
      }
    });
  }, [
    activeMarkets,
    groupedOrders,
    handleBookmark,
    handleCopy,
    handleShare,
    handleTimeRangeChange,
    selectedTimeRange
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
    <MDBContainer>
      <MDBRow>
        {activeMarkets.length === 0 ? (
          <div>No markets available</div>
        ) : (
          activeMarkets.map((market, index) => {
            const marketId = market.marketId;
            return (
              <MDBCol md="12" key={marketId}>
                <MDBCard>
                  <MDBCardHeader>
                    <div className="d-flex">
                      <h5
                        onClick={() => handleMarketClick(1)}
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
                        onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
                      >
                        Market {marketId}
                      </h5>
                    </div>
                  </MDBCardHeader>
                  {selectedMarket === 1 && (
                    <MDBCardBody>
                      <MDBTabs className="mb-3">
                        <MDBTabsItem>
                          <MDBTabsLink
                            onClick={() => handleTabClick("orderbook")}
                            active={activeTab === "orderbook"}
                          >
                            Orderbook
                          </MDBTabsLink>
                        </MDBTabsItem>
                        <MDBTabsItem>
                          <MDBTabsLink
                            onClick={() => handleTabClick("graph")}
                            active={activeTab === "graph"}
                          >
                            Graph
                          </MDBTabsLink>
                        </MDBTabsItem>
                      </MDBTabs>

                      <MDBTabsContent>
                        <MDBTabsPane open={activeTab === "orderbook"}>
                          {orderBookPropsArray && orderBookPropsArray[index] && <OrderBookUI {...orderBookPropsArray[index]} />}
                        </MDBTabsPane>

                        <MDBTabsPane open={activeTab === "graph"}>
                          {marketChartPropsArray && marketChartPropsArray[index] && <MarketChartUI {...marketChartPropsArray[index]} />}
                        </MDBTabsPane>
                      </MDBTabsContent>
                    </MDBCardBody>
                  )}
                </MDBCard>
              </MDBCol>
            );
          })
        )}
      </MDBRow>
    </MDBContainer>
    <ResultModal
      infoMessage={infoMessage}
      show={showResult}
      onClose={() => setShowResult(false)}
    />
    </>
  );
};