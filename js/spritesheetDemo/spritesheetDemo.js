const app = new PIXI.Application();

let inputBuffer = [];

const movementKeys = ["w", "a", "s", "d"];

const characterSpeed = 1;

let characterCameraBounds = { tl: { x: 0, y: 0 }, br: { x: 0, y: 0 } };

const characterSpriteXPadding = 16;
const characterSpriteYPadding = 8;

(async () => {
    // init PIXI
    await app.init({ background: 0xffffff, resizeTo: window });

    document.body.appendChild(app.canvas);

    const baseURL =
        window.location.origin +
        "/" +
        window.location.pathname.split("/").splice(-2, 1).join("/");

    // load the spritesheet asset
    PIXI.Assets.add({
        alias: "spritesheet_demo.png",
        src: baseURL + "/images/spritesheet_demo.png",
    });

    const ssTexture = await PIXI.Assets.load("spritesheet_demo.png");

    // create spritesheet
    const ss = new PIXI.Spritesheet(ssTexture, ssData);

    // generate textures asynchronously
    await ss.parse();

    // create mappings from movement keys to animations
    const movementKeysAnimMap = {
        w: ss.animations.walkNorth,
        a: ss.animations.walkWest,
        s: ss.animations.walkSouth,
        d: ss.animations.walkEast,
    };

    // load level assets
    const levelAssetsAliases = ["wood_tile", "stone_tile"];

    PIXI.Assets.add([
        {
            alias: "wood_tile",
            src:
                baseURL + "/images/seamless-64px-rpg-tiles-1.1.0/wood tile.png",
        },
        {
            alias: "stone_tile",
            src:
                baseURL +
                "/images/seamless-64px-rpg-tiles-1.1.0/stone tile.png",
        },
    ]);

    const levelAssets = await Promise.all(
        levelAssetsAliases.map((x) => PIXI.Assets.load(x))
    );

    // build out the level
    const levelContainer = new PIXI.Container();
    for (let i = 0; i < levelLayout.length; i++) {
        for (let y = 0; y < levelLayout[i].length; y++) {
            const tile = new PIXI.Sprite(levelAssets[levelLayout[i][y]]);
            tile.x = y * 64;
            tile.y = i * 64;
            levelContainer.addChild(tile);
        }
    }
    levelContainer.x = app.screen.width / 2 - levelContainer.width / 2;
    levelContainer.y = app.screen.height / 2 - levelContainer.height / 2;
    app.stage.addChild(levelContainer);

    // create character animated sprite
    const anim = new PIXI.AnimatedSprite(ss.animations.idle);

    anim.animationSpeed = 0.05;

    anim.play();

    anim.x = app.screen.width / 2 - anim.width / 2;
    anim.y = app.screen.height / 2 - anim.height / 2;
    app.stage.addChild(anim);

    // create character camera bounds
    characterCameraBounds.tl.x = app.screen.width / 4;
    characterCameraBounds.tl.y = app.screen.height / 4;
    characterCameraBounds.br.x = (app.screen.width * 3) / 4;
    characterCameraBounds.br.y = (app.screen.height * 3) / 4;

    // add event listeners
    document.addEventListener("keydown", (e) => {
        // push the new key to inputBuffer
        if (!inputBuffer.includes(e.key)) {
            inputBuffer.push(e.key);
            console.log(inputBuffer);
            // swap animations
            if (e.key == "w") {
                anim.textures = ss.animations.walkNorth;
                anim.animationSpeed = 0.15;
                anim.gotoAndPlay(0);
            }
            if (e.key == "a") {
                anim.textures = ss.animations.walkWest;
                anim.animationSpeed = 0.15;
                anim.gotoAndPlay(0);
            }
            if (e.key == "s") {
                anim.textures = ss.animations.walkSouth;
                anim.animationSpeed = 0.15;
                anim.gotoAndPlay(0);
            }
            if (e.key == "d") {
                anim.textures = ss.animations.walkEast;
                anim.animationSpeed = 0.15;
                anim.gotoAndPlay(0);
            }
        }
    });

    document.addEventListener("keyup", (e) => {
        // remove the key from inputBuffer
        if (inputBuffer.includes(e.key)) {
            inputBuffer.splice(
                inputBuffer.findIndex((x) => x == e.key),
                1
            );
            console.log(inputBuffer);
            // if there are movement keys left in the buffer,
            // swap animations to the last movementKey in the buffer
            if (movementKeys.some((x) => inputBuffer.includes(x))) {
                const lastMovementKey = inputBuffer
                    .slice()
                    .reverse()
                    .find((x) => movementKeys.includes(x));
                anim.textures = movementKeysAnimMap[`${lastMovementKey}`];
                anim.animationSpeed = 0.15;
                anim.gotoAndPlay(0);
            } else {
                // swap to idle animation
                anim.textures = ss.animations.idle;
                anim.animationSpeed = 0.05;
                anim.gotoAndPlay(0);
            }
        }
    });

    // add ticker to update character's position
    app.ticker.add(() => {
        // get new coordinates after move
        const { newX, newY } = getCoordinatesAfterMove({
            curX: anim.x,
            curY: anim.y,
        });
        // if can go there, update the coordinates
        if (
            canGoTo(
                getLevelLayoutCoordinates({ x: newX, y: newY, levelContainer })
            )
        ) {
            moveCharacter({
                toX: newX,
                toY: newY,
                character: anim,
                levelContainer,
            });
        } else {
            // if can't go there and both coordinates are updated,
            // see if we can move one coordinate only
            const canMoveInXAxis = canGoTo(
                getLevelLayoutCoordinates({
                    x: newX,
                    y: anim.y,
                    levelContainer,
                })
            );
            const canMoveInYAxis = canGoTo(
                getLevelLayoutCoordinates({
                    x: anim.x,
                    y: newY,
                    levelContainer,
                })
            );
            if (canMoveInXAxis) {
                moveCharacter({
                    toX: newX,
                    toY: anim.y,
                    character: anim,
                    levelContainer,
                });
            }
            if (canMoveInYAxis) {
                moveCharacter({
                    toX: anim.x,
                    toY: newY,
                    character: anim,
                    levelContainer,
                });
            }
        }
    });
})();

