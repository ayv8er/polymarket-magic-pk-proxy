"use client";

import { CATEGORIES, type CategoryId } from "@/constants/categories";
import { cn } from "@/utils/classNames";

interface CategoryTabsProps {
  activeCategory: CategoryId;
  onCategoryChange: (categoryId: CategoryId) => void;
}

export default function CategoryTabs({
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            activeCategory === category.id
              ? "bg-blue-600 text-white"
              : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}

