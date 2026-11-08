import { Injectable } from '@nestjs/common';
import { isEmpty, leaveGame } from '../../game/engine/players';
import { GameState } from '../../game/types/game-state.types';
import { Room } from '../entities/room.entity';
import { forgetPlayer } from '../room-connections';
import { RoomActionUseCase, RoomActorInput } from './room-action.usecase';

@Injectable()
export class LeaveRoomUseCase extends RoomActionUseCase {
  protected apply(state: GameState, { playerId }: RoomActorInput): void {
    leaveGame(state, playerId);
  }

  protected afterApply(room: Room, { playerId }: RoomActorInput): void {
    forgetPlayer(room, playerId);
    if (isEmpty(room.state)) this.roomsRepository.delete(room.code);
  }
}
