
import styles from './index.module.css';
import { useState, useEffect } from 'react';

function LayoutHeader () {
    const [state, setState] = useState({
        time: '--:--:--',
        date: '--/--/--',
        week: '--',
    });

    // 格式化时间函数
    const formatDateTime = () => {
        const now = new Date();
        
        // 格式化时间 HH:mm:ss
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const time = `${hours}:${minutes}:${seconds}`;
        
        // 格式化日期 MM/DD/YYYY
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const year = now.getFullYear();
        const date = `${month}/${day}/${year}`;
        
        // 格式化星期（中文显示）
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const week = weekdays[now.getDay()];
        
        return { time, date, week };
    };

    // 设置定时器每秒更新时间
    useEffect(() => {
        // 立即执行一次获取当前时间
        setState(formatDateTime());
        
        // 设置定时器，每秒更新一次
        const timer = setInterval(() => {
            setState(formatDateTime());
        }, 1000);
        
        // 组件卸载时清除定时器
        return () => clearInterval(timer);
    }, []);

    return <div className={styles.layoutHeader}>
        <div className={styles.headerMiddle}>
            <div className={styles.cn}>中亿风力发电机监控平台</div>
            <div className={styles.en}>ZY Large Wind Turbine Monitoring Platform</div>
        </div>
        <div className={styles.headerRight}>
            <span>{ state.time }</span>
            <span>{ state.date }</span>
            <span>{ state.week }</span>
            <span>13°c</span>
        </div>
    </div>
}

export default LayoutHeader;