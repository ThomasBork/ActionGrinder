const COLORS = {
    LOCKED: "#AA5555",
    LOCKED_BORDER: "#555555",
    ENABLED: "#669966",
    ENABLED_BORDER: "#555555",
    IN_PROGRESS: "#669966",
    IN_PROGRESS_BORDER: "#AAAAAA"
};
const Z_VALUES = {
    HOVER_INFO: -2,
    SIDE_WINDOW: -1
}

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
                speed: null,
                dps: null,
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
        let farmMapsContainer = new VCanvas({
            left: 0,
            top: 100,
            width: this.width,
            height: 700,
            isZoomable: true
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
            top: 800,
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

        // Stash
        this.objects.windows.stash = this.createSideWindow("Stash", false);
        this.objects.windows.stash.canvas = new VCanvas({
            left: 25,
            top: 45,
            width: this.objects.windows.stash.width - 25 * 2,
            height: this.objects.windows.stash.height - 45 - 25,
            isDraggableX: false,
            isDraggableY: true
        });
        this.objects.windows.stash.addChild(this.objects.windows.stash.canvas);

        // Inventory
        let inventory = this.createSideWindow("Inventory", true);
        this.objects.windows.inventory = inventory;

        let bodyBackground = new STImage({
            left: 100,
            top: 70,
            width: 300,
            height: 450,
            path: "img/bodyBackground.png"
        });
        inventory.addChild(bodyBackground);

        let headArmor = new VInventoryItem({
            left: bodyBackground.width / 2 - 68,
            top: -60,
            width: 136,
            height: 180,
            itemSlot: "headArmor"
        });
        bodyBackground.addChild(headArmor);
        this.objects.inventory.headArmor = headArmor;

        let weapon1 = new VInventoryItem({
            left: -20,
            top: -20,
            width: 75,
            height: 225,
            itemSlot: "weapon1"
        });
        bodyBackground.addChild(weapon1);
        this.objects.inventory.weapon1 = weapon1;

        let weapon2 = new VInventoryItem({
            right: -10,
            top: -20,
            width: 75,
            height: 225,
            isFlippedHorizontally: true,
            itemSlot: "weapon2"
        });
        bodyBackground.addChild(weapon2);
        this.objects.inventory.weapon2 = weapon2;

        let bodyArmor = new VInventoryItem({
            left: bodyBackground.width / 2 - 75,
            top: 120,
            width: 150,
            height: 150,
            itemSlot: "bodyArmor"
        });
        bodyBackground.addChild(bodyArmor);
        this.objects.inventory.bodyArmor = bodyArmor;

        let legArmor = new VInventoryItem({
            left: bodyBackground.width / 2 - 90,
            top: 270,
            width: 180,
            height: 120,
            itemSlot: "legArmor"
        });
        bodyBackground.addChild(legArmor);
        this.objects.inventory.legArmor = legArmor;

        let footArmor1 = new VInventoryItem({
            left: 16,
            bottom: -16,
            width: 75,
            height: 75,
            itemSlot: "footArmor1"
        });
        bodyBackground.addChild(footArmor1);
        this.objects.inventory.footArmor1 = footArmor1;

        let footArmor2 = new VInventoryItem({
            right: 24,
            bottom: -16,
            width: 75,
            height: 75,
            isFlippedHorizontally: true,
            itemSlot: "footArmor2"
        });
        bodyBackground.addChild(footArmor2);
        this.objects.inventory.footArmor2 = footArmor2;


        let addLabelWithValueReturnValue = (labelText, isLeft, bottom, parent) => {
            let containerOptions = {
                bottom: bottom,
                width: 0.42,
                height: 0,
                isSizeRelativeToParent: true
            };
            if(isLeft) {
                containerOptions.left = 20;
            } else {
                containerOptions.right = 20;
            }

            let container = new STGameObject(containerOptions);

            let label = new STText({
                left: 0,
                top: 0,
                text: labelText,
                color: "black"
            });

            let value = new STText({
                right: 0,
                top: 0,
                text: "0",
                isRightToLeft: true,
                color: "black"
            });

            container.addChild(label);
            container.addChild(value);
            parent.addChild(container);

            return value;
        };

        this.objects.playerStatsLabels.health = addLabelWithValueReturnValue("Health: ", true, 110, inventory);
        this.objects.playerStatsLabels.armor = addLabelWithValueReturnValue("Armor: ", true, 80, inventory);
        this.objects.playerStatsLabels.regeneration = addLabelWithValueReturnValue("Regeneration: ", true, 50, inventory);

        this.objects.playerStatsLabels.damage = addLabelWithValueReturnValue("Damage: ", false, 110, inventory);
        this.objects.playerStatsLabels.speed = addLabelWithValueReturnValue("Speed: ", false, 80, inventory);
        this.objects.playerStatsLabels.dps = addLabelWithValueReturnValue("Damage / sec: ", false, 50, inventory);


        // Menu buttons
        this.objects.menu.btnStash = this.createMenuWindowButton(this.objects.windows.stash, "img/btnStash.png", 10);

        this.objects.menu.btnInventory = this.createMenuWindowButton(this.objects.windows.inventory, "img/btnInventory.png", 50);
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
            z: Z_VALUES.SIDE_WINDOW
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
        this.loadFarmMaps(game.firstFarmMap);

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
        player.listeners.onItemUnequip.push((item) => {
            this.refreshPlayerUI(player);
        });
        player.listeners.onExperienceGain.push(() => {this.refreshPlayerUI(player);});
        player.listeners.onLevelUp.push(() => {this.refreshPlayerUI(player);});
        player.listeners.onFightingStop.push(() => {
            this.removeAreas();
            this.objects.farmMaps.forEach((map)=>{map.bar.hide();});
            this.refreshPlayerUI(player);
        });
    }
    refreshPlayerUI (player) {
        this.objects.playerLevel.text = "Level: " + prettyNumber(player.level);
        this.objects.playerHealthBar.setValue(player.currentHealth / player.attributes.health);
        this.objects.playerExperienceBar.setValue(player.experience / Player.getExperienceNeeded(player.level));

        this.objects.playerStatsLabels.health.text = prettyNumber(player.attributes.health);
        this.objects.playerStatsLabels.damage.text = prettyNumber(player.attributes.damage);
        this.objects.playerStatsLabels.speed.text = prettyNumber(player.attributes.speed, 2);
        this.objects.playerStatsLabels.dps.text = prettyNumber(player.attributes.damage * player.attributes.speed, 2);
        this.objects.playerStatsLabels.armor.text = prettyNumber(player.attributes.armor);
        this.objects.playerStatsLabels.regeneration.text = prettyNumber(player.attributes.regeneration, 2);

        // Inventory
        for(var slot in player.equippedItems) {
            let playerSlot = player.equippedItems[slot];
            let inventorySlot = this.objects.inventory[slot];
            if(playerSlot === null) {
                inventorySlot.hide();
            } else {
                inventorySlot.setItem(playerSlot);
                inventorySlot.show();
            }
        }
    }
    loadStash(stashItems) {

    }
    loadFarmMaps(firstFarmMap) {
        let loadFarmMap = (farmMap, row, column, rowCount) => {
            let vMap = new VFarmMap({
                map: farmMap,
                left: column * 200,
                top: this.objects.farmMapsContainer.height / 2 - rowCount / 2 * 140 + row * 140,
                height: 130,
                width: 130
            });
            this.objects.farmMaps.push(vMap);
            this.objects.farmMapsContainer.addChild(vMap);

            for(var i = 0; i<farmMap.gatedMaps.length; i++) {
                let map = farmMap.gatedMaps[i];
                loadFarmMap(map, i, column + 1, farmMap.gatedMaps.length);
            }
        };
        loadFarmMap(firstFarmMap, 0, 0, 1);
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
                area: areas[i],
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
                item.left = (i % 5) * 90;
                item.top = Math.floor(i / 5) * 90;
                this.objects.windows.stash.canvas.addChild(item);
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

        this.addChild(new STImage({
            left: 3,
            top: 3,
            width: this.width - 6,
            height: this.height - 6,
            path: "img/map_" + this.map.name.toLowerCase() + ".png"
        }));

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

            area.listeners.onComplete.push(() => {
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

        this.addChild(new STImage({
            left: 3,
            top: 3,
            width: this.width - 6,
            height: this.height - 6,
            path: "img/area_" + this.area.type + ".png"
        }));

        this.area.listeners.onUnlock.push(()=>{
            this.isVisible = true;
            this.unlock();
        });
        this.area.listeners.onStart.push(()=>{
            this.bar.show();
        });
        this.area.listeners.onChange.push(() => {
            this.refreshHealthBar();
        });
        this.area.listeners.onComplete.push(()=>{
            this.bar.hide();
            this.addChild(new STImage({
                path: "img/areaClear.png",
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                isSizeRelativeToParent: true
            }));
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
            hoverInfo: null,
            item: null,
            itemSlot: null,
            image: null,
            isFlippedHorizontally: false,
            currentYOffset: 0
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
    setItem(item) {
        let imagePath = VItem.getImagePath(item);
        this.image.setPath(imagePath);
        this.setHoverInfo(item);
        this.top -= this.currentYOffset;
        let newYOffset = VInventoryItem.getRelativeImageYOffset(item);
        this.currentYOffset = this.height * newYOffset;
        this.top += this.currentYOffset;
        this.updateRelativeVariables();
    }
    setHoverInfo(item) {
        if(this.item !== item) {
            this.item = item;
            this.hoverInfo = VItem.buildHoverInfo(item);
        }
    }
    refreshHoverInfoPosition(globalX, globalY) {
        this.hoverInfo.left = globalX;
        if(this.hoverInfo.left + this.hoverInfo.width > vGame.width) {
            this.hoverInfo.left = vGame.width - this.hoverInfo.width;
        }
        this.hoverInfo.top = globalY;
        if(this.hoverInfo.top + this.hoverInfo.height > vGame.height) {
            this.hoverInfo.top = vGame.height - this.hoverInfo.height;
        }
        this.hoverInfo.updateRelativeVariables();
    }
    onClick(x, y) {
        game.player.unequipItem(this.itemSlot);
    }
    onMouseMove(x, y) {
        this.refreshHoverInfoPosition(x, y);
        this.hoverInfo.show();
    }
    onMouseLeave(){
        this.hoverInfo.hide();
    }
    static getRelativeImageYOffset(item) {
        switch(item.name) {
            case "Facepeeler":
            case "Claw":
            case "Spiked Shield": 
            case "Tower Shield": return 0.4;
            default: return 0;
        }
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
            item: null,
            hoverInfo: null
        };
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        this.imagePath = VItem.getImagePath(this.item);

        let itemContainerPath = "img/item_" + this.item.rarity + ".png";

        this.image = new STImage({
            path: itemContainerPath,
            left: 0,
            top: 0,
            width: 1,
            height: 1,
            isSizeRelativeToParent: true,
            customOnClick: (x, y) => {
                let slot = this.item.type;
                if(slot == "weapon" || slot == "footArmor") {
                    // Equip available slot or at random
                    if(game.player.equippedItems[slot + "1"] == null) {
                        slot += 1;
                    } else if(game.player.equippedItems[slot + "2"] == null) {
                        slot += 2;
                    } else {
                        slot += randomInt(1, 2);
                    }
                }
                game.player.equipItem(this.item, slot);
            }
        });
        this.addChild(this.image);

        let imageDimensions = VItem.getRelativeImageDimensions(this.item);
        let width = imageDimensions.width;
        let height = imageDimensions.height;

        this.image.addChild(new STImage({
            path: this.imagePath,
            left: 10 + 60 * (1 - width) / 2,
            top: 10 + 60 * (1 - height) / 2,
            width: 0.70 * width,
            height: 0.70 * height,
            isSizeRelativeToParent: true  
        }));

        this.hoverInfo = VItem.buildHoverInfo(this.item);

        // Add listeners
        this.item.listeners.onEquip.push(()=>{
            removeElement(vGame.objects.itemsInStash, this);
            this.hoverInfo.hide();
            this.remove();
            vGame.reorganizeStashItems();
        });
        this.item.listeners.onUnequip.push(()=>{
            vGame.objects.itemsInStash.push(this);
            vGame.reorganizeStashItems();
        });
    }
    refreshHoverInfoPosition(globalX, globalY) {
        this.hoverInfo.left = globalX;
        if(this.hoverInfo.left + this.hoverInfo.width > vGame.width) {
            this.hoverInfo.left = vGame.width - this.hoverInfo.width;
        }
        this.hoverInfo.top = globalY;
        if(this.hoverInfo.top + this.hoverInfo.height > vGame.height) {
            this.hoverInfo.top = vGame.height - this.hoverInfo.height;
        }
        this.hoverInfo.updateRelativeVariables();
    }
    onMouseMove(x, y) {
        let globalPosition = this.getGlobalCoordinates(x, y);
        this.refreshHoverInfoPosition(globalPosition.x, globalPosition.y);
        this.hoverInfo.show();
    }
    onMouseLeave() {
        this.hoverInfo.hide();
    }
    static buildHoverInfo(item) {
        let containerPadding = 10;
        let width = 280;
        let nameSize = 18;
        let nameMargin = 20;
        let marginAfterImplicit = 10;
        let propertyHeight = 20;
        let propertyMargin = 5;
        let implicitCount = item.implicitProperties.length;
        let propertyCount = item.properties.length;
        let totalPropertyCount = implicitCount + propertyCount;
        let height = 
            nameSize + nameMargin +
            16 +
            (propertyHeight + propertyMargin) * implicitCount - propertyMargin + 
            marginAfterImplicit +
            (propertyHeight + propertyMargin) * propertyCount - propertyMargin + 
            2 * containerPadding;

        let hoverInfo = new STRect({
            width: width,
            height: height,
            left: 0,
            top: 0,
            borderSize: 3,
            borderColor: "black",
            z: Z_VALUES.HOVER_INFO
        });
        vGame.addChild(hoverInfo);
        hoverInfo.hide();
        let addPropertyLine = (property, top) => {
            if(property.type == "attributeFlat") {
                let label = new STText({
                    left: containerPadding,
                    top: top,
                    text: prettyWord(property.attribute),
                    color: "black"
                });
    
                let numberText = prettyNumber(property.value);
                if(property.attribute == "regeneration" || property.attribute == "speed") {
                    numberText = prettyNumber(property.value, 2);
                }

                let value = new STText({
                    right: containerPadding,
                    top: top,
                    text: numberText,
                    isRightToLeft: true,
                    color: "black"
                });
    
                hoverInfo.addChild(label);
                hoverInfo.addChild(value);
            } else if (property.type == "attributePercent") {
                let label = new STText({
                    left: containerPadding,
                    top: top,
                    text: prettyWord(property.attribute),
                    color: "black"
                });

                let value = new STText({
                    right: containerPadding,
                    top: top,
                    text: prettyNumber(property.value * 100) + "%",
                    isRightToLeft: true,
                    color: "black"
                });
    
                hoverInfo.addChild(label);
                hoverInfo.addChild(value);
            } else if(property.type == "attributePerAttribute") {
                let label = new STText({
                    left: containerPadding,
                    top: top,
                    text: prettyWord(property.args[0]) + " per " + prettyWord(property.args[1]),
                    color: "black"
                });

                let value = new STText({
                    right: containerPadding,
                    top: top,
                    text: prettyNumber(property.value, 2),
                    isRightToLeft: true,
                    color: "black"
                });
    
                hoverInfo.addChild(label);
                hoverInfo.addChild(value);
            } else if(property.type == "attributePerLevel") {
                let label = new STText({
                    left: containerPadding,
                    top: top,
                    text: prettyWord(property.attribute) + " per level",
                    color: "black"
                });

                let value = new STText({
                    right: containerPadding,
                    top: top,
                    text: prettyNumber(property.value, 2),
                    isRightToLeft: true,
                    color: "black"
                });
    
                hoverInfo.addChild(label);
                hoverInfo.addChild(value);
            }
        };

        hoverInfo.addChild(new STText({
            left: containerPadding,
            top: containerPadding,
            text: item.name,
            fontSize: nameSize,
            color: "black"
        }));

        hoverInfo.addChild(new STText({
            left: containerPadding,
            top: containerPadding + nameSize + 5,
            text: "Level",
            color: "black",
            fontSize: 12
        }));
        hoverInfo.addChild(new STText({
            right: containerPadding,
            top: containerPadding + nameSize + 5,
            text: item.level,
            isRightToLeft: true,
            color: "black",
            fontSize: 12
        }));

        hoverInfo.addChild(new STRect({
            left: containerPadding,
            top: containerPadding + nameSize + nameMargin / 2 - 1 + 16, 
            width: width - 2 * containerPadding,
            height: 1,
            color: "black"
        }));

        let implicitStartTop = containerPadding + nameSize + nameMargin + 10;
        for(var i = 0; i<implicitCount; i++) {
            let top = implicitStartTop + i * (propertyHeight + propertyMargin);
            addPropertyLine(item.implicitProperties[i], top);
        }

        let implicitEndTop = implicitStartTop + implicitCount * (propertyHeight + propertyMargin) - propertyMargin;
        hoverInfo.addChild(new STRect({
            left: containerPadding,
            top: implicitEndTop + marginAfterImplicit / 2 - 1, 
            width: width - 2 * containerPadding,
            height: 1,
            color: "black"
        }));

        for(var i = 0; i<propertyCount; i++) {
            let top = marginAfterImplicit + implicitEndTop + i * (propertyHeight + propertyMargin);
            addPropertyLine(item.properties[i], top);
        }

        return hoverInfo;
    }
    static getImagePath(item) {
        return "img/" + item.type + "_" + item.name.replace(" ", "") + ".png";
    }
    static getRelativeImageDimensions(item) {
        let width = 1;
        let height = 1;
        switch(item.type) {
            case "legArmor":
                height = 0.8;
                break;
            case "weapon":
                width = 0.33;
                break;
            default:
                break;
        }
        return {width: width, height: height};
    }
}

class VCanvas extends STCanvas {
    constructor(options) {
        super(options);
        let defaults = {
            isDraggableX: true,
            isDraggableY: true,
            isZoomable: false,
            isDragging: false,
            dragPointX: null,
            dragPointY: null
        };
        let settings = extend(defaults, options);
        mergeObjects(this, settings);
    }
    onMouseDown(x, y) {
        if(this.isDraggableX || this.isDraggableY) {
            this.isDragging = true;
            this.dragPointX = x;
            this.dragPointY = y;
        }
    }
    onMouseUp(x, y) {
        this.isDragging = false;
    }
    onMouseMove(x, y) {
        if(this.isDragging) {
            if(this.isDraggableX){
                this.viewportX -= this.dragPointX - x;
                this.dragPointX = x;
            }
            if(this.isDraggableY){
                this.viewportY -= this.dragPointY - y;
                this.dragPointY = y;
            }
        }
    }
    onScroll(x, y, speed) {
        if(this.isZoomable){
            let newScaleX = this.scaleX - 0.01;
            let newScaleY = this.scaleY - 0.01;
            if(speed < 0) {
                newScaleX = this.scaleX + 0.01;
                newScaleY = this.scaleX + 0.01;
            }
    
            this.viewportX += this.width * (this.scaleX - newScaleX) * 0.5;
            this.viewportY += this.height * (this.scaleY - newScaleY) * 0.5;
    
            this.scaleX = newScaleX;
            this.scaleY = newScaleY;
        }
        else if(this.isDraggableX) {
            if(speed >= 0) {
                this.viewportX -= 25;
            } else {
                this.viewportX += 25;
            }
        }
        else if(this.isDraggableY) {
            if(speed >= 0) {
                this.viewportY -= 25;
            } else {
                this.viewportY += 25;
            }
        }
    }
}