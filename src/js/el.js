var directions = {
    "n": new Vector(0, -1),
    "ne": new Vector(1, -1),
    "e": new Vector(1, 0),
    "se": new Vector(1, 1),
    "s": new Vector(0, 1),
    "sw": new Vector(-1, 1),
    "w": new Vector(-1, 0),
    "nw": new Vector(-1, -1)
};

var directionNames = "n ne e se s sw w nw".split(" ");

function randomElement(array) {
    // Select a random element from array
    return array[Math.floor(Math.random() * array.length)];
}

function elementFromChar(legend, ch) {
    if (ch == " ") return null;
    var element = new legend[ch]();
    element.originChar = ch;
    return element;
}

function charFromElement(element) {
    if (element == null) return " ";
    else return element.originChar;
}

function dirPlus(dir, n) {
    var index = directionNames.indexOf(dir);
    return directionNames[(index + n + 8) % 8];
}











/* The Vectory type represents a single co-ordinate square on the grid
 */
function Vector(x, y) {
    this.x = x;
    this.y = y;
}
Vector.prototype.plus = function(other) {
    return new Vector(this.x + other.x, this.y + other.y);
};

/* The Grid object represents the grid itself. It will be a property of the 
    world object. Here the grid is represented by a single array of length
    width x height. */
function Grid(width, height) {
    this.space = new Array(width * height);
    this.width = width;
    this.height = height;
}
Grid.prototype.isInside = function(vector) {
    return vector.x >= 0 && vector.x < this.width &&
        vector.y >= 0 && vector.y < this.height;
};
Grid.prototype.get = function(vector) {
    return this.space[vector.x + this.width * vector.y];
};
Grid.prototype.set = function(vector, value) {
    this.space[vector.x + this.width * vector.y] = value;
};
Grid.prototype.forEach = function(f, context) {
    // This calls a given function for each element in the Grid. The context 
    // can take the this value from the calling context.
    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            var value = this.space[x + y * this.width];
            if (value != null)
                f.call(context, value, new Vector(x, y));
        }
    }
};

/* The world contains critters. Each critter has an act method, that returns
    an action. The action is an object with a 'type' property that defines
    the action. The action is given a 'view' object that allows the critter
    to inspect its surroundings.
*/

var legend = {
    "#": Wall,
    "~": WallFollower,
    "o": BouncingCritter,
};

function Wall() {} // Wall is an empty object, with no act method

function BouncingCritter() {
    // this critter moves in a random direction until it hits a wall
    // then finds a new direction to move in.
    this.direction = randomElement(directionNames);
}
BouncingCritter.prototype.act = function(view) {
    if (view.look(this.direction) != " ")
        this.direction = view.find(" ") || "s"; // s if no spaces found
    return { type: "move", direction: this.direction };
};

function WallFollower() {
    this.dir = "s";
}

WallFollower.prototype.act = function(view) {
    var start = this.dir;
    if (view.look(dirPlus(this.dir, -3)) != " ")
        start = this.dir = dirPlus(this.dir, -2);
    while (view.look(this.dir) != " ") {
        this.dir = dirPlus(this.dir, 1);
        if (this.dir == start) break;
    }
    return { type: "move", direction: this.dir };
};

/* The World object take the plan and a legend and constructs all the World
    objects.
*/

function World(map, legend) {
    this.grid = new Grid(map[0].length, map.length);
    var grid = this.grid; // make grid available in forEach
    this.legend = legend;

    map.forEach(function(line, y) {
        for (var x = 0; x < line.length; x++) {
            grid.set(new Vector(x, y),
                elementFromChar(legend, line[x]));
        }
    });
}
World.prototype.toString = function() {
    var output = "";
    for (var y = 0; y < this.grid.height; y++) {
        for (var x = 0; x < this.grid.width; x++) {
            var element = this.grid.get(new Vector(x, y));
            output += charFromElement(element);
        }
        output += "\n";
    }
    return output;
};

/* The turn method gives the critter the chance to act.*/
World.prototype.turn = function() {
    var acted = [];
    this.grid.forEach(function(critter, vector) {
        // uses the custom forEach method of the grid.
        if (critter.act && acted.indexOf(critter) == -1) {
            acted.push(critter); // prevent a critter from acting twice.
            this.letAct(critter, vector);
        }
    }, this);
};
/* The letAct method carries out the action 
 */
World.prototype.letAct = function(critter, vector) {
    var action = critter.act(new View(this, vector));
    if (action && action.type == "move") {
        var dest = this.checkDestination(action, vector);
        if (dest && this.grid.get(dest) == null) {
            this.grid.set(vector, null);
            this.grid.set(dest, critter);
        }
    }
};
World.prototype.checkDestination = function(action, vector) {
    if (directions.hasOwnProperty(action.direction)) {
        var dest = vector.plus(directions[action.direction]);
        if (this.grid.isInside(dest))
            return dest;
    }
};

/* The View object provides a way for critters to look around them.
 */
function View(world, vector) {
    this.world = world;
    this.vector = vector;
}

View.prototype.look = function(dir) {
    var target = this.vector.plus(directions[dir]);
    if (this.world.grid.isInside(target))
        return charFromElement(this.world.grid.get(target));
    else
        return "#";
};
View.prototype.findAll = function(ch) {
    var found = [];
    for (var dir in directions)
        if (this.look(dir) == ch)
            found.push(dir);
    return found;
};
View.prototype.find = function(ch) {
    var found = this.findAll(ch);
    if (found.length == 0) return null;
    return randomElement(found);
};




/* Test out the code */
// var grid = new Grid(5, 5);
// grid.set(new Vector(1, 1), "X");
// console.log(grid.get(new Vector(1, 1)));
// The plan represents the world's grid
var plan = [
    "###########################",
    "#                         #",
    "# ####                    #",
    "#    #                    #",
    "#    #                    #",
    "#    #####                #",
    "#                         #",
    "#    #################    #",
    "#                    #    #",
    "#                    #    #",
    "#              #######    #",
    "#                         #",
    "#                         #",
    "###########################",
];

var world = new World(plan, legend);
// for (var i = 0; i < 5; i++) {
//     console.log(world.toString());
//     world.turn();
// }
/* Animate the world */
var intID = window.setInterval(tick, 1000, world);
function tick(world){
    console.clear();
    console.log(world.toString());
    world.turn();
}