function extend (defaults, options) {
    if(options == undefined) {
        return defaults;
    }
    let settings = [];
    for(var index in defaults) {
        if(options[index] !== undefined){
            settings[index] = options[index];
        } else {
            settings[index] = defaults[index];
        }
    }
    return settings;
}

function mergeObjects(mainObject, addedObject) {
    for(var index in addedObject) {
        mainObject[index] = addedObject[index];
    }
    return mainObject;
}

function copyArray(array) {
    return array.concat();
}

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

function prettyWord(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
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