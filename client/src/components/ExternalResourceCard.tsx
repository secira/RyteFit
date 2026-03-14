import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Play, BookOpen, Zap, Clock, Star } from 'lucide-react';

interface ExternalResourceCardProps {
  resource: {
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
    keywords: string[] | null;
  };
  compact?: boolean;
  showDescription?: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'video':
      return <Play className="w-4 h-4" />;
    case 'article':
      return <BookOpen className="w-4 h-4" />;
    case 'exercise':
      return <Zap className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

const getDifficultyColor = (difficulty: string | null) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
};

export default function ExternalResourceCard({ 
  resource, 
  compact = false, 
  showDescription = true 
}: ExternalResourceCardProps) {
  return (
    <Card 
      className={`overflow-hidden hover-elevate ${compact ? 'h-full' : ''}`} 
      data-testid={`card-resource-${resource.id}`}
    >
      {!compact && resource.thumbnailUrl && (
        <div className="aspect-video bg-muted relative overflow-hidden">
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <ExternalLink className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      )}
      
      <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {getTypeIcon(resource.type)}
            <Badge variant="secondary" className="text-xs">
              {resource.platform}
            </Badge>
          </div>
          {resource.rating && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-3 h-3 fill-current text-yellow-500" />
              {resource.rating.toFixed(1)}
            </div>
          )}
        </div>
        
        <CardTitle 
          className={`leading-tight ${compact ? 'text-base' : 'text-lg'}`} 
          data-testid={`text-resource-title-${resource.id}`}
        >
          {resource.title}
        </CardTitle>
        
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {resource.difficulty && (
            <Badge 
              variant="outline" 
              className={getDifficultyColor(resource.difficulty)}
            >
              {resource.difficulty}
            </Badge>
          )}
          {resource.duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(resource.duration)}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {showDescription && resource.description && !compact && (
          <CardDescription className="text-sm mb-4 line-clamp-3">
            {resource.description}
          </CardDescription>
        )}
        
        {resource.keywords && resource.keywords.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mb-4">
            {resource.keywords.slice(0, 3).map((keyword, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {resource.keywords.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{resource.keywords.length - 3} more
              </Badge>
            )}
          </div>
        )}
        
        <Button
          className={compact ? 'w-full text-sm' : 'w-full'}
          variant="default"
          size={compact ? 'sm' : 'default'}
          asChild
          data-testid={`button-open-resource-${resource.id}`}
        >
          <a href={resource.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Khan Academy
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}