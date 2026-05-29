import React from 'react';
import { Pagination } from 'react-bootstrap';

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  size?: 'sm' | 'lg';
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "justify-content-center mt-3",
  size
}) => {
  if (totalPages <= 1) return null;

  const items = [];

  items.push(
    <Pagination.Prev
      key="prev"
      onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
      disabled={currentPage === 1}
    />
  );

  if (totalPages <= 7) {
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => onPageChange(number)}>
          {number}
        </Pagination.Item>
      );
    }
  } else {
    items.push(
      <Pagination.Item key={1} active={1 === currentPage} onClick={() => onPageChange(1)}>
        1
      </Pagination.Item>
    );

    if (currentPage > 4) items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);

    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 4) {
      endPage = 5;
      startPage = 2;
    } else if (currentPage >= totalPages - 3) {
      startPage = totalPages - 4;
      endPage = totalPages - 1;
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => onPageChange(number)}>
          {number}
        </Pagination.Item>
      );
    }

    if (currentPage < totalPages - 3) items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);

    items.push(
      <Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => onPageChange(totalPages)}>
        {totalPages}
      </Pagination.Item>
    );
  }

  items.push(
    <Pagination.Next
      key="next"
      onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
      disabled={currentPage === totalPages}
    />
  );

  return (
    <Pagination className={className} size={size}>
      {items}
    </Pagination>
  );
};

export default CustomPagination;