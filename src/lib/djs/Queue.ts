
export interface ItemData {
    title: string,
    duration: number,
    timestamp: string,
    dj: string,
    url: string,
}

export default class Queue {
    constructor(public items: ItemData[] = []) { }

    public next() {
        this.items.splice(0, 1);
        return this.getCurrent;
    }

    public add(data: ItemData) {
        this.items.push(data);
    }

    public del(el: keyof ItemData | number, val?: any) {
        let index;
        if (typeof el == 'number') {
            index = el;
        } else {
            this.items.forEach((e, i) => {
                if (e[el] !== val) index = i;
            });
        }
        this.items.splice(index - 1, 1)

    }

    public get getCurrent() {
        return this.items[0];
    }

    public get getNext() {
        return this.items[1];
    }

    public get all() {
        return this.items;
    }
}