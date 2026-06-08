import { useState } from "react";
import { PSeIntViewer } from "./PSeIntViewer";

interface CodeViewTabsProps {
  blocklyCode: string;
  pseudocode: string;
  diagram: string;
}

type Tab = "blockly" | "pseudocode" | "diagram";

export const CodeViewTabs = ({
  blocklyCode,
  pseudocode,
  diagram,
}: CodeViewTabsProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("blockly");

  const tabs: { key: Tab; label: string }[] = [
    { key: "blockly", label: "Código Blockly" },
    { key: "pseudocode", label: "Pseudocódigo" },
    { key: "diagram", label: "Diagrama" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all duration-200 border-b-2 ${
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "blockly" && (
        <pre
          className="p-4 bg-bg border border-border text-sm text-text font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap"
          style={{ borderRadius: "var(--theme-radius)", minHeight: 120 }}
        >
          {blocklyCode || "Sin código Blockly generado."}
        </pre>
      )}

      {activeTab === "pseudocode" && (
        <PSeIntViewer pseudocode={pseudocode} diagram="" />
      )}

      {activeTab === "diagram" && (
        <PSeIntViewer pseudocode="" diagram={diagram} />
      )}
    </div>
  );
};
