"use client";
import DocumentWorkspace from "@/components/ui/custom/document-preview";
import { useState } from "react";
const mockDocs = [
  { id: "1", name: "Consent Form.pdf", type: "pdf", url: "/files/consent.pdf" },
  { id: "2", name: "Study Poster.jpg", type: "image", url: "/files/poster.jpg" },
  { id: "3", name: "Protocol.docx", type: "docx", url: "#" },
];

export default function Page() {
  const [current, setCurrent] = useState(mockDocs[0]);

  return (
    <div className="container w-auto h-auto">
      <DocumentWorkspace
        current={current as any}
        docs={mockDocs as any}
        onSelectDoc={(id: string) => setCurrent(mockDocs.find(d => d.id === id)!)}
        onDownload={(id: string) => console.log("download", id)}
        onReplace={(id: string) => console.log("replace", id)}
        onDelete={(id: string) => console.log("delete", id)}
      />
    </div>
  );
}
