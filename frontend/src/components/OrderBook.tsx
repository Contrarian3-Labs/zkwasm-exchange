import React from "react";
import { MDBTypography } from 'mdb-react-ui-kit';
import { OrderBookUI } from "polymarket-ui";

interface OrderBookProps {
  title?: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ title = "Order Book" }) => {
  const handleOrderClick = (order: any, type: "ask" | "bid") => {
    console.log(`点击${type}订单:`, order);
  };

  // 订单簿属性
  const orderBookProps = {
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

  return (
    <div className="order-book-section">
      <MDBTypography tag="h5" className="mb-3 text-center font-weight-bold">
        {title}
      </MDBTypography>
      <div className="order-book-container">
        <OrderBookUI {...orderBookProps as any} />
      </div>
    </div>
  );
};

export default OrderBook; 