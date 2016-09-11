var game = new Phaser.Game(800, 600, Phaser.AUTO, 'AsterBreak', {
    preload: preload
    , create: create
    , update: update
    , render: render
});

function preload() {

    game.load.image('space', 'assets/images/space_bg.png');
    game.load.image('bullet', 'assets/images/laserBlue08.png');
    game.load.image('ship', 'assets/images/playerShip2_red.png');
    game.load.image('brownBig1', 'assets/images/meteorBrown_big1.png');
    game.load.image('brownBig2', 'assets/images/meteorBrown_big2.png');
    game.load.image('brownBig3', 'assets/images/meteorBrown_big3.png');
    game.load.image('brownMed1', 'assets/images/meteorBrown_med1.png');
    game.load.image('brownMed2', 'assets/images/meteorBrown_med2.png');
    game.load.image('brownSml1', 'assets/images/meteorBrown_small1.png');
    game.load.image('brownSml2', 'assets/images/meteorBrown_small2.png');
    game.load.image('greyBig1', 'assets/images/meteorGrey_big1.png');
    game.load.image('greyBig2', 'assets/images/meteorGrey_big2.png');
    game.load.image('greyBig3', 'assets/images/meteorGrey_big3.png');
    game.load.image('greyMed1', 'assets/images/meteorGrey_med1.png');
    game.load.image('greyMed2', 'assets/images/meteorGrey_med2.png');
    game.load.image('greySml1', 'assets/images/meteorGrey_small1.png');
    game.load.image('greySml2', 'assets/images/meteorGrey_small2.png');
    
    game.load.image('outerBar', 'assets/images/bar_outer.png');
    game.load.image('weaponBar', 'assets/images/bar_weapon.png');
    
    game.load.audio('death', 'assets/audio/death.wav');

}

var sprite;
var cursors;

var bullet;
var bullets;
var bulletTime = 0;
var bulletKill = false;

var gameOver = false;

function create() {

    //  CANVAS SETTINGS
    game.renderer.clearBeforeRender = false;
    game.renderer.roundPixels = true;

    //  INITIALIZE PHYSICS
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  BACKGROUND
    game.add.sprite(0, 0, 'space');

    //  BULLETS
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    bullets.createMultiple(10, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);
    bullets.setAll('body.bounce.x', 1.0);
    bullets.setAll('body.bounce.y', 1.0);

    //  SHIP
    sprite = game.add.sprite(300, 300, 'ship');
    sprite.anchor.set(0.5);
    sprite.scale.setTo(0.35);

    game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.setSize(80, 80);
    sprite.body.drag.set(150);
    sprite.body.maxVelocity.set(260);
    sprite.body.bounce.x = 0.4;
    sprite.body.bounce.y = 0.4;

    // ASTEROIDS
    asteroids = game.add.group();
    asteroids.enableBody = true;

    for (var i = 0; i < 22; i++) {
        var asteroidGenerator = game.rnd.integerInRange(0, 2);
        var asteroidType = '';

        // Random select asteroid type to spawn
        if (asteroidGenerator == 0) {
            asteroidType = 'brownBig1';
        } else if (asteroidGenerator == 1) {
            asteroidType = 'brownBig2';
        } else {
            asteroidType = 'brownBig3';
        }

        // Position asteroids
        if (i < 7) {
            var asteroid = asteroids.create(i * 121 + 37, 37, asteroidType);
            asteroid.body.velocity.x = 20;
        } else if (i > 6 && i < 14) {
            var asteroid = asteroids.create((i - 7) * 121 + 37, 563, asteroidType);
            asteroid.body.velocity.x = -20;
        } else if (i > 13 && i < 18) {
            var asteroid = asteroids.create(37, (i - 13) * 105 + 37, asteroidType);
            asteroid.body.velocity.y = -20;
        } else {
            var asteroid = asteroids.create(763, (i - 17) * 105 + 37, asteroidType);
            asteroid.body.velocity.y = 20;
        }

        asteroid.scale.setTo(0.6);
        asteroid.body.immovable = true;
        asteroid.body.setSize(80, 80);
        asteroid.anchor.set(0.5);
        asteroid.angle += Math.random() * 360;
        asteroid.rotDir = (Math.round(Math.random()) * 2 - 1) * 0.15;
        asteroid.hitPoints = 3;
    }
    
    // BARS
    weaponBar = game.add.sprite(10, 10, 'weaponBar');
    outerBar = game.add.sprite(10, 10, 'outerBar');
    
    weaponBar.scale.x = 0;

    //  INPUT
    cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
    
    // AUDIO
    death = game.add.audio('death');

}