const getLevelLayoutCoordinates = ({ x, y, levelContainer }) => {
    // get coordinates relative to the level container
    const relX = x - levelContainer.x;
    const relY = y - levelContainer.y;

    // return the sprite corner coordinates in level layout system
    return [
        // top left corner
        {
            levelLayoutX: Math.floor((relX + characterSpriteXPadding) / 64),
            levelLayoutY: Math.floor((relY + characterSpriteYPadding) / 64),
        },
        // top right corner
        {
            levelLayoutX: Math.floor(
                (relX + 64 - characterSpriteXPadding) / 64
            ),
            levelLayoutY: Math.floor((relY + characterSpriteYPadding) / 64),
        },
        // bottom left corner
        {
            levelLayoutX: Math.floor((relX + characterSpriteXPadding) / 64),
            levelLayoutY: Math.floor(
                (relY + 64 - characterSpriteYPadding) / 64
            ),
        },
        // bottom right corner
        {
            levelLayoutX: Math.floor(
                (relX + 64 - characterSpriteXPadding) / 64
            ),
            levelLayoutY: Math.floor(
                (relY + 64 - characterSpriteYPadding) / 64
            ),
        },
    ];
};

const canGoTo = (spriteCorners) => {
    return spriteCorners.every(
        (x) => levelLayout[x.levelLayoutY][x.levelLayoutX] != 1
    );
};

const getCoordinatesAfterMove = ({ curX, curY }) => {
    let newX = curX;
    let newY = curY;
    if (inputBuffer.includes("w")) {
        newY -= characterSpeed;
    }
    if (inputBuffer.includes("a")) {
        newX -= characterSpeed;
    }
    if (inputBuffer.includes("s")) {
        newY += characterSpeed;
    }
    if (inputBuffer.includes("d")) {
        newX += characterSpeed;
    }
    return { newX, newY };
};

const isWithinBounds = ({ x, y, bounds }) => {
    return (
        x >= bounds.tl.x &&
        x <= bounds.br.x &&
        y >= bounds.tl.y &&
        y <= bounds.br.y
    );
};

const moveCharacter = ({ toX, toY, character, levelContainer }) => {
    if (
        isWithinBounds({
            x: toX,
            y: toY,
            bounds: characterCameraBounds,
        })
    ) {
        character.x = toX;
        character.y = toY;
    } else {
        // else, move the level container
        levelContainer.x -= toX - character.x;
        levelContainer.y -= toY - character.y;
    }
};
