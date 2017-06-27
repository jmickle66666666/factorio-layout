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