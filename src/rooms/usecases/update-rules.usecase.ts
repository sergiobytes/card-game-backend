import { Injectable } from '@nestjs/common';
import { updateRules } from '../../game/engine/players';
import { GameState, Rules } from '../../game/types/game-state.types';
import { RoomActionUseCase, RoomActorInput } from './room-action.usecase';

export interface UpdateRulesInput extends RoomActorInput {
  rules: Partial<Rules>;
}

@Injectable()
export class UpdateRulesUseCase extends RoomActionUseCase<UpdateRulesInput> {
  protected apply(state: GameState, input: UpdateRulesInput): void {
    updateRules(state, input.playerId, input.rules);
  }
}
