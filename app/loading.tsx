import styles from "./loading.module.scss";

export default function Loading() {
  return (
    <div className={styles["loading-page"]}>
      <div className={styles["loading-page__card"]}>
        Cargando listas...
      </div>
    </div>
  );
}
