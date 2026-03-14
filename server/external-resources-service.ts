import { storage } from './storage';
import { ExternalResource, InsertExternalResource } from '../shared/schema';

interface KhanAcademyContent {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  type: 'video' | 'article' | 'exercise';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  subjects: string[];
  topics: string[];
}

interface ExternalContentSource {
  platform: string;
  search(query: string, filters?: any): Promise<KhanAcademyContent[]>;
  getContent(id: string): Promise<KhanAcademyContent | null>;
}

class KhanAcademyService implements ExternalContentSource {
  platform = 'Khan Academy';

  async search(query: string, filters?: { subject?: string; type?: string; difficulty?: string }): Promise<KhanAcademyContent[]> {
    // In a real implementation, this would call Khan Academy's API
    // For now, we'll return mock data based on common NEET/JEE topics
    const mockKhanContent: KhanAcademyContent[] = [
      {
        id: 'khan-physics-motion-1',
        title: 'Introduction to Motion in One Dimension',
        description: 'Learn the fundamentals of motion, velocity, and acceleration in one dimension. Perfect for understanding kinematics basics.',
        url: 'https://www.khanacademy.org/science/physics/one-dimensional-motion',
        thumbnailUrl: 'https://cdn.kastatic.org/images/physics-motion.png',
        duration: 720, // 12 minutes
        type: 'video',
        difficulty: 'beginner',
        subjects: ['Physics'],
        topics: ['Motion', 'Kinematics']
      },
      {
        id: 'khan-chemistry-atomic-structure',
        title: 'Atomic Structure and Electronic Configuration',
        description: 'Understand the structure of atoms, electron shells, and how electrons are arranged in different energy levels.',
        url: 'https://www.khanacademy.org/science/chemistry/electronic-structure-of-atoms',
        thumbnailUrl: 'https://cdn.kastatic.org/images/chemistry-atoms.png',
        duration: 900, // 15 minutes
        type: 'video',
        difficulty: 'intermediate',
        subjects: ['Chemistry'],
        topics: ['Atomic Structure', 'Electronic Configuration']
      },
      {
        id: 'khan-biology-cell-structure',
        title: 'Cell Structure and Function',
        description: 'Explore the basic unit of life - the cell. Learn about organelles, their functions, and differences between plant and animal cells.',
        url: 'https://www.khanacademy.org/science/biology/structure-of-a-cell',
        thumbnailUrl: 'https://cdn.kastatic.org/images/biology-cells.png',
        duration: 1080, // 18 minutes
        type: 'video',
        difficulty: 'beginner',
        subjects: ['Biology'],
        topics: ['Cell Biology', 'Cell Structure']
      },
      {
        id: 'khan-math-calculus-limits',
        title: 'Introduction to Limits',
        description: 'Learn the fundamental concept of limits in calculus. Understanding limits is crucial for derivatives and integrals.',
        url: 'https://www.khanacademy.org/math/calculus-1/cs1-limits-and-continuity',
        thumbnailUrl: 'https://cdn.kastatic.org/images/math-calculus.png',
        duration: 960, // 16 minutes
        type: 'video',
        difficulty: 'intermediate',
        subjects: ['Mathematics'],
        topics: ['Calculus', 'Limits']
      },
      {
        id: 'khan-physics-thermodynamics',
        title: 'Laws of Thermodynamics',
        description: 'Master the four laws of thermodynamics with clear explanations and examples relevant to JEE/NEET preparation.',
        url: 'https://www.khanacademy.org/science/physics/thermodynamics',
        thumbnailUrl: 'https://cdn.kastatic.org/images/physics-thermo.png',
        duration: 1200, // 20 minutes
        type: 'video',
        difficulty: 'advanced',
        subjects: ['Physics'],
        topics: ['Thermodynamics', 'Heat Transfer']
      },
      {
        id: 'khan-chemistry-organic-basics',
        title: 'Introduction to Organic Chemistry',
        description: 'Get started with organic chemistry fundamentals including nomenclature, functional groups, and basic reactions.',
        url: 'https://www.khanacademy.org/science/organic-chemistry',
        thumbnailUrl: 'https://cdn.kastatic.org/images/chemistry-organic.png',
        duration: 840, // 14 minutes
        type: 'video',
        difficulty: 'intermediate',
        subjects: ['Chemistry'],
        topics: ['Organic Chemistry', 'Functional Groups']
      },
      {
        id: 'khan-biology-genetics',
        title: 'Mendelian Genetics and Inheritance',
        description: 'Understand the principles of heredity, genetic crosses, and inheritance patterns discovered by Gregor Mendel.',
        url: 'https://www.khanacademy.org/science/biology/classical-genetics',
        thumbnailUrl: 'https://cdn.kastatic.org/images/biology-genetics.png',
        duration: 1020, // 17 minutes
        type: 'video',
        difficulty: 'intermediate',
        subjects: ['Biology'],
        topics: ['Genetics', 'Heredity']
      }
    ];

    // Filter based on query and filters
    let filteredContent = mockKhanContent;

    if (query) {
      const queryLower = query.toLowerCase();
      filteredContent = filteredContent.filter(content => 
        content.title.toLowerCase().includes(queryLower) ||
        content.description.toLowerCase().includes(queryLower) ||
        content.subjects.some(subject => subject.toLowerCase().includes(queryLower)) ||
        content.topics.some(topic => topic.toLowerCase().includes(queryLower))
      );
    }

    if (filters?.subject) {
      filteredContent = filteredContent.filter(content =>
        content.subjects.some(subject => subject.toLowerCase().includes(filters.subject!.toLowerCase()))
      );
    }

    if (filters?.type) {
      filteredContent = filteredContent.filter(content =>
        content.type === filters.type
      );
    }

    if (filters?.difficulty) {
      filteredContent = filteredContent.filter(content =>
        content.difficulty === filters.difficulty
      );
    }

    return filteredContent;
  }

