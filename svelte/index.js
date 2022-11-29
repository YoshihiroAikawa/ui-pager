import { View } from '@nativescript/core';
import { profile } from '@nativescript/core/profiling';
import { ContentView, LayoutBase, StackLayout, ViewBase } from '@nativescript/core/ui';
import { NativeViewElementNode, TemplateElement, ViewNode, createElement, registerElement, registerNativeViewElement } from 'svelte-native/dom';
import { flush } from 'svelte/internal';
import { Pager, PagerItem } from '..';
class SvelteKeyedTemplate {
    constructor(key, templateEl) {
        this._key = key;
        this._templateEl = templateEl;
    }
    get component() {
        return this._templateEl.component;
    }
    get key() {
        return this._key;
    }
    createView() {
        const nativeEl = new StackLayout();
        nativeEl.__SvelteComponentBuilder__ = (parentView, props) => {
            profile('__SvelteComponentBuilder__', () => {
                nativeEl.__SvelteComponent__ = new this.component({
                    target: parentView,
                    props
                });
            })();
        };
        return nativeEl;
    }
}
export default class PagerViewElement extends NativeViewElementNode {
    constructor() {
        super('pager', Pager);
        const nativeView = this.nativeView;
        nativeView.itemViewLoader = (viewType) => this.loadView(viewType);
        this.nativeView.on(Pager.itemLoadingEvent, this.updateListItem, this);
    }
    loadView(viewType) {
        if (Array.isArray(this.nativeElement.itemTemplates)) {
            const keyedTemplate = this.nativeElement.itemTemplates.find((t) => t.key === 'default');
            if (keyedTemplate) {
                return keyedTemplate.createView();
            }
        }
        const componentClass = this.getComponentForView(viewType);
        if (!componentClass)
            return null;
        const nativeEl = new ContentView();
        const builder = (parentView, props) => {
            nativeEl.__SvelteComponent__ = new componentClass({
                target: parentView,
                props
            });
        };
        nativeEl.__SvelteComponentBuilder__ = builder;
        return nativeEl;
    }
    setAttribute(fullkey, value) {
        if (fullkey.toLowerCase() === 'itemtemplateselector') {
            fullkey = 'itemTemplateSelector';
        }
        super.setAttribute(fullkey, value);
    }
    getComponentForView(viewType) {
        const normalizedViewType = viewType.toLowerCase();
        const templateEl = this.childNodes.find((n) => n.tagName === 'template' && String(n.getAttribute('type')).toLowerCase() === normalizedViewType);
        if (!templateEl)
            return null;
        return templateEl.component;
    }
    onInsertedChild(childNode, index) {
        super.onInsertedChild(childNode, index);
        if (childNode instanceof TemplateElement) {
            const key = childNode.getAttribute('key') || 'default';
            const templateIndex = this.nativeView._itemTemplatesInternal.findIndex((t) => t.key === key);
            if (templateIndex >= 0) {
                this.nativeView._itemTemplatesInternal.splice(templateIndex, 1, new SvelteKeyedTemplate(key, childNode));
            }
            else {
                this.nativeView._itemTemplatesInternal = this.nativeView._itemTemplatesInternal.concat(new SvelteKeyedTemplate(key, childNode));
            }
        }
    }
    onRemovedChild(childNode) {
        super.onRemovedChild(childNode);
        if (childNode instanceof TemplateElement) {
            const key = childNode.getAttribute('key') || 'default';
            if (this.nativeView._itemTemplatesInternal && typeof this.nativeView._itemTemplatesInternal !== 'string') {
                this.nativeView._itemTemplatesInternal = this.nativeView._itemTemplatesInternal.filter((t) => t.key !== key);
            }
        }
    }
    updateListItem(args) {
        const _view = args.view;
        const props = { item: args.bindingContext, index: args.index };
        const componentInstance = _view.__SvelteComponent__;
        if (!componentInstance) {
            if (_view.__SvelteComponentBuilder__) {
                const dummy = createElement('fragment');
                _view.__SvelteComponentBuilder__(dummy, props);
                _view.__SvelteComponentBuilder__ = null;
                _view.__CollectionViewCurrentIndex__ = args.index;
                const nativeEl = dummy.firstElement().nativeView;
                _view.addChild(nativeEl);
            }
        }
        else {
            _view.__CollectionViewCurrentIndex__ = args.index;
            componentInstance.$set(props);
            flush();
        }
    }
    static register() {
        registerElement('pager', () => new PagerViewElement());
        registerNativeViewElement('pageritem', () => PagerItem);
    }
}
//# sourceMappingURL=index.js.map