import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../common/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    profilePicture: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      profilePicture: 'profile.jpg',
    };

    it('should create a new user with hashed password', async () => {
      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: hashedPassword,
          profilePicture: createUserDto.profilePicture,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should create user without profile picture if not provided', async () => {
      const createUserDtoWithoutProfile = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await service.create(createUserDtoWithoutProfile);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDtoWithoutProfile.email,
          name: createUserDtoWithoutProfile.name,
          password: hashedPassword,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent-id');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
      email: 'updated@example.com',
      profilePicture: 'updated-profile.jpg',
      password: 'newpassword123',
    };

    it('should update user with all fields', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      const hashedPassword = 'new-hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', updateUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          name: updateUserDto.name,
          email: updateUserDto.email,
          profilePicture: updateUserDto.profilePicture,
          password: hashedPassword,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should update user with partial fields', async () => {
      const partialUpdate: UpdateUserDto = {
        name: 'Updated Name Only',
      };

      const updatedUser = { ...mockUser, name: 'Updated Name Only' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', partialUpdate);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          name: partialUpdate.name,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should update user with password only', async () => {
      const passwordUpdate: UpdateUserDto = {
        password: 'newpassword123',
      };

      const hashedPassword = 'new-hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      const updatedUser = { ...mockUser, password: hashedPassword };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', passwordUpdate);

      expect(bcrypt.hash).toHaveBeenCalledWith(passwordUpdate.password, 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password: hashedPassword,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should handle profilePicture being set to undefined', async () => {
      const updateWithUndefinedProfile: UpdateUserDto = {
        profilePicture: undefined,
      };

      const updatedUser = { ...mockUser, profilePicture: undefined };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('user-1', updateWithUndefinedProfile);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          profilePicture: undefined,
        },
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove('user-1');

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
