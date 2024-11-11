import { Game } from './modules/game';
import { Player } from './modules/player';

const players = [
    new Player('A', 100),
    new Player('B', 100),
    new Player('C', 100)
];

const game = new Game({ deskCount: 6 }, players);
game.start();