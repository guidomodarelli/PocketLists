import type { GetServerSideProps, GetServerSidePropsResult } from "next";

type HomePageProps = Record<string, never>;

export const getServerSideProps = (async (): Promise<GetServerSidePropsResult<HomePageProps>> => {
  const { createList, getDefaultListId } = await import("@/app/features/lists/services");
  const defaultListId = getDefaultListId() ?? createList("Sin nombre").id;

  return {
    redirect: {
      destination: `/lists/${encodeURIComponent(defaultListId)}`,
      permanent: false,
    },
  };
}) satisfies GetServerSideProps<HomePageProps>;

export default function HomePage() {
  return null;
}
