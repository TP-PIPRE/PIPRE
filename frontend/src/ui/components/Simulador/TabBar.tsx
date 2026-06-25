import React from "react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
  variant?: "default" | "compact" | "boxed";
  position?: "top" | "bottom";
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
  variant = "default",
  position = "top",
}) => {
  const getTabStyles = (isActive: boolean, isDisabled: boolean) => {
    const baseStyles = "flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-wider leading-none transition-all duration-200";

    if (isDisabled) {
      return `${baseStyles} text-text-muted/40 cursor-not-allowed`;
    }

    if (variant === "compact") {
      return `${baseStyles} ${
        isActive
          ? "text-primary bg-primary/10 border-b-2 border-primary"
          : "text-text-muted hover:text-text hover:bg-surface-brighter border-b-2 border-transparent"
      }`;
    }

    if (variant === "boxed") {
      return `${baseStyles} ${
        isActive
          ? "text-primary bg-primary/10 border border-primary/30 rounded-t-md"
          : "text-text-muted hover:text-text hover:bg-surface-brighter border border-transparent rounded-t-md"
      }`;
    }

    return `${baseStyles} ${
      isActive
        ? "text-primary border-b-2 border-primary"
        : "text-text-muted hover:text-text hover:border-text-muted/30 border-b-2 border-transparent"
    }`;
  };

  return (
    <div className={`flex flex-col h-full ${position === "bottom" ? "flex-col-reverse" : ""}`}>
      <div
        className="flex border-b shrink-0 overflow-x-auto custom-scrollbar"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface-brighter)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              className={getTabStyles(isActive, !!tab.disabled)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 text-[8px] font-bold rounded-full"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--text-inverted)",
                  }}
                >
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
};
