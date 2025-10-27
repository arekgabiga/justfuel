import React from "react";
import { Button } from "@/components/ui/button";
import { Fuel, TrendingUp } from "lucide-react";

interface TabNavigationProps {
  activeTab: "fillups" | "charts";
  onTabChange: (tab: "fillups" | "charts") => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
      <Button
        onClick={() => onTabChange("fillups")}
        variant={activeTab === "fillups" ? "default" : "ghost"}
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 pb-2"
        data-state={activeTab === "fillups" ? "active" : undefined}
      >
        <Fuel className="h-4 w-4 mr-2" />
        Tankowania
      </Button>
      <Button
        onClick={() => onTabChange("charts")}
        variant={activeTab === "charts" ? "default" : "ghost"}
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 pb-2"
        data-state={activeTab === "charts" ? "active" : undefined}
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Wykresy
      </Button>
    </div>
  );
};

