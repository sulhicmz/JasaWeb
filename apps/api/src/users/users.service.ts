import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    // Hash the password before saving
    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS') || 12;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      bcryptRounds
    );

    return await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
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
      const bcryptRounds =
        this.configService.get<number>('BCRYPT_ROUNDS') || 12;
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        bcryptRounds
      );
    }

    return await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<any> {
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}
