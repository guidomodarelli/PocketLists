import type { GetServerSidePropsContext } from "next";
import { getServerSideProps } from "@/pages/index";
import * as services from "@/app/features/lists/services";

jest.mock("@/app/features/lists/services", () => ({
  createList: jest.fn(),
  getDefaultListId: jest.fn(),
}));

const servicesMock = jest.mocked(services);

describe("Root page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirige a la lista por defecto cuando existe", async () => {
    servicesMock.getDefaultListId.mockReturnValue("list-default");

    const result = await getServerSideProps({} as GetServerSidePropsContext);

    expect(result).toEqual({
      redirect: {
        destination: "/lists/list-default",
        permanent: false,
      },
    });
    expect(servicesMock.createList).not.toHaveBeenCalled();
  });

  test("crea una lista sin nombre cuando no hay listas y redirige", async () => {
    servicesMock.getDefaultListId.mockReturnValue(undefined);
    servicesMock.createList.mockReturnValue({ id: "list-new", title: "Sin nombre", items: [] });

    const result = await getServerSideProps({} as GetServerSidePropsContext);

    expect(result).toEqual({
      redirect: {
        destination: "/lists/list-new",
        permanent: false,
      },
    });
    expect(servicesMock.createList).toHaveBeenCalledWith("Sin nombre");
  });
});
