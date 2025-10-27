import React from "react";
import { Gauge, Route } from "lucide-react";

interface MileagePreferenceDisplayProps {
  preference: "odometer" | "distance";
}

export const MileagePreferenceDisplay: React.FC<MileagePreferenceDisplayProps> = ({
  preference,
}) => {
  const isOdometer = preference === "odometer";

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      {isOdometer ? (
        <>
          <Gauge className="h-4 w-4" />
          <span>Wprowadzanie od licznika</span>
        </>
      ) : (
        <>
          <Route className="h-4 w-4" />
          <span>Wprowadzanie od dystansu</span>
        </>
      )}
    </div>
  );
};

