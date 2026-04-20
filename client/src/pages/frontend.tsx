import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Monitor, Palette, Gauge, ShieldCheck } from "lucide-react";

export default function Frontend() {
  const sections = [
    {
      icon: Monitor,
      title: "Application Shell",
      items: [
        "React 18 + TypeScript architecture",
        "Route-driven page rendering",
        "Reusable component primitives",
      ],
    },
    {
      icon: Palette,
      title: "Design System",
      items: [
        "TailwindCSS utility styling",
        "Consistent card, button, and form patterns",
        "Responsive mobile-first layout",
      ],
    },
    {
      icon: Gauge,
      title: "User Experience",
      items: [
        "Interactive workflow builder interfaces",
        "Execution and analytics dashboards",
        "Fast client navigation and route transitions",
      ],
    },
    {
      icon: ShieldCheck,
      title: "Reliability",
      items: [
        "Error boundaries for runtime safety",
        "Strong typing across UI contracts",
        "Predictable route fallbacks",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <section className="py-16">
        <div className="container space-y-6">
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-4xl font-bold">Frontend Platform</h1>
            <p className="text-muted-foreground text-lg">
              The frontend experience is built for speed, clarity, and workflow-centric execution
              management.
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
