import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/portal/equipment-specs")({
  head: () => ({
    meta: [
      { title: "Equipment Specs — Cleard" },
      { name: "description", content: "Manufacturer spec sheets for pool equipment used on Flōridian projects." },
    ],
  }),
  component: EquipmentSpecsPage,
});

const SPECS: { title: string; url: string }[] = [
  { title: "Jandy Gas Heater Specs", url: "https://drive.google.com/file/d/19rwjw5fhHIvKNDY836WaumolMQMLTiEm/view" },
  { title: "Jandy Pump 1.65 Specs", url: "https://drive.google.com/file/d/1_bZ0Fl6-E_mvlF0Co8wwaP6g1iXKQFsU/view" },
  { title: "Jandy Pump 2.7 Specs", url: "https://drive.google.com/file/d/1qojZbCxO3ErmOtoFN3hBVTceJlZZthVC/view" },
  { title: "Jandy E-Pump 3.8", url: "https://drive.google.com/file/d/1BVGivAamDxAHEgDl3kqLUh6O_5hHhm9p/view" },
  { title: "Jandy Pump 1.85 Specs", url: "https://drive.google.com/file/d/1VviC455zkA89Kbbm8tKBBAEGfyQP53bV/view" },
  { title: "Jandy Filter Small Specs", url: "https://drive.google.com/file/d/1Bv4DS4Dne2QUhvAWVT2z2ISwnsaArId3/view" },
  { title: "Jandy Blower", url: "https://drive.google.com/file/d/1qwE3iUsvgvKukOAGRdS7dk1tlbzvmG0A/view" },
  { title: "Jandy Automation", url: "https://drive.google.com/file/d/10Wx7QU_01dgk5awn9wShhyHajlEQyQyD/view" },
  { title: "Jandy TruClear", url: "https://drive.google.com/file/d/1Ewqnc7H4O3iwfA_KVreZNIJH-MY9oQbB/view" },
  { title: "Jandy Heat Pump Specs", url: "https://drive.google.com/file/d/17-bTRgxQ0vI2y1ESwrYuJ0DydT5P5aEK/view" },
  { title: "In-Ground Pool Alarm", url: "https://drive.google.com/file/d/1pejNmrT2_XoiPqT6t77zCHMw9cJtid5N/view" },
  { title: "Jandy Nicheless Light", url: "https://drive.google.com/file/d/1d9hjBcaKsofqu4rA-ebdxMVovA1EHjsl/view" },
];

function EquipmentSpecsPage() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resources</p>
          <h1 className="text-3xl font-semibold tracking-tight">Equipment Specs</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Manufacturer specification sheets for pool equipment commonly used on Flōridian projects. Open a card to view or download the PDF.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SPECS.map((spec) => (
            <Card key={spec.url} className="flex flex-col">
              <CardHeader className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="rounded-md border bg-muted/40 p-2">
                    <FileText className="h-5 w-5 text-[#153157]" />
                  </div>
                  <CardTitle className="text-base leading-snug">{spec.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <a href={spec.url} target="_blank" rel="noopener noreferrer">
                    Open <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