function update() {
    // SHIP CONTROLS
    if (cursors.up.isDown) {
        game.physics.arcade.accelerationFromRotation(sprite.rotation, 200, sprite.body.acceleration);
    } else {
        sprite.body.acceleration.set(0);
    }

    if (cursors.left.isDown) {
        sprite.body.angularVelocity = -350;
    } else if (cursors.right.isDown) {
        sprite.body.angularVelocity = 350;
    } else {
        sprite.body.angularVelocity = 0;
    }
    
    // BULLETS
    fireBullet();
    
    bullets.forEachExists(function (bullet) {
        bullet.angle -= 20;
    });

    // ASTEROID DIRECTION CHANGE
    rotateAsteroids();

    // COLLISION DETECTION
    game.physics.arcade.collide(sprite, bullets, killPlayer, null, this);
    game.physics.arcade.collide(sprite, asteroids);
    game.physics.arcade.collide(bullets, asteroids, damageAsteroid, null, this);

    // SCREENWRAP
    screenWrap(sprite);
    bullets.forEachExists(screenWrap, this);
    
    // END LEVEL
    if (gameOver) {
        endLevel();
    }
}

function fireBullet() {

    if (game.time.now > bulletTime && !gameOver) {
        bullet = bullets.getFirstExists(false);

        if (bullet) {
            bullet.reset(sprite.body.x + 20, sprite.body.y + 20);
            bullet.rotation = sprite.rotation;
            bullet.scale.setTo(0.4);
            game.physics.arcade.velocityFromRotation(sprite.rotation, 150, bullet.body.velocity);
            bulletTime = game.time.now + 3000;

        }
    }

}

function rotateAsteroids() {
    asteroids.forEach(function (asteroid) {

        // Top Left Corner
        if (asteroid.position.x < 37.5 && asteroid.position.x > 36.5) {
            if (asteroid.position.y < 37.5 && asteroid.position.y > 36.5) {
                asteroid.body.velocity.x = 20;
                asteroid.body.velocity.y = 0;
            }
        }
        // Top Right Corner
        if (asteroid.position.x < 763.5 && asteroid.position.x > 762.5) {
            if (asteroid.position.y < 37.5 && asteroid.position.y > 36.5) {
                asteroid.body.velocity.x = 0;
                asteroid.body.velocity.y = 20;
            }
        }
        // Bottom Right Corner
        if (asteroid.position.x < 763.5 && asteroid.position.x > 762.5) {
            if (asteroid.position.y < 563.5 && asteroid.position.y > 562.5) {
                asteroid.body.velocity.x = -20;
                asteroid.body.velocity.y = 0;
            }
        }
        // Bottom Left Corner
        if (asteroid.position.x < 37.5 && asteroid.position.x > 36.5) {
            if (asteroid.position.y < 563.5 && asteroid.position.y > 562.5) {
                asteroid.body.velocity.x = 0;
                asteroid.body.velocity.y = -20;
            }
        }
        // Rotation
        asteroid.angle -= asteroid.rotDir;
    });
}

function screenWrap(sprite) {

    if (sprite.x < 0) {
        sprite.x = game.width;
    } else if (sprite.x > game.width) {
        sprite.x = 0;
    }
    if (sprite.y < 0) {
        sprite.y = game.height;
    } else if (sprite.y > game.height) {
        sprite.y = 0;
    }

}

function killPlayer(sprite, bullet) {
    if (true) {
        gameOver = true;
        sprite.kill();
        bullet.kill();
        death.play();
    }
}

function damageAsteroid(bullet, asteroid) {    
    var asteroidGenerator = game.rnd.integerInRange(0, 1);
    
    asteroid.hitPoints -= 1;
    
    if (asteroid.hitPoints == 2) {
        if (asteroidGenerator == 0) {
            asteroid.loadTexture('brownMed1');
        } else {
            asteroid.loadTexture('brownMed2');
        }
        
        asteroid.scale.setTo(1);
        asteroid.body.setSize(40, 40);
    } else if (asteroid.hitPoints == 1) {
        if (asteroidGenerator == 0) {
            asteroid.loadTexture('brownSml1');
        } else {
            asteroid.loadTexture('brownSml2');
        }
        
        asteroid.scale.setTo(1);
        asteroid.body.setSize(26, 26);
    } else {
        asteroid.kill();
    }
}

function endLevel() {
    
}

function render() {}
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        