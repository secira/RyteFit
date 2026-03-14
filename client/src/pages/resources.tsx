import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ExternalResourceCard from '@/components/ExternalResourceCard';

interface ExternalResource {
  id: string;
  resourceId: string;
  platform: string;
  title: string;
  description: string | null;
  url: string;
  type: string;
  difficulty: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  rating: number | null;
  language: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  keywords: string[] | null;
}


export default function Resources() {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all-platforms');
  const [typeFilter, setTypeFilter] = useState('all-types');
  const [difficultyFilter, setDifficultyFilter] = useState('all-levels');

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['/api/external-resources/search', searchQuery, platformFilter, typeFilter, difficultyFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (platformFilter && platformFilter !== 'all-platforms') params.append('platform', platformFilter);
      if (typeFilter && typeFilter !== 'all-types') params.append('type', typeFilter);
      if (difficultyFilter && difficultyFilter !== 'all-levels') params.append('difficulty', difficultyFilter);
      
      const response = await fetch(`/api/external-resources/search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      return response.json() as Promise<ExternalResource[]>;
    }
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-resources">External Learning Resources</h1>
        <p className="text-muted-foreground">
          Discover additional learning materials from trusted educational platforms to complement your interview preparation
        </p>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-resources"
          className="md:col-span-1"
        />
        
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger data-testid="select-platform-filter">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-platforms">All Content</SelectItem>
            <SelectItem value="Khan Academy">Khan Academy</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger data-testid="select-type-filter">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-types">All Types</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
            <SelectItem value="exercise">Exercises</SelectItem>
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger data-testid="select-difficulty-filter">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-levels">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery || (platformFilter !== 'all-platforms') || (typeFilter !== 'all-types') || (difficultyFilter !== 'all-levels')
              ? 'No resources found matching your filters'
              : 'No resources available yet'
            }
          </div>
          {(searchQuery || (platformFilter !== 'all-platforms') || (typeFilter !== 'all-types') || (difficultyFilter !== 'all-levels')) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setPlatformFilter('all-platforms');
                setTypeFilter('all-types');
                setDifficultyFilter('all-levels');
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <ExternalResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}