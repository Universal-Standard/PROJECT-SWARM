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
    if (template.category?.trim()) {
      categorySet.add(template.category);
    }
  });

  return ["all", ...Array.from(categorySet).sort()];
}

export function filterTemplates(
  templates: Template[],
  { searchTerm, categoryFilter, showFeaturedOnly }: TemplateFilterOptions
): Template[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return templates.filter((template) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      template.name.toLowerCase().includes(normalizedSearch) ||
      (template.description || "").toLowerCase().includes(normalizedSearch) ||
      template.category.toLowerCase().includes(normalizedSearch);
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    const matchesFeatured = !showFeaturedOnly || template.featured;

    return matchesSearch && matchesCategory && matchesFeatured;
  });
}

export function computeTemplateAnalytics(templates: Template[]): TemplateAnalytics {
  const totalUsage = templates.reduce((sum, template) => sum + template.usageCount, 0);
  const featuredCount = templates.filter((template) => template.featured).length;

  const categoryCounts = templates.reduce<Record<string, number>>((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1;
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
