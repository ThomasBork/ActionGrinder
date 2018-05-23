let PROPERTIES = {
    DAMAGE: {
        type: "attributeFlat",
        attribute: "damage",
        baseMin: 1,
        baseMax: 8
    },
    SPEED: {
        type: "attributeFlat",
        attribute: "speed",
        baseMin: 0.02,
        baseMax: 0.1
    },
    ARMOR: {
        type: "attributeFlat",
        attribute: "armor",
        baseMin: 1,
        baseMax: 20
    },
    HEALTH: {
        type: "attributeFlat",
        attribute: "health",
        baseMin: 10,
        baseMax: 50
    },
    REGENERATION: {
        type: "attributeFlat",
        attribute: "regeneration",
        baseMin: 0.1,
        baseMax: 2
    }
};

class ObservableObject {
    constructor() {
        this.listeners = {
            onChange: []
        };
    }
    callListeners(functionArray, argument) {
        for(var i = 0; i<functionArray.length; i++) {
            functionArray[i](argument);
        }
    }
}

class Game extends ObservableObject {
    constructor() {
        super();

        this.listeners.onItemCreated = [];
        this.listeners.onItemAddedToStash = [];
        this.listeners.onItemRemovedFromStash = [];

        this.player = null;

        this.items = [];

        this.areas = [];
        this.farmMaps = [];
        this.firstFarmMap = null;
        this.bossMaps = [];
    }
    initialize() {
        this.player = new Player();

        let plainsMap = new FarmMap("Plains", 1);
        let mountainMap = new FarmMap("Mountain", 5);
        let swampMap = new FarmMap("Swamp", 10);
        let graveyardMap = new FarmMap("Graveyard", 15);

        plainsMap.gatedMaps.push(mountainMap);
        mountainMap.gatedMaps.push(swampMap);
        mountainMap.gatedMaps.push(graveyardMap);

        plainsMap.unlock();
        this.firstFarmMap = plainsMap;
    }
    update(dTime) {
        this.player.update(dTime);
    }
    addRandomItem(level) {
        let item = Item.randomItem(level);
        this.callListeners(this.listeners.onItemCreated, item);
        this.addItemToStash(item);
    }
    addItemToStash(item) {
        this.items.push(item);
        this.callListeners(this.listeners.onItemAddedToStash);
    }
    removeItemFromStash(item) {
        removeElement(this.items, item);
        this.callListeners(this.listeners.onItemRemovedFromStash);
    }
}

