import { Injectable } from '@nestjs/common';
import { addPlayer } from '../../game/engine/players';
import { onlineIds } from '../room-connections';
import { RoomsRepository } from '../rooms.repository';
import { JoinedRoom, newId, newToken } from './create-room.usecase';

@Injectable()
export class JoinRoomUseCase {
  constructor(private readonly roomsRepository: RoomsRepository) {}

  execute(input: { code: string; name: string }, now = Date.now()): JoinedRoom {
    const room = this.roomsRepository.findByCode(input.code);
    const draft = structuredClone(room.state);
    const playerId = addPlayer(draft, newId(), input.name, onlineIds(room));
    room.state = draft;
    room.lastActivity = now;

    const token = newToken();
    room.tokens.set(token, playerId);
    return { room, playerId, token };
  }
}
