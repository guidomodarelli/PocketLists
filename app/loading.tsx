import { Card } from "@/components/ui/card";
import styles from "./loading.module.scss";

export default function Loading() {
  return (
    <div className={styles["loading-page"]}>
      <Card className={styles["loading-page__card"]}>
        Cargando listas...
      </Card>
    </div>
  );
}
