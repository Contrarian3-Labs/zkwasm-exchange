import React, { useState } from 'react';
import {
  MDBContainer,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
  MDBPagination,
  MDBPaginationItem,
  MDBPaginationLink,
  MDBPopover,
  MDBPopoverBody
} from 'mdb-react-ui-kit';
import { UserState } from "../data/state";
import { useAppSelector } from '../app/hooks';
import { selectUserState } from '../data/state';
import { selectMarketInfo } from "../data/market";
import { Order } from "../data/state";
import { typeMap, statusMap } from "./MarketPage";
import { FLAG_BUY } from './Commands';

interface TradeInfoProps {
  playerState: UserState | null;
  handleTabClick: (value: string) => void;
}

interface Trade {
  a_actual_amount: number;
  a_order_id: number;
  b_actual_amount: number;
  b_order_id: number;
  trade_id: number;
}

export const TradeInfo: React.FC<TradeInfoProps> = ({ playerState, handleTabClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const userState = useAppSelector(selectUserState);
  const marketInfo = useAppSelector(selectMarketInfo);
  const rowsPerPage = 5;

  // get orders data
  const orders = userState?.state?.orders || [];

  let trades: Trade[] = [];

  if(playerState && playerState.state) {
    trades = playerState.state.trades;
  }

  const totalPages = (trades && trades.length) ? Math.ceil(trades.length / rowsPerPage) : 0;

  const currentTrades = (trades && trades.length) ? trades.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  ) : [];

  const enrichedTrades = currentTrades.map((trade) => {
    const aOrder = orders.find(order => order.id === trade.a_order_id);
    const bOrder = orders.find(order => order.id === trade.b_order_id);

    if (!aOrder) {
      return {
        ...trade,
        aOrder: undefined,
        bOrder: undefined,
        marketId: '–',
        buyTokenIndexIn: null,
        buyTokenIndexOut: null
      };
    }

    const marketId = aOrder.market_id;
    const market = marketInfo.filter(market => market.marketId === marketId);

    if (market.length === 0) {
      return {
        ...trade,
        aOrder,
        bOrder,
        marketId: "-",
        buyTokenIndexIn: null,
        buyTokenIndexOut: null
      };
    }

    const buyTokenIndexIn = market[0].tokenA;
    const buyTokenIndexOut = market[0].tokenB;

    return {
      ...trade,
      aOrder,
      bOrder,
      marketId,
      buyTokenIndexIn,
      buyTokenIndexOut
    };
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderOrderPopover = (order: Order | undefined) => {
    if (!order) return '–';
    return (
      <MDBPopover
        placement="right"
        dismiss
        btnChildren={`View orderId ${order.id}`}
        btnClassName="btn btn-sm btn-outline-primary"
        popperTag="div"
      >
        <MDBPopoverBody className="text-start">
          <div><strong>Order ID:</strong> {order.id}</div>
          <div><strong>Market ID:</strong> {order.market_id}</div>
          <div><strong>Flag:</strong> {order.flag === FLAG_BUY ? "Buy": "Sell"}</div>
          <div><strong>Pid:</strong> {order.pid}</div>
          <div><strong>Type:</strong> {typeMap[order.type_]}</div>
          <div><strong>Status:</strong> {statusMap[order.status]}</div>
          <div><strong>Price:</strong> {order.price}</div>
          <div><strong>A Token Amount:</strong> {order.a_token_amount}</div>
          <div><strong>B Token Amount:</strong> {order.b_token_amount}</div>
          <div><strong>Locked Balance:</strong> {order.lock_balance}</div>
          <div><strong>Locked Fee:</strong> {order.lock_fee}</div>
          <div><strong>Already Deal Amount:</strong> {order.already_deal_amount}</div>
        </MDBPopoverBody>
      </MDBPopover>
    );
  };

  return (
    <MDBContainer className="mt-3">
      <MDBTable>
        <MDBTableHead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Trade ID</th>
            <th scope="col">Market ID</th>
            <th scope="col">
              Buy Side
            </th>
            <th scope="col">
              Sell Side
            </th>
            <th scope="col">Trading Amount</th>
          </tr>
        </MDBTableHead>
        <MDBTableBody>
          {enrichedTrades.map((trade, index) => {
            return (
              <tr key={index}>
                <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                <td>{trade.trade_id}</td>
                <td onClick={() => handleTabClick("4")} className="tableMarket">{trade.marketId}</td>
                <td>
                  {renderOrderPopover(trade.aOrder)}
                  <br />
                  (Paying Token Index {trade.buyTokenIndexIn} → Receiving Token Index {trade.buyTokenIndexOut})
                </td>
                <td>
                  {renderOrderPopover(trade.bOrder)}
                  <br />
                  (Paying Token Index {trade.buyTokenIndexOut} → Receiving Token Index {trade.buyTokenIndexIn})
                </td>
                <td>{trade.a_actual_amount}</td>
              </tr>
            );
          })}
        </MDBTableBody>
      </MDBTable>

      <MDBPagination className="mb-0">
        <MDBPaginationItem disabled={currentPage === 1}>
          <MDBPaginationLink
            style={{ cursor: 'pointer' }}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </MDBPaginationLink>
        </MDBPaginationItem>
        {[...Array(totalPages)].map((_, i) => (
          <MDBPaginationItem key={i} active={currentPage === i + 1}>
            <MDBPaginationLink
              style={{ cursor: 'pointer' }}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </MDBPaginationLink>
          </MDBPaginationItem>
        ))}
        <MDBPaginationItem disabled={currentPage === totalPages}>
          <MDBPaginationLink
            style={{ cursor: 'pointer' }}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </MDBPaginationLink>
        </MDBPaginationItem>
      </MDBPagination>
    </MDBContainer>
  );
};