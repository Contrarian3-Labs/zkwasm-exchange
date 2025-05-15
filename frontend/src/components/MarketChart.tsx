import React from "react";
import { MarketChartUI } from "polymarket-ui";

interface MarketChartProps {
  title?: string;
  mainValue?: number;
  changeValue?: number;
}

export const MarketChart: React.FC<MarketChartProps> = ({ 
  title = "US recession in 2025?", 
  mainValue = 39, 
  changeValue = 7.8 
}) => {
  const handleTimeRangeChange = (range: string) => {
    console.log("时间范围改变:", range);
  };

  const handleBookmark = () => {
    console.log("添加书签");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    console.log("分享链接");
  };

  const handleCopy = () => {
    console.log("复制内容");
  };

  // 生成图表数据
  const generateChartData = () => {
    const data = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString(),
        price: Math.floor(Math.random() * 20) + 30 // 生成30-50之间的随机价格
      });
    }
    return data.reverse();
  };

  // 图表属性
  const chartProps = {
    title,
    mainValue,
    changeValue,
    chartData: generateChartData(),
    selectedTimeRange: "1W",
    onTimeRangeChange: handleTimeRangeChange,
    actions: {
      onBookmark: handleBookmark,
      onShare: handleShare,
      onCopy: handleCopy,
    }
  };

  return (
    <div className="market-chart-container mb-4">
      <MarketChartUI {...chartProps as any} />
    </div>
  );
};

export default MarketChart; 