class Map extends ObservableObject {
    constructor() {
        super();
        this.level = 1;
        this.isVisible = false;
        this.isLocked = true;
        this.areas = [];

        this.listeners.onComplete = [];
        this.listeners.onUnlock = [];
    }
    unlock() {
        this.isLocked = false;
        this.isVisible = true;
        this.callListeners(this.listeners.onUnlock);
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
}

class FarmMap extends Map {
    constructor(name, level) {
        super();

        this.listeners.onStart = [];

        this.name = name;
        this.level = level;
        this.areaTypes = [];
        this.gatedMaps = [];
        this.runsLeft = 1;

        this.randomizeAreaTypes();
    }
    complete() {
        this.runsLeft--;
        if(this.runsLeft <= 0) {
            this.reset();
        }

        this.gatedMaps.forEach((map)=>{map.unlock();});

        this.callListeners(this.listeners.onComplete);
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
    reset() {
        this.randomizeAreaTypes();
        this.runsLeft = 1;
    }
    start() {
        this.areas = [];

        let areaCount = this.areaTypes.length;
        
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

            let area = new Area(new Attributes(attributes), this.level);

            this.areas.push(area);
        }
        this.areas[0].unlock();

        this.callListeners(this.listeners.onStart);
    }
}

class BossMap extends Map {
    constructor() {
        super();
    }
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

class Character extends ObservableObject {
    constructor(attributes) {
        super();
        this.level = 1;

        this.baseAttributes = attributes;
        this.attributes = null;
        this.recalculateAttributes();
        this.currentHealth = this.attributes.health;
    }
    recalculateAttributes() {
        this.recalculateAttributesBasedOnLevel();
        this.currentHealth = this.attributes.health;
        this.callListeners(this.listeners.onChange);
    }
    recalculateAttributesBasedOnLevel() {
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
    }
    dealDamageTo(character, dTime) {
        let damageDealt = this.attributes.damage * this.attributes.speed * dTime;
        character.takeDamage(damageDealt);
    }
    takeDamage(damageDealt) {
        let damageTaken = damageDealt * 100 / (100 + this.attributes.armor);
        this.currentHealth -= damageTaken;
        this.callListeners(this.listeners.onChange);
    }
    applyRegeneration(dTime) {
        let healing = this.attributes.regeneration * dTime;
        this.currentHealth += healing;
        if(this.currentHealth > this.attributes.health) {
            this.currentHealth = this.attributes.health;
        }
        this.callListeners(this.listeners.onChange);
    }
}

class Area extends Character {
    constructor(attributes, level) {
        super(attributes);

        this.level = level;
        this.recalculateAttributes();

        this.isComplete = false;
        this.isVisible = true;
        this.isLocked = true;

        this.listeners.onUnlock = [];
        this.listeners.onStart = [];
        this.listeners.onComplete = [];
    }
    unlock() {
        this.isLocked = false;
        this.callListeners(this.listeners.onUnlock);
    }
    start() {
        this.callListeners(this.listeners.onStart);
    }
    complete() {
        this.isComplete = true;

        let experienceGained = this.level * 10 + 10;
        game.player.gainExperience(experienceGained);
        game.addRandomItem(this.level);

        game.player.currentMap.onAreaComplete(this);

        game.player.leaveArea();

        this.callListeners(this.listeners.onComplete);
    }
}

class Player extends Character {
    constructor() {
        super(
            new Attributes({
                damage: 30,
                speed: 1,
                health: 100,
                regeneration: 4
            })
        );

        this.listeners.onExperienceGain = [];
        this.listeners.onLevelUp = [];
        this.listeners.onItemEquip = [];
        this.listeners.onItemUnequip = [];
        this.listeners.onMapEnter = [];
        this.listeners.onAreaEnter = [];
        this.listeners.onFightingStop = [];

        this.experience = 0;
        this.gold = 0;
        this.equippedItems = {
            headArmor: null,
            bodyArmor: null,
            legArmor: null,
            footArmor1: null,
            footArmor2: null,
            weapon1: null,
            weapon2: null
        };

        this.currentMap = null;
        this.currentArea = null;
    }
    recalculateAttributes() {
        this.recalculateAttributesBasedOnLevel();

        // Item attributes addition
        let addAdditiveProperties = (property) => {
            if(property.type == "attributeFlat") {
                this.attributes[property.attribute] += property.value;
            }
        }

        for(var index in this.equippedItems){
            let item = this.equippedItems[index];
            if(item !== null) {
                item.implicitProperties.forEach(addAdditiveProperties);
                item.properties.forEach(addAdditiveProperties);
            }
        }

        // Item attributes multipliers

        this.callListeners(this.listeners.onChange);
    }
    update(dTime) {
        // Regeneration
        this.applyRegeneration(dTime);

        // Area
        if(this.currentArea !== null) {
            this.currentArea.applyRegeneration(dTime);

            this.dealDamageTo(this.currentArea, dTime);
            this.currentArea.dealDamageTo(this, dTime);

            if(this.currentHealth <= 0) {
                this.stopFighting();
            } 
            else if (this.currentArea.currentHealth <= 0) {
                this.currentArea.complete();
            }
        }
        
        // Map
        // if(this.currentMap !== null) {
        // }
    }
    enterMap(map) {
        if(map.isVisible && !map.isLocked){
            this.currentMap = map;
            map.start();
            this.callListeners(this.listeners.onMapEnter, map);
        }
    }
    enterArea(area) {
        if(area.isVisible && !area.isLocked && !area.isComplete){
            this.currentArea = area;
            area.start();
            this.callListeners(this.listeners.onAreaEnter, area);
        }
    }
    leaveMap() {
        this.currentMap = null;
    }
    leaveArea() {
        this.currentArea = null;
    }
    stopFighting() {
        this.currentArea = null;
        this.currentMap = null;
        this.callListeners(this.listeners.onFightingStop);
    }
    gainExperience(amount) {
        this.experience += amount;
        while(Player.getExperienceNeeded(this.level) <= this.experience) {
            this.experience -= Player.getExperienceNeeded(this.level);
            this.levelUp();
        }
        this.callListeners(this.listeners.onExperienceGain, this.experience);
    }
    levelUp() {
        this.level++;
        this.recalculateAttributes();
        // If level == 5, unlock first boss
        // if(this.level == 5) {
        //     game.objects.bossLevels[0].unlock();
        //     game.objects.bossLevels[0].show();
        // }
        this.callListeners(this.listeners.onLevelUp);
    }
    equipItem(item, slot) {
        this.unequipItem(slot);
        this.equippedItems[slot] = item;
        game.removeItemFromStash(item);
        this.recalculateAttributes();
        this.callListeners(this.listeners.onItemEquip, item);
        item.callListeners(item.listeners.onEquip);
    }
    unequipItem(slot) {
        if(this.equippedItems[slot] !== null) {
            let item = this.equippedItems[slot];
            game.addItemToStash(item);
            this.equippedItems[slot] = null;
            this.recalculateAttributes();
            this.callListeners(this.listeners.onItemUnequip, item);
            item.callListeners(item.listeners.onUnequip);
        }
    }
    // Returns the amount of experience needed to advance from level to level + 1
    static getExperienceNeeded(level) {
        return 70 + 25 * (level - 1) + 30 * Math.pow(1.1, level - 1);
    }
}

class Item extends ObservableObject {
    constructor(options) {
        super();
        let defaults = {
            type: "headArmor",
            name: "Unknown",
            level: 0,
            rarity: 0,
            implicitProperties: [],
            properties: []
        }
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        this.listeners.onUnequip = [];
        this.listeners.onEquip = [];

        this.initializeProperties();
    }
    initializeProperties() {
        this.implicitProperties.forEach((property) => {property.min = property.baseMin;});
        this.properties.forEach((property) => {property.min = property.baseMin;});
    }
    scaleToLevel() {
        let scaleProperty = (property) => {
            property.min = property.baseMin * (0.9 + 0.1 * this.level);
            property.max = property.baseMax * (0.9 + 0.1 * this.level);
        };
        this.implicitProperties.forEach(scaleProperty);
        this.properties.forEach(scaleProperty);

        this.rollProperties();
    }
    rollProperties() {
        let rollProperty = (property) => {
            let value = randomFloat(property.min, property.max);
            property.value = value;
        };
        this.implicitProperties.forEach(rollProperty);
        this.properties.forEach(rollProperty);
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
                            baseMin: 12,
                            baseMax: 12
                        }]
                    },
                    {
                        name: "Sword",
                        properties: [{
                            type: "attributeFlat",
                            attribute: "damage",
                            baseMin: 7,
                            baseMax: 7
                        },{
                            type: "attributeFlat",
                            attribute: "speed",
                            baseMin: 0.1,
                            baseMax: 0.1
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
                            baseMin: 0.2,
                            baseMax: 0.2
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
                            baseMin: 25,
                            baseMax: 25
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
                            baseMin: 5,
                            baseMax: 5
                        }, {
                            type: "attributeFlat",
                            attribute: "speed",
                            baseMin: 0.1,
                            baseMax: 0.1
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
                            baseMin: 5,
                            baseMax: 5
                        }, {
                            type: "attributeFlat",
                            attribute: "speed",
                            baseMin: 0.1,
                            baseMax: 0.1
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

        let item = new Item({
            implicitProperties: implicitProperties,
            properties: properties,
            type: itemType,
            name: baseType.name,
            rarity: propertyCount,
            level: level
        });

        item.scaleToLevel();

        return item;
    }
}