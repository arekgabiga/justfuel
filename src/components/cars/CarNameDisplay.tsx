import React from "react";

interface CarNameDisplayProps {
  name: string;
}

export const CarNameDisplay: React.FC<CarNameDisplayProps> = ({ name }) => {
  return (
    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
      {name}
    </h1>
  );
};

