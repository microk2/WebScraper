const _IntEntries = (values) => {
    // values param must be string
    // 1. Create an array by splitting commas from input
    // 2. Convert all elements from the array to Numbers
    // 3. Return an array containing ONLY numbers and numbers > 0
    return values.split(",").map(Number).filter(num => (!isNaN(num) && num > 0))
}

module.exports = {
    _IntEntries: _IntEntries
}