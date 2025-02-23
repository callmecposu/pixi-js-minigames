const app = new PIXI.Application();

let incorrectAttempts = 0;
let score = 0;
let missedWords = 0;

let wordMoveSpeed = 0.5;

let WORD_POOL;

let words = [];

(async () => {
    // init PIXI
    await app.init({ background: 0xffffff, resizeTo: window });

    document.body.appendChild(app.canvas);

    // load the word pool
    let dataURL =
        window.location.origin +
        "/" +
        window.location.pathname.split("/").splice(-2, 1).join("/") +
        "/data/words.json";
    const res = await fetch(dataURL);
    WORD_POOL = (await res.json()).words;

    // create statistics display
    const { scoreDisplay, missedWordsDisplay, incorrectAttemptsDisplay } =
        createStatisticsDisplay();
    scoreDisplay.x = 20;
    scoreDisplay.y = 20;
    missedWordsDisplay.x = 20;
    missedWordsDisplay.y = scoreDisplay.y + scoreDisplay.height + 10;
    incorrectAttemptsDisplay.x = 20;
    incorrectAttemptsDisplay.y =
        missedWordsDisplay.y + missedWordsDisplay.height + 10;
    app.stage.addChild(incorrectAttemptsDisplay);
    app.stage.addChild(scoreDisplay);
    app.stage.addChild(missedWordsDisplay);

    const statisticsTicker = () => {
        scoreDisplay.text = `Score: ${score}`;
        missedWordsDisplay.text = `Missed Words: ${missedWords}`;
        incorrectAttemptsDisplay.text = `Incorrect Attempts: ${incorrectAttempts}`;
    };

    app.ticker.add(statisticsTicker);

    // create a typer
    const typer = createTyper();
    typer.x = app.screen.width / 2 - typer.width / 2;
    typer.y = app.screen.height - 100;
    app.stage.addChild(typer);

    // add keydown event listener
    document.addEventListener("keydown", (e) => {
        console.log(e.key);
        if (e.key == "Backspace") {
            typer.text = typer.text.slice(0, -1);
            typer.x = app.screen.width / 2 - typer.width / 2;
        } else if (e.key == "Enter" || e.key == " ") {
            handleWordEnter({ entered: typer.text });
            typer.text = "";
            typer.x = app.screen.width / 2 - typer.width / 2;
        } else if (e.key.length != 1) {
            return;
        } else {
            typer.text += e.key;
            typer.x = app.screen.width / 2 - typer.width / 2;
        }
    });

    // spawn words
    spawnWords();
})();

const createTyper = () => {
    const typer = new PIXI.Text({ style: { fill: 0x0073ff } });
    return typer;
};

const createStatisticsDisplay = () => {
    const scoreDisplay = new PIXI.Text({
        text: `Score: ${score}`,
        style: { fill: 0x009118, fontSize: 16 },
    });
    const missedWordsDisplay = new PIXI.Text({
        text: `Missed Words: ${missedWords}`,
        style: { fill: 0xff3300, fontSize: 16 },
    });
    const incorrectAttemptsDisplay = new PIXI.Text({
        text: `Incorrect Attempts: ${incorrectAttempts}`,
        style: { fill: 0xd4a408, fontSize: 16 },
    });
    return { scoreDisplay, missedWordsDisplay, incorrectAttemptsDisplay };
};

const spawnWords = async () => {
    while (true) {
        const randomWordIndex = Math.floor(Math.random() * WORD_POOL.length);
        const randomWord = WORD_POOL[randomWordIndex];
        const word = new PIXI.Text({ text: randomWord });
        word.y = -20;
        word.x = Math.floor(
            Math.random() * (app.screen.width - word.width - 20)
        );
        app.stage.addChild(word);

        const wordTicker = () => {
            word.y += wordMoveSpeed;
            if (word.y >= app.screen.height - 150) {
                missedWords += 1;
                wordMoveSpeed -= 0.05;
                words.splice(
                    words.findIndex((x) => x.word.text == randomWord),
                    1
                );
                app.stage.removeChild(word);
                app.ticker.remove(wordTicker);
            }
        };

        app.ticker.add(wordTicker);
        words.push({ word, wordTicker });
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
};

const handleWordEnter = ({ entered }) => {
    words.forEach((w) => console.log(w.word.text));
    const found = words.find((x) => x.word.text == entered);
    if (found) {
        score += 1;
        wordMoveSpeed += 0.05;
        app.ticker.remove(found.wordTicker);
        words.splice(
            words.findIndex((x) => x.word.text == found.word.text),
            1
        );
        const removeWordTicker = () => {
            found.word.x -= 3;
            if (found.word.x <= 0) {
                app.stage.removeChild(found.word);
                app.ticker.remove(removeWordTicker);
            }
        };
        app.ticker.add(removeWordTicker);
    } else {
        incorrectAttempts += 1;
    }
};
