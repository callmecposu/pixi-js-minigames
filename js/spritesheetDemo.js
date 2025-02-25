const app = new PIXI.Application();

(async () => {
    // init PIXI
    await app.init({ background: 0xffffff, resizeTo: window });

    document.body.appendChild(app.canvas);

    PIXI.Assets.add({
        alias: "spritesheet_demo.png",
        src: "../images/spritesheet_demo.png",
    });

    const ssTexture = await PIXI.Assets.load("spritesheet_demo.png");

    // create spritesheet
    const ss = new PIXI.Spritesheet(
        ssTexture,
        ssData
    );

    // generate textures asynchronously
    await ss.parse();


    // create an animated sprite
    const anim = new PIXI.AnimatedSprite(ss.animations.idle);

    anim.animationSpeed = 0.05;

    anim.play();

    // add event listeners
    document.addEventListener('keydown', (e) => {
        if (e.key == 'd' && anim.textures != ss.animations.walkEast){
            anim.textures = ss.animations.walkEast
            anim.animationSpeed = 0.15
            anim.gotoAndPlay(0)
        }
        if (e.key == 'a' && anim.textures != ss.animations.walkWest){
            anim.textures = ss.animations.walkWest
            anim.animationSpeed = 0.15
            anim.gotoAndPlay(0)
        }
        if (e.key == 's' && anim.textures != ss.animations.walkSouth){
            anim.textures = ss.animations.walkSouth
            anim.animationSpeed = 0.15
            anim.gotoAndPlay(0)
        }
        if (e.key == 'w' && anim.textures != ss.animations.walkNorth){
            anim.textures = ss.animations.walkNorth
            anim.animationSpeed = 0.15
            anim.gotoAndPlay(0)
        }
    })

    document.addEventListener('keyup', (e) => {
        anim.textures = ss.animations.idle
        anim.animationSpeed = 0.05
        anim.gotoAndPlay(0)
    })

    app.stage.addChild(anim);
})();
