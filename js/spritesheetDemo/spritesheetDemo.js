const app = new PIXI.Application();

let inputBuffer = [];

const movementKeys = ["w", "a", "s", "d"];

const characterSpeed = 1;

let characterCameraBounds = { tl: { x: 0, y: 0 }, br: { x: 0, y: 0 } };

const characterSpriteXPadding = 16;
const characterSpriteYPadding = 8;

let interactiveObjects = [];

let isDialogActive = false;

let chestsOpened = 0;

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

    // create character animated sprite
    const anim = new PIXI.AnimatedSprite(ss.animations.idle);

    anim.animationSpeed = 0.05;

    anim.play();

    // load level assets
    const levelAssetsAliases = [
        "wood_tile",
        "stone_tile",
        "chest_tile",
        "exit_tile",
    ];

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
        {
            alias: "chest_tile",
            src: baseURL + "/images/icons_20211222/png/64x64/case_metal_02.png",
        },
        {
            alias: "exit_tile",
            src:
                baseURL +
                "/images/icons_20211222/png/64x64/ornament_violet.png",
        },
    ]);

    const levelAssets = await Promise.all(
        levelAssetsAliases.map((x) => PIXI.Assets.load(x))
    );

    // build out the level
    const levelContainer = new PIXI.Container();
    for (let i = 0; i < levelLayout.length; i++) {
        for (let y = 0; y < levelLayout[i].length; y++) {
            // fill the first layer (floor & walls)
            if (levelLayout[i][y] < 2) {
                const tile = new PIXI.Sprite(levelAssets[levelLayout[i][y]]);
                tile.x = y * 64;
                tile.y = i * 64;
                levelContainer.addChild(tile);
            } else {
                // if encountered special object,
                // store its position to later add it on top of a floor tile
                interactiveObjects.push({
                    levelLayoutPos: {
                        levelLayoutX: y,
                        levelLayoutY: i,
                    },
                    tileID: levelLayout[i][y],
                    dialogCooldown: 0,
                });
                // place a floor tile in its place during this stage
                const tile = new PIXI.Sprite(levelAssets[0]);
                tile.x = y * 64;
                tile.y = i * 64;
                levelContainer.addChild(tile);
            }
        }
    }
    // add special objects' sprites on top of floor tiles
    interactiveObjects.forEach((obj) => {
        const intObjSprite = new PIXI.Sprite(levelAssets[obj.tileID]);
        intObjSprite.x = obj.levelLayoutPos.levelLayoutX * 64;
        intObjSprite.y = obj.levelLayoutPos.levelLayoutY * 64;
        obj.sprite = intObjSprite;
        levelContainer.addChild(intObjSprite);
        // add respective showDialog function to the object
        if (obj.tileID == 2) {
            obj.showDialog = () => {
                showChestDialog(obj, anim, levelContainer);
            };
        }
    });

    // create UI elements

    // create chestsStatistics
    const chestStatisticsContainer = new PIXI.Container();
    const chestStatisticsIcon = new PIXI.Sprite(levelAssets[2]);
    chestStatisticsIcon.scale = 0.5;
    const chestStatisticsText = new PIXI.Text({
        text: "0 / 5",
        style: {
            fill: 0xffffff,
            fontFamily: "Courier New",
            fontSize: 18,
            stroke: "black",
            strokeThickness: 4,
        },
    });
    chestStatisticsContainer.addChild(chestStatisticsIcon);
    chestStatisticsContainer.addChild(chestStatisticsText);
    chestStatisticsText.x = chestStatisticsIcon.width + 20;
    chestStatisticsText.y =
        chestStatisticsIcon.height / 2 - chestStatisticsText.height / 2;

    // mount level container
    levelContainer.x = app.screen.width / 2 - levelContainer.width / 2;
    levelContainer.y = app.screen.height / 2 - levelContainer.height / 2;
    app.stage.addChild(levelContainer);

    // mount character sprite
    anim.x = app.screen.width / 2 - anim.width / 2;
    anim.y = app.screen.height / 2 - anim.height / 2;
    app.stage.addChild(anim);

    // mount UI elements
    chestStatisticsContainer.x = 50;
    chestStatisticsContainer.y = 50;
    app.stage.addChild(chestStatisticsContainer);

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

    // add ticker to display / hide interactive object dialog
    app.ticker.add(() => {
        // get current levelLayout coordinates
        const curLevelLayoutPos = getLevelLayoutCoordinates({
            x: anim.x,
            y: anim.y,
            levelContainer,
        });
        // check if player is in vicinity of an interactive object
        const intObj = interactiveObjects.find((obj) =>
            [curLevelLayoutPos[0], curLevelLayoutPos[3]].every((coord) =>
                isInVicinity({ obj1: coord, obj2: obj.levelLayoutPos })
            )
        );
        if (intObj && !isDialogActive && intObj.dialogCooldown == 0) {
            intObj.showDialog();
        }
    });

    // add ticker to reduce intercativeObjects' dialog cooldowns
    app.ticker.add(() => {
        interactiveObjects.forEach((obj) => {
            if (obj.dialogCooldown > 0) {
                obj.dialogCooldown -= 1;
            }
        });
    });

    // add ticker to update UI elements
    const updateUIStatisticsTicker = () => {
        // update chestStatistics
        chestStatisticsText.text = `${chestsOpened} / ${chestsNum}`;
        // if all objectives are completed, add an exit tile to the level
        if (chestsOpened == chestsNum) {
            // get curent player coordinates
            const curCharacterLevelLayoutPos = getLevelLayoutCoordinates({
                x: anim.x,
                y: anim.y,
                levelContainer,
            });
            // generate coordinates for an exit tile
            let exitX, exitY;
            do {
                exitX = Math.floor(Math.random() * (levelWidth - 3));
                exitY = Math.floor(Math.random() * (levelHeight - 3));
            } while (
                levelLayout[exitY][exitX] != 0 ||
                curCharacterLevelLayoutPos.some(
                    (x) => x.levelLayoutX == exitX && x.levelLayoutY == exitY
                )
            );
            // create exit tile sprite
            const exitTileSprite = new PIXI.Sprite(levelAssets[3]);
            exitTileSprite.x = exitX * 64;
            exitTileSprite.y = exitY * 64;
            levelContainer.addChild(exitTileSprite);
            // add exit tile to the level
            levelLayout[exitY][exitX] = 3;
            let exitIntObj = {
                levelLayoutPos: {
                    levelLayoutX: exitX,
                    levelLayoutY: exitY,
                },
                tileID: 3,
                dialogCooldown: 0,
                sprite: exitTileSprite,
                showDialog: () => {
                    showExitDialog(exitIntObj, anim, levelContainer);
                },
            };
            interactiveObjects.push(exitIntObj);
            app.ticker.remove(updateUIStatisticsTicker);
        }
    };
    app.ticker.add(updateUIStatisticsTicker);
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
        (x) => levelLayout[x.levelLayoutY][x.levelLayoutX] == 0
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

