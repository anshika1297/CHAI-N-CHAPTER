'use client';

import { Filter, X } from 'lucide-react';
import { useState } from 'react';

interface FiltersProps {
  filters: {
    category: string;
    author: string;
    book: string;
    title: string;
  };
  setFilters: (filters: any) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  /** Categories that exist on the current blog posts (dropdown shows only these) */
  categories?: string[];
}

export default function Filters({ filters, setFilters, sortBy, setSortBy, categories = [] }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({ category: '', author: '', book: '', title: '' });
    setSortBy('newest');
  };

  const hasActiveFilters = Object.values(filters).some((val) => val !== '') || sortBy !== 'newest';

  return (
    <div className="lg:sticky lg:top-24">
      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full flex items-center justify-between bg-cream-light rounded-lg p-4 mb-4 border border-chai-brown/10"
      >
        <span className="flex items-center gap-2 text-chai-brown font-sans font-medium">
          <Filter size={18} />
          Filters & Sort
        </span>
        <span className="text-sm text-chai-brown-light">{isOpen ? 'Hide' : 'Show'}</span>
      </button>

      {/* Filters Panel */}
      <div
        className={`${
          isOpen ? 'block' : 'hidden'
        } lg:block bg-cream-light rounded-2xl p-5 lg:p-6 border border-chai-brown/10`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-chai-brown">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-terracotta hover:underline flex items-center gap-1"
            >
              <X size={14} />
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* Sort By */}
          <div>
            <label className="block text-sm font-sans font-medium text-chai-brown mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-chai-brown/20 bg-cream text-chai-brown font-sans text-sm focus:outline-none focus:border-terracotta transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="reading-time">Reading Time (Longest)</option>
            </select>
          </div>

          {/* Filter by Category */}
          <div>
            <label className="block text-sm font-sans font-medium text-chai-brown mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-chai-brown/20 bg-cream text-chai-brown font-sans text-sm focus:outline-none focus:border-terracotta transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Title */}
          <div>
            <label className="block text-sm font-sans font-medium text-chai-brown mb-2">
              Search by Title
            </label>
            <input
              type="text"
              value={filters.title}
              onChange={(e) => updateFilter('title', e.target.value)}
              placeholder="Enter title..."
              className="w-full px-4 py-2 rounded-lg border border-chai-brown/20 bg-cream text-chai-brown font-sans text-sm focus:outline-none focus:border-terracotta transition-colors placeholder:text-chai-brown-light"
            />
          </div>

          {/* Filter by Author */}
          <div>
            <label className="block text-sm font-sans font-medium text-chai-brown mb-2">
              Filter by Author
            </label>
            <input
              type="text"
              value={filters.author}
              onChange={(e) => updateFilter('author', e.target.value)}
              placeholder="Enter author name..."
              className="w-full px-4 py-2 rounded-lg border border-chai-brown/20 bg-cream text-chai-brown font-sans text-sm focus:outline-none focus:border-terracotta transition-colors placeholder:text-chai-brown-light"
            />
          </div>

          {/* Filter by Book */}
          <div>
            <label className="block text-sm font-sans font-medium text-chai-brown mb-2">
              Filter by Book
            </label>
            <input
              type="text"
              value={filters.book}
              onChange={(e) => updateFilter('book', e.target.value)}
              placeholder="Enter book title..."
              className="w-full px-4 py-2 rounded-lg border border-chai-brown/20 bg-cream text-chai-brown font-sans text-sm focus:outline-none focus:border-terracotta transition-colors placeholder:text-chai-brown-light"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
