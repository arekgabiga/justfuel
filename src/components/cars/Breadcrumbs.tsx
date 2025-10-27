import React from "react";

interface BreadcrumbsProps {
  carName: string;
  showFillups?: boolean;
  carId?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ carName, showFillups = false, carId }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.location.href = href;
    }
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <li>
          <a
            href="/cars"
            onClick={(e) => handleLinkClick(e, "/cars")}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Samochody
          </a>
        </li>
        <li>
          <span className="mx-2">/</span>
        </li>
        {showFillups && carId ? (
          <>
            <li>
              <a
                href={`/cars/${carId}`}
                onClick={(e) => handleLinkClick(e, `/cars/${carId}`)}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer truncate"
              >
                {carName}
              </a>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-gray-900 dark:text-gray-100 font-medium">
              Tankowania
            </li>
          </>
        ) : (
          <li className="text-gray-900 dark:text-gray-100 font-medium truncate">
            {carName}
          </li>
        )}
      </ol>
    </nav>
  );
};

