export type CategoryId =
  | "trending"
  | "politics"
  | "finance"
  | "crypto"
  | "sports"
  | "tech"
  | "culture"
  | "geopolitics";

export interface Category {
  id: CategoryId;
  label: string;
  tagId: number | null;
}

export const CATEGORIES: Category[] = [
  {
    id: "trending",
    label: "Trending",
    tagId: null,
  },
  {
    id: "politics",
    label: "Politics",
    tagId: 2,
  },
  {
    id: "finance",
    label: "Finance",
    tagId: 120,
  },
  {
    id: "crypto",
    label: "Crypto",
    tagId: 21,
  },
  {
    id: "sports",
    label: "Sports",
    tagId: 100639,
  },
  {
    id: "tech",
    label: "Tech",
    tagId: 1401,
  },
  {
    id: "culture",
    label: "Culture",
    tagId: 596,
  },
  {
    id: "geopolitics",
    label: "Geopolitics",
    tagId: 100265,
  },
];

export const DEFAULT_CATEGORY: CategoryId = "trending";

export function getCategoryById(id: CategoryId): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

