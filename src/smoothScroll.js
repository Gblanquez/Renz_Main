import ASScroll from '@ashthornton/asscroll';

let instance = null;

export function getASScrollInstance() {
    if (!instance) {
        instance = new ASScroll({
            disableRaf: true,
        });

        instance.enable({
            horizontalScroll: !document.body.classList.contains('b-inside'),
        });
    }
    return instance;
}

export function destroyASScrollInstance() {
    if (instance) {
        instance.disable();
        instance = null;
    }
}