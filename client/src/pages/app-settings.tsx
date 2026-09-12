import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings,
  User,
  LogOut,
  Key,
  Trash2,
  Brain,
  Download,
  Github,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface KnowledgeEntry {
  id: string;
  agentType: string;
  category: string;
  content: string;
  context?: string | null;
  confidence: number | null;
  createdAt: string;
}

export default function AppSettings() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [apiKeys, setApiKeys] = useState({
    openai: "",
    anthropic: "",
    gemini: "",
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
  });
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [knowledgeAgentType, setKnowledgeAgentType] = useState("all");
  const [knowledgeCategory, setKnowledgeCategory] = useState("all");
  const [knowledgeMinConfidence, setKnowledgeMinConfidence] = useState("0");
  const [deletingKnowledgeId, setDeletingKnowledgeId] = useState<string | null>(null);

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated,
  });

  // Fetch GitHub status
  const { data: githubStatus } = useQuery({
    queryKey: ["/api/auth/github/status"],
    enabled: isAuthenticated,
  });

  const { data: knowledgeEntries = [], isLoading: knowledgeLoading } = useQuery<KnowledgeEntry[]>({
    queryKey: [
      "/api/knowledge",
      {
        query: knowledgeQuery,
        agentType: knowledgeAgentType,
        category: knowledgeCategory,
        minConfidence: knowledgeMinConfidence,
      },
    ],
    enabled: isAuthenticated,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (knowledgeQuery.trim()) params.set("query", knowledgeQuery.trim());
      if (knowledgeAgentType !== "all") params.set("agentType", knowledgeAgentType);
      if (knowledgeCategory !== "all") params.set("category", knowledgeCategory);
      if (knowledgeMinConfidence !== "0") params.set("minConfidence", knowledgeMinConfidence);
      params.set("limit", "100");

      const res = await fetch(`/api/knowledge?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = "Failed to load knowledge base";
        try {
          const errorBody = await res.clone().json();
          if (errorBody?.error) {
            errorMessage = errorBody.error;
          }
        } catch {
          const message = await res.text();
          if (message) errorMessage = message;
        }
        throw new Error(errorMessage);
      }

      return res.json();
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save API key mutation
  const saveApiKeyMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const res = await apiRequest("POST", "/api/settings/api-keys", { provider, apiKey });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "API key saved successfully" });
      setApiKeys({ openai: "", anthropic: "", gemini: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test API key mutation
  const testApiKeyMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const res = await apiRequest("POST", "/api/settings/test-api-key", { provider, apiKey });
      const data = await res.json();
      if (!data.valid) throw new Error(data.error || "API key is invalid");
      return data;
    },
    onSuccess: () => {
      toast({ title: "API key is valid!", description: "Connection successful" });
    },
    onError: (error: any) => {
      toast({
        title: "API key is invalid",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Connect GitHub (GET - reads authUrl, no CSRF needed)
  const handleConnectGitHub = async () => {
    try {
      const res = await fetch("/api/auth/github/authorize", { credentials: "include" });
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch (error: any) {
      toast({ title: "Failed to start GitHub OAuth", variant: "destructive" });
    }
  };

  // Disconnect GitHub
  const disconnectGitHubMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/github/disconnect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/github/status"] });
      toast({ title: "GitHub disconnected successfully" });
    },
  });

  const deleteKnowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/knowledge/${id}`);
    },
    onMutate: (id: string) => {
      setDeletingKnowledgeId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge"] });
      toast({ title: "Knowledge entry deleted" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete knowledge entry",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingKnowledgeId(null);
    },
  });

  // Delete all workflows
  const deleteWorkflowsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/settings/workflows");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "All workflows deleted" });
    },
  });

  // Export data (GET - no CSRF needed)
  const handleExportData = async () => {
    try {
      const res = await fetch("/api/settings/export", { credentials: "include" });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `swarm-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Data exported successfully" });
    } catch (error: any) {
      toast({ title: "Failed to export data", variant: "destructive" });
    }
  };

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

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (authLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account, API keys, and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Profile</h2>
          </div>

          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              {(user as any)?.profileImageUrl && (
                <AvatarImage src={(user as any).profileImageUrl} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {(user as any)?.firstName?.[0] || (user as any)?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="font-semibold text-lg">
                {(user as any)?.firstName && (user as any)?.lastName
                  ? `${(user as any).firstName} ${(user as any).lastName}`
                  : (user as any)?.email}
              </div>
              {(user as any)?.email && (
                <div className="text-sm text-muted-foreground mt-1">{(user as any).email}</div>
              )}
            </div>
          </div>
        </Card>

        {/* GitHub Integration */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Github className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">GitHub Integration</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">GitHub Account</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {(githubStatus as any)?.connected ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <Check className="w-4 h-4" /> Connected{" "}
                      {(githubStatus as any).tokenPreview &&
                        `(${(githubStatus as any).tokenPreview})`}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <X className="w-4 h-4" /> Not connected
                    </span>
                  )}
                </div>
              </div>
              {(githubStatus as any)?.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectGitHubMutation.mutate()}
                  disabled={disconnectGitHubMutation.isPending}
                >
                  Disconnect
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={handleConnectGitHub}>
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* API Keys Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">API Keys</h2>
          </div>

          <div className="space-y-6">
            {(["openai", "anthropic", "gemini"] as const).map((provider) => (
              <div key={provider} className="space-y-2">
                <Label htmlFor={`${provider}-key`} className="capitalize">
                  {provider === "gemini" ? "Google Gemini" : provider} API Key
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={`${provider}-key`}
                      type={showKeys[provider] ? "text" : "password"}
                      placeholder={
                        (settings as any)?.[
                          `has${provider.charAt(0).toUpperCase() + provider.slice(1)}Key`
                        ]
                          ? "••••••••••••••••"
                          : "Enter API key"
                      }
                      value={apiKeys[provider]}
                      onChange={(e) => setApiKeys({ ...apiKeys, [provider]: e.target.value })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowKeys({ ...showKeys, [provider]: !showKeys[provider] })}
                    >
                      {showKeys[provider] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      testApiKeyMutation.mutate({ provider, apiKey: apiKeys[provider] })
                    }
                    disabled={!apiKeys[provider] || testApiKeyMutation.isPending}
                  >
                    Test
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      saveApiKeyMutation.mutate({ provider, apiKey: apiKeys[provider] })
                    }
                    disabled={!apiKeys[provider] || saveApiKeyMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* User Preferences */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-provider">Default AI Provider</Label>
              <Select
                value={(settings as any)?.defaultProvider || "openai"}
                onValueChange={(value) => updateSettingsMutation.mutate({ defaultProvider: value })}
              >
                <SelectTrigger id="default-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={(settings as any)?.theme || "system"}
                onValueChange={(value) => updateSettingsMutation.mutate({ theme: value })}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive email updates about your workflows
                </div>
              </div>
              <Switch
                checked={(settings as any)?.emailNotifications ?? true}
                onCheckedChange={(checked) =>
                  updateSettingsMutation.mutate({ emailNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">In-App Notifications</div>
                <div className="text-sm text-muted-foreground">Show notifications in the app</div>
              </div>
              <Switch
                checked={(settings as any)?.inAppNotifications ?? true}
                onCheckedChange={(checked) =>
                  updateSettingsMutation.mutate({ inAppNotifications: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="execution-timeout">Execution Timeout (seconds)</Label>
              <Input
                id="execution-timeout"
                type="number"
                min={30}
                max={3600}
                value={(settings as any)?.executionTimeout || 300}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 30 && value <= 3600) {
                    updateSettingsMutation.mutate({ executionTimeout: value });
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="autosave-interval">Auto-save Interval (seconds)</Label>
              <Input
                id="autosave-interval"
                type="number"
                min={10}
                max={300}
                value={(settings as any)?.autoSaveInterval || 30}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 10 && value <= 300) {
                    updateSettingsMutation.mutate({ autoSaveInterval: value });
                  }
                }}
              />
            </div>
          </div>
        </Card>

        {/* Knowledge Base */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Knowledge Base</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label htmlFor="knowledge-search" className="sr-only">
                  Search knowledge
                </Label>
                <Input
                  id="knowledge-search"
                  placeholder="Search knowledge..."
                  value={knowledgeQuery}
                  onChange={(e) => setKnowledgeQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="knowledge-agent-type" className="sr-only">
                  Filter by agent type
                </Label>
                <Select value={knowledgeAgentType} onValueChange={setKnowledgeAgentType}>
                  <SelectTrigger id="knowledge-agent-type">
                    <SelectValue placeholder="All agent types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All agent types</SelectItem>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                    <SelectItem value="coder">Coder</SelectItem>
                    <SelectItem value="researcher">Researcher</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="knowledge-category" className="sr-only">
                  Filter by category
                </Label>
                <Select value={knowledgeCategory} onValueChange={setKnowledgeCategory}>
                  <SelectTrigger id="knowledge-category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="knowledge-min-confidence" className="sr-only">
                  Filter by minimum confidence
                </Label>
                <Select value={knowledgeMinConfidence} onValueChange={setKnowledgeMinConfidence}>
                  <SelectTrigger id="knowledge-min-confidence">
                    <SelectValue placeholder="Min confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any confidence</SelectItem>
                    <SelectItem value="60">60%+</SelectItem>
                    <SelectItem value="70">70%+</SelectItem>
                    <SelectItem value="80">80%+</SelectItem>
                    <SelectItem value="90">90%+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {knowledgeLoading ? (
                <div className="text-sm text-muted-foreground">Loading knowledge entries...</div>
              ) : knowledgeEntries.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No knowledge entries found for the selected filters.
                </div>
              ) : (
                knowledgeEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{entry.content}</div>
                        {entry.context && (
                          <div className="text-xs text-muted-foreground">{entry.context}</div>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteKnowledgeMutation.mutate(entry.id)}
                        disabled={
                          deleteKnowledgeMutation.isPending && deletingKnowledgeId === entry.id
                        }
                        aria-label="Delete knowledge entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                      <span className="capitalize">{entry.agentType}</span>
                      <span>•</span>
                      <span className="capitalize">{entry.category}</span>
                      <span>•</span>
                      <span>{entry.confidence ?? 0}% confidence</span>
                      <span>•</span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/50">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Export All Data</div>
                <div className="text-sm text-muted-foreground">
                  Download all your workflows and executions
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium">Delete All Workflows</div>
                <div className="text-sm text-muted-foreground">
                  Permanently delete all your workflows
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Workflows
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your workflows
                      and their associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteWorkflowsMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">Sign Out</div>
                <div className="text-sm text-muted-foreground">Sign out of your account</div>
              </div>
              <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
