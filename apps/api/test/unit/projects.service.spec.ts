import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from '../../src/projects/project.service';
import { MultiTenantPrismaService } from '../../src/common/database/multi-tenant-prisma.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let multiTenantPrisma: any;

  const mockProject = {
    id: '1',
    name: 'Test Project',
    status: 'ACTIVE',
    organizationId: 'org1',
    startAt: new Date(),
    dueAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    multiTenantPrisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: MultiTenantPrismaService,
          useValue: multiTenantPrisma,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of projects', async () => {
      const mockProjects = [mockProject];
      multiTenantPrisma.project.findMany.mockResolvedValue(mockProjects);

      const result = await service.findAll();

      expect(multiTenantPrisma.project.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findOne', () => {
    it('should return a single project by id', async () => {
      multiTenantPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.findOne('1');

      expect(multiTenantPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockProject);
    });
  });
});
