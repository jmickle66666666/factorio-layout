function getRecipe(result) {

    if (data.recipe[result] != null) {
        if (data.recipe[result].result == result) {
            return data.recipe[result]; // found a direct recipe
        } else {
            if (data.recipe[result].results != null) {
                for (var i = 0; i < data.recipe[result].results.length; i++) {
                    if (data.recipe[result].results[0].name == result) {
                        return data.recipe[result];
                    }
                }
            }
        }
    } else {
        // ok iterate the entire thing, sorry

        var output = [];

        for each (recipe in data.recipe) {
            if (recipe.result == result) {
                output.push(recipe.result);
            } else {
                if (recipe.results != null) {
                    for (var i = 0; i < data.recipe[result].results.length; i++) {
                        if (recipe.results[0].name == result) {
                            output.push(recipe);
                        }
                    }
                }
            }
        }
    }

    if (output.length == 0) return null;
    if (output.length == 1) return output[0];
    return output;
}