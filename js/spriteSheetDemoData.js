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
        walkNorth: []
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
    ssData.frames[`walkWest${i}`] = generateFrameData(64*i, 9*64)
    ssData.animations.walkWest.push(`walkWest${i}`)
}

// add walkNorth Animations
for (let i = 1; i < 9; i++) {
    ssData.frames[`walkNorth${i}`] = generateFrameData(64*i, 8*64)
    ssData.animations.walkNorth.push(`walkNorth${i}`)
}

// add walkSouth Animations
for (let i = 1; i < 9; i++) {
    ssData.frames[`walkSouth${i}`] = generateFrameData(64*i, 10*64)
    ssData.animations.walkSouth.push(`walkSouth${i}`)
}

let levelLayout = []

// generate level layout
for (let i = 0; i < 10; i ++){
    levelLayout.push([])
    for (let y = 0; y < 10; y++){
        if (i == 0 || i == 9){
            levelLayout[i].push(1)
        } else {
            if (y == 0 || y == 9){
                levelLayout[i].push(1)
            } else {
                levelLayout[i].push(0)
            }
        }
    }
}