import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Users, Settings, ChartNoAxesCombined, ClipboardList } from "lucide-react";

export default function Admin() {
  const sections = [
    {
      icon: Users,
      title: "User & Access Management",
      items: [
        "Account-level access controls",
        "Session-aware authentication flow",
        "Protected app areas under /app routes",
      ],
    },
    {
      icon: Settings,
      title: "Platform Configuration",
      items: [
        "Workflow templates and runtime defaults",
        "Provider and execution preferences",
        "Secure operational settings",
      ],
    },
    {
      icon: ChartNoAxesCombined,
      title: "Operational Visibility",
      items: [
        "Execution analytics and trend tracking",
        "Run-by-run monitoring and diagnostics",
        "Performance and quality signals",
      ],
    },
    {
      icon: ClipboardList,
      title: "Governance",
      items: [
        "Audit-friendly execution history",
        "Configurable workflow lifecycle controls",
        "Centralized operational review capabilities",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <section className="py-16">
        <div className="container space-y-6">
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-4xl font-bold">Admin Platform</h1>
            <p className="text-muted-foreground text-lg">
              Administrative capabilities provide control over users, workflows, operations, and
              platform governance.
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
