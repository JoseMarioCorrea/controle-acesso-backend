// src/sync/sync.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import {
  CreateSyncTaskDto,
  RequeueSyncTaskDto,
} from './dto/create-sync-task.dto';
import {
  SyncTaskState,
  SyncOperation,
} from './sync-task.entity';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('tasks')
  create(@Body() dto: CreateSyncTaskDto) {
    return this.syncService.createTask(dto);
  }

  @Get('tasks')
  list(
    @Query('state') state?: SyncTaskState,
    @Query('operation') operation?: SyncOperation,
    @Query('limit') limit?: string,
  ) {
    return this.syncService.listTasks({
      state: state as any,
      operation: operation as any,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('tasks/:id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.syncService.getTask(id);
  }

  @Patch('tasks/:id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.syncService.cancelTask(id);
  }

  @Patch('tasks/:id/requeue')
  requeue(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequeueSyncTaskDto,
  ) {
    return this.syncService.requeueTask(id, dto);
  }

  @Post('dispatch')
  dispatch() {
    return this.syncService.dispatchNow();
  }

  @Post('rebuild')
  rebuild() {
    return this.syncService.rebuildQueue();
  }
}