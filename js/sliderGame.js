const app = new PIXI.Application();

(async () => {
    // init pixi
    await app.init({ resizeTo: window, background: 0xffffff });

    document.body.appendChild(app.canvas);

    // create a parent container
    const parent = new PIXI.Container();

    // create text to display the score
    let score = 0;
    const scoreText = new PIXI.Text({ text: `Score: ${score}` });

    scoreText.x = 400 / 2 - scoreText.width / 2;
    scoreText.y = -100;

    parent.addChild(scoreText);

    // create bounds graphics
    const bounds = new PIXI.Graphics();

    bounds.rect(0, 0, 400, 5);
    bounds.rect(0, -10, 5, 25);
    bounds.rect(400, -10, 5, 25);
    bounds.fill(0x000000);

    parent.addChild(bounds);

    // create area graphics
    const area = new PIXI.Graphics();

    let areaWidth = 150;

    area.rect(0, 0, areaWidth, 25);
    area.fill(0xfc034a);

    area.x = 100;
    area.y = -10;

    parent.addChild(area);

    // create slider graphics
    const slider = new PIXI.Graphics();

    slider.rect(0, 0, 5, 25);
    slider.fill(0x0394fc);

    slider.x = 200;
    slider.y = -10;

    parent.addChild(slider);

    // add parent container to the stage
    app.stage.addChild(parent);

    // set parent's position
    parent.x = app.screen.width / 2 - 400 / 2;
    parent.y = app.screen.height / 2;

    let sliderDirection = 1;
    let sliderSpeed = 1;

    app.ticker.add((time) => {
        const delta = time.deltaTime;
        if (!isMovingArea) {
            slider.x += sliderDirection * sliderSpeed;
            if (slider.x >= 400) {
                sliderDirection = -1;
            }
            if (slider.x <= 0) {
                sliderDirection = 1;
            }
        }
    });

    let isMovingArea = false;
    let areaNewX;
    let areaXStep;
    let areaNewWidth;
    let areaWidthStep;
    let moveAreaStep = 0;

    document.querySelector("canvas").addEventListener("click", () => {
        if (!isMovingArea) {
            if (slider.x >= area.x && slider.x <= area.x + area.width) {
                score += 1;
                sliderSpeed += 1;
                scoreText.text = `Score: ${score}`;
                areaNewWidth = area.width - 25;
                areaWidthStep = Math.floor((areaNewWidth - area.width) / 60);
                areaXStep = 0;
                while (areaXStep == 0) {
                    areaNewX = Math.floor(Math.random() * (400 - areaNewWidth));
                    areaXStep = Math.floor((areaNewX - area.x) / 60);
                }
                moveAreaStep = 1;
                isMovingArea = true;
            }
        }
    });

    app.ticker.add((time) => {
        const delta = time.deltaTime;
        if (isMovingArea) {
            // console.log({moveAreaStep, x: area.x, areaXStep, areaNewX})
            if (moveAreaStep == 1) {
                // move to newX
                if (
                    Math.abs(area.x + areaXStep - areaNewX) >=
                    Math.abs(areaXStep)
                ) {
                    area.x += areaXStep;
                } else {
                    moveAreaStep = 2;
                }
            }
            if (moveAreaStep == 2) {
                // change to newWidth
                if (area.width + areaWidthStep >= areaNewWidth) {
                    area.width += areaWidthStep;
                } else {
                    moveAreaStep = 0;
                    isMovingArea = false;
                }
            }
        }
    });
})();
