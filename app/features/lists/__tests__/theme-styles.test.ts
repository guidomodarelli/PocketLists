import { readFileSync } from "node:fs";
import { join } from "node:path";

const DARK_MODE_SENSITIVE_FILES = [
  "app/page.module.scss",
  "app/error.module.scss",
  "app/loading.module.scss",
  "app/features/lists/components/ListsSidebar/ListsSidebar.module.scss",
  "app/features/lists/components/TreeList/TreeList.module.scss",
  "app/features/lists/components/ListTitleEditable/ListTitleEditable.module.scss",
  "app/features/lists/components/AddRootItemButton/AddRootItemButton.module.scss",
  "app/features/lists/components/CompletedItemsDialog/CompletedItemsDialog.module.scss",
  "app/features/lists/components/ParentSelector/ParentSelector.module.scss",
] as const;

const HARDCODED_LIGHT_COLORS_PATTERN =
  /\b(?:bg|text|border|ring|from|to|via|shadow)-(?:white|slate|gray|neutral|stone|zinc)(?:-[0-9]{1,3})?(?:\/[0-9]{1,3})?\b/g;

describe("Dark mode styles", () => {
  test.each(DARK_MODE_SENSITIVE_FILES)("%s should avoid hardcoded light palette classes", (relativePath) => {
    const absolutePath = join(process.cwd(), relativePath);
    const content = readFileSync(absolutePath, "utf8");
    const matches = [...content.matchAll(HARDCODED_LIGHT_COLORS_PATTERN)].map((match) => match[0]);

    expect(matches).toEqual([]);
  });
});
