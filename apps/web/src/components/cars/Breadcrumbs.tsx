import React from 'react';

interface BreadcrumbsProps {
  carName: string;
  showFillups?: boolean;
  carId?: string;
  showNewFillup?: boolean;
  showEditFillup?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  carName,
  showFillups = false,
  carId,
  showNewFillup = false,
  showEditFillup = false,
}) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
        <li className="flex-shrink-0">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Auta
          </a>
        </li>
        <li className="flex-shrink-0">
          <span className="mx-2">/</span>
        </li>
        {(showFillups || showNewFillup || showEditFillup) && carId ? (
          <>
            <li className="flex-shrink-0 min-w-0">
              <a
                href={`/cars/${carId}`}
                onClick={(e) => handleLinkClick(e, `/cars/${carId}`)}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer truncate max-w-[120px] sm:max-w-none"
              >
                {carName}
              </a>
            </li>
            <li className="flex-shrink-0">
              <span className="mx-2">/</span>
            </li>
            <li className="flex-shrink-0 text-gray-900 dark:text-gray-100 font-medium">Tankowania</li>
            {(showNewFillup || showEditFillup) && (
              <>
                <li className="flex-shrink-0">
                  <span className="mx-2">/</span>
                </li>
                <li className="flex-shrink-0 text-gray-900 dark:text-gray-100 font-medium">
                  {showNewFillup ? 'Nowe tankowanie' : 'Edycja'}
                </li>
              </>
            )}
          </>
        ) : (
          <li className="flex-shrink-0 min-w-0 text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px] sm:max-w-none">
            {carName}
          </li>
        )}
      </ol>
    </nav>
  );
};
