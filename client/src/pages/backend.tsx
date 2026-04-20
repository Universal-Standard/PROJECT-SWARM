import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Database, Server, Workflow, Lock } from "lucide-react";

export default function Backend() {
  const sections = [
    {
      icon: Server,
      title: "API Services",
      items: [
        "Express + TypeScript service layer",
        "REST endpoints for workflows and executions",
        "Structured error handling and response contracts",
      ],
    },
    {
      icon: Database,
      title: "Data Layer",
      items: [
        "PostgreSQL persistence via Drizzle ORM",
        "Schema-driven data access patterns",
        "Execution logs and workflow metadata storage",
      ],
    },
    {
      icon: Workflow,
      title: "Execution Engine",
      items: [
        "Workflow validation before runtime",
        "Topological execution coordination",
        "Context passing between connected agents",
      ],
    },
    {
      icon: Lock,
      title: "Security & Controls",
      items: [
        "Server-side input validation",
        "Secure session and auth middleware",
        "Rate limiting and safe defaults",
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
              The backend orchestrates agent execution, data persistence, and API contracts for the
              SWARM platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <Card key={section.title} className="p-6">
                <section.icon className="w-8 h-8 text-primary mb-3" />
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
