"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import styles from "./error.module.scss";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles["error-page"]}>
      <Card className={styles["error-page__card"]}>
        <h2 className={styles["error-page__title"]}>Ocurrió un error al cargar las listas</h2>
        <p className={styles["error-page__description"]}>
          Volvé a intentarlo o recargá la página si el problema persiste.
        </p>
        <Button
          type="button"
          onClick={reset}
          className={styles["error-page__button"]}
        >
          Reintentar
        </Button>
      </Card>
    </div>
  );
}
