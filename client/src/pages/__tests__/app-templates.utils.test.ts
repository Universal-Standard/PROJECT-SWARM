import { describe, expect, it } from "vitest";
import type { Template } from "@shared/schema";
import {
  ALL_TEMPLATE_CATEGORY_FILTER,
  computeTemplateAnalytics,
  encodeTemplateCategoryFilter,
  filterTemplates,
  getTemplateCategories,
} from "@/pages/app-templates.utils";

function createTemplate(overrides: Partial<Template>): Template {
  return {
    id: overrides.id || "template-id",
    workflowId: overrides.workflowId || "workflow-id",
    name: overrides.name || "Template",
    description: overrides.description ?? null,
    category: overrides.category ?? "general",
    thumbnailUrl: overrides.thumbnailUrl ?? null,
    usageCount: overrides.usageCount ?? 0,
    featured: overrides.featured ?? false,
    createdAt: overrides.createdAt || new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("app templates utils", () => {
  const templates: Template[] = [
    createTemplate({
      id: "t-1",
      name: "Support Triage",
      description: "Routes support tickets",
      category: "support",
      usageCount: 15,
      featured: true,
    }),
    createTemplate({
      id: "t-2",
      workflowId: "w-2",
      name: "Sales Outreach",
      description: "Automates follow-up emails",
      category: "sales",
      usageCount: 5,
    }),
    createTemplate({
      id: "t-3",
      workflowId: "w-3",
      name: "Bug Intake",
      category: "support",
      usageCount: 3,
    }),
  ];

  it("filters by search term, category, and featured flag", () => {
    const filtered = filterTemplates(templates, {
      searchTerm: "support",
      categoryFilter: encodeTemplateCategoryFilter("support"),
      showFeaturedOnly: true,
    });

    expect(filtered.map((template) => template.id)).toEqual(["t-1"]);
  });

  it("returns sorted unique category list with all option", () => {
    expect(getTemplateCategories(templates)).toEqual(["sales", "support"]);
  });

  it("computes usage, featured count, and top category", () => {
    expect(computeTemplateAnalytics(templates)).toEqual({
      totalUsage: 23,
      featuredCount: 1,
      topCategory: "support",
    });
  });

  it("handles blank categories without throwing", () => {
    const withBlankCategory = [
      ...templates,
      createTemplate({
        id: "t-4",
        workflowId: "w-4",
        category: "",
      }),
    ];

    expect(
      filterTemplates(withBlankCategory, {
        searchTerm: "",
        categoryFilter: ALL_TEMPLATE_CATEGORY_FILTER,
        showFeaturedOnly: false,
      })
    ).toHaveLength(4);

    expect(computeTemplateAnalytics(withBlankCategory).topCategory).toBe("support");
  });

  it("normalizes mixed-case categories for list and filtering", () => {
    const mixedCaseTemplates = [
      createTemplate({
        id: "t-5",
        workflowId: "w-5",
        name: "Support Escalation",
        category: "Support",
      }),
      createTemplate({
        id: "t-6",
        workflowId: "w-6",
        name: "Case Routing",
        category: "support",
      }),
    ];

    expect(getTemplateCategories(mixedCaseTemplates)).toEqual(["support"]);
    expect(
      filterTemplates(mixedCaseTemplates, {
        searchTerm: "",
        categoryFilter: encodeTemplateCategoryFilter("SUPPORT"),
        showFeaturedOnly: false,
      })
    ).toHaveLength(2);
    expect(computeTemplateAnalytics(mixedCaseTemplates).topCategory).toBe("support");
  });

  it("keeps the all category distinct from the all-categories filter", () => {
    const allCategoryTemplates = [
      createTemplate({
        id: "t-7",
        workflowId: "w-7",
        name: "All Hands",
        category: "all",
      }),
      createTemplate({
        id: "t-8",
        workflowId: "w-8",
        name: "General Purpose",
        category: "general",
      }),
    ];

    expect(getTemplateCategories(allCategoryTemplates)).toEqual(["all", "general"]);
    expect(
      filterTemplates(allCategoryTemplates, {
        searchTerm: "",
        categoryFilter: encodeTemplateCategoryFilter("all"),
        showFeaturedOnly: false,
      }).map((template) => template.id)
    ).toEqual(["t-7"]);
  });
});
