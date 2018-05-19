let game;
let vGame;

$(document).ready(function () {
    game = new Game();

    game.initialize();

    vGame = new VGame();

    vGame.load(game);

    vGame.start();
});