import React from 'react';

interface CarNameProps {
  name: string;
}

export const CarName: React.FC<CarNameProps> = ({ name }) => {
  // Validate name length and content
  const displayName = name && name.length > 0 ? name.trim() : 'Bez nazwy';

  // Truncate very long names
  const truncatedName = displayName.length > 50 ? `${displayName.substring(0, 50)}...` : displayName;

  return (
    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4" title={displayName}>
      {truncatedName}
    </h3>
  );
};
