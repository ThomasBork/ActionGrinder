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
        Item.initializeItemSystem();

        this.player = new Player();

        let plainsMap = new FarmMap("Plains", 1);
        let mountainMap = new FarmMap("Mountain", 5);
        let swampMap = new FarmMap("Swamp", 10);
        let graveyardMap = new FarmMap("Graveyard", 15);

        plainsMap.gatedMaps.push(mountainMap);
        mountainMap.gatedMaps.push(swampMap);
        swampMap.gatedMaps.push(graveyardMap);

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
        let areaTypeOptions = ["lethal", "armored", "regenerating", "weak", "squishy"];
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
                case "lethal":
                    attributes.damage *= 3;
                    break;
                case "armored":
                    attributes.armor *= 2;
                    attributes.health *= 2;
                    break;
                case "regenerating":
                    attributes.regeneration *= 5;
                    break;
                case "weak":
                    attributes.damage *= 0.5;
                    break;
                case "squishy":
                    attributes.health *= 0.5;
                    break;
                default:
                    console.log("Unknown area type: " + areaType);
                    break;
            }

            let area = new Area(new Attributes(attributes), this.level, areaType);

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
        this.attackCooldown = 0;
    }
    getLevelMultiplierAmount() {
        return 0.1;
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
        let levelMultiplierAmount = this.getLevelMultiplierAmount();
        let levelMultiplier = Attributes.getMultiplier(levelMultiplierAmount);
        let levelAttributes = new Attributes();
        levelAttributes.add(this.baseAttributes);
        levelAttributes.multiply(levelMultiplier);
        for(var i = 1; i<this.level; i++) {
            this.attributes.add(levelAttributes);
        } 
    }
    dealDamageTo(character) {
        let damageDealt = this.attributes.damage;
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
    constructor(attributes, level, type) {
        super(attributes);

        this.level = level;
        this.type = type;
        this.recalculateAttributes();

        this.isComplete = false;
        this.isVisible = true;
        this.isLocked = true;

        this.listeners.onUnlock = [];
        this.listeners.onStart = [];
        this.listeners.onComplete = [];
    }
    getLevelMultiplierAmount() {
        return 0.3;
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
            else if(property.type == "attributePerLevel") {
                this.attributes[property.attribute] += property.value * this.level;
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
        let addMultiplicativeProperties = (property) => {
            if(property.type == "attributePercent") {
                this.attributes[property.attribute] *= 1 + property.value;
            }
        }

        for(var index in this.equippedItems){
            let item = this.equippedItems[index];
            if(item !== null) {
                item.implicitProperties.forEach(addMultiplicativeProperties);
                item.properties.forEach(addMultiplicativeProperties);
            }
        }

        // Item attribute per attribute
        let attributePerAttributeSet = new Attributes();
        let addAttributePerAttributeProperties = (property) => {
            if(property.type == "attributePerAttribute") {
                attributePerAttributeSet[property.args[0]] += property.value * this.attributes[property.args[1]];
            }
        }

        for(var index in this.equippedItems){
            let item = this.equippedItems[index];
            if(item !== null) {
                item.implicitProperties.forEach(addAttributePerAttributeProperties);
                item.properties.forEach(addAttributePerAttributeProperties);
            }
        }
        this.attributes.add(attributePerAttributeSet);


        this.callListeners(this.listeners.onChange);
    }
    update(dTime) {
        // Regeneration
        this.applyRegeneration(dTime);

        // Area
        if(this.currentArea !== null) {
            this.currentArea.applyRegeneration(dTime);

            // Deal damage
            this.attackCooldown -= this.attributes.speed * dTime;
            while(this.attackCooldown <= 0) {
                this.attackCooldown += 1;
                this.dealDamageTo(this.currentArea);
            }

            // Take damage
            this.currentArea.attackCooldown -= this.currentArea.attributes.speed * dTime;
            while(this.currentArea.attackCooldown <= 0) {
                this.currentArea.attackCooldown += 1;
                this.currentArea.dealDamageTo(this);
            }

            if(this.currentHealth <= 0) {
                this.currentHealth = 0;
                this.stopFighting();
            } 
            else if (this.currentArea.currentHealth <= 0) {
                this.currentArea.currentHealth = 0;
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
        this.attackCooldown = 0;
    }
    leaveArea() {
        this.currentArea = null;
        this.attackCooldown = 0;
    }
    stopFighting() {
        this.currentArea = null;
        this.currentMap = null;
        this.attackCooldown = 0;
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

class ItemProperty {
    constructor(options) {
        let defaults = {
            type: "attributeFlat",
            attribute: "armor",
            baseMin: null,
            baseMax: null,
            min: null,
            max: null,
            value: null,
            isSpecial: false,
            args: []
        };
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        if(this.baseMin === null) {
            this.baseMin = this.baseMax;
        } else if (this.baseMax === null) {
            this.baseMax = this.baseMin;
        }
    }
}

class ItemType {
    constructor(options) {
        let defaults = {
            type: "weapon",
            name: "Unknown",
            properties: [],
            tags: []
        };
        let settings = extend(defaults, options);
        mergeObjects(this, settings);
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
            properties: [],
            tags: []
        }
        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        this.listeners.onUnequip = [];
        this.listeners.onEquip = [];

        this.initializeProperties();
    }
    initializeProperties() {
        this.implicitProperties.forEach((property) => {
            property.min = property.baseMin;
            property.max = property.baseMax;
        });
        this.properties.forEach((property) => {
            property.min = property.baseMin;
            property.max = property.baseMax;
        });
    }
    scaleToLevel() {
        let scaleProperty = (property) => {
            if(property.type == "attributeFlat") {
                property.min = property.baseMin * (0.9 + 0.1 * this.level);
                property.max = property.baseMax * (0.9 + 0.1 * this.level);
            } else if (property.type == "attributePercent") {
                property.min = property.baseMin * (0.96 + 0.04 * this.level);
                property.max = property.baseMax * (0.96 + 0.04 * this.level);
            }
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
    static initializeItemSystem() {
        Item.properties = {
            damage: {
                type: "attributeFlat",
                attribute: "damage",
                baseMin: 1,
                baseMax: 8
            },
            speed: {
                type: "attributeFlat",
                attribute: "speed",
                baseMin: 0.02,
                baseMax: 0.1
            },
            armor: {
                type: "attributeFlat",
                attribute: "armor",
                baseMin: 1,
                baseMax: 20
            },
            health: {
                type: "attributeFlat",
                attribute: "health",
                baseMin: 10,
                baseMax: 50
            },
            regeneration: {
                type: "attributeFlat",
                attribute: "regeneration",
                baseMin: 0.1,
                baseMax: 0.5
            },
            percent_damage: {
                type: "attributePercent",
                attribute: "damage",
                baseMin: 0.01,
                baseMax: 0.05
            },
            percent_speed: {
                type: "attributePercent",
                attribute: "speed",
                baseMin: 0.01,
                baseMax: 0.05
            },
            percent_armor: {
                type: "attributePercent",
                attribute: "armor",
                baseMin: 0.01,
                baseMax: 0.05
            },
            percent_health: {
                type: "attributePercent",
                attribute: "health",
                baseMin: 0.01,
                baseMax: 0.05
            },
            percent_regeneration: {
                type: "attributePercent",
                attribute: "regeneration",
                baseMin: 0.01,
                baseMax: 0.05
            }
        };

        // Convert all property objects to instances of ItemProperty
        for(var index in Item.properties){
            Item.properties[index] = new ItemProperty(Item.properties[index]);
        }

        Item.itemTypes = {
            weapon: [
                {
                    name: "Axe",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "damage",
                        baseMin: 12
                    }]
                },
                {
                    name: "Sword",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "damage",
                        baseMin: 7
                    },{
                        type: "attributeFlat",
                        attribute: "speed",
                        baseMin: 0.1
                    }]
                },
                {
                    name: "Claw",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "damage",
                        baseMin: 3
                    },{
                        type: "attributeFlat",
                        attribute: "speed",
                        baseMin: 0.2
                    }]
                },
                {
                    name: "Spiked Shield",
                    tags: ["shield"],
                    properties: [{
                        type: "attributeFlat",
                        attribute: "damage",
                        baseMin: 2
                    },{
                        type: "attributeFlat",
                        attribute: "armor",
                        baseMin: 25
                    }]
                },
                {
                    name: "Tower Shield",
                    tags: ["shield"],
                    properties: [{
                        type: "attributeFlat",
                        attribute: "armor",
                        baseMin: 40
                    }]
                }
            ],
            headArmor: [
                {
                    name: "Magic Hat",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "speed",
                        baseMin: 0.2
                    }]
                },
                {
                    name: "Leather Cap",
                    properties: [
                        {
                            type: "attributeFlat",
                            attribute: "armor",
                            baseMin: 10
                        },{
                            type: "attributeFlat",
                            attribute: "speed",
                            baseMin: 0.1
                        }
                    ]
                },
                {
                    name: "Crown",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "damage",
                        baseMin: 5
                    }]
                },
                {
                    name: "Helm",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "armor",
                        baseMin: 20
                    }]
                }
            ],
            bodyArmor: [
                {
                    name: "Plate Mail",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "armor",
                        baseMin: 25
                    }]
                },
                {
                    name: "Leather Armor",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "armor",
                        baseMin: 15
                    },{
                        type: "attributeFlat",
                        attribute: "health",
                        baseMin: 25
                    }]
                }
            ],
            legArmor: [
                {
                    name: "Leather Pants",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "armor",
                        baseMin: 10
                    }, {
                        type: "attributeFlat",
                        attribute: "speed",
                        baseMin: 0.1
                    }]
                },
                {
                    name: "Chain Pants",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "armor",
                        baseMin: 20
                    }, {
                        type: "attributeFlat",
                        attribute: "health",
                        baseMin: 20
                    }]
                }
            ],
            footArmor: [
                {
                    name: "Leather Boot",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "armor",
                        baseMin: 7
                    }, {
                        type: "attributeFlat",
                        attribute: "speed",
                        baseMin: 0.1
                    }]
                },
                {
                    name: "Wooden Boot",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "armor",
                        baseMin: 15
                    }]
                },
                {
                    name: "Spiked Boot",
                    properties: [{
                        type: "attributeFlat",
                        attribute: "armor",
                        baseMin: 5
                    }, {
                        type: "attributeFlat",
                        attribute: "damage",
                        baseMin: 5
                    }]
                }
            ]
        };

        Item.uniqueItemTypes = {
            weapon: [
                {
                    name: "Golden Sword",
                    properties: [{
                        type: "attributePerAttribute",
                        args: ["damage", "speed"],
                        baseMin: 15
                    }]
                },
                {
                    name: "Facepeeler",
                    properties: [{
                        type: "attributePerLevel",
                        attribute: "damage",
                        baseMin: 3
                    },{
                        type: "attributePerLevel",
                        attribute: "speed",
                        baseMin: 0.05
                    }]
                }
            ],
            headArmor: [
                {
                    name: "Golden Hat",
                    properties: [{
                        type: "attributePerAttribute",
                        args: ["damage", "health"],
                        baseMin: 0.1
                    }]
                }
            ],
            bodyArmor: [
                {
                    name: "Golden Mail",
                    properties: [{
                        type: "attributePerAttribute",
                        args: ["damage", "armor"],
                        baseMin: 0.2
                    }]
                }
            ],
            legArmor: [
                {
                    name: "Golden Pants",
                    properties: [{
                        type: "attributePerAttribute",
                        args: ["damage", "regeneration"],
                        baseMin: 5
                    }]
                }
            ],
            footArmor: [
                {
                    name: "Golden Boot",
                    properties: [{
                        type: "attributePerAttribute",
                        args: ["damage", "speed"],
                        baseMin: 15
                    }]
                }
            ]
        };

        // Convert all item objects to instances of ItemType
        for(var index in Item.itemTypes){
            var typeArray = Item.itemTypes[index];
            for(var iType = 0; iType < typeArray.length; iType++) {
                var type = typeArray[iType];
                for(var iProperty = 0; iProperty < type.properties.length; iProperty++) {
                    type.properties[iProperty] = new ItemProperty(type.properties[iProperty]);
                }
                typeArray[iType] = new ItemType(typeArray[iType]);
            }
        }
        for(var index in Item.uniqueItemTypes){
            var typeArray = Item.uniqueItemTypes[index];
            for(var iType = 0; iType < typeArray.length; iType++) {
                var type = typeArray[iType];
                for(var iProperty = 0; iProperty < type.properties.length; iProperty++) {
                    type.properties[iProperty] = new ItemProperty(type.properties[iProperty]);
                }
                typeArray[iType] = new ItemType(typeArray[iType]);
            }
        }

        Item.weightedItemProperties = {
            weapon: [
                [10, Item.properties.damage],
                [10, Item.properties.speed],
                [4, Item.properties.health],
                [2, Item.properties.regeneration],
                [5, Item.properties.percent_damage],
                [5, Item.properties.percent_speed],
                [2, Item.properties.percent_health],
                [1, Item.properties.percent_regeneration]
            ],
            headArmor: [
                [10, Item.properties.armor],
                [4, Item.properties.speed],
                [10, Item.properties.health],
                [4, Item.properties.regeneration],
                [5, Item.properties.percent_armor],
                [2, Item.properties.percent_speed],
                [5, Item.properties.percent_health],
                [2, Item.properties.percent_regeneration]
            ],
            bodyArmor: [
                [10, Item.properties.armor],
                [4, Item.properties.speed],
                [10, Item.properties.health],
                [4, Item.properties.regeneration],
                [5, Item.properties.percent_armor],
                [2, Item.properties.percent_speed],
                [5, Item.properties.percent_health],
                [2, Item.properties.percent_regeneration]
            ],
            legArmor: [
                [10, Item.properties.armor],
                [10, Item.properties.speed],
                [4, Item.properties.health],
                [4, Item.properties.regeneration],
                [5, Item.properties.percent_armor],
                [5, Item.properties.percent_speed],
                [2, Item.properties.percent_health],
                [2, Item.properties.percent_regeneration]
            ],
            footArmor: [
                [6, Item.properties.armor],
                [10, Item.properties.speed],
                [4, Item.properties.health],
                [2, Item.properties.regeneration],
                [6, Item.properties.damage],
                [3, Item.properties.percent_armor],
                [5, Item.properties.percent_speed],
                [2, Item.properties.percent_health],
                [1, Item.properties.percent_regeneration],
                [3, Item.properties.percent_damage]
            ]
        }
    }
    static getWeightedProperties(itemType, itemSlot) {
        let propertyDictionary = {
            armor: 2,
            speed: 2,
            health: 2,
            regeneration: 2,
            damage: 2,
            percent_armor: 1,
            percent_speed: 1,
            percent_health: 1,
            percent_regeneration: 1,
            percent_damage: 1
        };

        switch(itemSlot) {
            case "weapon":
                if(itemType.tags.includes("shield")) {
                    propertyDictionary.armor = 4;
                    propertyDictionary.percent_armor = 4;
                    propertyDictionary.damage = 0;
                    propertyDictionary.percent_damage = 0;
                } else {
                    propertyDictionary.armor = 0;
                    propertyDictionary.percent_armor = 0;
                    propertyDictionary.damage = 4;
                    propertyDictionary.percent_damage = 4;
                    propertyDictionary.speed = 4;
                    propertyDictionary.percent_speed = 4;
                }
                break;
            case "headArmor": 
                propertyDictionary.armor = 4;
                propertyDictionary.percent_armor = 4;
                propertyDictionary.damage = 0;
                propertyDictionary.percent_damage = 0;
                break;
            case "bodyArmor": 
                propertyDictionary.armor = 4;
                propertyDictionary.percent_armor = 4;
                propertyDictionary.regeneration = 4;
                propertyDictionary.percent_regeneration = 4;
                propertyDictionary.damage = 0;
                propertyDictionary.percent_damage = 0;
                break;
            case "legArmor": 
                propertyDictionary.armor = 4;
                propertyDictionary.percent_armor = 4;
                propertyDictionary.speed = 4;
                propertyDictionary.percent_speed = 4;
                propertyDictionary.damage = 0;
                propertyDictionary.percent_damage = 0;
                break;
            case "footArmor": 
                propertyDictionary.speed = 4;
                propertyDictionary.percent_speed = 4;
                break;
        }

        // Build and return weighted properties
        let weightedProperties = [];
        for(var index in propertyDictionary) {
            weightedProperties.push([
                propertyDictionary[index],  // Weight
                Item.properties[index]      // Property
            ]);
        }
        return weightedProperties;
    }
    static randomItem (level) {
        let itemSlot = randomElementWeighted([
            [1, "headArmor"],
            [1, "bodyArmor"],
            [1, "legArmor"],
            [2, "footArmor"],
            [4, "weapon"]
        ]);

        let implicitProperties = [];
        let properties = [];
        let propertyCount = 0;
        let itemArray = null;

        let propertyCompareFunction = (p1, p2) => {
            if(p1.attribute == p2.attribute) {
                if(p1.type > p2.type){
                    return 1;
                } else {
                    return -1;
                }
            } else {
                if(p1.attribute > p2.attribute){
                    return 1;
                } else {
                    return -1;
                }
            }
        }

        let isUnique = Math.random() < 0.02;
        if(isUnique) {
            itemArray = Item.uniqueItemTypes;
        } else {
            itemArray = Item.itemTypes;
            propertyCount = randomInt(1, 4);
        }
    
        let itemType = randomElement(itemArray[itemSlot]);
        let propertiesWeighted = copyArray(Item.getWeightedProperties(itemType, itemSlot));

        for(var i = 0; i<itemType.properties.length; i++) {
            let property = itemType.properties[i];
            let propertyCopy = copyObject(property);
            implicitProperties.push(propertyCopy);
        }

        for(var i = 0; i<propertyCount; i++) {
            let property = randomElementWeighted(propertiesWeighted);
            removeWeightedElement(propertiesWeighted, property);
            let propertyCopy = copyObject(property);
            properties.push(propertyCopy);
        }

        implicitProperties.sort(propertyCompareFunction);
        properties.sort(propertyCompareFunction);

        let item = new Item({
            implicitProperties: implicitProperties,
            properties: properties,
            type: itemSlot,
            name: itemType.name,
            rarity: propertyCount == 0 ? 5 : propertyCount,
            level: level,
            tags: copyArray(itemType.tags)
        });

        item.scaleToLevel();

        return item;
    }
}