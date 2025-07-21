// src/components/Pagination/Pagination.js
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Lógica para gerar os números de página (ex: 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      if (currentPage > 2) {
        pages.push(currentPage - 1);
      }
      if (currentPage !== 1 && currentPage !== totalPages) {
        pages.push(currentPage);
      }
      if (currentPage < totalPages - 1) {
        pages.push(currentPage + 1);
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return [...new Set(pages)]; // Remove duplicados
  };


  return (
    <nav className={styles.paginationContainer}>
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={styles.navButton}
      >
        <ChevronLeft size={18} />
        Anterior
      </button>
      <div className={styles.pageNumbers}>
        {getPageNumbers().map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`${styles.pageButton} ${currentPage === page ? styles.activePage : ''}`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className={styles.ellipsis}>{page}</span>
          )
        )}
      </div>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={styles.navButton}
      >
        Próximo
        <ChevronRight size={18} />
      </button>
    </nav>
  );
};

export default Pagination;