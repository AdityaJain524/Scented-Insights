import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export interface SearchFiltersState {
  query: string;
  notes: string[];
  emotions: string[];
  minCredibility: number;
  postType: string | null;
  sortBy: 'recent' | 'popular' | 'credibility';
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onFiltersChange: (filters: SearchFiltersState) => void;
}

const COMMON_NOTES = [
  'Oud', 'Rose', 'Vanilla', 'Sandalwood', 'Bergamot', 'Jasmine',
  'Amber', 'Musk', 'Cedar', 'Iris', 'Vetiver', 'Tonka Bean',
];

const COMMON_EMOTIONS = [
  'Luxurious', 'Fresh', 'Romantic', 'Confident', 'Mysterious',
  'Elegant', 'Playful', 'Sophisticated', 'Warm', 'Cool',
];

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof SearchFiltersState>(
    key: K,
    value: SearchFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayItem = (
    key: 'notes' | 'emotions',
    item: string
  ) => {
    const current = filters[key];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    updateFilter(key, updated);
  };

  const clearFilters = () => {
    onFiltersChange({
      query: '',
      notes: [],
      emotions: [],
      minCredibility: 0,
      postType: null,
      sortBy: 'recent',
    });
  };

  const hasActiveFilters =
    filters.notes.length > 0 ||
    filters.emotions.length > 0 ||
    filters.minCredibility > 0 ||
    filters.postType !== null;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fragrances, notes, or users..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {filters.notes.length + filters.emotions.length + (filters.postType ? 1 : 0) + (filters.minCredibility > 0 ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Post Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Post Type</label>
                <Select
                  value={filters.postType || 'all'}
                  onValueChange={(v) => updateFilter('postType', v === 'all' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="review">Reviews</SelectItem>
                    <SelectItem value="story">Stories</SelectItem>
                    <SelectItem value="comparison">Comparisons</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Credibility Score */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Min Credibility Score: {filters.minCredibility}%
                </label>
                <Slider
                  value={[filters.minCredibility]}
                  onValueChange={([v]) => updateFilter('minCredibility', v)}
                  max={100}
                  step={5}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_NOTES.map((note) => (
                    <Badge
                      key={note}
                      variant={filters.notes.includes(note) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayItem('notes', note)}
                    >
                      {note}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Emotions */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Emotions</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_EMOTIONS.map((emotion) => (
                    <Badge
                      key={emotion}
                      variant={filters.emotions.includes(emotion) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleArrayItem('emotions', emotion)}
                    >
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(v) => updateFilter('sortBy', v as SearchFiltersState['sortBy'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="credibility">Highest Credibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.notes.map((note) => (
            <Badge key={note} variant="secondary" className="gap-1">
              {note}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayItem('notes', note)}
              />
            </Badge>
          ))}
          {filters.emotions.map((emotion) => (
            <Badge key={emotion} variant="secondary" className="gap-1">
              {emotion}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleArrayItem('emotions', emotion)}
              />
            </Badge>
          ))}
          {filters.postType && (
            <Badge variant="secondary" className="gap-1">
              {filters.postType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('postType', null)}
              />
            </Badge>
          )}
          {filters.minCredibility > 0 && (
            <Badge variant="secondary" className="gap-1">
              {filters.minCredibility}%+ credibility
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('minCredibility', 0)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
