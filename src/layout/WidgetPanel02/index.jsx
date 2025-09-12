import React, { useEffect, useRef } from 'react';
import LayoutPanel from '../LayoutPanel';
import styles from './index.module.css';
import * as echarts from 'echarts';

function WidgetPanel02(props) {
    const { title } = props;
    const chartRef = useRef(null);

    const generateOptions = (sources) => {
        return {
            legend: {
            show: true,
            right: 0,
            top: 0,
            textStyle: {
                color: '#fff',
            },
            },
            tooltip: {
            trigger: 'axis',
            backgroundColor: '#000',
            borderColor: '#333',
            textStyle: {
                color: '#fff',
            },
            },
            grid: {
            left: '1%',
            right: '6%',
            bottom: '0%',
            top: '20%',
            containLabel: true,
            },
            xAxis: {
            type: 'category',
            boundaryGap: false,
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false,
            },
            axisLabel: {
                color: '#fff',
                margin: 20,
            },
            data: [
                '1月',
                '2月',
                '3月',
                '4月',
                '5月',
                '6月',
                '7月',
                '8月',
                '9月',
                '10月',
                '11月',
                '12月',
            ],
            },
            yAxis: {
            type: 'value',
            axisLabel: {
                color: '#c8c8c8',
            },
            splitLine: {
                lineStyle: {
                color: '#c8c8c830',
                type: 'dashed',
                },
            },
            },
            series: [
            {
                name: '2024',
                type: 'line',
                symbol: 'none',
                smooth: true,
                lineStyle: {
                normal: {
                    width: 2,
                    color: 'rgba(0, 254, 169, 1)',
                },
                },
                itemStyle: {
                color: 'rgba(0, 254, 169, 0.5)',
                },
                areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                    offset: 0,
                    color: 'rgba(31, 218, 163, 0.4)',
                    },
                    {
                    offset: 1,
                    color: 'rgba(31, 218, 163, 0)',
                    },
                ]),
                },
                data: sources[0],
            },
            {
                name: '2023',
                type: 'line',
                symbol: 'none',
                smooth: true,
                lineStyle: {
                normal: {
                    width: 2,
                    color: 'rgba(87, 153, 214, 1)',
                },
                },
                itemStyle: {
                color: 'rgba(87, 153, 214, 1)',
                },
                data: sources[1],
            },
            ],
        }
    }

    useEffect(() => {
        if (chartRef.current) {
            const chart = echarts.init(chartRef.current);
            const sources = [
                [859, 571, 612, 906, 866, 984, 212, 931, 749, 993, 276, 477],
                [598, 539, 861, 375, 576, 383, 896, 430, 315, 755, 808, 630],
            ]
            const options = generateOptions(sources)
            chart.setOption(options);
        }
    }, [])
    
    return (
        <LayoutPanel title={title} children={
            <div 
            ref={chartRef} 
            style={{ width: '100%', height: '100%' }}
            />
        }>            
        </LayoutPanel>
    )
}
export default WidgetPanel02;