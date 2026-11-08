import { Injectable } from '@nestjs/common';
import { GameRuleError } from '../game/engine/game-rule.error';
import { GameState } from '../game/types/game-state.types';
import { Room } from './entities/room.entity';

@Injectable()
export class RoomsRepository {
  private readonly rooms = new Map<string, Room>();

  create(code: string, state: GameState, now = Date.now()): Room {
    const room: Room = {
      code,
      state,
      tokens: new Map(),
      connections: new Map(),
      lastActivity: now,
    };
    this.rooms.set(code, room);
    return room;
  }

  exists(code: string): boolean {
    return this.rooms.has(code);
  }

  findByCode(code: string): Room {
    const room = this.rooms.get(code);
    if (!room) throw new GameRuleError('No existe una sala con ese código.');
    return room;
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  all(): Room[] {
    return [...this.rooms.values()];
  }

  count(): number {
    return this.rooms.size;
  }
}
