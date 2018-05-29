class STGameObject {
    constructor(options) {
        let defaults = {
            x: 0,
            y: 0,
            z: 0,
            width: 10,
            height: 10,
            relativeX: 0,
            relativeY: 0,
            relativeWidth: 1,
            relativeHeight: 1,
            left: null,
            top: null,
            right: null,
            bottom: null,
            isPositionRelativeToParent: false,
            isSizeRelativeToParent: false,
            isVisible: true,
            parent: null,
            children: [],
            customOnClick: null,
            customOnMouseOver: null,
            isMouseOver: false
        };

        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        if(STGameObject.nextId === undefined) {
            STGameObject.nextId = 0;
        }
        this.id = STGameObject.nextId;
        STGameObject.nextId++;

        // Set relative z
        this.relativeZ = this.z;
        if(this.relativeZ == 0) {
            this.relativeZ = 0.0001;
        }

        // Update relative position
        if(this.isPositionRelativeToParent) {
            this.relativeX = this.x;
            this.relativeY = this.y;
        }
        // Update relative size
        if(this.isSizeRelativeToParent) {
            this.relativeWidth = this.width;
            this.relativeHeight = this.height;
        }

        // Custom event handlers
        if(this.customOnClick !== null) {
            this.onClick = this.customOnClick;
        }
    }
    addChild(object) {
        this.children.push(object);
        object.parent = this;
        if(!(object instanceof STCanvas)){
            object.setContext(this.context);
        }

        // Handle children with relative position or size
        object.updateRelativeVariables(); 

        // Sort children from highest z value to lowest
        this.children.sort(STGameObject.compareZBackToFront);
    }
    updateRelativeVariables() {
        // Update this
        if(this.parent !== null) {
            // Handle relative size
            if(this.isSizeRelativeToParent) {
                this.width = this.parent.width * this.relativeWidth;
                this.height = this.parent.height * this.relativeHeight;
            }

            // Handle relative position
            if(this.isPositionRelativeToParent) {
                this.x = this.parent.x + this.relativeX;
                this.y = this.parent.y + this.relativeY;
            }
            if(this.left !== null) {
                this.x = this.parent.x + this.left;
            }
            if(this.right !== null) {
                this.x = this.parent.x + this.parent.width - this.width - this.right;
            }
            if(this.top !== null) {
                this.y = this.parent.y + this.top;
            }
            if(this.bottom !== null) {
                this.y = this.parent.y + this.parent.height - this.height - this.bottom;
            }
            // Remove offset if parent is a canvas
            if(this.parent instanceof STCanvas){
                this.x -= this.parent.x;
                this.y -= this.parent.y;
            }

            // Handle relative z
            this.z = this.parent.z + this.relativeZ;
        }

        // Update children
        this.children.forEach((object) => {
            object.updateRelativeVariables();
        });
    }
    empty() {
        this.children = [];
    }
    removeChild(object) {
        this.children = this.children.filter(function(e) { return e !== object; });
        if(object.parent == this) {
            object.parent = null;
        }
    }
    remove() {
        if(this.parent != null) {
            this.parent.removeChild(this);
        }
    }
    setContext(context) {
        this.context = context;
        for(var index in this.children) {
            let child = this.children[index];
            if(!(child instanceof STCanvas)){
                child.setContext(context);
            }
        }
    }
    hide() {
        this.isVisible = false;
    }
    show() {
        this.isVisible = true;
    }
    update(dTime) {
        if(this.onUpdate !== undefined) {
            this.onUpdate(dTime);
        }
        //this.updateChildren(dTime);
    }
    updateChildren(dTime) {
        for(var index in this.children) {
            this.children[index].update(dTime);
        }
    }
    draw() {
        this.drawChildren();
    }
    drawChildren() {
        for(var index in this.children) {
            if(this.children[index].isVisible) {
                this.children[index].draw();
            }
        }
    }
    containsPoint(globalX, globalY) {
        let locals = this.getLocalCoordinates(globalX, globalY);
        return ( this.x <= locals.x && locals.x < this.x + this.width ) &&
            ( this.y <= locals.y && locals.y < this.y + this.height );
    }
    findObjects(predicate) {
        let matchedObjects = [];
        for(var index in this.children) {
            let object = this.children[index];
            if(predicate(object)) {
                matchedObjects.push(object);
            }
            matchedObjects = matchedObjects.concat(object.findObjects(predicate));
        }
        return matchedObjects;
    }
    findObjectsOnPoint(x, y, predicate) {
        // Find all objects on point
        let matchedObjects = this.findObjects((obj) => {
            return obj.containsPoint(x, y);
        });

        // Filter matched objects based on predicate
        if(predicate !== undefined && predicate !== null) {
            matchedObjects = matchedObjects.filter(predicate);
        }

        return matchedObjects;
    }
    getLocalCoordinates(globalX, globalY) {
        let canvas = this.getContainingCanvas();
        if(canvas !== null) {
            let localCoordinates = canvas.getLocalCoordinates(globalX, globalY);
            return {
                x: (localCoordinates.x - canvas.x - canvas.viewportX) / canvas.scaleX,
                y: (localCoordinates.y - canvas.y - canvas.viewportY) / canvas.scaleY
            }
        } else {
            return {
                x: globalX,
                y: globalY
            };
        }
    }
    getGlobalCoordinates(localX, localY) {
        let canvas = this.getContainingCanvas();
        if(canvas !== null) {
            return canvas.getGlobalCoordinates(localX, localY);
        } else {
            return {
                x: localX,
                y: localY
            };
        }
    }
    handleSingleEvent(globalX, globalY, args, handlerName, onVisible, predicate) {
        if(!this.isVisible) {
            return false;
        } else { 
            if(onVisible != undefined) {
                onVisible(this);
            }

            // Reverse iteration to test top-most elements first
            for(var i = this.children.length - 1; i >= 0; i--) {
                let child = this.children[i];
                // If the child contains the click
                if(child.containsPoint(globalX, globalY)) {
                    // If the child handled the click
                    if(child.handleSingleEvent(globalX, globalY, args, handlerName, onVisible, predicate)){
                        return true;
                    }
                }
            }

            // No child handled the click event, handle this.
            let localCoordinates = this.getLocalCoordinates(globalX, globalY);
            let predicateTest = true;
            if(predicate != undefined){
                predicateTest = predicate(this);
            }
            if(this[handlerName] !== undefined && predicateTest) {
                let arg = [localCoordinates.x, localCoordinates.y];
                args.forEach((element)=>{arg.push(element);});
                this[handlerName].apply(this, arg);
                return true;
            } else {
                return false;
            }
        }
    }
    handleMouseMove(globalX, globalY) {
        this.handleSingleEvent(globalX, globalY, [], "onMouseMove", (element) => {
            element.isMouseOver = true;
        });
    }
    handleMouseDown(globalX, globalY) {
        this.handleSingleEvent(globalX, globalY, [], "onMouseDown");
        this.getGame().lastMouseDownEvent = {
            date: new Date(),
            globalX: globalX,
            globalY: globalY
        };
    }
    handleMouseUp(globalX, globalY) {
        this.handleSingleEvent(globalX, globalY, [], "onMouseUp");
        this.handleSingleEvent(globalX, globalY, [], "onClick", null, (element) => {
            let event = element.getGame().lastMouseDownEvent;
            if(event.date != null) {
                let now = new Date().getTime();
                let diff = now - event.date.getTime();
                return diff < 150;
            } else {
                return false;
            }
        });
    }
    handleMouseLeave(globalX, globalY) {
        if(this.isMouseOver && (!this.isVisible || !this.containsPoint(globalX, globalY))) {
            if(this.onMouseLeave !== undefined) {
                this.onMouseLeave();
                this.isMouseOver = false;
            }
        }
        this.children.forEach((child) => {
            child.handleMouseLeave(globalX, globalY);
        });
    }
    handleScroll(globalX, globalY, speed) {
        this.handleSingleEvent(globalX, globalY, [speed], "onScroll");
    }
    getAncestor(type) {
        if(this.parent === null) {
            return null;
        } else if(this.parent instanceof type) {
            return this.parent;
        } else {
            return this.parent.getAncestor(type);
        }
    }
    getGame() {
        if(this instanceof STGame) {
            return this;
        } else {
            return this.parent.getGame();
        }
    }
    getContainingCanvas() {
        return this.getAncestor(STCanvas);
    }
    getGlobalPosition(x, y) {
        let canvas = this.getContainingCanvas();
        if(canvas === null) {
            return {x: x, y: y};
        } else {
            return canvas.getGlobalPosition(canvas.x + x, canvas.y + y);
        }
    }
    static compareZFrontToBack (objA, objB) {
        if(objA.z < objB.z){ return -1; }
        if(objA.z > objB.z){ return 1; }
        return 0;
    }
    static compareZBackToFront (objA, objB) {
        if(objA.z > objB.z){ return -1; }
        if(objA.z < objB.z){ return 1; }
        return 0;
    }
}

