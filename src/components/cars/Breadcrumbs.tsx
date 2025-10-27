import React from "react";

interface BreadcrumbsProps {
  carName: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ carName }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.location.href = "/cars";
    }
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <li>
          <a
            href="/cars"
            onClick={handleLinkClick}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Samochody
          </a>
        </li>
        <li>
          <span className="mx-2">/</span>
        </li>
        <li className="text-gray-900 dark:text-gray-100 font-medium truncate">
          {carName}
        </li>
      </ol>
    </nav>
  );
};

