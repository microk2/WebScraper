const getTypeOf = (element) => Object.prototype.toString.call(element).match(/\s([a-zA-Z]+)/)[1].toLowerCase();

module.exports = {
    getTypeOf: getTypeOf,
    intEntries: (values) => {
        // values param must be string
        // 1. Create an array by splitting commas from input
        // 2. Convert all elements from the array to Numbers
        // 3. Return an array containing ONLY numbers and numbers > 0
        if (!values) {
            return [];
        }

        if (getTypeOf(values) !== "array") {
            values = values.split(",");
        }
        
        return values.map(Number).filter(num => (!isNaN(num) && num > 0))
    },
    isEmpty: (item) => {
        if (item === null) {
            return new Error("isEmpty: The input value is null");
        }
    
        const type = Object.prototype.toString.call(item).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        if (type === 'array') {
            return item.length === 0;
        }
    
        if (type === 'object') {
            return Object.entries(item).length === 0;
        }
    
        return new Error(`isEmpty: Unhandled type: ${type}`)
    },
    removeDuplicates: (array) => {
        return [...new Set(array)]
    },
    generateFileName: (name) => {        
        const _Date = new Date();

        const year = _Date.getFullYear();
        const month = _Date.getMonth() + 1 < 10 ? `0${_Date.getMonth() + 1}` : _Date.getMonth() + 1;
        const day = _Date.getDate() < 10 ? `0${_Date.getDate()}` : _Date.getDate();
        const yearMonthDay = `${year}${month}${day}`;
        
        const hour = _Date.getHours() < 10 ? `0${_Date.getHours()}` : _Date.getHours();
        const minutes = _Date.getMinutes() < 10 ? `0${_Date.getMinutes()}` : _Date.getMinutes();
        const seconds = _Date.getSeconds() < 10 ? `0${_Date.getSeconds()}` : _Date.getSeconds();
        const hourMinutesSeconds = `${hour}${minutes}${seconds}`;

        if (!name) name = "";
        else name = `${name}_`;
    
        return `${name}${yearMonthDay}_${hourMinutesSeconds}.sql`;
    }, 
}