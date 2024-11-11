import { Bet, BetChoice, GameRound } from "./types";

export class Player {
    private balance: number;
    private betHistory: GameRound[] = [];
    
    constructor(public name: string, initialBalance: number) {
        this.balance = initialBalance;
    }

    placeBet(betChoice: BetChoice, amount: number): Bet | null {
        if (this.balance >= amount) {
            this.balance -= amount;
            return { betChoice, amount };
        }
        console.log(`${this.name} doesn't have enough balance to place the bet.`);
        return null;
    }

    updateBalance(amount: number) {
        this.balance += amount;
    }

    getBalance(): number {
        return this.balance;
    }

    async getBet(): Promise<Bet | null> {
        const thinkingTime = Math.random() * 16000; // Случайная задержка от 0 до 16 секунд
        const amount = 10;

        return new Promise<Bet | null>((resolve) => {
            setTimeout(() => {
                // Если у игрока недостаточно баланса, возвращаем null
                // Но вообще нужно предусмотреть возможность выхода игроков из игры
                if (this.balance < amount) {
                    resolve(null);
                    return;
                }

                // Если баланс достаточен, выбираем случайный выбор ставки
                // Естественно нужен еще и выбор ставки игроком
                const betChoice = Math.random() > 0.5 ? BetChoice.HIGHER : BetChoice.LOWER;
                console.log(`Player ${this.name} placed a bet: ${betChoice} ${amount}`);
                resolve(this.placeBet(betChoice, amount));
            }, thinkingTime);
        });
    }

    saveBetHistory(round: GameRound) {
        this.betHistory.push(round);
    }

    getBetHistory() {
        return this.betHistory;
    }
}