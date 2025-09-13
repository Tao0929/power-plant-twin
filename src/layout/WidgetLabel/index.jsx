import styles from './index.module.css'
function WidgetLabel(props) {
  const { name } = props
  return (
    <div className={styles.equipmentLabel}>
      {name}
    </div>
  )
}
export default WidgetLabel