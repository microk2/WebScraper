module.exports = class CommandLine {
    constructor(input) {
        this.#input = input.splice(2).join(" ").replace(/[,="']/g, " ").split(/ +/).filter(e => e !== '');
        this.#options = this.#getOptionsFromInput();
    }

    // Privates
    #input;
    #options;
    #availableCommands = ["ql"];
    
    #getOptionsFromInput() {
        const options = {};        
        let optName = "";

        for (const e of this.#input) {
            if ((e.startsWith("-") || e.startsWith("--")) && optName !== e && 
                this.#availableCommands.includes(e.replace(/[-]/g, ""))) {
                optName = e;

                options[e] = {
                    name: e,
                    index: this.#input.indexOf(e),
                    values: [],
                }

                continue;
            }

            if (optName && options[optName]) {
                options[optName].values.push(e);
            }
        }

        return options;
    }

    // Public
    getInput() {
        return this.#input;
    }

    getOptions() {
        return this.#options;
    }

    getValuesForOption(option) {
        if (this.#options[option]) {
            return this.#options[option].values;
        }

        return [];
    }

    hasOption(option) {
        if (this.#options[option]) {
            return true;
        }

        return false;
    }
}