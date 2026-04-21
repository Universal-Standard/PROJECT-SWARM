import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Monitor, Palette, Gauge, ShieldCheck } from "lucide-react";

export function FrontendOverview() {
  const pillars = [
    { id: "ui-framework", label: "UI Framework", value: "React + TypeScript + Vite" },
    {
      id: "design-system",
      label: "Design System",
      value: "Tailwind + reusable component primitives",
    },
    {
      id: "runtime-reliability",
      label: "Runtime Reliability",
      value: "Error boundaries and typed state flows",
    },
  ];

  const sections = [
    {
      icon: Monitor,
      title: "Application Shell",
      items: [
        "Production-ready route architecture for public and protected areas",
        "Compositional layouts for dashboard and marketing experiences",
        "Strongly typed page contracts and reusable primitives",
      ],
    },
    {
      icon: Palette,
      title: "Design System",
      items: [
        "Consistent typography, spacing, and component hierarchy",
        "Accessible controls and predictable interaction feedback",
        "Responsive breakpoints for desktop, tablet, and mobile",
      ],
    },
    {
      icon: Gauge,
      title: "Performance & UX",
      items: [
        "Fast route transitions with minimal layout thrash",
        "Optimized dashboard rendering and data presentation",
        "Clear workflows for creation, monitoring, and analysis",
      ],
    },
    {
      icon: ShieldCheck,
      title: "Reliability",
      items: [
        "Graceful fallback routes and error-safe rendering boundaries",
        "Strict typing to reduce runtime defects in production",
        "Defensive UI handling for unavailable or delayed data",
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
              A production-grade interface focused on clarity, speed, and operational confidence.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {pillars.map((pillar) => (
              <Card key={pillar.id} className="p-5">
                <p className="text-sm text-muted-foreground">{pillar.label}</p>
                <p className="font-semibold mt-1">{pillar.value}</p>
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
