import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiCapability, AiProvider, AiSuggestionLog } from 'src/entities/ai.entity';
import { InventoryEntry } from 'src/entities/inventory-entry.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { UtilService } from 'src/utility/util/util.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiProvider,
      AiCapability,
      AiSuggestionLog,
      InventoryEntry,
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, UtilService],
  exports: [AiService],
})
export class AiModule {}
