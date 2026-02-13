import styles from "./loading.module.scss";

export default function Loading() {
  return (
    <div className={styles["loading-page"]}>
      <span className={styles["loading-page__loader"]} role="status" aria-label="Cargando listas" />
    </div>
  );
}
