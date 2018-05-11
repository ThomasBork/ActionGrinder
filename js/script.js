function addObjects(mainObject, addObject) {
    for(var index in addObject) {
        mainObject[index] += addObject[index];
    }
}

class Player {
    constructor(options) {
        let defaults = {
            level: 1,
            experience: 0,
            gold: 0,
            attributes: {
                damage: 10,
                movementSpeed: 10,
                armor: 0,
                health: 100,
                maxHealth: 100,
                regeneration: 5
            }
        };

        let settings = extend(defaults, options);
        mergeObjects(this, settings);
    }
    gainExperience(amount) {
        this.experience += amount;
        while(Player.getExperienceNeeded(this.level) <= this.experience) {
            this.experience -= Player.getExperienceNeeded(this.level);
            this.levelUp();
        }
        game.objects.playerExperienceBar.setValue(this.experience / Player.getExperienceNeeded(this.level));
    }
    levelUp() {
        this.level++;
        addObjects(this.attributes, {
            maxHealth: 10,
            regeneration: 0.5
        });
        game.objects.playerLevel.text = "Level: " + this.level;
    }
    // Returns the amount of experience needed to advance from level to level + 1
    static getExperienceNeeded(level) {
        return 70 + 25 * (level - 1) + 30 * Math.pow(1.1, level - 1);
    }
}

class ActionGrinderGame extends STGame {
    constructor () {
        super({
            htmlContainer: document.getElementById("game-container"),
            width: 1000 * document.body.clientWidth / document.body.clientHeight,
            height: 1000
        });

        this.player = new Player();

        this.objects = {
            levels: [],
            areas: [],
            playerLevel: null,
            playerExperienceBar: null,
            playerGold: null,
            windows: {
                playerStats: null,
                inventory: null,
                stash: null
            },
            menu: {
                btnPlayerStats: null,
                btnInventory: null,
                btnStash: null
            }
        };
        
        // Levels
        let levelCount = 20;
        for(var i = 0; i<levelCount; i++) {
            let level = new Level({
                x: 25 + i * 60,
                y: this.height - 75
            });

            this.objects.levels.push(level);
            this.addChild(level);

            if(i > 0) {
                this.objects.levels[i-1].gatedLevels.push(level);
            }
        }
        this.objects.levels[0].unlock();

        // HUD
        this.objects.playerLevel = new STText({
            x: 0,
            y: 0,
            text: "Level: 1"
        });
        this.addChild(this.objects.playerLevel);

        this.objects.playerExperienceBar = new STProgressBar({
            x: 0,
            y: 16,
            width: 50,
            height: 5,
            value: 0
        });
        this.addChild(this.objects.playerExperienceBar);
        
        this.objects.playerGold = new STText({
            x: 0,
            y: 28,
            text: "Gold: 0"
        });
        this.addChild(this.objects.playerGold);

        // Windows
        this.objects.windows.playerStats = this.createSideWindow("Player", true);
        this.addChild(this.objects.windows.playerStats);

        this.objects.windows.stash = this.createSideWindow("Stash", false);
        this.addChild(this.objects.windows.stash);

        this.objects.windows.inventory = this.createSideWindow("Inventory", true);
        this.addChild(this.objects.windows.inventory);

        // Menu buttons
        this.objects.menu.btnPlayerStats = this.createMenuWindowButton(this.objects.windows.playerStats, "img/btnPlayerStats.png", 10);
        this.addChild(this.objects.menu.btnPlayerStats);

        this.objects.menu.btnStash = this.createMenuWindowButton(this.objects.windows.stash, "img/btnStash.png", 50);
        this.addChild(this.objects.menu.btnStash);

        this.objects.menu.btnInventory = this.createMenuWindowButton(this.objects.windows.inventory, "img/btnInventory.png", 90);
        this.addChild(this.objects.menu.btnInventory);
    }
    createSideWindow(title, isLeft) {
        let options = {
            title: title,
            top: 80,
            height: 800, 
            width: 600, 
            color: "#BBBBBB",
            hasCloseButton: true,
            isVisible: false,
            isLeft: isLeft
        };
        if(isLeft) {
            options.left = 80;
        } else {
            options.right = 80;
        }
        return new PopupWindow(options);
    }
    createMenuWindowButton (window, imagePath, right) {
        let windowButton = new WindowButton({
            right: right,
            top: 10,
            width: 32,
            height: 32,
            color: "#444444",
            window: window,
            image: new STImage({
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                isSizeRelativeToParent: true,
                path: imagePath
            })
        });
        window.windowButton = windowButton;
        return windowButton;
    }
    update(dTime) {
        super.update(dTime);
    }
    removeAreas() {
        if(game.objects.areas.length > 0) {
            game.objects.areas[0].parentLevel.reset();
        }    
        this.objects.areas.forEach((area) => {area.remove();});
        this.objects.areas = [];
    }
    onKeyUp(keyCode) {
        switch(keyCode) {
            case 27: // Escape
                this.closeWindows();
                break;
            case 32: // Space
                this.closeWindows();
                break;
            case 67:
                this.objects.menu.btnPlayerStats.toggle();
                break;
            case 73:
                this.objects.menu.btnInventory.toggle();
                break;
            case 83:
                this.objects.menu.btnStash.toggle();
                break;
        }
    }
    closeWindows() {
        for(var index in this.objects.windows) {
            this.objects.windows[index].close();
        }
    }
}

