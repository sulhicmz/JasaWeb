import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class User {
  id: string = '';
  email: string = '';
  name: string = '';
  password: string = '';
  profilePicture?: string;
  isActive: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}