class STCanvas extends STGameObject {
    constructor(options) {
        super(options);
        this.canvas = document.createElement("canvas");
        this.canvas.classList.add("game-canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext("2d");
        this.viewportX = 0;
        this.viewportY = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.descendants = [];
    }
    addDescendant(object) {
        this.descendants.push(object);
        if(!(object instanceof STCanvas)){
            object.setContext(this.context);
        }

        // Sort children from highest z value to lowest
        this.descendants.sort(STGameObject.compareZBackToFront);
    }
    removeDescendant(object) {
        this.descendants = this.descendants.filter(function(e) { return e !== object; });
        if(object.parent == this) {
            object.parent = null;
        }
    }
    draw() {
        // Reset the transform
        this.context.setTransform(1,0,0,1,0,0);

        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Translate according to viewport
        this.context.translate( this.viewportX, this.viewportY ); 

        // Apply zoom
        this.context.scale(this.scaleX, this.scaleY);

        // Draw objects
        this.drawChildren();

        // Draw self on parent
        if(this.parent !== null) {
            this.parent.context.drawImage(this.canvas, this.x, this.y, this.width, this.height);
        }
    }
    drawDescendants() {
        for(var i = 0; i<this.descendants.length; i++) {
            if(this.descendants[i].isVisible){
                this.descendants[i].draw();
            }
        } 
    }
    containsGlobalPoint(x, y) {
        return ( this.canvas.offsetLeft <= x && x < this.canvas.offsetLeft + this.canvas.offsetWidth ) &&
            ( this.canvas.offsetTop <= y && y < this.canvas.offsetTop + this.canvas.offsetHeight );
    }
    getGlobalCoordinates(localX, localY) {
        let relativeCoordinates = {
            x: localX + this.x + this.viewportX,
            y: localY + this.y + this.viewportY
        };
        let canvas = this.getContainingCanvas();
        if(canvas !== null) {
            return canvas.getGlobalCoordinates(relativeCoordinates.x, relativeCoordinates.y);
        } else {
            return relativeCoordinates;
        }
    }
}

class STGame extends STCanvas {
    constructor(options) {
        super(options);
        let defaults = {
            htmlContainer: null,
            isStarted: false,
            updateTimeoutId: null,
            updateInterval: 1000 / 60,
            lastUpdateTimestamp: null,
            millisecondsToUpdate: 0,
            lastMouseDownEvent: {
                date: null,
                globalX: null,
                globalY: null
            }
        };

        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        // Reset container
        this.htmlContainer.innerHTML = "";
        this.htmlContainer.appendChild(this.canvas);
        this.htmlContainer.tabIndex = 1;
        this.htmlContainer.focus();

        // Set up events
        this.htmlContainer.addEventListener("mousedown", (e) => {
            this.handleGlobalMouseDown(e.clientX, e.clientY);
        });
        this.htmlContainer.addEventListener("mouseup", (e) => {
            this.handleGlobalMouseUp(e.clientX, e.clientY);
        });
        this.htmlContainer.addEventListener("mousemove", (e) => {
            this.handleGlobalMouseMove(e.clientX, e.clientY);
        });
        this.htmlContainer.addEventListener("keypress", (e) => {
            this.handleKeyPress(e.keyCode);
        });
        this.htmlContainer.addEventListener("keyup", (e) => {
            this.handleKeyUp(e.keyCode);
        });
        this.htmlContainer.addEventListener("keydown", (e) => {
            this.handleKeyDown(e.keyCode);
        });
        this.htmlContainer.addEventListener("wheel", (e) => {
            this.handleGlobalScroll(e.clientX, e.clientY, e.deltaY);
        });
    }
    start() {
        this.isStarted = true;
        this.lastUpdateTimestamp = Date.now();
        this.draw();
        this.delayNextGameLoop();
    }
    delayNextGameLoop() {
        this.updateTimeoutId = setTimeout(() => {
            this.gameLoop();
        }, this.updateInterval);
    }
    gameLoop() {
        let now = Date.now();
        let dTime = now - this.lastUpdateTimestamp;
        this.lastUpdateTimestamp = now;
        this.millisecondsToUpdate += dTime;
        while(this.millisecondsToUpdate > this.updateInterval) {
            this.millisecondsToUpdate -= this.updateInterval;
            // Call update with dTime in seconds
            this.update(this.updateInterval / 1000);
        }

        this.draw();

        this.delayNextGameLoop();
    }
    getGameCoordinates(clientX, clientY) {
        let x = clientX;
        let y = clientY;

        // Apply css
        x -= this.canvas.offsetLeft;
        y -= this.canvas.offsetTop;
        x *= this.width / this.canvas.offsetWidth;
        y *= this.height / this.canvas.offsetHeight;

        return {x: x, y: y};
    }
    handleGlobalMouseDown(clientX, clientY) {
        let gameCoordinates = this.getGameCoordinates(clientX, clientY);
        let x = gameCoordinates.x;
        let y = gameCoordinates.y;
        return this.handleMouseDown(x, y);
    }
    handleGlobalMouseUp(clientX, clientY) {
        let gameCoordinates = this.getGameCoordinates(clientX, clientY);
        let x = gameCoordinates.x;
        let y = gameCoordinates.y;
        return this.handleMouseUp(x, y);
    }
    handleGlobalMouseMove(clientX, clientY) {
        let gameCoordinates = this.getGameCoordinates(clientX, clientY);
        let x = gameCoordinates.x;
        let y = gameCoordinates.y;
        this.handleMouseLeave(x, y);
        return this.handleMouseMove(x, y);
    }
    handleKeyPress(keyCode) {
        if(this.onKeyPress !== undefined) {
            this.onKeyPress(keyCode);
        }
    }
    handleKeyUp(keyCode) {
        if(this.onKeyUp !== undefined) {
            this.onKeyUp(keyCode);
        }
    }
    handleKeyDown(keyCode) {
        if(this.onKeyDown !== undefined) {
            this.onKeyDown(keyCode);
        }
    }
    handleGlobalScroll(clientX, clientY, speed) {
        let gameCoordinates = this.getGameCoordinates(clientX, clientY);
        let x = gameCoordinates.x;
        let y = gameCoordinates.y;
        return this.handleScroll(x, y, speed);
    }
}

class STRect extends STGameObject{
    constructor(options) {
        super(options);
        let defaults = {
            color: "white",
            borderColor: "black",
            borderSize: 0
        };

        let settings = extend(defaults, options);

        mergeObjects(this, settings);
    }
    draw() {
        this.context.fillStyle = this.borderColor;
        this.context.fillRect(this.x, this.y, this.width, this.height);
        this.context.fillStyle = this.color;
        this.context.fillRect(this.x + this.borderSize, this.y + this.borderSize, this.width - 2 * this.borderSize, this.height - 2 * this.borderSize);

        this.drawChildren();
    }
}

class STProgressBar extends STRect {
    constructor(options) {
        super(options);
        let defaults = {
            value: 0,
            minValue: 0,
            maxValue: 1,
            fillColor: "red",
            fillObject: null
        };

        let settings = extend(defaults, options);

        mergeObjects(this, settings);

        this.fillObject = new STRect({
            isPositionRelativeToParent: true,
            color: this.fillColor,
            width: this.getFillPercent() * (this.width - this.borderSize),
            height: this.height - this.borderSize
        });

        this.addChild(this.fillObject);
    }
    setValue(value) {
        this.value = value;
        if(this.value < this.minValue) {this.value = this.minValue;}
        if(this.value > this.maxValue) {this.value = this.maxValue;}
        this.fillObject.width = this.getFillPercent() * (this.width - this.borderSize);
    }
    getFillPercent () {
        return (this.value - this.minValue) / ( this.maxValue - this.minValue );  
    }
}

class STText extends STGameObject {
    constructor(options) {
        super(options);
        let defaults = {
            color: "white",
            text: "",
            font: "Arial",
            fontSize: 14,
            fontString: "14px Arial",
            isRightToLeft: false
        }

        let settings = extend(defaults, options);

        mergeObjects(this, settings);

        this.updateFontString();
    }
    setText(value) {
        this.text = value;
        this.updateFontString();
    }
    updateFontString() {
        this.fontString = this.fontSize + "px " + this.font;
    }
    draw() {
        this.context.save();
        this.context.font = this.fontString;
        this.context.fillStyle = this.color;
        let drawX = this.x;
        if(this.isRightToLeft) {
            drawX = this.x + this.width - this.context.measureText(this.text).width;
        }
    
        this.context.fillText(this.text, drawX, this.y + this.fontSize);
        this.context.restore();
    }
}

class STImage extends STGameObject {
    constructor(options) {
        super(options);
        let defaults = {
            path: "",
            image: null,
            isLoaded: false,
            isFlippedHorizontally: false,
            isFlippedVertically: false
        };

        let settings = extend(defaults, options);

        mergeObjects(this, settings);
        this.setPath(this.path);
    }
    setPath(path) {
        this.path = path;
        this.image = new Image();
        this.image.onload = () => {
            this.isLoaded = true;
        };
        this.image.src = this.path;
    }
    draw() {
        if(this.isLoaded) {
            this.context.save();
            let drawX = this.x;
            let drawY = this.y;
            if(this.isFlippedHorizontally && this.isFlippedVertically) {
                this.context.scale(-1, -1);
                drawX = -drawX - this.width;
                drawY = -drawY - this.height;
            }
            else if(this.isFlippedHorizontally) {
                this.context.scale(-1, 1);
                drawX = -drawX - this.width;
            }
            else if(this.isFlippedVertically) {
                this.context.scale(1, -1);
                drawY = -drawY - this.height;
            }
            this.context.drawImage(this.image, drawX, drawY, this.width, this.height);
            this.context.restore();
            this.drawChildren();
        }
    }
}

class STWindow extends STRect {
    constructor(options) {
        super(options);
        let defaults = {
            hasCloseButton: true,
            closeButton: null
        };

        let settings = extend(defaults, options);
        mergeObjects(this, settings);

        if(this.hasCloseButton) {
            this.closeButton = new STImage({
                top: 5,
                right: 5,
                width: 16,
                height: 16,
                path: "img/closeWindow.png",
                customOnClick: () => {
                    // Close window
                    this.close();
                }
            });
            this.addChild(this.closeButton);
        }
    }
    close() {
        this.hide();
        if(this.onClose !== undefined) {
            this.onClose();
        }
    }
}