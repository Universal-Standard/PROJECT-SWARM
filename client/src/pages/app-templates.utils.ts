import type { Template } from "@shared/schema";

export interface TemplateFilterOptions {
  searchTerm: string;
  categoryFilter: string;
  showFeaturedOnly: boolean;
}

export interface TemplateAnalytics {
  totalUsage: number;
  featuredCount: number;
  topCategory: string;
}

export function getTemplateCategories(templates: Template[]): string[] {
  const categorySet = new Set<string>();

  templates.forEach((template) => {
    const normalizedCategory = (template.category || "").trim().toLowerCase();
    if (normalizedCategory) {
      categorySet.add(normalizedCategory);
    }
  });

  return ["all", ...Array.from(categorySet).sort()];
}

export function filterTemplates(
  templates: Template[],
  { searchTerm, categoryFilter, showFeaturedOnly }: TemplateFilterOptions
): Template[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedCategoryFilter = categoryFilter.trim().toLowerCase();

  return templates.filter((template) => {
    const normalizedCategory = (template.category || "").trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      template.name.toLowerCase().includes(normalizedSearch) ||
      (template.description || "").toLowerCase().includes(normalizedSearch) ||
      normalizedCategory.includes(normalizedSearch);
    const matchesCategory =
      normalizedCategoryFilter === "all" || normalizedCategory === normalizedCategoryFilter;
    const matchesFeatured = !showFeaturedOnly || template.featured;

    return matchesSearch && matchesCategory && matchesFeatured;
  });
}

export function computeTemplateAnalytics(templates: Template[]): TemplateAnalytics {
  const totalUsage = templates.reduce((sum, template) => sum + template.usageCount, 0);
  const featuredCount = templates.filter((template) => template.featured).length;

  const categoryCounts = templates.reduce<Record<string, number>>((acc, template) => {
    const category = (template.category || "").trim().toLowerCase();
    if (!category) {
      return acc;
    }
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const topCategory =
    Object.entries(categoryCounts).sort(([, countA], [, countB]) => countB - countA)[0]?.[0] ||
    "none";

  return {
    totalUsage,
    featuredCount,
    topCategory,
  };
}
