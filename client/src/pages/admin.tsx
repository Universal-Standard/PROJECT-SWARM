import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Users, Settings, ChartNoAxesCombined, ClipboardList } from "lucide-react";

export function AdminOverview() {
  const priorities = [
    {
      id: "platform-oversight",
      label: "Platform Oversight",
      value: "Central control for workflows and executions",
    },
    {
      id: "access-governance",
      label: "Access Governance",
      value: "Protected app surfaces and secure session handling",
    },
    {
      id: "operational-insight",
      label: "Operational Insight",
      value: "Metrics, diagnostics, and historical analysis",
    },
  ];

  const sections = [
    {
      icon: Users,
      title: "User & Access Management",
      items: [
        "Role-aware access boundaries for protected app capabilities",
        "Session-aware authentication and account-level isolation",
        "Controlled access to workflow creation and execution operations",
      ],
    },
    {
      icon: Settings,
      title: "Platform Configuration",
      items: [
        "Centralized template and runtime configuration",
        "Provider selection and execution policy preferences",
        "Operational controls with secure default behavior",
      ],
    },
    {
      icon: ChartNoAxesCombined,
      title: "Operational Visibility",
      items: [
        "Live and historical execution analytics",
        "Run-level diagnostics and issue triage context",
        "Performance, quality, and reliability trend visibility",
      ],
    },
    {
      icon: ClipboardList,
      title: "Governance",
      items: [
        "Audit-friendly execution timeline and event traceability",
        "Configurable lifecycle controls across workflow states",
        "Centralized review workflows for operational compliance",
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
              Production-grade administration for control, policy, and governance across the
              platform.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {priorities.map((priority) => (
              <Card key={priority.id} className="p-5">
                <p className="text-sm text-muted-foreground">{priority.label}</p>
                <p className="font-semibold mt-1">{priority.value}</p>
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
