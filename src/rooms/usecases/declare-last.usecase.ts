import { Injectable } from '@nestjs/common';
import { declareLast } from '../../game/engine/last-card';
import { GameState } from '../../game/types/game-state.types';
import { RoomActionUseCase, RoomActorInput } from './room-action.usecase';

@Injectable()
export class DeclareLastUseCase extends RoomActionUseCase {
  protected apply(state: GameState, { playerId }: RoomActorInput): void {
    declareLast(state, playerId);
  }
}