class RectWithBar extends STRect {
    constructor (options) {
        super(options);
        let defaults = {
            bar: null,
            barHeight: 10,
            barValue: 1 
        };
        
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        this.bar = new STProgressBar({
            left: 0,
            top: -this.barHeight,
            isPositionRelativeToParent: true,
            width: this.width,
            height: this.barHeight,
            value: this.barValue
        });
        this.addChild(this.bar);
    }
}

class ClickableRectWithBar extends RectWithBar {
    constructor(options) {
        super(
            mergeObjects(options, {
                barHeight: 10,
                borderSize: 3
            })
        );

        let defaults = {
            isLocked: true,
            isComplete: false,
            isInProgress: false
        };

        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        if(this.isLocked) {
            this.lock();
        } else {
            this.unlock();
        }

        this.bar.isVisible = false;
    }
    lock() {
        this.isLocked = true;
        this.color = COLORS.LOCKED;
        this.borderColor = COLORS.LOCKED_BORDER; 
    }
    unlock() {
        if(this.isLocked) {
            this.isLocked = false;
            this.color = COLORS.ENABLED;
            this.borderColor = COLORS.ENABLED_BORDER;
        }
    }
    start() {
        this.bar.isVisible = true;
        this.isInProgress = true;
        this.color = COLORS.IN_PROGRESS;
        this.borderColor = COLORS.IN_PROGRESS_BORDER; 
    }
    stop() {
        if(this.isInProgress) {
            this.isInProgress = false;
            this.color = COLORS.ENABLED;
            this.borderColor = COLORS.ENABLED_BORDER; 
        }
    }
    reset() {
        this.bar.isVisible = false;
        this.isInProgress = false;
        this.isComplete = false;
        this.bar.value = 1;
        this.color = COLORS.ENABLED;
        this.borderColor = COLORS.ENABLED_BORDER; 
    }
}

