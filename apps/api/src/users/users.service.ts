import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordService, PasswordHashVersion } from '../auth/password.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    // Hash the password before saving
    const { hash: hashedPassword, version: hashVersion } =
      await this.passwordService.hashPassword(createUserDto.password);

    return await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        passwordHashVersion: hashVersion,
        ...(createUserDto.profilePicture && {
          profilePicture: createUserDto.profilePicture,
        }),
      },
    });
  }

  async findAll(): Promise<any[]> {
    return await this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<any> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<any> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const updateData: any = {};

    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.name) updateData.name = updateUserDto.name;
    if (updateUserDto.profilePicture !== undefined)
      updateData.profilePicture = updateUserDto.profilePicture;

    // Hash password if provided
    if (updateUserDto.password) {
      const { hash: hashedPassword, version: hashVersion } =
        await this.passwordService.hashPassword(updateUserDto.password);
      updateData.password = hashedPassword;
      updateData.passwordHashVersion = hashVersion;
    }

    return await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async updatePasswordHash(
    id: string,
    hash: string,
    version: PasswordHashVersion
  ): Promise<any> {
    return await this.prisma.user.update({
      where: { id },
      data: {
        password: hash,
        passwordHashVersion: version,
      },
    });
  }

  async remove(id: string): Promise<any> {
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}
