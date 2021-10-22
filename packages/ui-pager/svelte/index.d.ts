import { NativeViewElementNode, ViewNode } from 'svelte-native/dom';
import { Pager } from '..';
declare module '@nativescript/core/ui/core/view-base' {
    interface ViewBase {
        __SvelteComponent__?: any;
        __SvelteComponentBuilder__?: any;
        __CollectionViewCurrentIndex__?: number;
    }
}
export default class PagerViewElement extends NativeViewElementNode<Pager> {
    constructor();
    private loadView;
    setAttribute(fullkey: string, value: any): void;
    private getComponentForView;
    onInsertedChild(childNode: ViewNode, index: number): void;
    onRemovedChild(childNode: ViewNode): void;
    private updateListItem;
    static register(): void;
}