const isInVicinity = ({ obj1, obj2 }) => {
    const xAxisDiff = Math.abs(obj1.levelLayoutX - obj2.levelLayoutX);
    const yAxisDiff = Math.abs(obj1.levelLayoutY - obj2.levelLayoutY);
    return xAxisDiff + yAxisDiff == 1;
};

const showChestDialog = (chest, character, levelContainer) => {
    isDialogActive = true;

    const { dialogContainer, dialogTicker } = createDialog({
        text: "You've found a chest!",
        prompt: "Open it?",
        yesOptionHander: () => {
            chestsOpened += 1;
            levelContainer.removeChild(chest.sprite);
            levelLayout[chest.levelLayoutPos.levelLayoutY][
                chest.levelLayoutPos.levelLayoutX
            ] = 0;
            interactiveObjects.splice(
                interactiveObjects.findIndex((x) => x == chest),
                1
            );
        },
        noOptionHandler: () => {},
        intObj: chest,
        character,
        levelContainer,
    });

    app.stage.addChild(dialogContainer);
    app.ticker.add(dialogTicker);
};

const showExitDialog = (exit, character, levelContainer) => {
    isDialogActive = true;

    const { dialogContainer, dialogTicker } = createDialog({
        text: "You've found the exit...",
        prompt: "Are you ready to leave?",
        yesOptionHander: () => {
            location.reload();
        },
        noOptionHandler: () => {},
        intObj: exit,
        character,
        levelContainer,
    });

    app.stage.addChild(dialogContainer);
    app.ticker.add(dialogTicker);
};

