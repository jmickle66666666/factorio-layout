
// Get a list of recipes available for the given item
function getRecipe(result) {
    if (data.recipe[result] != null && data.recipe[result].normal != null) {
        if (data.recipe[result].normal.result == result) {
            return [data.recipe[result].normal]; // found a direct recipe
        } else {
            if (data.recipe[result].normal.results != null) {
                for (var i = 0; i < data.recipe[result].normal.results.length; i++) {
                    if (data.recipe[result].normal.results[0].name == result) {
                        return [data.recipe[result].normal];
                    }
                }
            }
        }
    } else {
        // ok iterate the entire thing, sorry
        var output = [];

        for (var recipe in data.recipe) {
            if (data.recipe.hasOwnProperty(recipe)) {
                recipe = data.recipe[recipe];
                if (recipe.normal != null) recipe = recipe.normal;

                if (recipe.result != null) {
                    if (recipe.result == result) {
                        output.push(recipe);
                    }
                } else if (recipe.results != null) {
                    for (var r in recipe.results) {
                        r = recipe.results[r];
                        if (r.name == result) {
                            output.push(recipe);
                            break;
                        }
                    }
                }
            }

        }
        return output;
    }   
}

// Fill out optional data in a recipe object with the game's defaults
function fillOptionalRecipeData(recipe) {
    if (recipe.result != null && recipe.result_count == null) {
        recipe.result_count = 1;
    }
    //console.log(recipe);
    if (recipe.category == null) {
        recipe.category = "crafting";
    }

    if (recipe.energy_required == null) {
        recipe.energy_required = 0.5;
    }

    if (recipe.enabled == null) {
        recipe.enabled = "true";
    }
}

function whatIsItMadeIn(item) {
    var output = [];
    var recipe = getRecipe(item);

    for (var i = 0; i < recipe.length; i++) {
        fillOptionalRecipeData(recipe[i]);

        var category = recipe[i].category;

        for (var assembler in data["assembling-machine"]) {
            assembler = data["assembling-machine"][assembler];
            for (var c in assembler.crafting_categories) {
                c = assembler.crafting_categories[c];
                if (c == category) {
                    output.push(assembler.name);
                }
            }
        }

        for (var furnace in data["furnace"]) {
            furnace = data["furnace"][furnace];
            for (var c in furnace.crafting_categories) {
                c = furnace.crafting_categories[c];
                if (c == category) {
                    output.push(furnace.name);
                }
            }
        }
    }

    return output.filter(function(item, pos) {
        return output.indexOf(item) == pos;
    });
}

// Get the size in tiles of an entity
function entitySize(entity) {
    var box = null;

    for (var category in data) {
        for (var ent in data[category]) {
            if (ent == entity) {
                box = data[category][ent].collision_box;
                break;
            }
        }
        if (box != null) break;
    }

    if (box == null) return;

    var width = Math.ceil(box[1][0] - box[0][0]);
    var height = Math.ceil(box[1][1] - box[0][1]);

    return {width: width, height: height};
}

// Return a list of all possible recipe result items
function listProducts() {
    var output = [];
    for (var recipe in data.recipe) {
        recipe = data.recipe[recipe];
        if (recipe.normal != null) recipe = recipe.normal;

        if (recipe.result != null) output.push(recipe.result);

        if (recipe.results != null) {
            for (var result in recipe.results) {
                result = recipe.results[result];
                output.push(result.name);
            }
        }
    }
    return output.filter(function(item, pos) {
        return output.indexOf(item) == pos;
    });
}
