import { TursoListsRepository } from "@/core/modules/lists/infrastructure/repositories/TursoListsRepository";

async function run() {
  const repository = new TursoListsRepository();
  await repository.initialize();
  const lists = await repository.getLists();
  console.log(`[migration] Relational lists ready. Total lists: ${lists.length}`);
}

run().catch((error) => {
  console.error("[migration] Failed to migrate lists_store to relational tables", error);
  process.exitCode = 1;
});