class Level extends ClickableRectWithBar {
    constructor (options) {
        super(
            mergeObjects(options, {
                width: 50,
                height: 50
            })
        );
        let defaults = {
            areas: [],
            gatedLevels: []
        };
        
        let settings = extend(defaults, options);
        mergeObjects(this, settings);
    }
    start() {
        game.findObjects((obj) => {return obj instanceof Level;})
            .forEach((obj) => {obj.stop();});

        game.removeAreas();

        let areaCount = 3;
        let marginX = 10;
        let areaWidth = 100;
        // Substracts the "extra" margin
        let totalWidth = areaCount * (areaWidth + marginX) - marginX; 
        let startX = (600 - totalWidth) / 2;
        for(var i = 0; i<areaCount; i++) {
            let area = new LevelArea({
                x: startX + (areaWidth + marginX) * i,
                y: 200,
                parentLevel: this
            });

            this.areas.push(area);
            game.objects.areas.push(area);
            game.addChild(area);
        }
        this.areas[0].unlock();

        super.start();
    }
    complete () {
        this.gatedLevels.forEach((level) => {level.unlock();});
    }
    reset () {
        this.areas = [];
        super.reset();
    }
    onAreaComplete (area) {
        let complete = true;
        for(var index in this.areas) {
            let area = this.areas[index];
            if(!area.isComplete) {
                complete = false;
                area.unlock();
                break;
            }
        }
        if(complete) {
            this.complete();
        }
    }
    onClick(x, y) {
        if(!this.isComplete && !this.isLocked) {
            this.start();
        }
    }
    onUpdate(dTime) {
        if(this.isComplete || this.isInProgress) {
            let completed = 0;
            let toComplete = this.areas.length;
            this.areas.forEach((area) => {completed += area.bar.value;});
            this.bar.setValue(completed / toComplete);
        }
    }
}

class LevelArea extends ClickableRectWithBar {
    constructor(options) {
        super(
            mergeObjects(options, {
                width: 100,
                height: 100
            })
        );
        let defaults = {
            parentLevel: null
        };
        
        let settings = extend(defaults, options);
        mergeObjects(this, settings);
    }
    complete() {
        this.isInProgress = false;
        this.isComplete = true;
        game.player.gainExperience(15);
        this.parentLevel.onAreaComplete(this);
    }
    onClick(x, y) {
        if(!this.isComplete && !this.isLocked) {
            this.start();
        }
    }
    onUpdate(dTime) {
        if(this.isInProgress) {
            this.bar.setValue(this.bar.value - dTime * 0.25);
            if(this.bar.value <= 0) {
                this.complete();
            }
        }
    }
}

class WindowButton extends STRect {
    constructor(options) {
        super(options);
        let defaults = {
            window: null,
            image: null,
            isPressed: false,
            pressedBorderColor: "#99FF99",
            pressedBorderSize: 3,
            notPressedBorderColor: null,
            notPressedBorderSize: null
        };
        
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        // Add image
        if(this.image !== null) {
            this.addChild(this.image);
        }

        // Save border properties
        this.notPressedBorderColor = this.borderColor;
        this.notPressedBorderSize = this.borderSize;
    }
    onClick (x, y) {
        this.toggle();
    }
    toggle() {
        this.isPressed = !this.isPressed;
        if(this.isPressed) {
            this.showWindow();
        } else {
            this.closeWindow();
        }
    }
    showWindow() {
        // Close all windows in the same side
        for(var index in game.objects.windows) {
            let window = game.objects.windows[index];
            if(window.isLeft == this.window.isLeft) {
                window.windowButton.closeWindow();
            }
        }
        // Show the window
        this.isPressed = true;
        this.borderColor = this.pressedBorderColor;
        this.borderSize = this.pressedBorderSize;
        this.window.show();
    }
    closeWindow() {
        this.isPressed = false;
        this.borderColor = this.notPressedBorderColor;
        this.borderSize = this.notPressedBorderSize;
        this.window.hide();
    }
}

class PopupWindow extends STWindow {
    constructor(options) {
        super(options);
        let defaults = {
            title: null,
            windowButton: null,
            isLeft: false
        }

        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        if(this.title !== null) {
            this.addChild(new STText({
                left: 5,
                top: 5,
                text: this.title,
                fontSize: 18,
                color: "black"
            }));
        }
    }
    onClose() {
        if(this.windowButton !== null) {
            this.windowButton.closeWindow();
        }
    }
}

const COLORS = {
    LOCKED: "#AA5555",
    LOCKED_BORDER: "#555555",
    ENABLED: "#669966",
    ENABLED_BORDER: "#555555",
    IN_PROGRESS: "#669966",
    IN_PROGRESS_BORDER: "#AAAAAA"
};
var game;

var gameState = {

};

$(document).ready(function () {
    game = new ActionGrinderGame();
    
    game.start();
});