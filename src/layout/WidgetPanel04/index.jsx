import LayoutPanel from '../LayoutPanel';
import styles from './index.module.css';
import { Random } from 'mockjs'

function WidgetPanel04(props) {
    const { title } = props;
    const source = [
    {
        icon: 'fa-solid fa-temperature-three-quarters',
        label: '温度',
        value: '23',
        unit: '度',
        status: Random.pick([true, false]),
    },
    {
        icon: 'fa-solid fa-umbrella',
        label: '湿度',
        value: '70',
        unit: '%',
        status: Random.pick([true, false]),
    },
    {
        icon: 'fa-solid fa-fan',
        label: '气压',
        value: '23',
        unit: 'kPa',
        status: Random.pick([true, false]),
    },
    {
        icon: 'fa-solid fa-wind',
        label: '最大风速',
        value: '11',
        unit: 'm/s',
        status: Random.pick([true, false]),
    },
    {
        icon: 'fa-solid fa-temperature-arrow-up',
        label: '环境温度',
        value: '15',
        unit: '度',
        status: Random.pick([true, false]),
    },
    {
        icon: 'fa-solid fa-weight-scale',
        label: '负荷率',
        value: '23',
        unit: '%',
        status: Random.pick([true, false]),
    },
    {
        icon: 'fa-solid fa-plug',
        label: '总功率',
        value: '12',
        unit: 'kVa',
        status: Random.pick([true, false]),
    },
    {
        icon: 'fa-solid fa-plug',
        label: '有功功率',
        value: '12',
        unit: 'kVa',
        status: Random.pick([true, false]),
    },
    {
        icon: 'fa-solid fa-plug',
        label: '无功功率',
        value: '12',
        unit: 'kVa',
        status: Random.pick([true, false]),
    },
    ]

    const ListItem = ({item}) => {
        return (
            <div className={`${styles.item} ${item.status ? styles.error : ''}`}>
                {/* <div className={`${styles.icon} ${styles[item.icon]}`}></div> */}
                <div className={styles.label}>{item.label}</div>
                <div className={styles.key}>
                    <span className={styles.value}>{item.value}</span>
                    <span className={styles.unit}>{item.unit}</span>
                </div>
                {/* {item.status && (
                    <FontAwesomeIcon icon={faTriangleExclamation} className={styles.alert} />
                )} */}
                {/* <i  className={`fa-solid fa-triangle-exclamation ${styles.alert}`}></i> */}
            </div>
        );
    };
    return (
        <LayoutPanel title={title} children={
            <div className={styles.container}>
            {
              source.map((item, index) => (
                <ListItem key={`${item.name}-${(index+ new Date().getDate())}`} item={item} />
                ))
            }
            </div>
          }>

          </LayoutPanel>
    )
}

export default WidgetPanel04;