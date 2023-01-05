"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class List extends Array {
    constructor(array) {
        super();
        if (array) {
            this.push(...array);
        }
    }
    removeDuplicates() {
        return new List([...new Set(this.values())]);
    }
    sortList(ascending) {
        return new List([
            ...this.sort((a, b) => (ascending ? (a > b ? 1 : -1) : a > b ? -1 : 1)),
        ]);
    }
    clearList() {
        this.length = 0;
    }
    isLastElement(elem) {
        return this.indexOf(elem) === this.length - 1;
    }
    isEmptyList() {
        return this.length === 0;
    }
    toNumberList() {
        if (this.isEmptyList()) {
            return new List();
        }
        return new List(Object.values(this)
            .map(Number)
            .filter((num) => !isNaN(num) && num > 0));
    }
    toStringList() {
        if (this.isEmptyList()) {
            return new List();
        }
        return new List(Object.values(this).map(String));
    }
    get first() {
        return Object.values(this)[0];
    }
    get last() {
        return Object.values(this)[this.length - 1];
    }
    get elements() {
        return Object.values(this);
    }
}
exports.default = List;
