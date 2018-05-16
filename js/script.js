function addObjects(mainObject, addObject) {
    for(var index in addObject) {
        mainObject[index] += addObject[index];
    }
    return mainObject;
}

function multiplyObjects(mainObject, multiplierObject) {
    for(var index in multiplierObject) {
        mainObject[index] *= multiplierObject[index];
    }
    return mainObject;
}

function prettyNumber(number, digits) {
    if(digits === undefined) {
        digits = 0;
    }
    return number.toFixed(digits);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function randomElement(array) {
    return array[randomInt(0, array.length - 1)];
}

function randomElementWeighted(array) {
    let totalWeight = 0;
    array.forEach((obj) => {
        totalWeight += obj[0];
    });
    let roll = randomFloat(0, totalWeight);
    for(var index in array) {
        let obj = array[index];
        let weight = obj[0];
        let element = obj[1];
        if(roll <= weight) {
            return element;
        } else {
            roll -= weight;
        }
    }
}

function removeWeightedElement(array, element) {
    let foundIndex = -1;
    for(var index in array) {
        if(array[index][1] == element) {
            foundIndex = index;
        }
    }
    if(foundIndex >= 0) {
        array.splice(foundIndex, 1);
    }
}

function removeElement(array, element) {
    let foundIndex = -1;
    for(var index in array) {
        if(array[index] == element) {
            foundIndex = index;
        }
    }
    if(foundIndex >= 0) {
        array.splice(foundIndex, 1);
    }
}

function copyObject(obj) {
    let newObj = {};
    for(var index in obj) {
        newObj[index] = obj[index];
    }
    return newObj;
}

class Attributes {
    constructor (options) {
        let defaults = {
            damage: 0,
            speed: 0,
            armor: 0,
            health: 0,
            regeneration: 0
        }
        let settings = extend(defaults, options);
        mergeObjects(this, settings);
    }
    add(attributes) {
        addObjects(this, attributes);
    }
    multiply(attributes) {
        multiplyObjects(this, attributes);
    }
    static getMultiplierDefaults() {
        let attr = new Attributes();
        for(var index in attr) {
            attr[index] = 1;
        }
        return attr;
    }
    static getMultiplier(amount) {
        let attr = new Attributes();
        for(var index in attr) {
            attr[index] = amount;
        }
        return attr;
    }
}

class Character {
    constructor(options) {
        let defaults = {
            level: 1,
            currentHealth: 0,
            attributes: null,
            baseAttributes: null,
            items: []
        };

        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        if(this.baseAttributes !== null) {
            this.recalculateAttributes();
        }

        this.currentHealth = this.attributes.health;
    }
    recalculateAttributes() {
        this.attributes = new Attributes();

        // Base attributes
        this.attributes.add(this.baseAttributes);

        // Level attributes
        let levelMultiplierAmount = 0.1;
        let levelMultiplier = Attributes.getMultiplier(levelMultiplierAmount);
        let levelAttributes = new Attributes();
        levelAttributes.add(this.baseAttributes);
        levelAttributes.multiply(levelMultiplier);
        for(var i = 1; i<this.level; i++) {
            this.attributes.add(levelAttributes);
        } 

        // Item attributes addition

        // Item attributes multipliers
    }
    dealDamageTo(character, dTime) {
        let damageDealt = this.attributes.damage * dTime;
        let damageTaken = damageDealt * 100 / (100 + character.attributes.armor);
        character.currentHealth -= damageTaken;
    }
    applyRegeneration(dTime) {
        let healing = this.attributes.regeneration * dTime;
        this.currentHealth += healing;
        if(this.currentHealth > this.attributes.health) {
            this.currentHealth = this.attributes.health;
        }
    }
}

class Player extends Character {
    constructor(options) {
        super(
            mergeObjects({}, {
                baseAttributes: new Attributes({
                    damage: 50,
                    speed: 1,
                    health: 100,
                    regeneration: 4
                })
            })
        );
        let defaults = {
            experience: 0,
            gold: 0,
            equippedItems: {
                headArmor: null,
                bodyArmor: null,
                legArmor: null,
                footArmor1: null,
                footArmor2: null,
                weapon1: null,
                weapon2: null
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
        this.recalculateAttributes();
        // If level == 5, unlock first boss
        if(this.level == 5) {
            game.objects.bossLevels[0].unlock();
            game.objects.bossLevels[0].show();
        }
        this.updateUI();
    }
    equipItem(item, slot) {
        this.unequipItem(slot);
        this.equippedItems[slot] = item;
        game.removeItemFromStash(item);
        this.updateUI();
    }
    unequipItem(slot) {
        if(this.equippedItems[slot] !== null) {
            game.addItemToStash(this.equippedItems[slot]);
            this.equippedItems[slot] = null;
        }
    }
    updateUI() {
        game.objects.playerLevel.text = "Level: " + prettyNumber(this.level);
        game.objects.playerHealthBar.setValue(this.currentHealth / this.attributes.health);

        game.objects.playerStatsLabels.level.text = prettyNumber(this.level);
        game.objects.playerStatsLabels.health.text = prettyNumber(this.attributes.health);
        game.objects.playerStatsLabels.damage.text = prettyNumber(this.attributes.damage);
        game.objects.playerStatsLabels.armor.text = prettyNumber(this.attributes.armor);
        game.objects.playerStatsLabels.regeneration.text = prettyNumber(this.attributes.regeneration);

        // Inventory
        for(var slot in this.equippedItems) {
            let playerSlot = this.equippedItems[slot];
            let inventorySlot = game.objects.inventory[slot];
            if(playerSlot === null) {
                inventorySlot.hide();
            } else {
                inventorySlot.image.setPath(playerSlot.imagePath);
                inventorySlot.show();
            }
        }
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
        
        if(1000 * document.body.clientWidth / document.body.clientHeight < 1200) {
            this.width = 1200;
            this.canvas.width = 1200;
            this.canvas.style.height = (1000 / 1200) * 100 + "%";
        }

        this.player = new Player();

        this.stashItems = [];

        this.objects = {
            farmLevels: [],
            bossLevels: [],
            levels: [],
            farmLevelsContainer: null,
            bossLevelsContainer: null,
            areas: [],
            areasContainer: null,
            playerHealthBar: null,
            playerLevel: null,
            playerExperienceBar: null,
            playerGold: null,
            playerStatsLabels: {
                level: null,
                health: null,
                damage: null,
                armor: null,
                regeneration: null
            },
            inventory: {
                headArmor: null,
                bodyArmor: null,
                legArmor: null,
                footArmor1: null,
                footArmor2: null,
                weapon1: null,
                weapon2: null
            },
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
        
        // Farm levels
        let farmLevelsContainer = new STGameObject({
            top: 700,
            left: this.width / 2 - 580,
            width: 550,
            height: 140
        });
        this.objects.farmLevelsContainer = farmLevelsContainer;
        this.addChild(farmLevelsContainer);

        let levelCount = 4;
        for(var i = 0; i<levelCount; i++) {
            let level = new FarmLevel({
                right: i * 140,
                top: 0,
                height: 130,
                width: 130
            });

            if(i > 0) {
                level.hide();
            } else {
                level.unlock();
            }
            this.objects.farmLevels.push(level);
            farmLevelsContainer.addChild(level);
        }

        // Boss levels
        let bossLevelsContainer = new STGameObject({
            top: 645,
            left: this.width / 2 + 30,
            width: this.width / 2 - 10,
            height: 250
        });
        this.objects.bossLevelsContainer = bossLevelsContainer;
        this.addChild(bossLevelsContainer);

        let bossLevelCount = 25;
        for(var i = 0; i<bossLevelCount; i++) {
            let level = new BossLevel({
                left: i*260,
                top: 0,
                height: 250,
                width: 250
            });

            level.hide();

            if(i > 0) {
                this.objects.bossLevels[i - 1].gatedLevel = level;
            }

            this.objects.bossLevels.push(level);
            bossLevelsContainer.addChild(level);
        }

        // Areas
        let areasContainer = new STGameObject({
            top: 300,
            left: this.width / 2,
            height: 150,
            width: 0
        });
        this.objects.areasContainer = areasContainer;
        this.addChild(areasContainer);

        // HUD
        this.objects.playerHealthBar = new STProgressBar({
            left: 200,
            top: 0,
            width: this.width - 400,
            height: 10,
            value: 1
        });
        this.addChild(this.objects.playerHealthBar);

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
        //this.addChild(this.objects.playerGold);

        // Windows
        // Player stats
        let playerStats = this.createSideWindow("Player", true);
        this.objects.windows.playerStats = playerStats;

        let addLabelWithValueReturnValue = (labelText, valueText, top, parent) => {
            let label = new STText({
                left: 20,
                top: top,
                text: labelText,
                color: "black"
            });

            let value = new STText({
                right: 20,
                top: top,
                text: valueText,
                isRightToLeft: true,
                color: "black"
            });

            parent.addChild(label);
            parent.addChild(value);

            return value;
        };

        this.objects.playerStatsLabels.level = addLabelWithValueReturnValue("Level: ", "0", 50, playerStats);
        this.objects.playerStatsLabels.health = addLabelWithValueReturnValue("Health: ", "0", 80, playerStats);
        this.objects.playerStatsLabels.damage = addLabelWithValueReturnValue("Damage: ", "0", 110, playerStats);
        this.objects.playerStatsLabels.armor = addLabelWithValueReturnValue("Armor: ", "0", 140, playerStats);
        this.objects.playerStatsLabels.regeneration = addLabelWithValueReturnValue("Regeneration: ", "0", 170, playerStats);


        this.objects.windows.stash = this.createSideWindow("Stash", false);

        // Inventory
        let inventory = this.createSideWindow("Inventory", true);
        this.objects.windows.inventory = inventory;

        let bodyBackground = new STImage({
            left: 50,
            top: 100,
            width: 400,
            height: 600,
            path: "img/bodyBackground.png"
        });
        inventory.addChild(bodyBackground);

        let headArmor = new InventoryItem({
            left: bodyBackground.width / 2 - 90,
            top: -80,
            width: 180,
            height: 120
        });
        bodyBackground.addChild(headArmor);
        this.objects.inventory.headArmor = headArmor;

        let weapon1 = new InventoryItem({
            left: -25,
            top: -25,
            width: 100,
            height: 300
        });
        bodyBackground.addChild(weapon1);
        this.objects.inventory.weapon1 = weapon1;

        let weapon2 = new InventoryItem({
            right: -18,
            top: -25,
            width: 100,
            height: 300,
            isFlippedHorizontally: true,
        });
        bodyBackground.addChild(weapon2);
        this.objects.inventory.weapon2 = weapon2;

        let bodyArmor = new InventoryItem({
            left: bodyBackground.width / 2 - 100,
            top: 160,
            width: 200,
            height: 200
        });
        bodyBackground.addChild(bodyArmor);
        this.objects.inventory.bodyArmor = bodyArmor;

        let legArmor = new InventoryItem({
            left: bodyBackground.width / 2 - 120,
            top: 360,
            width: 240,
            height: 180
        });
        bodyBackground.addChild(legArmor);
        this.objects.inventory.legArmor = legArmor;

        let footArmor1 = new InventoryItem({
            left: 30,
            bottom: -25,
            width: 100,
            height: 100
        });
        bodyBackground.addChild(footArmor1);
        this.objects.inventory.footArmor1 = footArmor1;

        let footArmor2 = new InventoryItem({
            right: 30,
            bottom: -25,
            width: 100,
            height: 100,
            isFlippedHorizontally: true
        });
        bodyBackground.addChild(footArmor2);
        this.objects.inventory.footArmor2 = footArmor2;


        // Menu buttons
        this.objects.menu.btnPlayerStats = this.createMenuWindowButton(this.objects.windows.playerStats, "img/btnPlayerStats.png", 10);

        this.objects.menu.btnStash = this.createMenuWindowButton(this.objects.windows.stash, "img/btnStash.png", 50);

        this.objects.menu.btnInventory = this.createMenuWindowButton(this.objects.windows.inventory, "img/btnInventory.png", 90);
    }
    createSideWindow(title, isLeft) {
        let options = {
            title: title,
            top: 80,
            width: 500, 
            height: 800, 
            color: "#BBBBBB",
            hasCloseButton: true,
            isVisible: false,
            isLeft: isLeft,
            z: -1
        };
        if(isLeft) {
            options.left = 10;
        } else {
            options.right = 10;
        }
        let window = new PopupWindow(options);
        this.addChild(window);
        return window;
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
        this.addChild(windowButton);
        return windowButton;
    }
    update(dTime) {
        this.player.applyRegeneration(dTime);
        this.player.updateUI();
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
    addRandomItem(level) {
        let item = Item.randomItem(level);
        this.addItemToStash(item);
    }
    addItemToStash(item) {
        this.stashItems.push(item);
        this.reorganizeStashItems();
    }
    removeItemFromStash(item) {
        removeElement(this.stashItems, item);
        game.objects.windows.stash.removeChild(item);
        this.reorganizeStashItems();
    }
    reorganizeStashItems() {
        // Remove all items from parents
        this.stashItems.forEach((item) => {
            item.remove();
        });

        for(var i = 0; i<this.stashItems.length; i++) {
            let item = this.stashItems[i];
            item.left = 25 + (i % 5) * 90;
            item.top = 45 + Math.floor(i / 5) * 90;
            game.objects.windows.stash.addChild(item);
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
        super(options);
        let defaults = {
            areas: []
        };
        
        let settings = extend(defaults, options);
        mergeObjects(this, settings);
    }
    complete () {
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

class FarmLevel extends Level {
    constructor(options){
        super(options);
        let defaults = {
            level: 1,
            areaTypes: [],
            runsLeft: 1
        };
        
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        this.randomizeAreaTypes();
    }
    complete() {
        this.runsLeft--;
        if(this.runsLeft <= 0) {
            this.reset();
        }
    }
    reset() {
        super.reset();
        this.randomizeAreaTypes();
        this.runsLeft = 1;
    }
    randomizeAreaTypes() {
        let areaCount = 2 + Math.round(Math.random() * 0.7); // 2: 2, 3: 5
        let areaTypeOptions = ["Lethal", "Armored", "Tanky", "Regenerating", "Weak", "Squishy"];
        this.areaTypes = [];
        for(var i = 0; i<areaCount; i++) {
            let areaType = randomElement(areaTypeOptions);
            this.areaTypes.push(areaType);
        }
    }
    start() {
        game.findObjects((obj) => {return obj instanceof Level;})
            .forEach((obj) => {obj.stop();});

        game.removeAreas();

        let areaCount = this.areaTypes.length;
        let marginX = 10;
        let areaWidth = 130;
        // Substracts the "extra" margin
        let totalWidth = areaCount * (areaWidth + marginX) - marginX;
        game.objects.areasContainer.width = totalWidth;
        game.objects.areasContainer.left = game.width / 2 - totalWidth / 2;
        game.objects.areasContainer.updateRelativeVariables();
        for(var i = 0; i<areaCount; i++) {
            let areaType = this.areaTypes[i];

            let attributes = {
                armor: 25,
                damage: 6,
                speed: 1,
                health: 100,
                regeneration: 1
            };
            switch(areaType) {
                case "Lethal":
                    attributes.damage *= 3;
                    break;
                case "Armored":
                    attributes.armor *= 3;
                    break;
                case "Tanky":
                    attributes.health *= 3;
                    break;
                case "Regenerating":
                    attributes.regeneration *= 5;
                    break;
                case "Weak":
                    attributes.damage *= 0.5;
                    break;
                case "Squishy":
                    attributes.health *= 0.5;
                    break;
                default:
                    console.log("Unknown area type: " + areaType);
                    break;
            }

            let area = new LevelArea({
                left: (areaWidth + marginX) * i,
                top: 0,
                parentLevel: this,
                width: areaWidth,
                height: areaWidth,
                character: new Character({
                    baseAttributes: new Attributes(attributes)
                })
            });

            this.areas.push(area);
            game.objects.areas.push(area);
            game.objects.areasContainer.addChild(area);
        }
        this.areas[0].unlock();

        super.start();
    }
}

class BossLevel extends Level {
    constructor(options){
        super(options);
        let defaults = {
            gatedLevel: null
        };
        
        let settings = extend(defaults, options);
        mergeObjects(this, settings);
    }
    complete () {
        this.gatedLevels.forEach((level) => {level.unlock();});
    }
}

class LevelArea extends ClickableRectWithBar {
    constructor(options) {
        super(options);
        let defaults = {
            parentLevel: null,
            attributes: null,
            character: null
        };
        
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        if(this.parentLevel !== null) {
            this.character.level = this.parentLevel.level;
            this.character.recalculateAttributes();
        }
    }
    randomizeAttributes(minMultiplier, maxMultiplier) {
        let multiplier = new Attributes();
        for(var index in multiplier) {
            multiplier[index] = randomFloat(minMultiplier, maxMultiplier);
        }
        this.attributes.multiply(multiplier);
    }
    complete() {
        this.isInProgress = false;
        this.isComplete = true;
        let experienceGained = this.character.level * 10 + 10;
        game.player.gainExperience(experienceGained);
        game.addRandomItem(this.level);
        this.parentLevel.onAreaComplete(this);
    }
    onClick(x, y) {
        if(!this.isComplete && !this.isLocked) {
            this.start();
        }
    }
    onUpdate(dTime) {
        if(!this.isComplete && !this.isLocked) {
            this.character.applyRegeneration(dTime);
        }

        if(this.isInProgress) {
            this.character.dealDamageTo(game.player, dTime);
            game.player.dealDamageTo(this.character, dTime);
            if(this.bar.value <= 0) {
                this.complete();
            } 
            else if(game.player.currentHealth <= 0) {
                this.stop();
            }
        }

        this.bar.setValue(this.character.currentHealth / this.character.attributes.health);
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

class InventoryItem extends STGameObject {
    constructor(options) {
        super(options);
        let defaults = {
            image: null,
            isFlippedHorizontally: false
        }
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        this.image = new STImage({
            isFlippedHorizontally: this.isFlippedHorizontally,
            path: "img/closeWindow.png",
            left: 0,
            top: 0,
            width: 1,
            height: 1,
            isSizeRelativeToParent: true
        });
        this.addChild(this.image);
    }
}

class Item extends STGameObject {
    constructor(options) {
        super(
            mergeObjects(options, {
                width: 80,
                height: 80
            })
        );
        let defaults = {
            image: null,
            type: "headArmor",
            name: "Unknown",
            imagePath: "img/Unknown_Unknown.png",
            level: null,
            rarity: 0,
            implicitProperties: [],
            properties: []
        }
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        this.imagePath = "img/" + this.type + "_" + this.name.replace(" ", "") + ".png";

        this.image = new STImage({
            path: "img/item.png",
            left: 0,
            top: 0,
            width: 1,
            height: 1,
            isSizeRelativeToParent: true,
            customOnClick: (x, y) => {
                let slot = this.type;
                if(slot == "weapon" || slot == "footArmor") {
                    slot += randomInt(1, 2);
                }
                game.player.equipItem(this, slot);
            }
        });
        this.addChild(this.image);

        let width = 1;
        let height = 1;
        switch(this.type) {
            case "legArmor":
                height = 0.8;
                break;
            case "weapon":
                width = 0.33;
                break;
            default:
                break;
        }

        this.image.addChild(new STImage({
            path: this.imagePath,
            left: 20 + 60 * (1 - width) / 2,
            top: 20 + 60 * (1 - height) / 2,
            width: 0.70 * width,
            height: 0.70 * height,
            isSizeRelativeToParent: true  
        }));
    }
    static randomItem (level) {
        let itemType = randomElementWeighted([
            [1, "headArmor"],
            [1, "bodyArmor"],
            [1, "legArmor"],
            [2, "footArmor"],
            [5, "weapon"]
        ]);

        let implicitProperties = [];
        let properties = [];

        let baseType = null;

        let propertyCount = randomInt(1, 3);

        let propertiesWeighted = [];

        switch(itemType) {
            case "weapon":
                baseType = randomElement([
                    {
                        name: "Axe",
                        properties: [{
                            type: "attributeFlat",
                            attribute: "damage",
                            min: 7,
                            max: 15
                        }]
                    },
                    {
                        name: "Sword",
                        properties: [{
                            type: "attributeFlat",
                            attribute: "damage",
                            min: 5,
                            max: 10
                        },{
                            type: "attributeFlat",
                            attribute: "speed",
                            min: 0.05,
                            max: 0.25
                        }]
                    }
                ]);

                propertiesWeighted = [
                    [5, PROPERTIES.DAMAGE],
                    [5, PROPERTIES.SPEED],
                    [2, PROPERTIES.HEALTH],
                    [1, PROPERTIES.REGENERATION]
                ];
                break;
            case "headArmor":
                baseType = randomElement([
                    {
                        name: "Magic Hat",
                        properties: [{
                            type: "attributeFlat",
                            attribute: "speed",
                            min: 0.1,
                            max: 0.4
                        }]
                    }
                ]);

                propertiesWeighted = [
                    [5, PROPERTIES.ARMOR],
                    [2, PROPERTIES.SPEED],
                    [5, PROPERTIES.HEALTH],
                    [2, PROPERTIES.REGENERATION]
                ];
                break;
            case "bodyArmor":
                baseType = randomElement([
                    {
                        name: "Plate Mail",
                        properties: [{
                            type: "attributeFlat",
                            attribute: "armor",
                            min: 10,
                            max: 30
                        }]
                    }
                ]);

                propertiesWeighted = [
                    [5, PROPERTIES.ARMOR],
                    [2, PROPERTIES.SPEED],
                    [5, PROPERTIES.HEALTH],
                    [2, PROPERTIES.REGENERATION]
                ];
                break;
            case "legArmor":
                baseType = randomElement([
                    {
                        name: "Leather Pants",
                        properties: [{
                            type: "attributeFlat",
                            attribute: "armor",
                            min: 1,
                            max: 5
                        }, {
                            type: "attributeFlat",
                            attribute: "speed",
                            min: 0.05,
                            max: 0.15
                        }]
                    }
                ]);

                propertiesWeighted = [
                    [5, PROPERTIES.ARMOR],
                    [5, PROPERTIES.SPEED],
                    [2, PROPERTIES.HEALTH],
                    [2, PROPERTIES.REGENERATION]
                ];
                break;
            case "footArmor":
                baseType = randomElement([
                    {
                        name: "Leather Boot",
                        properties: [{
                            type: "attributeFlat",
                            attribute: "armor",
                            min: 1,
                            max: 5
                        }, {
                            type: "attributeFlat",
                            attribute: "speed",
                            min: 0.05,
                            max: 0.15
                        }]
                    }
                ]);

                propertiesWeighted = [
                    [3, PROPERTIES.ARMOR],
                    [5, PROPERTIES.SPEED],
                    [2, PROPERTIES.HEALTH],
                    [1, PROPERTIES.REGENERATION],
                    [3, PROPERTIES.DAMAGE]
                ];
                break;            
        }

        for(var i = 0; i<baseType.properties.length; i++) {
            let property = baseType.properties[i];
            let propertyCopy = copyObject(property);
            implicitProperties.push(propertyCopy);
        }

        for(var i = 0; i<propertyCount; i++) {
            let property = randomElementWeighted(propertiesWeighted);
            removeWeightedElement(propertiesWeighted, property);
            let propertyCopy = copyObject(property);
            properties.push(propertyCopy);
        }

        // TODO: Calculate actual value of each property

        let item = new Item({
            implicitProperties: implicitProperties,
            properties: properties,
            type: itemType,
            name: baseType.name,
            rarity: propertyCount,
            level: level
        });

        return item;
    }
}

let PROPERTIES = {
    DAMAGE: {
        type: "attributeFlat",
        attribute: "damage",
        min: 1,
        max: 8
    },
    SPEED: {
        type: "attributeFlat",
        attribute: "speed",
        min: 0.05,
        max: 0.2
    },
    ARMOR: {
        type: "attributeFlat",
        attribute: "armor",
        min: 1,
        max: 20
    },
    HEALTH: {
        type: "attributeFlat",
        attribute: "health",
        min: 10,
        max: 50
    },
    REGENERATION: {
        type: "attributeFlat",
        attribute: "regeneration",
        min: 0.1,
        max: 2
    }
};

const COLORS = {
    LOCKED: "#AA5555",
    LOCKED_BORDER: "#555555",
    ENABLED: "#669966",
    ENABLED_BORDER: "#555555",
    IN_PROGRESS: "#669966",
    IN_PROGRESS_BORDER: "#AAAAAA"
};
let game;

$(document).ready(function () {
    game = new ActionGrinderGame();
    
    game.player.updateUI();

    game.start();
});