import LayoutPanel from '../LayoutPanel';
import styles from './index.module.css';
import React, { useEffect, useRef, useState } from 'react';
import { Random } from 'mockjs'

function WidgetPanel06 (props) {
    const { title } = props;
    const container06 = useRef(null);
    const timerRef = useRef(null);
    // 动画状态
    const [isScrolling, setIsScrolling] = useState(false);
    const equipments = [
        '发动机',
        '叶片',
        '轮毂',
        '主轴',
        '发电机',
        '塔架',
        '变流器',
        '变桨系统',
        '齿轮箱',
    ]
    const [dataList, setDataList] = useState([...equipments.map((eq) => ({
            name: eq,
            status: Random.pick([0, 1]),
            time: Random.date('MM/dd HH:mm:ss'),
        }))]);
    
    // 启动定时滚动
    const startAutoScroll = () => {
        if (timerRef.current) {
        clearInterval(timerRef.current);
        }
        
        timerRef.current = setInterval(() => {
        setIsScrolling(true);
        
        setTimeout(() => {
            if (!timerRef.current) return;
            
            setIsScrolling(false);
            
            // 移动第一个项目到列表末尾
            setDataList(prevList => {
            const [first, ...rest] = prevList;
            return [...rest, first];
            });
        }, 1500);
        }, 2500);
    };

    useEffect(() => {
        startAutoScroll();
        return () => { 
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setIsScrolling(false);
        }
    }, [])

    const ListItem = ({item}) => {
        return (
            <div className={`${styles.itemBox} ${item.status==0 ? styles.error : ''}`}>
                    <div className={`${styles.itemCircle} ${item.status==0 ? styles.itemCircleError : ''}`}></div>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemType}>{item.status===0 ? '部件异常' : '正常'}</div>
                    <div className={styles.itemTime}>{item.time}</div>
                </div>
        )
    }

    return (
        <LayoutPanel title={title} children={
            <div className={styles.wrap}>
                <div className={`${styles.itemList} ${isScrolling ? styles.itemListScroll : ''}`} ref={container06}>
                    {
                        dataList.map((item,index) => (
                            <ListItem key={item.name+index} item={item} />
                            ))
                    }
                </div>
            </div>
        } />
    )

}
export default WidgetPanel06;