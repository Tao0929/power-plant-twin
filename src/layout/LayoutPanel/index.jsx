
import styles from './index.module.css';
function LayoutPanel(props) {
    const { title, children } = props;
  return (
    <div className={`${styles.layoutPanel}`}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderTitle}>{title}</div>
      </div>
      <div className={styles.panelBody}>
        {children}
      </div>
    </div>
  );
}
export default LayoutPanel