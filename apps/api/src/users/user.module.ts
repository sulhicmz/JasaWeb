import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
=======
import { PrismaModule } from '../common/database/prisma.module';
>>>>>>> origin/main
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
<<<<<<< HEAD
  imports: [TypeOrmModule.forFeature([User])],
=======
  imports: [PrismaModule],
>>>>>>> origin/main
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserModule {}