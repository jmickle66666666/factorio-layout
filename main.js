function main () {

    ////////////// SETUP AND DRWAING STUFF

    var BOUND_WIDTH = 10;
    var BOUND_HEIGHT = 16;

    var TILESIZE = 30;
    var can = document.getElementById('can');
    if (can == null) can = document.createElement('canvas');
    can.id = 'can';
    var ctx = can.getContext('2d');
    can.width=600;
    can.height=800;
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,can.width,can.height);
    function drawBox(x,y,w,h,text, text2, color) {

        ctx.fillStyle = color;
        ctx.fillRect(x*TILESIZE,y*TILESIZE,w * TILESIZE,h * TILESIZE);
        ctx.strokeStyle = "#CCC";
        for (var i=0;i<w;i++) {
            for (var j=0; j<h; j++) {
                ctx.strokeRect((x+i)*TILESIZE,(y+j)*TILESIZE,TILESIZE,TILESIZE);
            }
        }
        ctx.strokeStyle = "black";
        ctx.strokeRect(x*TILESIZE,y*TILESIZE,w * TILESIZE,h * TILESIZE);
        ctx.fillStyle = "black";
        ctx.fillText(text,x*TILESIZE+2,((y*TILESIZE)+TILESIZE/2)-4,w*TILESIZE);
        ctx.fillText(text2,x*TILESIZE+2,((y*TILESIZE)+TILESIZE/2)+8,w*TILESIZE);
    }
    //drawBox(2,2,3,3,"factory");
    document.body.appendChild(can);

    function choice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    //document.addEventListener("keydown", main);

    current_entities = [];

    function place(entity) {
        current_entities.push(entity);
    }

    function clear_entities() {
        current_entities = [];
    }

    function unplace() {
        unplaceN(1);
    }

    function unplaceN(n) {
        current_entities = current_entities.slice(n * -1);
    }

    function can_place_entity(entity) {
        if (entity.width == null) {
            var size = entitySize(entity.entity);
            entity.width = size.width;
            entity.height = size.height;
        }
        var bounds = getCurrentBounds();
        if (!inBounds(entity, bounds)) {
            var newWidth = Math.max(bounds.x2, entity.x+entity.width) - Math.min(bounds.x1, entity.x);
            if (newWidth > BOUND_WIDTH) return false;
            var newHeight = Math.max(bounds.y2, entity.y+entity.height) - Math.min(bounds.y1, entity.y);
            if (newHeight > BOUND_HEIGHT) return false;   
        }

        for (var i = 0; i < current_entities.length; i++) {
            var ent2 = current_entities[i];
            if (entity.x + entity.width > ent2.x && 
                entity.x < ent2.x + ent2.width &&
                entity.y + entity.height > ent2.y &&
                entity.y < ent2.y + ent2.height) {
                return false;
            }
        }
        return true;
    }

    function getCurrentBounds() {
        var minX = 100;
        var minY = 100;
        var maxX = -100;
        var maxY = -100;

        for (var i = 0; i < current_entities.length; i++) {
            if (current_entities[i].x < minX) minX = current_entities[i].x; 
            if (current_entities[i].y < minY) minY = current_entities[i].y;
            if (current_entities[i].x + current_entities[i].width > maxX) maxX = current_entities[i].x + current_entities[i].width;
            if (current_entities[i].y + current_entities[i].height > maxY) maxY = current_entities[i].y + current_entities[i].height;
        }

        return { x1 : minX, x2 : maxX, y1 : minY, y2 : maxY, width : maxX - minX, height : maxY - minY };
    }

    function inBounds(entity, bounds) {
        if (entity.x > bounds.x1 && 
            entity.x + entity.width < bounds.x2 &&
            entity.y > bounds.y1 &&
            entity.y + entity.height < bounds.y2) {
            return true;
        }
        return false;
    }

    function drawEntity(entity, position) {
        var size = entitySize(entity.entity);
        if (size == null) {
            console.log("Can't get size of "+entity.entity+", fallback to 1x1");
            size = {width:1, height:1};
        }

        var infoText = "";

        if (entity.recipe != null) infoText = entity.recipe;
        if (entity.direction != null) infoText = entity.direction;

        var drawColor = stringToHex(entity.entity);
        drawBox(position.x, position.y, size.width, size.height, entity.entity, infoText, drawColor);
    }

    function stringToHex(string) {
        // Junk to convert a string into a hex value for deterministic color stuff
        var value = 1;
        for (var i = 0; i < string.length; i++) {
            value += string.charCodeAt(i);
        }
        value %= 0x1000;
        var output = value.toString(16).toUpperCase();
        return "#"+output;
    }

    function pointInRect(point, rect) {
        if (point.x >= rect.x && point.x < rect.x+rect.width &&
            point.y >= rect.y && point.y < rect.y+rect.height) return true;
        return false;
    }


    ///////////// ACTUAL THINGS

    function generate_build_from_recipe(recipe, belted_inputs) {
        
        var output = {};
        output.recipe = recipe;

        for (var b in belted_inputs) {
            b = belted_inputs[b];
            if (recipe == b) {
                output.inputs = [];
                output.entity = "transport-belt";
                return output;
            }
        }

        var main_source = whatIsItMadeIn(recipe)[0];
        output.entity = main_source;
        output.inputs = [];
        var ingredients = getRecipe(recipe)[0].ingredients;
        for (var i = 0; i < ingredients.length; i++) {
            output.inputs.push(generate_build_from_recipe(ingredients[i][0], belted_inputs));
        }

        return output;
    }

    function get_entity_connections(entity) {
        var output = [];
        output.push(entity);
        if (entity.inputs == null) entity.inputs = [];
        if (entity.inputs.length == 0) {
            return output;
        }

        entity.ins = entity_inserter_variations(entity);

        

        for (var i = 0; i < entity.inputs.length; i++) {
            var success = false;
            for (var j = 0; j < entity.ins.length; j++) {
                if (can_place_entity(entity.ins[j])) {
                    var ins_var = inserter_entity_input_positions(entity.ins[j], entity.inputs[i]);
                    for (var k = 0; k < ins_var.length; k++) {
                        var test_ent = Object.assign({}, entity.inputs[i]);
                        test_ent.x = ins_var[k].x;
                        test_ent.y = ins_var[k].y;
                        if (can_place_entity(test_ent)) {
                            place(test_ent);
                            place(entity.ins[j]);
                            var next_one = get_entity_connections(test_ent);
                            if (next_one == null) {
                                unplaceN(2);
                            } else {
                                success = true;
                                output = output.concat(next_one);
                                output.push(entity.ins[j]);
                                break;
                            }
                        }

                    }
                }
                if (success == true) break;
            }
            
        }

        if (output.length == 1) {
            console.log("here");
            return null;
        }
        return output;

        
    }

    function entity_inserter_variations(entity) {
        // Create a list of every possible input inserter position for the entity
        var output = []
        var i = 0;

        var size = entitySize(entity.entity);

        // normal inserters
        
        for (i = 0; i < size.width; i++) {
            output.push({x:entity.x + i,y:entity.y - 1,direction:"south",type:"normal",width:1,height:1,entity:"inserter"});
            output.push({x:entity.x + i,y:entity.y + size.height,direction:"north",type:"normal",width:1,height:1,entity:"inserter"});
        }
        for (i = 0; i < entity.height; i++) {
            output.push({x:entity.x - 1,y:entity.y + i,direction:"east",type:"normal",width:1,height:1,entity:"inserter"});
            output.push({x:entity.x + size.width,y:entity.y + i,direction:"west",type:"normal",width:1,height:1,entity:"inserter"});
        }
        
        // long inserters
        
        for (i = 0; i < size.width; i++) {
            output.push({x:entity.x + i,y:entity.y - 1,direction:"south",type:"long",width:1,height:1,entity:"inserter"});
            output.push({x:entity.x + i,y:entity.y - 2,direction:"south",type:"long",width:1,height:1,entity:"inserter"});
            output.push({x:entity.x + i,y:entity.y + size.height,direction:"north",type:"long",width:1,height:1,entity:"inserter"});
            output.push({x:entity.x + i,y:entity.y + size.height + 1,direction:"north",type:"long",width:1,height:1,entity:"inserter"});
        }
        for (i = 0; i < size.height; i++) {
            output.push({x:entity.x - 1,y:entity.y + i,direction:"east",type:"long",width:1,height:1,entity:"inserter"});
            output.push({x:entity.x - 2,y:entity.y + i,direction:"east",type:"long",width:1,height:1,entity:"inserter"});
            output.push({x:entity.x + size.width,y:entity.y + i,direction:"west",type:"long",width:1,height:1,entity:"inserter"});
            output.push({x:entity.x + size.width + 1,y:entity.y + i,direction:"west",type:"long",width:1,height:1,entity:"inserter"});
        }

        return output;
    }

    function inserter_entity_input_positions(inserter, entity) {
        // Create a list of every position `entity` can be placed as an input for `inserter`

        entity = entitySize(entity.entity);

        var i, j;
        var output = [];
        var pickup;

        if (inserter.direction == "north" && inserter.type == "normal") { pickup = { x: inserter.x, y: inserter.y + 1 }};
        if (inserter.direction == "south" && inserter.type == "normal") { pickup = { x: inserter.x, y: inserter.y - 1 }};
        if (inserter.direction == "east" && inserter.type == "normal") { pickup = { x: inserter.x - 1, y: inserter.y }};
        if (inserter.direction == "west" && inserter.type == "normal") { pickup = { x: inserter.x + 1, y: inserter.y }};

        if (inserter.direction == "north" && inserter.type == "long") { pickup = { x: inserter.x, y: inserter.y + 2 }};
        if (inserter.direction == "south" && inserter.type == "long") { pickup = { x: inserter.x, y: inserter.y - 2 }};
        if (inserter.direction == "east" && inserter.type == "long") { pickup = { x: inserter.x - 2, y: inserter.y }};
        if (inserter.direction == "west" && inserter.type == "long") { pickup = { x: inserter.x + 2, y: inserter.y }};

        for (i = pickup.x - entity.width; i <= pickup.x + entity.width; i++) {
            for (j = pickup.y - entity.height; j <= pickup.y + entity.height; j++) {
                entity.x = i;
                entity.y = j;
                if (pointInRect(pickup, entity) && !pointInRect(inserter, entity)) {
                    output.push({x: i, y: j});
                }
            }
        }

        return output;

    }

    function assembler_inserter_test () {
        assembler = { x: 4, y:4, width:3, height:3 };
        inserters = entity_inserter_variations(assembler);

        drawBox(assembler.x,assembler.y,3,3,"factory");
        for (var i = 0; i < inserters.length; i++) {
            drawBox(inserters[i].x,inserters[i].y,1,1,inserters[i].direction);
        }
    }

    //assembler_inserter_test();

    function inserter_assembler_test() {
        inserter = { x:5, y:5, direction:choice(["north","south","east","west"]), type:"long"};
        drawBox(inserter.x,inserter.y,1,1,"inserter "+inserter.direction);

        // create a test entity, then find all positions it could be for input
        assembler = {x:0, y:0, width:3, height:3};

        var epos = inserter_entity_input_positions(inserter,assembler);

        var pos = choice(epos);
        assembler.x = pos.x;
        assembler.y = pos.y;
        drawBox(assembler.x,assembler.y,3,3,"assembler");
    }
    //inserter_assembler_test();

    function test_iteration() {

        var assembler = {x:5,y:5, width:3,height:3};
        place(assembler);
        drawBox(assembler.x,assembler.y,assembler.width,assembler.height,"assembler");

        

        var inserters = entity_inserter_variations(assembler);
        var inserter1 = choice(inserters);
        place(inserter1);
        drawBox(inserter1.x,inserter1.y,1,1,inserter1.direction);
        var furnace = {x:0,y:0,width:2,height:2};
        var furnpos = choice(inserter_entity_input_positions(inserter1, furnace));
        furnace.x = furnpos.x;
        furnace.y = furnpos.y;
        place(furnace);
        drawBox(furnace.x,furnace.y,furnace.width,furnace.height,"furnace");

        for (var r = 0; r < 4; r++) {
            var rock = {x:Math.floor(Math.random()*12),y:Math.floor(Math.random()*12),width:2,height:2};
            if (can_place_entity(rock)) {
                place(rock);
                drawBox(rock.x,rock.y,rock.width,rock.height,"rock");
            }
        }

        var assembler2 = null;
        var ass2poss = null;
        var success = false;
        var inserter2 = null;
        for (var i = 0; i < inserters.length; i++) {
            if (can_place_entity(inserters[i])) {
                inserter2 = inserters[i];

                success = false;
                assembler2 = {x:0,y:0,width:3,height:3};
                ass2poss = inserter_entity_input_positions(inserter2, assembler2);
                for (var j = 0; j < ass2poss.length; j++) {
                    assembler2.x = ass2poss[j].x;
                    assembler2.y = ass2poss[j].y;
                    if (can_place_entity(assembler2)) {
                        success = true;
                        break;
                    }
                }
                if (success == true) break;
            }
        }

        if (success == "false") {
            console.log("fucked it");
        }
        else {
            place(inserter2);
            place(assembler2);
            drawBox(inserter2.x,inserter2.y,1,1,inserter2.direction);
            drawBox(assembler2.x,assembler2.y,assembler2.width,assembler2.height,"assembler");
        }
    }
    //test_iteration();

    function test_long_process() {
        var setup = {
            name: "assembler",
            x: 10,
            y: 10,
            width: 3,
            height: 3,
            inputs: [
                { 
                    name: "furnace",
                    x: 0,
                    y: 0,
                    width: 2,
                    height: 2,
                    inputs: []
                },
                {
                    name: "assembler",
                    x: 0,
                    y: 0,
                    width: 3,
                    height: 3,
                    inputs: []
                },
                {
                    name: "assembler",
                    x: 0,
                    y: 0,
                    width: 3,
                    height: 3,
                    inputs: [
                        {
                            name: "furnace",
                            x: 0,
                            y: 0,
                            width: 2,
                            height: 2,
                            inputs: []
                        }
                    ]
                }
            ]
        };

        place(setup);
        //drawEntity(setup);
        
        var output = get_entity_connections(setup);
        for (var i = 0; i < output.length; i++) {
            drawEntity(output[i]);
        }

    }
    //test_long_process();

    function test_recipe_system() {

        var r = document.getElementById("selectedItem").value;

        var setup = generate_build_from_recipe(r, ["iron-ore", "copper-ore", "coal", "stone"]);
        setup.x = 10;
        setup.y = 10;
        place(setup);
        //drawEntity(setup);
        var output = get_entity_connections(setup);
        for (var i = 0; i < output.length; i++) {
            drawEntity(output[i], {x:output[i].x, y:output[i].y});
        }



    }
    test_recipe_system();

// default recipe energy-required appears to be 0.5
}
//window.onload=main;