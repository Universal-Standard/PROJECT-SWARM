import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Database, Server, Workflow, Lock } from "lucide-react";

export function BackendOverview() {
  const guarantees = [
    {
      id: "execution-safety",
      label: "Execution Safety",
      value: "Validation before orchestration begins",
    },
    {
      id: "data-integrity",
      label: "Data Integrity",
      value: "Schema-driven persistence and typed access",
    },
    {
      id: "operational-stability",
      label: "Operational Stability",
      value: "Clear API contracts and structured errors",
    },
  ];

  const sections = [
    {
      icon: Server,
      title: "API Services",
      items: [
        "Express + TypeScript runtime for predictable service behavior",
        "REST endpoints powering workflows, executions, and templates",
        "Consistent response envelopes and status semantics",
      ],
    },
    {
      icon: Database,
      title: "Data Layer",
      items: [
        "PostgreSQL persistence with Drizzle ORM models",
        "Normalized workflow, node, and execution storage patterns",
        "Indexed paths for execution history and analytics queries",
      ],
    },
    {
      icon: Workflow,
      title: "Execution Engine",
      items: [
        "Deterministic workflow validation and preflight checks",
        "Topological orchestration for multi-agent sequencing",
        "Context propagation between connected execution nodes",
      ],
    },
    {
      icon: Lock,
      title: "Security & Controls",
      items: [
        "Server-side schema validation for incoming payloads",
        "Secure auth/session middleware and protected APIs",
        "Rate limiting and defensive defaults for public endpoints",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <section className="py-16">
        <div className="container space-y-6">
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-4xl font-bold">Backend Platform</h1>
            <p className="text-muted-foreground text-lg">
              A production-oriented backend for orchestration, observability, and secure API
              operations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {guarantees.map((guarantee) => (
              <Card key={guarantee.id} className="p-5">
                <p className="text-sm text-muted-foreground">{guarantee.label}</p>
                <p className="font-semibold mt-1">{guarantee.value}</p>
              </Card>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <Card key={section.title} className="p-6">
                <section.icon aria-hidden="true" className="w-8 h-8 text-primary mb-3" />
                <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
