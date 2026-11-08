import { Injectable, Logger } from '@nestjs/common';
import { onlineIds } from '../room-connections';
import { ROOM_IDLE_MS } from '../rooms.constants';
import { RoomsRepository } from '../rooms.repository';

/** Borra salas sin nadie conectado y sin actividad reciente. */
@Injectable()
export class RemoveIdleRoomsUseCase {
  private readonly logger = new Logger(RemoveIdleRoomsUseCase.name);

  constructor(private readonly roomsRepository: RoomsRepository) {}

  execute(now = Date.now()): number {
    let removed = 0;
    for (const room of this.roomsRepository.all()) {
      const idle = now - room.lastActivity > ROOM_IDLE_MS;
      if (idle && !onlineIds(room).length) {
        this.roomsRepository.delete(room.code);
        removed++;
      }
    }
    if (removed) this.logger.log(`Se borraron ${removed} salas inactivas`);
    return removed;
  }
}
