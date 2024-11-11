import { Player } from './player';
import { Bet, BetChoice, BetOutcome, GameConfig, GameRound } from './types';

export class Game {
    private config: GameConfig;
    private history: GameRound[] = [];

    private isRoundInProgress = false; 


    // TODO: Хорошо бы использовать класс Timespan для хранения временных интервалов в формате 15s, 1m и т.д.
    // Можно также вынести в конфиг
    private bidTTL = 15000;
    private dropTTL = 1000;
    private payoutTTL = 1000;

    private roundNumber = 0;
    private players: Player[];

    private cards: number[] = [];
    private cardIndex = 0;
    private lastCard: number;
    private currentCard: number;

    constructor(config: GameConfig, players: Player[]) {
        this.config = config;
        this.players = players; 
        // Нужно ли иметь возможность добавлять игроков во время игры? И давать возможность выйти из игра?
        // Если да, тогда конфигурируем немного по-другому
    }

    private async lifeCycle() {
        if (this.isRoundInProgress) return;
        this.isRoundInProgress = true;

        try {
            await this.round();
        } finally {
            this.isRoundInProgress = false;
            this.lifeCycle(); 
            // Запуск следующего раунда после завершения текущего, если нужна бесконечная игра
            // тогда нужно предусмотреть возможность выхода из игры и присоединения новых игроков
        }
    }

    private delay<A, R>(delay: number, fn: (args?: A) => R, args?: A): Promise<R> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(fn(args)), delay);
        });
    }

    private init() {
        const cardCount = 52; // Количество карт в колоде тоже должно конфигурироваться в зависимости от типа колоды (наверное)
        this.cards = Array(this.config.deskCount * cardCount).fill(0).map((_, i) => (i % 13) + 1);
        this.cards.sort(() => Math.random() - 0.5);

        this.cardIndex = 0;
    }

    private drawCard(): number {
        if (this.cardIndex >= this.cards.length) {
            console.log("Game over. Do you want to start a new game?");
            // TODO: Нужна бесконечная игра?
        }

        return this.cards[this.cardIndex++];
    }

    private async getBets(): Promise<{ player: Player; bet: Bet | null }[]> {
        const betPromises = this.players.map(async player => {
            return Promise.race([
                player.getBet().then(bet => ({ player, bet })),  // Ожидаем ставку игрока
                this.delay(this.bidTTL, () => ({ player, bet: null }))  // Устанавливаем тайм-аут на решение
            ]);
        });
    
        return Promise.all(betPromises);
    }

    private determineOutcome(playerChoice: BetChoice): BetOutcome {
        const higher = this.currentCard > this.lastCard && playerChoice === BetChoice.HIGHER;
        const lower = this.currentCard < this.lastCard && playerChoice === BetChoice.LOWER;

        return higher || lower ? BetOutcome.WIN : BetOutcome.LOSS;
    }

    private async payout(player: Player, bet: Bet, outcome: BetOutcome): Promise<void> {
        await this.delay(this.payoutTTL, () => {});
    
        const winnings = outcome === BetOutcome.WIN ? bet.amount * 1.7 : 0;

        const roundResult: GameRound = {
            roundNumber: this.roundNumber,
            previousCard: this.lastCard,
            currentCard: this.currentCard,
            outcome,
            playerBet: bet.betChoice,
            betAmount: bet.amount,
            winnings,
        };
    
        player.saveBetHistory(roundResult);
        this.history.push(roundResult);

        return this.delay(this.payoutTTL, () => player.updateBalance(winnings - bet.amount));
    }

    private async round() {
        this.roundNumber += 1;
        if (!this.lastCard) {
            this.lastCard = this.drawCard();
        }

        console.log(`Round ${this.roundNumber}: Previous card is ${this.lastCard}. Place your bets!`);

        const bets = await this.getBets();
        console.log(`Round ${this.roundNumber}: Bets are placed. Opening the card...`);
        this.currentCard = await this.delay(this.dropTTL, this.drawCard.bind(this));
        console.log(`Round ${this.roundNumber}: Next card is ${this.currentCard}.`);

        const payoutPromises = bets.map(async ({ player, bet }) => {
            if (bet) {
                const outcome = this.determineOutcome(bet.betChoice);
                console.log(`Player ${player.name} bet ${bet.betChoice}. Result: ${outcome}.`);
                await this.payout(player, bet, outcome);
            } else {
                console.log(`Player ${player.name} skipped this round.`);
            }
        });

        await Promise.all(payoutPromises);
        this.lastCard = this.currentCard;
        console.log(`Round ${this.roundNumber} is over.`);
        console.log("--- --- ---")
    }

    start() {
        this.init();

        console.log("Game started. Betting is open.");
        this.lifeCycle();
    }

    getHistory() {
        return this.history;
    }
}