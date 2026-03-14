import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Clock, Eye, ArrowLeft, Share2, BookmarkPlus } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

const BlogPostPage = () => {
  const [, params] = useRoute("/blog/:slug");
  const { toast } = useToast();
  const slug = params?.slug;

  // Fetch blog post
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['/api/blog/posts', slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts/${slug}`);
      if (!response.ok) {
        throw new Error('Post not found');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Fetch blog categories for category display
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/blog/categories'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              Sorry, we couldn't find the article you're looking for.
            </p>
            <Button asChild data-testid="button-back-to-blog">
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (readingTime: number) => {
    if (readingTime === 0) return "Quick read";
    return `${readingTime} min read`;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category?.color || "#3B82F6";
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category?.name || "General";
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: window.location.href,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Article link copied to clipboard.",
        });
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard.",
      });
    }
  };

  // Convert markdown-like content to HTML (basic implementation)
  const renderContent = (content: string) => {
    // This is a basic markdown renderer - in production, you'd use a proper markdown parser
    return content
      .split('\n')
      .map((paragraph, index) => {
        if (paragraph.trim() === '') return null;
        
        // Handle headings
        if (paragraph.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{paragraph.slice(2)}</h1>;
        }
        if (paragraph.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-semibold mt-6 mb-3">{paragraph.slice(3)}</h2>;
        }
        if (paragraph.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{paragraph.slice(4)}</h3>;
        }
        
        // Handle lists
        if (paragraph.startsWith('- ')) {
          return (
            <li key={index} className="ml-6 mb-1">
              {paragraph.slice(2)}
            </li>
          );
        }
        
        // Regular paragraph
        return (
          <p key={index} className="text-foreground leading-relaxed mb-4">
            {paragraph}
          </p>
        );
      })
      .filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" asChild data-testid="button-back-to-blog">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </Button>
      </div>

      {/* Article Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Category Badge */}
          {post.categoryId && (
            <Badge 
              className="text-white mb-4"
              style={{ backgroundColor: getCategoryColor(post.categoryId) }}
              data-testid="badge-category"
            >
              {getCategoryName(post.categoryId)}
            </Badge>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight" data-testid="text-title">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="text-excerpt">
              {post.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span data-testid="text-author">By Admin</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span data-testid="text-date">
                {formatDate(post.publishedAt || post.createdAt)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span data-testid="text-reading-time">
                {getReadingTime(post.readingTime)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span data-testid="text-views">
                {post.viewsCount || 0} views
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-8">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              data-testid="button-share"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              data-testid="button-bookmark"
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Bookmark
            </Button>
          </div>

          <Separator className="mb-8" />

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full rounded-lg shadow-lg"
                data-testid="img-featured"
              />
            </div>
          )}

          {/* Article Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none" data-testid="content-article">
                {renderContent(post.content)}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer hover-elevate"
                    data-testid={`tag-${tag.replace(/\s+/g, '-')}`}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Ready to Start Your NEET/JEE Preparation?</h3>
              <p className="text-muted-foreground mb-4">
                Join thousands of students who are already improving their scores with our comprehensive mock tests.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild data-testid="button-start-test">
                  <Link href="/test-wizard">
                    Start Free Mock Test
                  </Link>
                </Button>
                <Button variant="outline" asChild data-testid="button-view-pricing">
                  <Link href="/pricing">
                    View Pricing Plans
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;