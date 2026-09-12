import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutTemplate, Star, Download, Plus, Search, Eye, Pencil, Sparkles } from "lucide-react";
import type { Template, Workflow } from "@shared/schema";
import {
  ALL_TEMPLATE_CATEGORY_FILTER,
  computeTemplateAnalytics,
  encodeTemplateCategoryFilter,
  filterTemplates,
  getTemplateCategories,
} from "@/pages/app-templates.utils";

interface TemplateExportData {
  template: {
    name: string;
    description?: string | null;
    category: string;
  };
  workflow: {
    nodes: Record<string, unknown>[];
    edges: Record<string, unknown>[];
  };
  exportedAt: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Request failed";
}

export default function AppTemplates() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_TEMPLATE_CATEGORY_FILTER);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("general");
  const [newTemplateFeatured, setNewTemplateFeatured] = useState(false);

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editFeatured, setEditFeatured] = useState(false);

  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [previewByTemplateId, setPreviewByTemplateId] = useState<
    Record<string, TemplateExportData>
  >({});
  const [previewLoadingByTemplateId, setPreviewLoadingByTemplateId] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
    enabled: isAuthenticated,
  });

  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
    enabled: isAuthenticated,
  });

  const availableWorkflows = useMemo(() => {
    const templateWorkflowIds = new Set((templates || []).map((template) => template.workflowId));
    return (workflows || []).filter(
      (workflow) => !workflow.isTemplate && !templateWorkflowIds.has(workflow.id)
    );
  }, [workflows, templates]);

  useEffect(() => {
    if (!selectedWorkflowId || !workflows) {
      return;
    }

    const workflow = workflows.find((item) => item.id === selectedWorkflowId);
    if (!workflow) {
      return;
    }

    setNewTemplateName(workflow.name);
    setNewTemplateDescription(workflow.description || "");
    setNewTemplateCategory(workflow.category || "general");
  }, [selectedWorkflowId, workflows]);

  const categories = useMemo(() => getTemplateCategories(templates || []), [templates]);

  const filteredTemplates = useMemo(() => {
    return filterTemplates(templates || [], {
      searchTerm,
      categoryFilter,
      showFeaturedOnly,
    });
  }, [templates, searchTerm, categoryFilter, showFeaturedOnly]);
  const featuredFilteredTemplates = useMemo(
    () => filteredTemplates.filter((template) => template.featured),
    [filteredTemplates]
  );

  const analytics = useMemo(() => computeTemplateAnalytics(templates || []), [templates]);

  const ownedWorkflowIds = useMemo(
    () =>
      new Set(
        (workflows || [])
          .filter((workflow) => (user?.id ? workflow.userId === user.id : true))
          .map((workflow) => workflow.id)
      ),
    [workflows, user?.id]
  );

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/templates", {
        workflowId: selectedWorkflowId,
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || undefined,
        category: newTemplateCategory.trim() || "general",
        featured: newTemplateFeatured,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setSelectedWorkflowId("");
      setNewTemplateName("");
      setNewTemplateDescription("");
      setNewTemplateCategory("general");
      setNewTemplateFeatured(false);
      toast({
        title: "Template created",
        description: "Workflow is now available in your template library.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to create template",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!editingTemplateId) {
        throw new Error("No template selected for editing");
      }

      return apiRequest("PUT", `/api/templates/${editingTemplateId}`, {
        name: editName.trim(),
        description: editDescription.trim(),
        category: editCategory.trim() || "general",
        featured: editFeatured,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setEditingTemplateId(null);
      toast({
        title: "Template updated",
        description: "Template changes were saved.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to update template",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const createWorkflowFromTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest("POST", `/api/templates/${templateId}/create-workflow`, {});
      return response.json() as Promise<Workflow>;
    },
    onSuccess: async (workflow: Workflow) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow created",
        description: `Created "${workflow.name}" from template.`,
      });
      setLocation(`/app/workflow-builder/${workflow.id}`);
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to use template",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const previewTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest("GET", `/api/templates/${templateId}/export`);
      const payload = (await response.json()) as TemplateExportData;
      return { templateId, payload };
    },
    onSuccess: ({ templateId, payload }) => {
      setPreviewByTemplateId((current) => ({
        ...current,
        [templateId]: payload,
      }));
      setPreviewLoadingByTemplateId((current) => ({
        ...current,
        [templateId]: false,
      }));
    },
    onError: (error: unknown, templateId: string) => {
      setPreviewLoadingByTemplateId((current) => ({
        ...current,
        [templateId]: false,
      }));
      toast({
        title: "Failed to load preview",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  if (authLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-2">
          Create templates from your workflows, manage categories, and launch new workflows faster.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total templates</p>
          <p className="text-2xl font-bold">{templates?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Featured templates</p>
          <p className="text-2xl font-bold">{analytics.featuredCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total template usage</p>
          <p className="text-2xl font-bold">{analytics.totalUsage}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Top category</p>
          <p className="text-2xl font-bold capitalize">{analytics.topCategory}</p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Create template from workflow</h2>
        </div>

        {availableWorkflows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All workflows already have templates or no workflows are available yet.
          </p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workflow-select">Workflow</Label>
                <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                  <SelectTrigger id="workflow-select">
                    <SelectValue placeholder="Select a workflow" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkflows.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-name">Template name</Label>
                <Input
                  id="template-name"
                  value={newTemplateName}
                  onChange={(event) => setNewTemplateName(event.target.value)}
                  placeholder="Customer support triage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Input
                  id="template-category"
                  value={newTemplateCategory}
                  onChange={(event) => setNewTemplateCategory(event.target.value)}
                  placeholder="support"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  value={newTemplateDescription}
                  onChange={(event) => setNewTemplateDescription(event.target.value)}
                  placeholder="Automates customer issue routing"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="template-featured"
                checked={newTemplateFeatured}
                onCheckedChange={setNewTemplateFeatured}
              />
              <Label htmlFor="template-featured">Mark as featured</Label>
            </div>

            <Button
              onClick={() => createTemplateMutation.mutate()}
              disabled={
                createTemplateMutation.isPending || !selectedWorkflowId || !newTemplateName.trim()
              }
              data-testid="button-create-template"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search templates"
              placeholder="Search templates"
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="md:w-[220px]" aria-label="Filter templates by category">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TEMPLATE_CATEGORY_FILTER}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={encodeTemplateCategoryFilter(category)}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              checked={showFeaturedOnly}
              onCheckedChange={setShowFeaturedOnly}
              id="featured-only"
            />
            <Label htmlFor="featured-only">Featured only</Label>
          </div>
        </div>
      </Card>

      {featuredFilteredTemplates.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold">Featured templates</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {featuredFilteredTemplates.map((template) => (
              <Badge key={`featured-${template.id}`} variant="secondary" className="px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                {template.name}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded mb-4" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const isOwnTemplate = ownedWorkflowIds.has(template.workflowId);
            const isEditing = editingTemplateId === template.id;
            const isPreviewing = previewTemplateId === template.id;
            const previewData = previewByTemplateId[template.id];
            const previewLoading = previewLoadingByTemplateId[template.id];

            return (
              <Card key={template.id} className="p-6 hover-elevate transition-all">
                <div className="flex items-start justify-between mb-4">
                  <LayoutTemplate className="w-8 h-8 text-primary" />
                  {template.featured && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </Badge>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 mb-4">
                    <Input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      aria-label="Template name"
                    />
                    <Input
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      aria-label="Template description"
                      placeholder="Description"
                    />
                    <Input
                      value={editCategory}
                      onChange={(event) => setEditCategory(event.target.value)}
                      aria-label="Template category"
                      placeholder="Category"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editFeatured}
                        onCheckedChange={setEditFeatured}
                        id={`edit-featured-${template.id}`}
                      />
                      <Label htmlFor={`edit-featured-${template.id}`}>Featured</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateTemplateMutation.mutate()}
                        disabled={updateTemplateMutation.isPending || !editName.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTemplateId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <span>•</span>
                  <span>{template.usageCount} uses</span>
                </div>

                {isPreviewing && previewLoading && (
                  <div className="rounded-md border p-3 bg-muted/30 mb-4 text-xs">
                    Loading preview...
                  </div>
                )}

                {isPreviewing && !previewLoading && previewData && (
                  <div className="rounded-md border p-3 bg-muted/30 mb-4 text-xs space-y-1">
                    <p>
                      <strong>Nodes:</strong> {previewData.workflow.nodes.length}
                    </p>
                    <p>
                      <strong>Edges:</strong> {previewData.workflow.edges.length}
                    </p>
                    <p>
                      <strong>Exported:</strong> {new Date(previewData.exportedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isPreviewing) {
                        setPreviewTemplateId(null);
                        return;
                      }

                      setPreviewTemplateId(template.id);
                      if (!previewByTemplateId[template.id]) {
                        setPreviewLoadingByTemplateId((current) => ({
                          ...current,
                          [template.id]: true,
                        }));
                        previewTemplateMutation.mutate(template.id);
                      }
                    }}
                    data-testid={`button-preview-${template.id}`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={() => createWorkflowFromTemplateMutation.mutate(template.id)}
                    disabled={createWorkflowFromTemplateMutation.isPending}
                    data-testid={`button-use-${template.id}`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Use
                  </Button>
                </div>

                {isOwnTemplate && !isEditing && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2"
                    onClick={() => {
                      setEditingTemplateId(template.id);
                      setEditName(template.name);
                      setEditDescription(template.description || "");
                      setEditCategory(template.category);
                      setEditFeatured(template.featured);
                    }}
                    data-testid={`button-edit-template-${template.id}`}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit template
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <LayoutTemplate className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          {templates && templates.length > 0 ? (
            <>
              <h3 className="text-xl font-semibold mb-2">No templates match this filter</h3>
              <p className="text-muted-foreground">Try updating your search or category filters.</p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-2">No templates available</h3>
              <p className="text-muted-foreground">
                Create one from a workflow to start building your library.
              </p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
