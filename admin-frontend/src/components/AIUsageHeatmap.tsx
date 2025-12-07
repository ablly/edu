/**
 * AI使用热力图组件
 */

import React from 'react';
import { Card, Spin, Empty } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useQuery } from '@tanstack/react-query';
import { getAIUsageHeatmap } from '../api/dashboard';

interface AIUsageHeatmapProps {
  days?: number;
}

const AIUsageHeatmap: React.FC<AIUsageHeatmapProps> = ({ days = 30 }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-usage-heatmap', days],
    queryFn: () => getAIUsageHeatmap(days),
  });

  if (isLoading) {
    return (
      <Card title="AI功能使用热力图" style={{ height: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data || !data.heatmap_data || data.heatmap_data.length === 0) {
    return (
      <Card title="AI功能使用热力图" style={{ height: 400 }}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  // 准备热力图数据
  const { heatmap_data, dates, features } = data;

  // 计算最大值用于颜色映射
  const maxValue = Math.max(...heatmap_data.map(item => item[2]));

  const option: EChartsOption = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const [date, feature, count] = params.data;
        return `${date}<br/>${feature}: ${count}次`;
      },
    },
    grid: {
      left: '10%',
      right: '5%',
      top: '10%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      splitArea: {
        show: true,
      },
      axisLabel: {
        rotate: 45,
        interval: Math.floor(dates.length / 10), // 显示部分日期避免拥挤
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'category',
      data: features,
      splitArea: {
        show: true,
      },
      axisLabel: {
        fontSize: 12,
      },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
      },
      text: ['高', '低'],
      textStyle: {
        color: '#666',
      },
    },
    series: [
      {
        name: 'AI功能使用',
        type: 'heatmap',
        data: heatmap_data.map(item => {
          const [date, feature, count] = item;
          return [dates.indexOf(date), features.indexOf(feature), count];
        }),
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return (
    <Card 
      title="AI功能使用热力图" 
      style={{ height: 450 }}
      bodyStyle={{ padding: '20px 10px' }}
    >
      <ReactECharts 
        option={option} 
        style={{ height: 360 }} 
        notMerge={true}
        lazyUpdate={true}
      />
    </Card>
  );
};

export default AIUsageHeatmap;

