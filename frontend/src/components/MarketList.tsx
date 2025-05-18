import React, { useMemo } from 'react';
import { 
  MDBCard, 
  MDBCardBody, 
  MDBCardHeader, 
  MDBTable, 
  MDBTableHead, 
  MDBTableBody,
  MDBBadge
} from 'mdb-react-ui-kit';
import { useAppSelector } from '../app/hooks';
import { selectMarketInfo } from '../data/market';

interface MarketListProps {
  selectedMarket: number | null;
  setSelectedMarket: React.Dispatch<React.SetStateAction<number | null>>;
  filteredMarkets?: any[];
}

const MarketList: React.FC<MarketListProps> = ({ 
  selectedMarket, 
  setSelectedMarket,
  filteredMarkets 
}) => {
  const marketInfo = useAppSelector(selectMarketInfo);
  
  // Group markets by status
  const groupedMarkets = useMemo(() => {
    // 使用传入的过滤后的市场或者原始市场数据
    const marketsToUse = filteredMarkets || marketInfo;
    
    const active = marketsToUse.filter(market => market.status === 1);
    const closed = marketsToUse.filter(market => market.status === 0);
    return { active, closed };
  }, [marketInfo, filteredMarkets]);

  // Handle market click
  const handleMarketClick = (marketId: number) => {
    setSelectedMarket(marketId === selectedMarket ? null : marketId);
  };

  // Get status badge
  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return <MDBBadge color='success' pill>Active</MDBBadge>;
    } else {
      return <MDBBadge color='danger' pill>Closed</MDBBadge>;
    }
  };

  // Price direction indicator
  const getPriceIndicator = (market: any) => {
    const previousPrice = market.previousPrice || 0;
    const currentPrice = Number(market.lastPrice);
    
    if (currentPrice > previousPrice) {
      return <span className="text-success">↑</span>;
    } else if (currentPrice < previousPrice) {
      return <span className="text-danger">↓</span>;
    }
    return <span>-</span>;
  };

  // 确定要显示的市场数据
  const marketsToDisplay = filteredMarkets || marketInfo;
  const hasFilteredResults = filteredMarkets && filteredMarkets.length > 0;
  const isFiltering = filteredMarkets && filteredMarkets.length !== marketInfo.length;

  return (
    <MDBCard className="mb-4">
      <MDBCardHeader className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">All Markets</h5>
        {isFiltering && (
          <span className="text-muted small">
            Showing {filteredMarkets?.length} of {marketInfo.length} markets
          </span>
        )}
      </MDBCardHeader>
      <MDBCardBody>
        <MDBTable hover responsive>
          <MDBTableHead>
            <tr>
              <th>Market ID</th>
              <th>Trading Pair</th>
              <th>Last Price</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </MDBTableHead>
          <MDBTableBody>
            {/* Active markets */}
            {groupedMarkets.active.map(market => (
              <tr 
                key={market.marketId}
                className={selectedMarket === market.marketId ? 'table-primary' : ''}
              >
                <td>{market.marketId}</td>
                <td>Token {market.tokenA} / Token {market.tokenB}</td>
                <td>
                  {market.lastPrice} {getPriceIndicator(market)}
                </td>
                <td>{getStatusBadge(market.status)}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleMarketClick(market.marketId)}
                  >
                    {selectedMarket === market.marketId ? 'Close' : 'View'}
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Closed markets */}
            {groupedMarkets.closed.map(market => (
              <tr 
                key={market.marketId}
                className={`${selectedMarket === market.marketId ? 'table-primary' : ''} text-muted`}
              >
                <td>{market.marketId}</td>
                <td>Token {market.tokenA} / Token {market.tokenB}</td>
                <td>
                  {market.lastPrice} {getPriceIndicator(market)}
                </td>
                <td>{getStatusBadge(market.status)}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    disabled={market.status === 0}
                    onClick={() => handleMarketClick(market.marketId)}
                  >
                    {selectedMarket === market.marketId ? 'Close' : 'View'}
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Display when no markets are available or no search results */}
            {marketsToDisplay.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center">
                  {hasFilteredResults ? 'No matching markets found' : 'No market data available'}
                </td>
              </tr>
            )}
          </MDBTableBody>
        </MDBTable>
      </MDBCardBody>
    </MDBCard>
  );
};

export default MarketList; 