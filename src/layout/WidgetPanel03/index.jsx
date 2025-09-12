import React, { useEffect, useRef } from 'react';
import LayoutPanel from '../LayoutPanel';
import styles from './index.module.css';
import * as echarts from 'echarts';

function WidgetPanel03(props) {
    const { title } = props;
    const chartRef03 = useRef(null);

    const generateOptions = () => ({
        legend: {
            show: true,
            right: 0,
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
            left: '4%',
            right: '4%',
            bottom: '0%',
            top: '10%',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            axisLine: {
            show: false,
            },
            axisTick: {
            show: false,
            },
            axisLabel: {
            color: '#fff',
            margin: 10,
            },
            data: [...Array(30).keys()],
        },
        yAxis: {
            type: 'value',
            axisLabel: {
            color: '#fff',
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
            smooth: true,
            showSymbol: false,
            data: Array.from({ length: 30 }).map(
                () => Math.floor(Math.random() * 90) + 10
            ),
            type: 'bar',
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0, 254, 169, 1)' },
                { offset: 1, color: 'rgba(65, 138, 255, 0.2)' },
                ]),
            },
            },
        ],
    })

    useEffect(() => { 
        if (chartRef03.current) {
            const chart = echarts.init(chartRef03.current);
            const options = generateOptions()
            chart.setOption(options);
        }
    }, [])

    return (
        <LayoutPanel title={title} children={
            <div 
            ref={chartRef03} 
            style={{ width: '100%', height: '100%' }}
            />
        } />
    )
}
export default WidgetPanel03;