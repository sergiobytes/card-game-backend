import { Injectable } from '@nestjs/common';
import { kickPlayer } from '../../game/engine/players';
import { GameState } from '../../game/types/game-state.types';
import { Room } from '../entities/room.entity';
import { forgetPlayer } from '../room-connections';
import { RoomActionUseCase, RoomActorInput } from './room-action.usecase';

export interface KickPlayerInput extends RoomActorInput {
  targetId: string;
}

@Injectable()
export class KickPlayerUseCase extends RoomActionUseCase<KickPlayerInput> {
  protected apply(state: GameState, input: KickPlayerInput): void {
    kickPlayer(state, input.playerId, input.targetId);
  }

  protected afterApply(room: Room, input: KickPlayerInput): void {
    forgetPlayer(room, input.targetId);
  }
}
