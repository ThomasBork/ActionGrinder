const COLORS = {
    LOCKED: "#AA5555",
    LOCKED_BORDER: "#555555",
    ENABLED: "#669966",
    ENABLED_BORDER: "#555555",
    IN_PROGRESS: "#669966",
    IN_PROGRESS_BORDER: "#AAAAAA"
};

class VGame extends STGame {
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

        this.game = null;

        this.objects = {
            farmMaps: [],
            bossMaps: [],
            farmMapsContainer: null,
            bossMapsContainer: null,
            areas: [],
            areasContainer: null,
            itemsInInventory: [],
            itemsInStash: [],
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
        
        // Farm level container
        let farmMapsContainer = new STGameObject({
            top: 700,
            left: this.width / 2 - 580,
            width: 550,
            height: 140
        });
        this.objects.farmMapsContainer = farmMapsContainer;
        this.addChild(farmMapsContainer);

        // Boss level container
        let bossMapsContainer = new STGameObject({
            top: 645,
            left: this.width / 2 + 30,
            width: this.width / 2 - 10,
            height: 250
        });
        this.objects.bossMapsContainer = bossMapsContainer;
        this.addChild(bossMapsContainer);

        // Area container
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
            text: "Level: ?"
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

        // Stash
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

        let headArmor = new VInventoryItem({
            left: bodyBackground.width / 2 - 90,
            top: -80,
            width: 180,
            height: 120
        });
        bodyBackground.addChild(headArmor);
        this.objects.inventory.headArmor = headArmor;

        let weapon1 = new VInventoryItem({
            left: -25,
            top: -25,
            width: 100,
            height: 300
        });
        bodyBackground.addChild(weapon1);
        this.objects.inventory.weapon1 = weapon1;

        let weapon2 = new VInventoryItem({
            right: -18,
            top: -25,
            width: 100,
            height: 300,
            isFlippedHorizontally: true,
        });
        bodyBackground.addChild(weapon2);
        this.objects.inventory.weapon2 = weapon2;

        let bodyArmor = new VInventoryItem({
            left: bodyBackground.width / 2 - 100,
            top: 160,
            width: 200,
            height: 200
        });
        bodyBackground.addChild(bodyArmor);
        this.objects.inventory.bodyArmor = bodyArmor;

        let legArmor = new VInventoryItem({
            left: bodyBackground.width / 2 - 120,
            top: 360,
            width: 240,
            height: 180
        });
        bodyBackground.addChild(legArmor);
        this.objects.inventory.legArmor = legArmor;

        let footArmor1 = new VInventoryItem({
            left: 30,
            bottom: -25,
            width: 100,
            height: 100
        });
        bodyBackground.addChild(footArmor1);
        this.objects.inventory.footArmor1 = footArmor1;

        let footArmor2 = new VInventoryItem({
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
        let window = new VPopupWindow(options);
        this.addChild(window);
        return window;
    }
    createMenuWindowButton (window, imagePath, right) {
        let windowButton = new VWindowButton({
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
    load(game) {
        this.game = game;
        this.loadPlayer(game.player);
        this.loadStash(game.items);
        this.loadFarmMaps(game.farmMaps);

        // Add listeners
        this.game.listeners.onItemCreated.push((item) => {
            let vItem = new VItem({
                item: item
            });

            this.objects.itemsInStash.push(vItem);
            this.reorganizeStashItems();
        });
    }
    loadPlayer(player) {
        this.refreshPlayerUI(player);

        // Add listeners
        player.listeners.onChange.push(() => {this.refreshPlayerUI(player);});
        player.listeners.onItemEquip.push(() => {this.refreshPlayerUI(player);});
        player.listeners.onItemUnequip.push(() => {this.refreshPlayerUI(player);});
        player.listeners.onExperienceGain.push(() => {this.refreshPlayerUI(player);});
        player.listeners.onLevelUp.push(() => {this.refreshPlayerUI(player);});
        player.listeners.onFightingStop.push(() => {this.refreshPlayerUI(player);});
    }
    refreshPlayerUI (player) {
        this.objects.playerLevel.text = "Level: " + prettyNumber(player.level);
        this.objects.playerHealthBar.setValue(player.currentHealth / player.attributes.health);
        this.objects.playerExperienceBar.setValue(player.experience / Player.getExperienceNeeded(player.level));

        this.objects.playerStatsLabels.level.text = prettyNumber(player.level);
        this.objects.playerStatsLabels.health.text = prettyNumber(player.attributes.health);
        this.objects.playerStatsLabels.damage.text = prettyNumber(player.attributes.damage);
        this.objects.playerStatsLabels.armor.text = prettyNumber(player.attributes.armor);
        this.objects.playerStatsLabels.regeneration.text = prettyNumber(player.attributes.regeneration);

        // Inventory
        for(var slot in player.equippedItems) {
            let playerSlot = player.equippedItems[slot];
            let inventorySlot = this.objects.inventory[slot];
            if(playerSlot === null) {
                inventorySlot.hide();
            } else {
                let imagePath = VItem.getImagePath(playerSlot);
                inventorySlot.image.setPath(imagePath);
                inventorySlot.show();
            }
        }
    }
    loadStash(stashItems) {

    }
    loadFarmMaps(farmMaps) {
        for(var i = 0; i<farmMaps.length; i++) {
            let map = farmMaps[i];
            let vMap = new VFarmMap({
                map: map,
                right: i * 140,
                top: 0,
                height: 130,
                width: 130
            });
            this.objects.farmMaps.push(vMap);
            this.objects.farmMapsContainer.addChild(vMap);
        }
    }
    onUpdate(dTime) {
        this.game.update(dTime);
    }
    setAreas(areas) {
        // Remove old areas
        this.removeAreas();

        let areaCount = areas.length;
        let marginX = 10;
        let areaWidth = 130;
        // Substracts the "extra" margin
        let totalWidth = areaCount * (areaWidth + marginX) - marginX;
        this.objects.areasContainer.width = totalWidth;
        this.objects.areasContainer.left = game.width / 2 - totalWidth / 2;
        this.objects.areasContainer.updateRelativeVariables();

        // Create new areas
        for(var i = 0; i < areas.length; i++) {
            let area = new VArea({
                left: (areaWidth + marginX) * i,
                top: 0,
                parentLevel: this,
                width: areaWidth,
                height: areaWidth
            });

            this.objects.areas.push(area);
            this.objects.areasContainer.addChild(area);
        }
    }
    removeAreas() {
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
    reorganizeStashItems() {
        // Remove all items from parents
        this.objects.itemsInStash.forEach((item) => {
            item.remove();
        });

        for(var i = 0; i<this.objects.itemsInStash.length; i++) {
            let item = this.objects.itemsInStash[i];
            let itemEquipped = false;
            for(var index in game.player.equippedItems) {
                if(game.player.equippedItems[index] == item.item) {
                    itemEquipped = true;
                }
            }
            if(itemEquipped) {
                removeElement(this.objects.itemsInStash, item);
            } else {
                item.left = 25 + (i % 5) * 90;
                item.top = 45 + Math.floor(i / 5) * 90;
                this.objects.windows.stash.addChild(item);
            }
        }
    }
}

class VRectWithBar extends STRect {
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

class VClickableRectWithBar extends VRectWithBar {
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

class VMap extends VClickableRectWithBar {
    constructor (options) {
        super(options);
        let defaults = {
            map: null
        };
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        this.isVisible = this.map.isVisible;

        if(this.map.isLocked) {
            this.lock();
        } else {
            this.unlock();
        }

        this.map.listeners.onUnlock.push(()=>{
            this.isVisible = true;
            this.unlock();
        });
        this.map.listeners.onStart.push(()=>{this.onStart();});
        this.map.listeners.onComplete.push(()=>{this.onComplete();});
    }
    onClick(x, y) {
        game.player.enterMap(this.map);
    }
    onStart () {
        vGame.removeAreas();

        let areaCount = this.map.areaTypes.length;
        let marginX = 10;
        let areaWidth = 130;
        // Substracts the "extra" margin
        let totalWidth = areaCount * (areaWidth + marginX) - marginX;
        vGame.objects.areasContainer.width = totalWidth;
        vGame.objects.areasContainer.left = vGame.width / 2 - totalWidth / 2;
        vGame.objects.areasContainer.updateRelativeVariables();

        for(var i = 0; i<this.map.areas.length; i++) {
            let area = this.map.areas[i];
            let vArea = new VArea({
                area: area,
                left: (areaWidth + marginX) * i,
                top: 0,
                width: areaWidth,
                height: areaWidth
            });
            vGame.objects.areas.push(vArea);
            vGame.objects.areasContainer.addChild(vArea);

            area.listeners.onChange.push(()=>{
                this.refreshHealthBar();
            });
        }

        this.refreshHealthBar();
        this.bar.show();
    }
    onComplete() {
        this.bar.hide();
    }
    refreshHealthBar() {
        let completed = 0;
        let toComplete = this.map.areas.length;
        this.map.areas.forEach((area) => {completed += area.currentHealth / area.attributes.health;});
        this.bar.setValue(completed / toComplete); 
    }
}

class VFarmMap extends VMap {
    constructor(options){
        super(options);
    }
}

class VArea extends VClickableRectWithBar {
    constructor(options) {
        super(options);
        let defaults = {
            area: null
        };
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        this.isVisible = this.area.isVisible;

        if(this.area.isLocked) {
            this.lock();
        } else {
            this.unlock();
        }

        this.area.listeners.onUnlock.push(()=>{
            this.isVisible = true;
            this.unlock();
        });
        this.area.listeners.onStart.push(()=>{
            this.bar.show();
        });
        this.area.listeners.onChange.push(() => {this.refreshHealthBar();});
        this.area.listeners.onComplete.push(()=>{
            this.bar.hide();
        });
    }
    onClick(x, y) {
        game.player.enterArea(this.area);
    }
    refreshHealthBar() {
        this.bar.setValue(this.area.currentHealth / this.area.attributes.health);
    }
}

class VWindowButton extends STRect {
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
        for(var index in vGame.objects.windows) {
            let window = vGame.objects.windows[index];
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

class VPopupWindow extends STWindow {
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

class VInventoryItem extends STGameObject {
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

class VItem extends STGameObject {
    constructor(options) {
        super(
            mergeObjects(options, {
                width: 80,
                height: 80
            })
        );
        let defaults = {
            image: null,
            item: null
        };
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        this.imagePath = VItem.getImagePath(this.item);

        this.image = new STImage({
            path: "img/item.png",
            left: 0,
            top: 0,
            width: 1,
            height: 1,
            isSizeRelativeToParent: true,
            customOnClick: (x, y) => {
                let slot = this.item.type;
                if(slot == "weapon" || slot == "footArmor") {
                    slot += randomInt(1, 2);
                }
                game.player.equipItem(this.item, slot);
            }
        });
        this.addChild(this.image);

        let width = 1;
        let height = 1;
        switch(this.item.type) {
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

        // Add listeners
        this.item.listeners.onEquip.push(()=>{
            removeElement(vGame.objects.itemsInStash, this);
            this.remove();
            vGame.reorganizeStashItems();
        });
        this.item.listeners.onUnequip.push(()=>{
            vGame.objects.itemsInStash.push(this);
        });
    }
    static getImagePath(item) {
        return "img/" + item.type + "_" + item.name.replace(" ", "") + ".png";
    }
}