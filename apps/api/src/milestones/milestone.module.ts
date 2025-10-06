import { Module } from '@nestjs/common';
import { MilestoneController } from './milestone.controller';

@Module({
  controllers: [MilestoneController],
})
export class MilestoneModule {}