const createDialog = ({
    text,
    prompt,
    yesOptionHander,
    noOptionHandler,
    intObj,
    character,
    levelContainer,
}) => {
    // create dialog

    // create dialog container
    const dialogContainer = new PIXI.Container();
    // create dialog text
    const dialogText = new PIXI.Text({
        text: text + "\n\n\n" + prompt,
        style: {
            fill: 0xffffff,
            fontSize: 24,
            fontFamily: "Courier New",
            align: "center",
        },
    });
    // create dialog bg
    const dialogBg = new PIXI.Graphics();
    dialogBg.rect(0, 0, dialogText.width + 50, 250);
    dialogBg.fill(0x000000);
    // create dialog options
    let dialogOptionChosen = false;
    const dialogOptionYes = new PIXI.Text({
        text: "Yes",
        style: {
            fill: 0x4cf041,
            fontSize: 24,
            fontFamily: "Courier New",
        },
    });
    dialogOptionYes.interactive = true;
    dialogOptionYes.cursor = "pointer";
    dialogOptionYes.on("pointerdown", () => {
        dialogOptionChosen = true;
        yesOptionHander();
    });
    const dialogOptionNo = new PIXI.Text({
        text: "No",
        style: {
            fill: 0xf04848,
            fontSize: 24,
            fontFamily: "Courier New",
        },
    });
    dialogOptionNo.interactive = true;
    dialogOptionNo.cursor = "pointer";
    dialogOptionNo.on("pointerdown", () => {
        dialogOptionChosen = true;
        intObj.dialogCooldown = 300;
        noOptionHandler();
    });
    // mount dialod components to dialog container
    dialogContainer.addChild(dialogBg);
    dialogContainer.addChild(dialogText);
    dialogText.x = dialogContainer.width / 2 - dialogText.width / 2;
    dialogText.y = 50;
    dialogContainer.addChild(dialogOptionYes);
    dialogOptionYes.x = dialogContainer.width / 4 - dialogOptionYes.width / 2;
    dialogOptionYes.y = 200;
    dialogContainer.addChild(dialogOptionNo);
    dialogOptionNo.x =
        (dialogContainer.width / 4) * 3 - dialogOptionNo.width / 2;
    dialogOptionNo.y = 200;
    dialogContainer.x = app.screen.width / 2 - dialogContainer.width / 2;
    dialogContainer.y = app.screen.height;

    // create dialogTicker
    const dialogTicker = () => {
        if (!dialogOptionChosen) {
            // get character's levelLayout coordinates
            const curCharacterLevelLayoutPos = getLevelLayoutCoordinates({
                x: character.x,
                y: character.y,
                levelContainer,
            });
            // see if character is in vicinity of the interactive object
            const characterInVicinity = [
                curCharacterLevelLayoutPos[0],
                curCharacterLevelLayoutPos[3],
            ].every((coord) =>
                isInVicinity({ obj1: coord, obj2: intObj.levelLayoutPos })
            );
            // if character is in vicinity, animate dialog intro
            if (characterInVicinity) {
                if (
                    dialogContainer.y >
                    app.screen.height / 2 - dialogContainer.height / 2
                ) {
                    dialogContainer.y -= 10;
                }
            } else {
                // if character is not in vicinity, animate dialog outro
                if (dialogContainer.y < app.screen.height) {
                    dialogContainer.y += 10;
                } else {
                    // when dialog is out of stage bounds, remove the dialog and its ticker
                    isDialogActive = false;
                    app.stage.removeChild(dialogContainer);
                    app.ticker.remove(dialogTicker);
                }
            }
        } else {
            if (dialogContainer.y < app.screen.height) {
                dialogContainer.y += 10;
            } else {
                // when dialog is out of stage bounds, remove the dialog and its ticker
                isDialogActive = false;
                app.stage.removeChild(dialogContainer);
                app.ticker.remove(dialogTicker);
            }
        }
    };

    return { dialogContainer, dialogTicker };
};
