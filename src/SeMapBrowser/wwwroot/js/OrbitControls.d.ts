/// <reference path="three.d.ts"/>

declare module THREE {
    export class OrbitControls {
        constructor(camera: THREE.Camera, domElement?: HTMLElement);

        damping: number;
        target: THREE.Vector3;

        update();
        reset();

        // EventDispatcher mixins
        addEventListener(type: string, listener: (event: any) => void): void;
        hasEventListener(type: string, listener: (event: any) => void): void;
        removeEventListener(type: string, listener: (event: any) => void): void;
        dispatchEvent(event: { type: string; target: any; }): void;
    }
}