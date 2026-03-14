import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Clock, Eye, Search, Filter } from "lucide-react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";

const BlogPage = () => {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const postsPerPage = 9;

  // Parse URL parameters on mount and initialize state
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const categoryParam = urlParams.get('category');
    const searchParam = urlParams.get('q');
    const pageParam = urlParams.get('page');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    if (pageParam) {
      setCurrentPage(parseInt(pageParam) || 1);
    }
  }, [location]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== "all") {
      params.set('category', selectedCategory);
    }
    if (searchTerm.trim()) {
      params.set('q', searchTerm.trim());
    }
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    
    const newLocation = params.toString() ? `/blog?${params}` : '/blog';
    if (newLocation !== location) {
      setLocation(newLocation, { replace: true });
    }
  }, [selectedCategory, searchTerm, currentPage, location, setLocation]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  // Fetch blog categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/blog/categories'],
  });

  // Fetch blog posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['/api/blog/posts', { page: currentPage, category: selectedCategory, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: postsPerPage.toString(),
      });
      
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      
      if (searchTerm.trim()) {
        params.append("q", searchTerm.trim());
      }
      
      const response = await fetch(`/api/blog/posts?${params}`);
      return response.json();
    },
  });

  // Posts are already filtered server-side, no need for client filtering
  const filteredPosts = posts;

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            AI Recruitment Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Discover best practices, industry insights, and proven strategies to revolutionize your hiring process with AI-powered interviews and smarter candidate evaluation.
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-blog-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-blog-category">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Featured Categories */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Browse by Category</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className="rounded-full"
                data-testid="button-category-all"
              >
                All Articles
              </Button>
              {categories.map((category: any) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.slug ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.slug)}
                  className="rounded-full"
                  style={{
                    backgroundColor: selectedCategory === category.slug ? category.color : undefined,
                    borderColor: category.color,
                    color: selectedCategory === category.slug ? 'white' : category.color
                  }}
                  data-testid={`button-category-${category.slug}`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Blog Posts Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post: any) => (
              <Card key={post.id} className="group hover-elevate cursor-pointer transition-all duration-200" data-testid={`card-blog-post-${post.slug}`}>
                <Link href={`/blog/${post.slug}`}>
                  {post.featuredImage && (
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        data-testid={`img-blog-${post.slug}`}
                      />
                      {post.categoryId && (
                        <Badge 
                          className="absolute top-3 left-3 text-white"
                          style={{ backgroundColor: getCategoryColor(post.categoryId) }}
                          data-testid={`badge-category-${post.slug}`}
                        >
                          {getCategoryName(post.categoryId)}
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-title-${post.slug}`}>
                      {post.title}
                    </CardTitle>
                    {post.excerpt && (
                      <CardDescription className="line-clamp-3" data-testid={`text-excerpt-${post.slug}`}>
                        {post.excerpt}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span data-testid={`text-date-${post.slug}`}>
                            {formatDate(post.publishedAt || post.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span data-testid={`text-reading-time-${post.slug}`}>
                            {getReadingTime(post.readingTime)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span data-testid={`text-views-${post.slug}`}>
                          {post.viewsCount || 0}
                        </span>
                      </div>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {post.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs" data-testid={`tag-${post.slug}-${tag.replace(/\s+/g, '-')}`}>
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{post.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? `No articles match "${searchTerm}"` : "No articles available in this category"}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredPosts.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              data-testid="button-prev-page"
            >
              Previous
            </Button>
            <span className="mx-4 text-sm text-muted-foreground">
              Page {currentPage}
            </span>
            <Button
              variant="outline"
              disabled={filteredPosts.length < postsPerPage}
              onClick={() => setCurrentPage(prev => prev + 1)}
              data-testid="button-next-page"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;