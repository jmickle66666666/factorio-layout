function getRecipe(result) {
    if (data.recipe[result] != null && data.recipe[result].normal != null) {
        if (data.recipe[result].normal.result == result) {
            return data.recipe[result].normal; // found a direct recipe
        } else {
            if (data.recipe[result].normal.results != null) {
                for (var i = 0; i < data.recipe[result].normal.results.length; i++) {
                    if (data.recipe[result].normal.results[0].name == result) {
                        return data.recipe[result].normal;
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
                    if (recipe.result == recipe) output.push(recipe);
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
        if (output.length == 0) return null;
        if (output.length == 1) return output[0];
        return output;
    }   
}

function fillOptionalRecipeData(recipe) {
    if (recipe.result != null && recipe.result_count == null) {
        recipe.result_count = 1;
    }

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

    if (recipe.length == 1) recipe = [recipe,];

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