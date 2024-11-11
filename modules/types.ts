export enum BetChoice {
    HIGHER = 'higher',
    LOWER = 'lower'
}

export enum BetOutcome {
    WIN = 'win',
    LOSS = 'loss'
}

export type GameRound = {
    roundNumber: number;
    previousCard: number;
    currentCard: number;
    outcome: BetOutcome | null;
    playerBet: BetChoice | null;
    betAmount: number;
    winnings: number;
};

export type Bet = {
    betChoice: BetChoice;
    amount: number;
};

export type GameConfig = {
    deskCount: number; // Количество колод
}