import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useListsMutations } from "../hooks/useListsMutations";
import { listsQueryKey } from "../hooks/useListsQuery";
import type { ListsResponse } from "../types";

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

function createListsResponse(): ListsResponse {
  return {
    lists: [{ id: "list-1", title: "Lista original" }],
    activeList: {
      id: "list-1",
      title: "Lista original",
      items: [{ id: "item-1", title: "Item original", completed: false, children: [] }],
    },
  };
}

function createListsResponseWithTwoItems(): ListsResponse {
  return {
    lists: [{ id: "list-1", title: "Lista original" }],
    activeList: {
      id: "list-1",
      title: "Lista original",
      items: [
        { id: "item-1", title: "Item 1", completed: false, children: [] },
        { id: "item-2", title: "Item 2", completed: false, children: [] },
      ],
    },
  };
}

describe("useListsMutations", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test("aplica update optimista y hace rollback con toast si falla", async () => {
    const queryClient = new QueryClient();
    const initialData = createListsResponse();
    queryClient.setQueryData(listsQueryKey("list-1"), initialData);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    let resolveMutation: ((value: { ok: boolean; json: () => Promise<unknown> }) => void) | null = null;
    global.fetch = jest.fn(() => new Promise((resolve) => {
      resolveMutation = resolve as (value: { ok: boolean; json: () => Promise<unknown> }) => void;
    })) as typeof fetch;

    const { result } = renderHook(() => useListsMutations("list-1"), { wrapper });

    let mutationPromise: Promise<unknown> = Promise.resolve();
    act(() => {
      mutationPromise = result.current
        .mutateAction("editItemTitle", {
          listId: "list-1",
          id: "item-1",
          title: "Item optimista",
        })
        .catch(() => undefined);
    });

    await waitFor(() => {
      const optimisticData = queryClient.getQueryData<ListsResponse>(listsQueryKey("list-1"));
      expect(optimisticData?.activeList.items[0]?.title).toBe("Item optimista");
    });

    act(() => {
      resolveMutation?.({
        ok: true,
        json: async () => ({ redirectTo: "/lists/list-1?error=edit" }),
      });
    });

    await waitFor(() => {
      expect((toast.error as jest.Mock).mock.calls.length).toBe(1);
    });
    await mutationPromise;

    const rolledBackData = queryClient.getQueryData<ListsResponse>(listsQueryKey("list-1"));
    expect(rolledBackData?.activeList.items[0]?.title).toBe("Item original");
  });

  test("sincroniza cache canónica y notifica redirect en éxito", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(listsQueryKey("list-1"), createListsResponse());
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const redirectSpy = jest.fn();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        {
          ok: true,
          json: async () => ({ redirectTo: "/lists/list-2" }),
        } as Response
      )
      .mockResolvedValueOnce(
        {
          ok: true,
          json: async () => ({
            lists: [{ id: "list-2", title: "Lista canónica" }],
            activeList: { id: "list-2", title: "Lista canónica", items: [] },
          }),
        } as Response
      ) as typeof fetch;

    const { result } = renderHook(
      () =>
        useListsMutations("list-1", {
          onRedirect: redirectSpy,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAction("createList", {});
    });

    await waitFor(() => {
      const canonicalData = queryClient.getQueryData<ListsResponse>(listsQueryKey("list-2"));
      expect(canonicalData?.activeList.id).toBe("list-2");
    });

    expect(redirectSpy).toHaveBeenCalledWith("/lists/list-2", "list-2");
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  test("evita sincronización canónica intermedia con mutaciones concurrentes", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(listsQueryKey("list-1"), createListsResponseWithTwoItems());

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const pendingResolvers: Array<
      (value: { ok: boolean; json: () => Promise<unknown> }) => void
    > = [];
    global.fetch = jest.fn(() => new Promise((resolve) => {
      pendingResolvers.push(resolve as (value: { ok: boolean; json: () => Promise<unknown> }) => void);
    })) as typeof fetch;

    const { result } = renderHook(() => useListsMutations("list-1"), { wrapper });

    let firstMutationPromise: Promise<unknown> = Promise.resolve();
    let secondMutationPromise: Promise<unknown> = Promise.resolve();
    act(() => {
      firstMutationPromise = result.current.mutateAction("toggleItem", {
        listId: "list-1",
        id: "item-1",
        nextCompleted: true,
      });
      secondMutationPromise = result.current.mutateAction("toggleItem", {
        listId: "list-1",
        id: "item-2",
        nextCompleted: true,
      });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    act(() => {
      pendingResolvers[0]?.({
        ok: true,
        json: async () => ({ redirectTo: "/lists/list-1" }),
      });
    });

    await waitFor(() => {
      const optimisticData = queryClient.getQueryData<ListsResponse>(listsQueryKey("list-1"));
      expect(optimisticData?.activeList.items.every((item) => item.completed)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    act(() => {
      pendingResolvers[1]?.({
        ok: true,
        json: async () => ({ redirectTo: "/lists/list-1" }),
      });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    await firstMutationPromise;
    await secondMutationPromise;
  });

  test("omite fetch canónico para toggles rápidos consecutivos", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(listsQueryKey("list-1"), createListsResponseWithTwoItems());

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ redirectTo: "/lists/list-1" }),
      } as Response)
    ) as typeof fetch;

    const { result } = renderHook(() => useListsMutations("list-1"), { wrapper });

    await act(async () => {
      await Promise.all([
        result.current.mutateAction("toggleItem", {
          listId: "list-1",
          id: "item-1",
          nextCompleted: true,
        }),
        result.current.mutateAction("toggleItem", {
          listId: "list-1",
          id: "item-2",
          nextCompleted: true,
        }),
      ]);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("omite fetch canónico en confirmParent", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(listsQueryKey("list-1"), createListsResponse());

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ redirectTo: "/lists/list-1" }),
      } as Response)
    ) as typeof fetch;

    const { result } = renderHook(() => useListsMutations("list-1"), { wrapper });

    await act(async () => {
      await result.current.mutateAction("confirmParent", {
        listId: "list-1",
        id: "item-1",
      });
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("createItem en secuencia rápida difiere sincronización canónica y evita sync intermedia", async () => {
    jest.useFakeTimers();
    try {
      const queryClient = new QueryClient();
      queryClient.setQueryData(listsQueryKey("list-1"), createListsResponse());

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(
          {
            ok: true,
            json: async () => ({ redirectTo: "/lists/list-1" }),
          } as Response
        )
        .mockResolvedValueOnce(
          {
            ok: true,
            json: async () => ({ redirectTo: "/lists/list-1" }),
          } as Response
        )
        .mockResolvedValueOnce(
          {
            ok: true,
            json: async () => ({
              lists: [{ id: "list-1", title: "Lista original" }],
              activeList: {
                id: "list-1",
                title: "Lista original",
                items: [
                  { id: "item-a", title: "Item A", completed: false, children: [] },
                  { id: "item-b", title: "Item B", completed: false, children: [] },
                ],
              },
            }),
          } as Response
        ) as typeof fetch;

      const { result } = renderHook(() => useListsMutations("list-1"), { wrapper });

      await act(async () => {
        await Promise.all([
          result.current.mutateAction("createItem", {
            listId: "list-1",
            title: "Item A",
          }),
          result.current.mutateAction("createItem", {
            listId: "list-1",
            title: "Item B",
          }),
        ]);
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);

      act(() => {
        jest.advanceTimersByTime(349);
      });
      expect(global.fetch).toHaveBeenCalledTimes(2);

      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });

      await waitFor(() => {
        const canonicalData = queryClient.getQueryData<ListsResponse>(listsQueryKey("list-1"));
        expect(canonicalData?.activeList.items.map((item) => item.id)).toEqual(["item-a", "item-b"]);
      });
    } finally {
      jest.useRealTimers();
    }
  });
});
