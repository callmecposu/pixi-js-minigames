let ssData = {
    frames: {
        idle1: {
            frame: { x: 0, y: 7 * 4 * 64, w: 64, h: 64 },
            sourceSize: { w: 64, h: 64 },
            spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
        },
        idle2: {
            frame: { x: 64, y: 7 * 4 * 64, w: 64, h: 64 },
            sourceSize: { w: 64, h: 64 },
            spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
        },
    },
    meta: {
        image: "spritesheet_demo.png",
        size: { w: 832, h: 3456 },
        scale: 1,
    },
    animations: {
        idle: ["idle1", "idle2"],
        walkEast: [],
        walkWest: [],
        walkSouth: [],
        walkNorth: [],
    },
};

const generateFrameData = (x, y) => {
    return {
        frame: { x, y, w: 64, h: 64 },
        sourceSize: { w: 64, h: 64 },
        spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
    };
};

// add walkEast Animations
for (let i = 1; i < 9; i++) {
    ssData.frames[`walkEast${i}`] = generateFrameData(64 * i, 11 * 64);
    ssData.animations.walkEast.push(`walkEast${i}`);
}

// add walkWest Animations
for (let i = 1; i < 9; i++) {
    ssData.frames[`walkWest${i}`] = generateFrameData(64 * i, 9 * 64);
    ssData.animations.walkWest.push(`walkWest${i}`);
}

// add walkNorth Animations
for (let i = 1; i < 9; i++) {
    ssData.frames[`walkNorth${i}`] = generateFrameData(64 * i, 8 * 64);
    ssData.animations.walkNorth.push(`walkNorth${i}`);
}

// add walkSouth Animations
for (let i = 1; i < 9; i++) {
    ssData.frames[`walkSouth${i}`] = generateFrameData(64 * i, 10 * 64);
    ssData.animations.walkSouth.push(`walkSouth${i}`);
}

// let levelLayout = []

// generate level layout

// // generate level area
// for (let i = 0; i < 100; i ++){
//     levelLayout.push([])
//     for (let y = 0; y < 100; y++){
//         if (i == 0 || i == 99){
//             levelLayout[i].push(1)
//         } else {
//             if (y == 0 || y == 99){
//                 levelLayout[i].push(1)
//             } else {
//                 levelLayout[i].push(0)
//             }
//         }
//     }
// }

// generate level layout using Randomized Walk algorithm
const levelWidth = 50;
const levelHeight = 50;

let levelLayout = Array.from({ length: levelHeight }, () =>
    Array(levelWidth).fill(1)
);

// carve floor in the center so that player can certainly be placed there
const centerX = Math.floor(levelWidth / 2) - 1
const centerY = Math.floor(levelHeight / 2) - 1
for (let i = centerY - 1; i <= centerY + 1; i++ ){
    for (let y = centerX - 1; y <= centerX +1; y++){
        levelLayout[y][i] = 0
    }
}

const carveCorridors = (steps = levelHeight*levelWidth / 2) => {
    let x = Math.floor(levelWidth / 2)
    let y = Math.floor(levelHeight / 2)

    for (let i = 0; i < steps; i++){
        // carve floor
        levelLayout[y][x] = 0 

        // randomly choose a direction
        const directions = [
            {dx: 1, dy: 0},
            {dx: -1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 0, dy: -1},
        ]
        const {dx, dy} = directions[Math.floor(Math.random() * directions.length)]

        // move ensuring we stay within bounds
        x = Math.max(1, Math.min(levelWidth - 2, x + dx));
        y = Math.max(1, Math.min(levelHeight - 2, y + dy));
    }
}

carveCorridors()
