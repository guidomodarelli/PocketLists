describe("core setup bootstrap", () => {
  it("builds core setup once and reuses the same instance", async () => {
    jest.resetModules();

    const repositoryInstance = { tag: "lists-repository" };
    const repositoryConstructorMock = jest.fn(() => repositoryInstance);
    const createListsUseCasesMock = jest.fn().mockReturnValue({ tag: "lists-use-cases" });

    jest.doMock("@/core/modules/lists/infrastructure/repositories/TursoListsRepository", () => ({
      TursoListsRepository: repositoryConstructorMock,
    }));

    jest.doMock("@/core/modules/lists/application/use-cases/ListsUseCases", () => ({
      createListsUseCases: createListsUseCasesMock,
    }));

    const { getCoreSetup } = await import("@/core/setup");

    const [setupA, setupB, setupC] = await Promise.all([getCoreSetup(), getCoreSetup(), getCoreSetup()]);

    expect(repositoryConstructorMock).toHaveBeenCalledTimes(1);
    expect(createListsUseCasesMock).toHaveBeenCalledTimes(1);
    expect(createListsUseCasesMock).toHaveBeenCalledWith(repositoryInstance);
    expect(setupA).toBe(setupB);
    expect(setupB).toBe(setupC);
  });
});
