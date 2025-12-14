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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
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
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new knowledge base category' })
  async createCategory(@Body() createCategoryDto: CreateKbCategoryDto) {
    return this.knowledgeBaseService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all knowledge base categories' })
  async getCategories() {
    return this.knowledgeBaseService.getCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get a specific knowledge base category' })
  async getCategory(@Param('id') id: string) {
    return this.knowledgeBaseService.getCategory(id);
  }

  @Patch('categories/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a knowledge base category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateKbCategoryDto
  ) {
    return this.knowledgeBaseService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a knowledge base category' })
  async deleteCategory(@Param('id') id: string) {
    return this.knowledgeBaseService.deleteCategory(id);
  }

  // Tags
  @Post('tags')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new knowledge base tag' })
  async createTag(@Body() createTagDto: CreateKbTagDto) {
    return this.knowledgeBaseService.createTag(createTagDto);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all knowledge base tags' })
  async getTags() {
    return this.knowledgeBaseService.getTags();
  }

  // Articles
  @Post('articles')
  @UseGuards(AuthGuard)
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
    @Query('featured') featured?: string
  ) {
    const featuredBool =
      featured === 'true' ? true : featured === 'false' ? false : undefined;
    return this.knowledgeBaseService.getArticles(
      status,
      categoryId,
      featuredBool
    );
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Get a specific knowledge base article' })
  async getArticle(@Param('id') id: string) {
    return this.knowledgeBaseService.getArticle(id);
  }

  @Get('articles/slug/:slug')
  @ApiOperation({ summary: 'Get a knowledge base article by slug' })
  async getArticleBySlug(@Param('slug') slug: string) {
    return this.knowledgeBaseService.getArticleBySlug(slug);
  }

  @Patch('articles/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a knowledge base article' })
  async updateArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateKbArticleDto
  ) {
    return this.knowledgeBaseService.updateArticle(id, updateArticleDto);
  }

  @Delete('articles/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a knowledge base article' })
  async deleteArticle(@Param('id') id: string) {
    return this.knowledgeBaseService.deleteArticle(id);
  }

  // Search
  @Post('search')
  @ApiOperation({ summary: 'Search knowledge base articles' })
  async search(
    @Body() searchDto: KbSearchDto,
    @Request() req: Request & { user: User }
  ) {
    return this.knowledgeBaseService.search(searchDto, req.user);
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
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get knowledge base analytics' })
  async getAnalytics() {
    return this.knowledgeBaseService.getAnalytics();
  }
}
