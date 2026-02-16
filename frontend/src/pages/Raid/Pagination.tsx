import React from 'react';
import './Pagination.css';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pageNumbers: number[] = [];

  for (let i = 0; i < totalPages; i += 1) {
    if (
      i === currentPage ||
      i === 0 ||
      i === totalPages - 1 ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      pageNumbers.push(i);
    }
  }

  const canGoPrevious = currentPage > 0 && totalPages > 0;
  const canGoNext = totalPages > 0 && currentPage < totalPages - 1;

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
        disabled={!canGoPrevious}
      >
        Previous
      </button>
      {pageNumbers.map((number) => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={currentPage === number ? 'active' : ''}
          disabled={currentPage === number}
        >
          {number + 1}
        </button>
      ))}
      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages - 1))}
        disabled={!canGoNext}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
