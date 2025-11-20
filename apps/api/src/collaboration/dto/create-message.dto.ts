import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsEnum(['chat', 'comment', 'notification'])
  type: 'chat' | 'comment' | 'notification';

  @IsOptional()
  @IsString()
  recipientId?: string;
}
