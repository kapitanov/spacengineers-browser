declare class Stats {
    REVISION: number;
    domElement: HTMLElement;
    setMode: (mode: number) => void;
    begin: () => void;
    update: () => void;
    end: () => number;
}