  async getContent(id: string): Promise<KhanAcademyContent | null> {
    const allContent = await this.search('');
    return allContent.find(content => content.id === id) || null;
  }
}

export class ExternalResourcesService {
  private contentSources: Map<string, ExternalContentSource>;

  constructor() {
    this.contentSources = new Map();
    this.contentSources.set('Khan Academy', new KhanAcademyService());
  }

  async searchResources(query: string, filters?: { 
    platform?: string; 
    subject?: string; 
    type?: string; 
    difficulty?: string; 
  }): Promise<ExternalResource[]> {
    const results: ExternalResource[] = [];
    
    // If platform is specified, search only that platform
    if (filters?.platform) {
      const source = this.contentSources.get(filters.platform);
      if (source) {
        const content = await source.search(query, filters);
        const resources = content.map(c => this.convertToExternalResource(c, source.platform));
        results.push(...resources);
      }
    } else {
      // Search all platforms
      for (const [platform, source] of Array.from(this.contentSources.entries())) {
        try {
          const content = await source.search(query, filters);
          const resources = content.map((c: KhanAcademyContent) => this.convertToExternalResource(c, platform));
          results.push(...resources);
        } catch (error) {
          console.error(`Error searching ${platform}:`, error);
        }
      }
    }

    return results;
  }

  async getResourceById(id: string, platform: string): Promise<ExternalResource | null> {
    const source = this.contentSources.get(platform);
    if (!source) return null;

    try {
      const content = await source.getContent(id);
      if (!content) return null;
      
      return this.convertToExternalResource(content, platform);
    } catch (error) {
      console.error(`Error fetching resource ${id} from ${platform}:`, error);
      return null;
    }
  }

  private convertToExternalResource(content: KhanAcademyContent, platform: string): ExternalResource {
    const resourceId = `${platform.toLowerCase().replace(' ', '-')}-${content.id}`;
    return {
      id: resourceId,
      resourceId,
      platform,
      title: content.title,
      description: content.description,
      url: content.url,
      type: content.type,
      difficulty: content.difficulty,
      thumbnailUrl: content.thumbnailUrl || null,
      duration: content.duration || null,
      rating: this.getDefaultRating(platform),
      subjectId: null, // Will be populated when storing in database
      chapterId: null,
      topicId: null,   // Will be populated when storing in database
      keywords: content.topics,
      language: 'English',
      viewCount: 0,
      lastChecked: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private getDefaultRating(platform: string): number {
    // Default ratings based on platform reputation
    switch (platform) {
      case 'Khan Academy': return 4.8;
      default: return 4.0;
    }
  }

  async syncResourceToDatabase(resource: ExternalResource, subjectId: string, topicId?: string): Promise<ExternalResource> {
    // Check if resource already exists
    const existing = await storage.getExternalResource(resource.id);
    if (existing) {
      return existing;
    }

    // Create new resource in database
    const resourceData: InsertExternalResource = {
      ...resource,
      subjectId,
      topicId: topicId || null
    };

    return await storage.createExternalResource(resourceData);
  }

  async getRecommendationsForTopic(topicId: string, userId: string): Promise<ExternalResource[]> {
    // Get existing resources for topic
    const existingResources = await storage.getExternalResourcesByTopic(topicId);
    
    // If we have enough resources, return them
    if (existingResources.length >= 3) {
      return existingResources.slice(0, 5); // Return top 5
    }

    // Otherwise, search for new content and sync to database
    // This would typically use the topic name/subject to search
    const searchQuery = ''; // In real implementation, get topic name
    const newResources = await this.searchResources(searchQuery);
    
    // Sync promising resources to database
    const syncedResources: ExternalResource[] = [];
    for (const resource of newResources.slice(0, 3)) {
      try {
        const synced = await this.syncResourceToDatabase(resource, 'subject-id', topicId);
        syncedResources.push(synced);
      } catch (error) {
        console.error('Error syncing resource:', error);
      }
    }

    return [...existingResources, ...syncedResources];
  }
}

export const externalResourcesService = new ExternalResourcesService();