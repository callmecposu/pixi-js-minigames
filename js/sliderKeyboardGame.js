const app = new PIXI.Application();

const BOUNDS_WIDTH = 400;
let sliderSpeed = 1;
let sliderDirection = 1;
let feedbackMessagesNum = 0;
let updatingArea = false;

(async () => {
    // init PIXI
    await app.init({ background: 0xffffff, resizeTo: window });

    document.body.appendChild(app.canvas);

    // create a parent container
    const parent = new PIXI.Container();

    // create the bounds
    const bounds = createBounds({ width: BOUNDS_WIDTH });
    parent.addChild(bounds);

    // create the area container (for area and keyText)
    const areaContainer = new PIXI.Container();

    // create the area
    const area = createArea({ width: 150 });
    areaContainer.addChild(area);

    // create the keyText
    const keyText = createKeyText();
    keyText.x = areaContainer.width / 2 - keyText.width / 2;
    keyText.y = -50;
    areaContainer.addChild(keyText);

    // mount area container to the parent
    areaContainer.position = generateAreaContainerPos({
        boundsWidth: BOUNDS_WIDTH,
        areaWidth: 150,
    });
    parent.addChild(areaContainer);

    // create the slider
    const slider = createSlider();
    slider.x = BOUNDS_WIDTH / 2;
    slider.y = -10;
    parent.addChild(slider);

    // set parent container position
    parent.x = app.screen.width / 2 - parent.width / 2;
    parent.y = app.screen.height / 2 - parent.height / 2;

    // add the parent container to the stage
    app.stage.addChild(parent);

    // add the keydown event listener
    document.addEventListener("keydown", (e) => {
        if (updatingArea){
            return
        }
        if (sliderIsWithinArea({slider, areaContainer, area})){
            if (e.key.toUpperCase() == keyText.text){
                showFeedbackMessage("Nice!", 0x00ff00);
                updateAreaContainer({areaContainer, area, keyText})
                sliderSpeed += 1
            } else {
                showFeedbackMessage("Wrong key...", 0xff0000);
            }
        } else {
            showFeedbackMessage("Bad Timing...", 0xff0000)
        }
    });

    // add ticker logic for the slider
    app.ticker.add(() => {
        sliderTick(slider);
    });
})();

const createBounds = ({ width }) => {
    const bounds = new PIXI.Graphics();
    bounds.rect(0, 0, width, 5);
    bounds.rect(0, -10, 5, 25);
    bounds.rect(width, -10, 5, 25);
    bounds.fill(0x000000);
    return bounds;
};

const createArea = ({ width }) => {
    const area = new PIXI.Graphics();
    area.rect(0, 0, width, 25);
    area.fill(0xfc034a);
    return area;
};

const generateAreaContainerPos = ({ boundsWidth, areaWidth }) => {
    const x = Math.floor(Math.random() * (boundsWidth - areaWidth));
    const y = -10;
    return { x, y };
};

const createKeyText = () => {
    const keyText = new PIXI.Text();
    const key = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    keyText.text = key;
    return keyText;
};

const createSlider = () => {
    const slider = new PIXI.Graphics();
    slider.rect(0, 0, 5, 25);
    slider.fill(0x0394fc);
    return slider;
};

const sliderTick = (slider) => {
    slider.x += sliderDirection * sliderSpeed;
    if (slider.x >= BOUNDS_WIDTH) {
        sliderDirection = -1;
    }
    if (slider.x <= 0) {
        sliderDirection = 1;
    }
};

const sliderIsWithinArea = ({slider, areaContainer, area}) => {
    const areaX = areaContainer.x + area.x
    if (slider.x >= areaX && slider.x <= areaX + area.width){
        return true
    } else {
        return false
    }
}

const showFeedbackMessage = (text, color) => {
    const message = new PIXI.Text({ text, style: { fill: color } });
    message.x = app.screen.width / 2 - message.width / 2;
    message.y = app.screen.height / 2 + 100 + feedbackMessagesNum * message.height + 20;
    app.stage.addChild(message);
    feedbackMessagesNum += 1

    let elapsed = 0

    const feedbackMessageTick = (time) => {
        const delta = time.deltaTime / 60
        elapsed += delta
        if (elapsed > 0.5){
            message.y += 25
            if (message.y >= app.screen.height){
                app.stage.removeChild(message)
                app.ticker.remove(feedbackMessageTick)
                feedbackMessagesNum -= 1
            }
        }
    }

    app.ticker.add(feedbackMessageTick)
};

const updateAreaContainer = ({areaContainer, area, keyText}) => {
    const newWidth = area.width - 25
    const widthStep = Math.floor(newWidth - area.width) / 60
    let newX
    let xStep = 0
    while (xStep == 0) {
        newX = Math.floor(Math.random() * (BOUNDS_WIDTH - newWidth))
        xStep = Math.floor((newX - areaContainer.x) / 60)
    }
    const newKey = String.fromCharCode(65 + Math.floor(Math.random() * 26))
    
    let updateAreaStep = 1
    updatingArea = true

    const updateAreaTicker = () => {
        if (updateAreaStep == 1){
            // move to new x
            if (Math.abs(areaContainer.x + xStep - newX) >= Math.abs(xStep)){
                areaContainer.x += xStep
            } else {
                updateAreaStep = 2
            }
        }
        if (updateAreaStep == 2){
            // update width
            if (area.width + widthStep >= newWidth){
                area.width += widthStep
                keyText.x = areaContainer.width / 2 - keyText.width / 2
            } else {
                updateAreaStep = 3
            }
        }
        if (updateAreaStep == 3){
            // fade out and update keyText
            if (keyText.alpha > 0){
                keyText.alpha -= 0.05
            } else {
                keyText.text = newKey
                updateAreaStep = 4
            }
        }
        if (updateAreaStep == 4){
            // fade in updated keyText
            if (keyText.alpha < 1){
                keyText.alpha += 0.05
            } else {
                updatingArea = false
                app.ticker.remove(updateAreaTicker)
            }
        }
    }

    app.ticker.add(updateAreaTicker)
}
