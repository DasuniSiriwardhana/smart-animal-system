"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LayoutGrid, 
  List, 
  Calendar, 
  ArrowUpDown,
  Dog,
  Cat,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  PawPrint
} from 'lucide-react';

export type DataItem = {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age: number;
  weight: number;
  photo_url?: string | null;
  created_at: string;
  health_score?: number;
};

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'date' | 'age' | 'weight';
type SortOrder = 'asc' | 'desc';
type PetType = 'all' | 'dog' | 'cat';
type StorageValue = string | number | boolean | object | null;

interface DataViewProps {
  data: DataItem[];
  viewMode?: ViewMode;
  onViewChange?: (mode: ViewMode) => void;
  onItemClick?: (item: DataItem) => void;
  renderCard?: (item: DataItem) => React.ReactNode;
  renderListItem?: (item: DataItem) => React.ReactNode;
  showFilters?: boolean;
  showSearch?: boolean;
  itemsPerPage?: number;
  emptyMessage?: string;
}

const loadSavedSetting = (key: string, defaultValue: StorageValue): StorageValue => {
  if (typeof window === 'undefined') return defaultValue;
  const saved = localStorage.getItem(`dataview_${key}`);
  if (!saved) return defaultValue;
  try {
    return JSON.parse(saved);
  } catch {
    return defaultValue;
  }
};

const saveSetting = (key: string, value: StorageValue): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`dataview_${key}`, JSON.stringify(value));
  }
};

export default function DataView({
  data,
  viewMode: externalViewMode,
  onViewChange,
  onItemClick,
  renderCard,
  renderListItem,
  showFilters = true,
  showSearch = true,
  itemsPerPage = 12,
  emptyMessage = "No data found"
}: DataViewProps) {
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>(() => {
    const saved = loadSavedSetting('viewMode', 'grid');
    return saved === 'grid' || saved === 'list' ? saved : 'grid';
  });
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    const saved = loadSavedSetting('searchTerm', '');
    return typeof saved === 'string' ? saved : '';
  });
  const [petType, setPetType] = useState<PetType>(() => {
    const saved = loadSavedSetting('petType', 'all');
    return saved === 'all' || saved === 'dog' || saved === 'cat' ? saved : 'all';
  });
  const [sortField, setSortField] = useState<SortField>(() => {
    const saved = loadSavedSetting('sortField', 'name');
    return saved === 'name' || saved === 'date' || saved === 'age' || saved === 'weight' ? saved : 'name';
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const saved = loadSavedSetting('sortOrder', 'asc');
    return saved === 'asc' || saved === 'desc' ? saved : 'asc';
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  const viewMode = externalViewMode || internalViewMode;
  const setViewMode = onViewChange || setInternalViewMode;

  useEffect(() => {
    saveSetting('viewMode', internalViewMode);
  }, [internalViewMode]);

  useEffect(() => {
    saveSetting('searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    saveSetting('petType', petType);
  }, [petType]);

  useEffect(() => {
    saveSetting('sortField', sortField);
  }, [sortField]);

  useEffect(() => {
    saveSetting('sortOrder', sortOrder);
  }, [sortOrder]);

  const getPetType = (species: string): PetType => {
    const s = species.toLowerCase();
    if (s.includes('dog')) return 'dog';
    if (s.includes('cat')) return 'cat';
    return 'all';
  };

  const filteredData = data.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.breed && item.breed.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = petType === 'all' || getPetType(item.species) === petType;
    
    return matchesSearch && matchesType;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';
    
    if (sortField === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else if (sortField === 'date') {
      aVal = new Date(a.created_at).getTime();
      bVal = new Date(b.created_at).getTime();
    } else if (sortField === 'age') {
      aVal = a.age;
      bVal = b.age;
    } else if (sortField === 'weight') {
      aVal = a.weight;
      bVal = b.weight;
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = (): void => {
    setSearchTerm('');
    setPetType('all');
    setSortField('name');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const hasActiveFilters: boolean = searchTerm !== '' || petType !== 'all';

  const defaultRenderCard = (item: DataItem): React.ReactElement => (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
      onClick={() => onItemClick?.(item)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <PawPrint className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold truncate">{item.name}</h3>
            <p className="text-xs text-muted-foreground">{item.breed || item.species}</p>
            <p className="text-xs text-muted-foreground">{item.age} yrs • {item.weight} kg</p>
          </div>
        </div>
        {item.health_score !== undefined && (
          <div className="mt-3 pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span>Health Score</span>
              <span className={`font-bold ${
                item.health_score >= 80 ? 'text-green-600' :
                item.health_score >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>{item.health_score}%</span>
            </div>
            <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  item.health_score >= 80 ? 'bg-green-500' :
                  item.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${item.health_score}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const defaultRenderListItem = (item: DataItem): React.ReactElement => (
    <div 
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onItemClick?.(item)}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <PawPrint className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.breed || item.species}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm">{item.age} yrs • {item.weight} kg</p>
        <p className="text-xs text-muted-foreground">
          Joined: {new Date(item.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            <Button variant="outline" size="sm" onClick={() => handleSort('name')}>
              Name
              {sortField === 'name' && <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSort('date')}>
              <Calendar className="h-3 w-3 mr-1" />
              Date
              {sortField === 'date' && <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSort('age')}>
              Age
              {sortField === 'age' && <ArrowUpDown className={`ml-1 h-3 w-3 ${sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'}`} />}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setPetType('all')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  petType === 'all' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPetType('dog')}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors ${
                  petType === 'dog' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                }`}
              >
                <Dog className="h-3 w-3" /> Dogs
              </button>
              <button
                onClick={() => setPetType('cat')}
                className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors ${
                  petType === 'cat' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                }`}
              >
                <Cat className="h-3 w-3" /> Cats
              </button>
            </div>

            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {paginatedData.length} of {sortedData.length} items
      </div>

      {paginatedData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedData.map((item) => (
            <div key={item.id}>
              {renderCard ? renderCard(item) : defaultRenderCard(item)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedData.map((item) => (
            <div key={item.id}>
              {renderListItem ? renderListItem(item) : defaultRenderListItem(item)}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-4 py-2 text-sm">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}