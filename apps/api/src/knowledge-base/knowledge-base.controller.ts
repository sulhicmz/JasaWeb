import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';
import { KnowledgeBaseService } from './knowledge-base.service';
import { User } from '@prisma/client';
import {
  CreateKbCategoryDto,
  UpdateKbCategoryDto,
  CreateKbTagDto,
  CreateKbArticleDto,
  UpdateKbArticleDto,
  CreateKbFeedbackDto,
  KbSearchDto,
  KbArticleStatus,
} from './dto/knowledge-base.dto';

@ApiTags('knowledge-base')
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  // Categories
  @Post('categories')
  @UseGuards(AuthGuard, MultiTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new knowledge base category' })
  async createCategory(
    @Body() createCategoryDto: CreateKbCategoryDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.knowledgeBaseService.createCategory(
      createCategoryDto,
      organizationId
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all knowledge base categories' })
  async getCategories(@CurrentOrganizationId() organizationId?: string) {
    return this.knowledgeBaseService.getCategories(organizationId);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get a specific knowledge base category' })
  async getCategory(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId?: string
  ) {
    return this.knowledgeBaseService.getCategory(id, organizationId);
  }

  @Patch('categories/:id')
  @UseGuards(AuthGuard, MultiTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a knowledge base category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateKbCategoryDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.knowledgeBaseService.updateCategory(
      id,
      updateCategoryDto,
      organizationId
    );
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard, MultiTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a knowledge base category' })
  async deleteCategory(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.knowledgeBaseService.deleteCategory(id, organizationId);
  }

  // Tags
  @Post('tags')
  @UseGuards(AuthGuard, MultiTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new knowledge base tag' })
  async createTag(
    @Body() createTagDto: CreateKbTagDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.knowledgeBaseService.createTag(createTagDto, organizationId);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all knowledge base tags' })
  async getTags(@Request() req: Request & { user?: User }) {
    return this.knowledgeBaseService.getTags(req.user);
  }

  // Articles
  @Post('articles')
  @UseGuards(AuthGuard, MultiTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new knowledge base article' })
  async createArticle(
    @Body() createArticleDto: CreateKbArticleDto,
    @Request() req: Request & { user: User }
  ) {
    return this.knowledgeBaseService.createArticle(createArticleDto, req.user);
  }

  @Get('articles')
  @ApiOperation({ summary: 'Get knowledge base articles' })
  async getArticles(
    @Query('status') status?: KbArticleStatus,
    @Query('categoryId') categoryId?: string,
    @Query('featured') featured?: string,
    @Request() req?: Request & { user?: User }
  ) {
    const featuredBool =
      featured === 'true' ? true : featured === 'false' ? false : undefined;
    return this.knowledgeBaseService.getArticles(
      status,
      categoryId,
      featuredBool,
      req?.user
    );
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Get a specific knowledge base article' })
  async getArticle(
    @Param('id') id: string,
    @Request() req: Request & { user?: User }
  ) {
    return this.knowledgeBaseService.getArticle(id, req.user);
  }

  @Get('articles/slug/:slug')
  @ApiOperation({ summary: 'Get a knowledge base article by slug' })
  async getArticleBySlug(
    @Param('slug') slug: string,
    @CurrentOrganizationId() organizationId?: string
  ) {
    return this.knowledgeBaseService.getArticleBySlug(slug, organizationId);
  }

  @Patch('articles/:id')
  @UseGuards(AuthGuard, MultiTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a knowledge base article' })
  async updateArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateKbArticleDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.knowledgeBaseService.updateArticle(
      id,
      updateArticleDto,
      organizationId
    );
  }

  @Delete('articles/:id')
  @UseGuards(AuthGuard, MultiTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a knowledge base article' })
  async deleteArticle(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.knowledgeBaseService.deleteArticle(id, organizationId);
  }

  // Search
  @Post('search')
  @ApiOperation({ summary: 'Search knowledge base articles' })
  async search(
    @Body() searchDto: KbSearchDto,
    @CurrentOrganizationId() organizationId?: string
  ) {
    return this.knowledgeBaseService.search(searchDto, organizationId);
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Get search suggestions and popular searches' })
  async getSearchSuggestions(
    @Query('q') query: string,
    @CurrentOrganizationId() organizationId?: string
  ) {
    return this.knowledgeBaseService.getSearchSuggestions(
      query,
      organizationId
    );
  }

  @Get('search/popular')
  @ApiOperation({ summary: 'Get popular search terms' })
  async getPopularSearches(@CurrentOrganizationId() organizationId?: string) {
    return this.knowledgeBaseService.getPopularSearches(organizationId);
  }

  // Feedback
  @Post('articles/:id/feedback')
  @ApiOperation({ summary: 'Add feedback to an article' })
  async createFeedback(
    @Param('id') articleId: string,
    @Body() createFeedbackDto: CreateKbFeedbackDto,
    @Request() req: Request & { user: User }
  ) {
    return this.knowledgeBaseService.createFeedback(
      articleId,
      createFeedbackDto,
      req.user
    );
  }

  // Analytics
  @Get('analytics')
  @UseGuards(AuthGuard, MultiTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get knowledge base analytics' })
  async getAnalytics(@CurrentOrganizationId() organizationId: string) {
    return this.knowledgeBaseService.getAnalytics(organizationId);
  }
}
