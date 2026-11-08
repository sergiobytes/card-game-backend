import { Injectable } from '@nestjs/common';
import { passTurn } from '../../game/engine/turn';
import { GameState } from '../../game/types/game-state.types';
import { RoomActionUseCase, RoomActorInput } from './room-action.usecase';

@Injectable()
export class PassTurnUseCase extends RoomActionUseCase {
  protected apply(state: GameState, { playerId }: RoomActorInput): void {
    passTurn(state, playerId);
  }
}
