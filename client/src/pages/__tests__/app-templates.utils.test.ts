import { describe, expect, it } from "vitest";
import type { Template } from "@shared/schema";
import {
  computeTemplateAnalytics,
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
      categoryFilter: "support",
      showFeaturedOnly: true,
    });

    expect(filtered.map((template) => template.id)).toEqual(["t-1"]);
  });

  it("returns sorted unique category list with all option", () => {
    expect(getTemplateCategories(templates)).toEqual(["all", "sales", "support"]);
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
        categoryFilter: "all",
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

    expect(getTemplateCategories(mixedCaseTemplates)).toEqual(["all", "support"]);
    expect(
      filterTemplates(mixedCaseTemplates, {
        searchTerm: "",
        categoryFilter: "SUPPORT",
        showFeaturedOnly: false,
      })
    ).toHaveLength(2);
    expect(computeTemplateAnalytics(mixedCaseTemplates).topCategory).toBe("support");
  });
});
