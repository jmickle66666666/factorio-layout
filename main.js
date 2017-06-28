function main () {

    ////////////// SETUP AND DRWAING STUFF

    var BOUND_WIDTH = 10;
    var BOUND_HEIGHT = 9;

    var TILESIZE = 30;
    var can = document.getElementById('can');
    if (can == null) can = document.createElement('canvas');
    can.id = 'can';
    var ctx = can.getContext('2d');
    can.width=600;
    can.height=800;
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,can.width,can.height);
    function drawBox(x,y,w,h,text, color) {

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
        ctx.fillText(text,x*TILESIZE+2,(y*TILESIZE)+TILESIZE/2,w*TILESIZE);
    }
    //drawBox(2,2,3,3,"factory");
    document.body.appendChild(can);

    function choice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    document.addEventListener("keydown", main);

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

    function drawEntity(entity) {
        var drawColor = "white";
        if (entity.name == "assembler") drawColor = "#AAE";
        if (entity.name == "inserter") drawColor = "#EEA";
        if (entity.name == "inserter" && entity.type == "long") drawColor = "#EAA";
        if (entity.name == "furnace") drawColor = "#AAA";
        var text = entity.name;
        if (entity.recipe != null) text = entity.recipe;
        drawBox(entity.x, entity.y, entity.width, entity.height, text, drawColor);
    }

    function pointInRect(point, rect) {
        if (point.x >= rect.x && point.x < rect.x+rect.width &&
            point.y >= rect.y && point.y < rect.y+rect.height) return true;
        return false;
    }


    ///////////// ACTUAL THINGS

    function generate_build_from_recipe(recipe, recipes, items, entities) {

        if (items[recipe] == null) console.log("Can't find item: "+recipe);

        var main_source = items[recipe].source;
        var output = Object.assign({}, entities[main_source]);
        output.recipe = recipe;

        output.inputs = [];

        if (recipes[recipe] == null) return output;

        var ingredients = recipes[recipe];

        for (var i = 0; i < ingredients.length; i++) {
            output.inputs.push(generate_build_from_recipe(ingredients[i],recipes,items,entities));
        }

        return output;
    }

    function get_entity_connections(entity) {
        var output = [];
        output.push(entity);
        
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

        if (output.length == 1) return null;
        return output;

        
    }

    function entity_inserter_variations(entity) {
        // Create a list of every possible input inserter position for the entity

        var output = []
        var i = 0;

        // normal inserters
        
        for (i = 0; i < entity.width; i++) {
            output.push({x:entity.x + i,y:entity.y - 1,direction:"south",type:"normal",width:1,height:1,name:"inserter"});
            output.push({x:entity.x + i,y:entity.y + entity.height,direction:"north",type:"normal",width:1,height:1,name:"inserter"});
        }
        for (i = 0; i < entity.height; i++) {
            output.push({x:entity.x - 1,y:entity.y + i,direction:"east",type:"normal",width:1,height:1,name:"inserter"});
            output.push({x:entity.x + entity.width,y:entity.y + i,direction:"west",type:"normal",width:1,height:1,name:"inserter"});
        }
        
        // long inserters
        
        for (i = 0; i < entity.width; i++) {
            output.push({x:entity.x + i,y:entity.y - 1,direction:"south",type:"long",width:1,height:1,name:"inserter"});
            output.push({x:entity.x + i,y:entity.y - 2,direction:"south",type:"long",width:1,height:1,name:"inserter"});
            output.push({x:entity.x + i,y:entity.y + entity.height,direction:"north",type:"long",width:1,height:1,name:"inserter"});
            output.push({x:entity.x + i,y:entity.y + entity.height + 1,direction:"north",type:"long",width:1,height:1,name:"inserter"});
        }
        for (i = 0; i < entity.height; i++) {
            output.push({x:entity.x - 1,y:entity.y + i,direction:"east",type:"long",width:1,height:1,name:"inserter"});
            output.push({x:entity.x - 2,y:entity.y + i,direction:"east",type:"long",width:1,height:1,name:"inserter"});
            output.push({x:entity.x + entity.width,y:entity.y + i,direction:"west",type:"long",width:1,height:1,name:"inserter"});
            output.push({x:entity.x + entity.width + 1,y:entity.y + i,direction:"west",type:"long",width:1,height:1,name:"inserter"});
        }

        return output;
    }

    function inserter_entity_input_positions(inserter, entity) {
        // Create a list of every position `entity` can be placed as an input for `inserter`

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

        var entities = {
            assembler : {
                name : "assembler",
                width : 3,
                height : 3
            },
            furnace : {
                name : "furnace",
                width : 2,
                height : 2
            },
            belt : {
                name : "belt",
                width : 1,
                height : 1
            }
        }

        var items = {
            iron_ore : {
                name : "iron-ore",
                source : "belt"
            },
            iron_plate : {
                name : "iron-plate",
                source : "furnace"
            },
            copper_ore : {
                name : "copper-ore",
                source : "belt"
            },
            copper_plate : {
                name : "copper-plate",
                source : "furnace"
            },
            coal : {
                name : "coal",
                source : "belt"
            },
            copper_cable : {
                name : "copper-cable",
                source : "assembler"
            },
            green_circuit : {
                name : "electronic-circuit",
                source : "assembler"
            },
            green_output : {
                name : "output",
                source : "belt"
            }
        }

        var recipes = {
            iron_plate : [ "iron_ore" ],
            copper_plate : [ "copper_ore" ],
            copper_cable : [ "copper_plate", "copper_plate" ],
            green_circuit : [ "copper_cable", "copper_cable", "iron_plate" ],
            green_output : [ "green_circuit" ]
        }

        var setup = generate_build_from_recipe("green_output", recipes, items, entities);
        setup.x = 10;
        setup.y = 10;
        place(setup);
        //drawEntity(setup);
        
        var output = get_entity_connections(setup);
        for (var i = 0; i < output.length; i++) {
            drawEntity(output[i]);
        }



    }
    test_recipe_system();

// default recipe energy-required appears to be 0.5
}
window.onload=main;