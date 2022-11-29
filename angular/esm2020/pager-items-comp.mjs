import { Component, ContentChild, Directive, ElementRef, EmbeddedViewRef, EventEmitter, Host, Inject, InjectionToken, Input, IterableDiffers, Output, TemplateRef, ViewChild, ViewContainerRef, ɵisListLikeIterable as isListLikeIterable } from '@angular/core';
import { Pager, PagerError, PagerItem, PagerLog } from '@nativescript-community/ui-pager';
import { extractSingleViewRecursive, isInvisibleNode, registerElement } from '@nativescript/angular';
import { LayoutBase, Trace, View, isIOS } from '@nativescript/core';
import { ObservableArray } from '@nativescript/core/data/observable-array';
import { profile } from '@nativescript/core/profiling';
import * as i0 from "@angular/core";
const _c0 = ["loader"];
registerElement('Pager', () => Pager);
registerElement('PagerItem', () => PagerItem);
const NG_VIEW = '_ngViewRef';
export class ItemContext {
    constructor($implicit, item, index, even, odd) {
        this.$implicit = $implicit;
        this.item = item;
        this.index = index;
        this.even = even;
        this.odd = odd;
    }
}
export class TemplatedItemsComponent {
    constructor(_elementRef, _iterableDiffers) {
        this._iterableDiffers = _iterableDiffers;
        this.setupItemView = new EventEmitter();
        this.templatedItemsView = _elementRef.nativeElement;
        this.templatedItemsView.on('itemLoading', this.onItemLoading, this);
        this.templatedItemsView.on('itemDisposing', this.onItemDisposing, this);
    }
    get items() {
        return this._items;
    }
    set items(value) {
        this._items = value;
        let needDiffer = true;
        if (value instanceof ObservableArray) {
            needDiffer = false;
        }
        if (needDiffer && !this._differ && isListLikeIterable(value)) {
            this._differ = this._iterableDiffers.find(this._items).create((_index, item) => item);
        }
        this.templatedItemsView.items = this._items;
    }
    get selectedIndex() {
        return this._selectedIndex;
    }
    set selectedIndex(value) {
        this._selectedIndex = value;
        this.templatedItemsView.selectedIndex = this._selectedIndex;
    }
    ngAfterViewInit() {
        if (!!this._selectedIndex) {
            setTimeout(() => {
                if (isIOS) {
                    this.templatedItemsView.scrollToIndexAnimated(this._selectedIndex, false);
                }
                this.templatedItemsView.selectedIndex = this._selectedIndex;
            });
        }
    }
    ngAfterContentInit() {
        if (Trace.isEnabled()) {
            PagerLog('TemplatedItemsView.ngAfterContentInit()');
        }
        this.setItemTemplates();
    }
    ngOnDestroy() {
        this.templatedItemsView.off('itemLoading', this.onItemLoading, this);
        this.templatedItemsView.off('itemDisposing', this.onItemDisposing, this);
    }
    setItemTemplates() {
        if (!this.items)
            return;
        this.itemTemplate = this.itemTemplateQuery;
        if (this._templateMap) {
            if (Trace.isEnabled()) {
                PagerLog('Setting templates');
            }
            const templates = [];
            this._templateMap.forEach((value) => {
                templates.push(value);
            });
            this.templatedItemsView.itemTemplates = templates;
        }
    }
    registerTemplate(key, template) {
        if (Trace.isEnabled()) {
            PagerLog(`registerTemplate for key: ${key}`);
        }
        if (!this._templateMap) {
            this._templateMap = new Map();
        }
        const keyedTemplate = {
            key,
            createView: this.getItemTemplateViewFactory(template)
        };
        this._templateMap.set(key, keyedTemplate);
    }
    onItemLoading(args) {
        if (!args.view && !this.itemTemplate) {
            return;
        }
        if (!this.items)
            return;
        const index = args.index;
        const items = args.object.items;
        const currentItem = typeof items.getItem === 'function' ? items.getItem(index) : items[index];
        let viewRef;
        if (args.view) {
            if (Trace.isEnabled()) {
                PagerLog(`onItemLoading: ${index} - Reusing existing view`);
            }
            viewRef = args.view[NG_VIEW];
            if (!viewRef && args.view instanceof LayoutBase && args.view.getChildrenCount() > 0) {
                viewRef = args.view.getChildAt(0)[NG_VIEW];
            }
            if (!viewRef && Trace.isEnabled()) {
                PagerError(`ViewReference not found for item ${index}. View recycling is not working`);
            }
        }
        if (!viewRef) {
            if (Trace.isEnabled()) {
                PagerLog(`onItemLoading: ${index} - Creating view from template`);
            }
            viewRef = this.loader.createEmbeddedView(this.itemTemplate, new ItemContext(), 0);
            args.view = getItemViewRoot(viewRef);
            args.view[NG_VIEW] = viewRef;
        }
        this.setupViewRef(viewRef, currentItem, index);
        this.detectChangesOnChild(viewRef, index);
    }
    onItemDisposing(args) {
        if (!args.view) {
            return;
        }
        let viewRef;
        if (args.view) {
            if (Trace.isEnabled()) {
                PagerLog(`onItemDisposing: ${args.index} - Removing angular view`);
            }
            viewRef = args.view[NG_VIEW];
            if (!viewRef && args.view instanceof LayoutBase && args.view.getChildrenCount() > 0) {
                viewRef = args.view.getChildAt(0)[NG_VIEW];
            }
            if (!viewRef && Trace.isEnabled()) {
                PagerError(`ViewReference not found for item ${args.index}. View disposing is not working`);
            }
        }
        if (viewRef) {
            if (Trace.isEnabled()) {
                PagerLog(`onItemDisposing: ${args.index} - Disposing view reference`);
            }
            viewRef.destroy();
        }
    }
    setupViewRef(viewRef, data, index) {
        const context = viewRef.context;
        context.$implicit = data;
        context.item = data;
        context.index = index;
        context.even = index % 2 === 0;
        context.odd = !context.even;
        this.setupItemView.next({
            view: viewRef,
            data,
            index,
            context
        });
    }
    getItemTemplateViewFactory(template) {
        return () => {
            const viewRef = this.loader.createEmbeddedView(template, new ItemContext(), 0);
            const resultView = getItemViewRoot(viewRef);
            resultView[NG_VIEW] = viewRef;
            return resultView;
        };
    }
    detectChangesOnChild(viewRef, index) {
        if (Trace.isEnabled()) {
            PagerLog(`Manually detect changes in child: ${index}`);
        }
        viewRef.markForCheck();
        viewRef.detectChanges();
    }
    ngDoCheck() {
        if (this._differ) {
            if (Trace.isEnabled()) {
                PagerLog('ngDoCheck() - execute differ');
            }
            const changes = this._differ.diff(this._items);
            if (changes) {
                if (Trace.isEnabled()) {
                    PagerLog('ngDoCheck() - refresh');
                }
                this.templatedItemsView.refresh();
            }
        }
    }
}
TemplatedItemsComponent.ɵfac = function TemplatedItemsComponent_Factory(t) { return new (t || TemplatedItemsComponent)(i0.ɵɵdirectiveInject(i0.ElementRef), i0.ɵɵdirectiveInject(i0.IterableDiffers)); };
TemplatedItemsComponent.ɵcmp = i0.ɵɵdefineComponent({ type: TemplatedItemsComponent, selectors: [["ng-component"]], contentQueries: function TemplatedItemsComponent_ContentQueries(rf, ctx, dirIndex) { if (rf & 1) {
        i0.ɵɵcontentQuery(dirIndex, TemplateRef, 5);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.itemTemplateQuery = _t.first);
    } }, viewQuery: function TemplatedItemsComponent_Query(rf, ctx) { if (rf & 1) {
        i0.ɵɵviewQuery(_c0, 5, ViewContainerRef);
    } if (rf & 2) {
        let _t;
        i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.loader = _t.first);
    } }, inputs: { items: "items", selectedIndex: "selectedIndex" }, outputs: { setupItemView: "setupItemView" }, decls: 0, vars: 0, template: function TemplatedItemsComponent_Template(rf, ctx) { }, encapsulation: 2 });
__decorate([
    profile
], TemplatedItemsComponent.prototype, "onItemLoading", null);
__decorate([
    profile
], TemplatedItemsComponent.prototype, "onItemDisposing", null);
__decorate([
    profile
], TemplatedItemsComponent.prototype, "detectChangesOnChild", null);
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TemplatedItemsComponent, [{
        type: Component,
        args: [{
                template: ''
            }]
    }], function () { return [{ type: i0.ElementRef }, { type: i0.IterableDiffers }]; }, { loader: [{
            type: ViewChild,
            args: ['loader', { read: ViewContainerRef, static: false }]
        }], setupItemView: [{
            type: Output
        }], itemTemplateQuery: [{
            type: ContentChild,
            args: [TemplateRef, { static: false }]
        }], items: [{
            type: Input
        }], selectedIndex: [{
            type: Input
        }], onItemLoading: [], onItemDisposing: [], detectChangesOnChild: [] }); })();
export function getItemViewRoot(viewRef, rootLocator = extractSingleViewRecursive) {
    return rootLocator(viewRef.rootNodes, 0);
}
export const TEMPLATED_ITEMS_COMPONENT = new InjectionToken('TemplatedItemsComponent');
export class PagerItemDirective {
    constructor(templateRef, owner, viewContainer) {
        this.templateRef = templateRef;
        this.owner = owner;
        this.viewContainer = viewContainer;
    }
    ensureItem() {
        if (!this.item) {
            this.item = new PagerItem();
        }
    }
    applyConfig() {
        this.ensureItem();
    }
    ngOnInit() {
        this.applyConfig();
        const viewRef = this.viewContainer.createEmbeddedView(this.templateRef);
        const realViews = viewRef.rootNodes.filter((node) => !isInvisibleNode(node));
        if (realViews.length > 0) {
            const view = realViews[0];
            this.item.addChild(view);
            this.owner.nativeElement._addChildFromBuilder('PagerItem', this.item);
        }
    }
}
PagerItemDirective.ɵfac = function PagerItemDirective_Factory(t) { return new (t || PagerItemDirective)(i0.ɵɵdirectiveInject(i0.TemplateRef), i0.ɵɵdirectiveInject(TEMPLATED_ITEMS_COMPONENT, 1), i0.ɵɵdirectiveInject(i0.ViewContainerRef)); };
PagerItemDirective.ɵdir = i0.ɵɵdefineDirective({ type: PagerItemDirective, selectors: [["", "pagerItem", ""]] });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(PagerItemDirective, [{
        type: Directive,
        args: [{
                selector: '[pagerItem]'
            }]
    }], function () { return [{ type: i0.TemplateRef }, { type: TemplatedItemsComponent, decorators: [{
                type: Inject,
                args: [TEMPLATED_ITEMS_COMPONENT]
            }, {
                type: Host
            }] }, { type: i0.ViewContainerRef }]; }, null); })();
export class TemplateKeyDirective {
    constructor(templateRef, comp) {
        this.templateRef = templateRef;
        this.comp = comp;
    }
    set pagerTemplateKey(value) {
        if (this.comp && this.templateRef) {
            this.comp.registerTemplate(value, this.templateRef);
        }
    }
}
TemplateKeyDirective.ɵfac = function TemplateKeyDirective_Factory(t) { return new (t || TemplateKeyDirective)(i0.ɵɵdirectiveInject(i0.TemplateRef), i0.ɵɵdirectiveInject(TEMPLATED_ITEMS_COMPONENT, 1)); };
TemplateKeyDirective.ɵdir = i0.ɵɵdefineDirective({ type: TemplateKeyDirective, selectors: [["", "pagerTemplateKey", ""]], inputs: { pagerTemplateKey: "pagerTemplateKey" } });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TemplateKeyDirective, [{
        type: Directive,
        args: [{ selector: '[pagerTemplateKey]' }]
    }], function () { return [{ type: i0.TemplateRef }, { type: TemplatedItemsComponent, decorators: [{
                type: Inject,
                args: [TEMPLATED_ITEMS_COMPONENT]
            }, {
                type: Host
            }] }]; }, { pagerTemplateKey: [{
            type: Input
        }] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZXItaXRlbXMtY29tcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy91aS1wYWdlci9hbmd1bGFyL3BhZ2VyLWl0ZW1zLWNvbXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVILFNBQVMsRUFDVCxZQUFZLEVBQ1osU0FBUyxFQUVULFVBQVUsRUFDVixlQUFlLEVBQ2YsWUFBWSxFQUNaLElBQUksRUFDSixNQUFNLEVBQ04sY0FBYyxFQUNkLEtBQUssRUFFTCxlQUFlLEVBR2YsTUFBTSxFQUNOLFdBQVcsRUFDWCxTQUFTLEVBQ1QsZ0JBQWdCLEVBQ2hCLG1CQUFtQixJQUFJLGtCQUFrQixFQUM1QyxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFDMUYsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRyxPQUFPLEVBQTRCLFVBQVUsRUFBWSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3hHLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSwwQ0FBMEMsQ0FBQztBQUMzRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sOEJBQThCLENBQUM7OztBQUd2RCxlQUFlLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7QUFFOUMsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDO0FBYzdCLE1BQU0sT0FBTyxXQUFXO0lBQ3BCLFlBQW1CLFNBQWUsRUFBUyxJQUFVLEVBQVMsS0FBYyxFQUFTLElBQWMsRUFBUyxHQUFhO1FBQXRHLGNBQVMsR0FBVCxTQUFTLENB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QWpDUSxrQkFBa0IsNkRBS2YseUJBQXlCO3VEQUw1QixrQkFBa0I7dUZBQWxCLGtCQUFrQjtjQUg5QixTQUFTO2VBQUM7Z0JBQ1AsUUFBUSxFQUFFLGFBQWE7YUFDMUI7Z0VBUXNCLHVCQUF1QjtzQkFGckMsTUFBTTt1QkFBQyx5QkFBeUI7O3NCQUNoQyxJQUFJOztBQStCYixNQUFNLE9BQU8sb0JBQW9CO0lBQzdCLFlBQ1ksV0FBNkIsRUFHN0IsSUFBNkI7UUFIN0IsZ0JBQVcsR0FBWCxXQUFXLENBQWtCO1FBRzdCLFNBQUksR0FBSixJQUFJLENBQXlCO0lBQ3RDLENBQUM7SUFFSixJQUNJLGdCQUFnQixDQUFDLEtBQVU7UUFDM0IsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3ZEO0lBQ0wsQ0FBQzs7d0ZBYlEsb0JBQW9CLDZEQUdqQix5QkFBeUI7eURBSDVCLG9CQUFvQjt1RkFBcEIsb0JBQW9CO2NBRGhDLFNBQVM7ZUFBQyxFQUFFLFFBQVEsRUFBRSxvQkFBb0IsRUFBRTtnRUFNdkIsdUJBQXVCO3NCQUZwQyxNQUFNO3VCQUFDLHlCQUF5Qjs7c0JBQ2hDLElBQUk7d0JBS0wsZ0JBQWdCO2tCQURuQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBBZnRlckNvbnRlbnRJbml0LFxuICAgIENvbXBvbmVudCxcbiAgICBDb250ZW50Q2hpbGQsXG4gICAgRGlyZWN0aXZlLFxuICAgIERvQ2hlY2ssXG4gICAgRWxlbWVudFJlZixcbiAgICBFbWJlZGRlZFZpZXdSZWYsXG4gICAgRXZlbnRFbWl0dGVyLFxuICAgIEhvc3QsXG4gICAgSW5qZWN0LFxuICAgIEluamVjdGlvblRva2VuLFxuICAgIElucHV0LFxuICAgIEl0ZXJhYmxlRGlmZmVyLFxuICAgIEl0ZXJhYmxlRGlmZmVycyxcbiAgICBPbkRlc3Ryb3ksXG4gICAgT25Jbml0LFxuICAgIE91dHB1dCxcbiAgICBUZW1wbGF0ZVJlZixcbiAgICBWaWV3Q2hpbGQsXG4gICAgVmlld0NvbnRhaW5lclJlZixcbiAgICDJtWlzTGlzdExpa2VJdGVyYWJsZSBhcyBpc0xpc3RMaWtlSXRlcmFibGVcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBQYWdlciwgUGFnZXJFcnJvciwgUGFnZXJJdGVtLCBQYWdlckxvZyB9IGZyb20gJ0BuYXRpdmVzY3JpcHQtY29tbXVuaXR5L3VpLXBhZ2VyJztcbmltcG9ydCB7IGV4dHJhY3RTaW5nbGVWaWV3UmVjdXJzaXZlLCBpc0ludmlzaWJsZU5vZGUsIHJlZ2lzdGVyRWxlbWVudCB9IGZyb20gJ0BuYXRpdmVzY3JpcHQvYW5ndWxhcic7XG5pbXBvcnQgeyBFdmVudERhdGEsIEtleWVkVGVtcGxhdGUsIExheW91dEJhc2UsIFRlbXBsYXRlLCBUcmFjZSwgVmlldywgaXNJT1MgfSBmcm9tICdAbmF0aXZlc2NyaXB0L2NvcmUnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZUFycmF5IH0gZnJvbSAnQG5hdGl2ZXNjcmlwdC9jb3JlL2RhdGEvb2JzZXJ2YWJsZS1hcnJheSc7XG5pbXBvcnQgeyBwcm9maWxlIH0gZnJvbSAnQG5hdGl2ZXNjcmlwdC9jb3JlL3Byb2ZpbGluZyc7XG5pbXBvcnQgeyBJdGVtRXZlbnREYXRhLCBJdGVtc1NvdXJjZSB9IGZyb20gJ0BuYXRpdmVzY3JpcHQvY29yZS91aS9saXN0LXZpZXcnO1xuXG5yZWdpc3RlckVsZW1lbnQoJ1BhZ2VyJywgKCkgPT4gUGFnZXIpO1xucmVnaXN0ZXJFbGVtZW50KCdQYWdlckl0ZW0nLCAoKSA9PiBQYWdlckl0ZW0pO1xuXG5jb25zdCBOR19WSUVXID0gJ19uZ1ZpZXdSZWYnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2VyVGVtcGxhdGVkSXRlbXNWaWV3IHtcbiAgICBpdGVtczogYW55W10gfCBJdGVtc1NvdXJjZTtcbiAgICBpdGVtVGVtcGxhdGU6IHN0cmluZyB8IFRlbXBsYXRlO1xuICAgIGl0ZW1UZW1wbGF0ZXM/OiBzdHJpbmcgfCBLZXllZFRlbXBsYXRlW107XG5cbiAgICByZWZyZXNoKCk6IHZvaWQ7XG5cbiAgICBvbihldmVudDogJ2l0ZW1EaXNwb3NpbmcnIHwgJ2l0ZW1Mb2FkaW5nJywgY2FsbGJhY2s6IChhcmdzOiBJdGVtRXZlbnREYXRhKSA9PiB2b2lkLCB0aGlzQXJnPzogYW55KTtcblxuICAgIG9mZihldmVudDogJ2l0ZW1Mb2FkaW5nJyB8ICdpdGVtRGlzcG9zaW5nJywgY2FsbGJhY2s6IChhcmdzOiBFdmVudERhdGEpID0+IHZvaWQsIHRoaXNBcmc/OiBhbnkpO1xufVxuXG5leHBvcnQgY2xhc3MgSXRlbUNvbnRleHQge1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyAkaW1wbGljaXQ/OiBhbnksIHB1YmxpYyBpdGVtPzogYW55LCBwdWJsaWMgaW5kZXg/OiBudW1iZXIsIHB1YmxpYyBldmVuPzogYm9vbGVhbiwgcHVibGljIG9kZD86IGJvb2xlYW4pIHt9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dXBJdGVtVmlld0FyZ3Mge1xuICAgIHZpZXc6IEVtYmVkZGVkVmlld1JlZjxhbnk+O1xuICAgIGRhdGE6IGFueTtcbiAgICBpbmRleDogbnVtYmVyO1xuICAgIGNvbnRleHQ6IEl0ZW1Db250ZXh0O1xufVxuQENvbXBvbmVudCh7XG4gICAgdGVtcGxhdGU6ICcnXG59KVxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRlbXBsYXRlZEl0ZW1zQ29tcG9uZW50IGltcGxlbWVudHMgRG9DaGVjaywgT25EZXN0cm95LCBBZnRlckNvbnRlbnRJbml0IHtcbiAgICBwdWJsaWMgYWJzdHJhY3QgZ2V0IG5hdGl2ZUVsZW1lbnQoKTogUGFnZXI7XG5cbiAgICBwcm90ZWN0ZWQgdGVtcGxhdGVkSXRlbXNWaWV3OiBQYWdlcjtcbiAgICBwcm90ZWN0ZWQgX2l0ZW1zOiBhbnk7XG4gICAgcHJvdGVjdGVkIF9kaWZmZXI6IEl0ZXJhYmxlRGlmZmVyPEtleWVkVGVtcGxhdGU+O1xuICAgIHByb3RlY3RlZCBfdGVtcGxhdGVNYXA6IE1hcDxzdHJpbmcsIEtleWVkVGVtcGxhdGU+O1xuICAgIHByaXZhdGUgX3NlbGVjdGVkSW5kZXg6IG51bWJlcjtcbiAgICBAVmlld0NoaWxkKCdsb2FkZXInLCB7IHJlYWQ6IFZpZXdDb250YWluZXJSZWYsIHN0YXRpYzogZmFsc2UgfSkgbG9hZGVyOiBWaWV3Q29udGFpbmVyUmVmO1xuXG4gICAgQE91dHB1dCgpXG4gICAgcHVibGljIHNldHVwSXRlbVZpZXcgPSBuZXcgRXZlbnRFbWl0dGVyPFNldHVwSXRlbVZpZXdBcmdzPigpO1xuXG4gICAgQENvbnRlbnRDaGlsZChUZW1wbGF0ZVJlZiwgeyBzdGF0aWM6IGZhbHNlIH0pIGl0ZW1UZW1wbGF0ZVF1ZXJ5OiBUZW1wbGF0ZVJlZjxJdGVtQ29udGV4dD47XG5cbiAgICBpdGVtVGVtcGxhdGU6IFRlbXBsYXRlUmVmPEl0ZW1Db250ZXh0PjtcblxuICAgIEBJbnB1dCgpXG4gICAgZ2V0IGl0ZW1zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXRlbXM7XG4gICAgfVxuXG4gICAgc2V0IGl0ZW1zKHZhbHVlOiBhbnkpIHtcbiAgICAgICAgdGhpcy5faXRlbXMgPSB2YWx1ZTtcbiAgICAgICAgbGV0IG5lZWREaWZmZXIgPSB0cnVlO1xuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBPYnNlcnZhYmxlQXJyYXkpIHtcbiAgICAgICAgICAgIG5lZWREaWZmZXIgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmVlZERpZmZlciAmJiAhdGhpcy5fZGlmZmVyICYmIGlzTGlzdExpa2VJdGVyYWJsZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2RpZmZlciA9IHRoaXMuX2l0ZXJhYmxlRGlmZmVycy5maW5kKHRoaXMuX2l0ZW1zKS5jcmVhdGUoKF9pbmRleCwgaXRlbSkgPT4gaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRlbXBsYXRlZEl0ZW1zVmlldy5pdGVtcyA9IHRoaXMuX2l0ZW1zO1xuICAgIH1cblxuICAgIEBJbnB1dCgpXG4gICAgZ2V0IHNlbGVjdGVkSW5kZXgoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gICAgfVxuXG4gICAgc2V0IHNlbGVjdGVkSW5kZXgodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IHZhbHVlO1xuICAgICAgICB0aGlzLnRlbXBsYXRlZEl0ZW1zVmlldy5zZWxlY3RlZEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleDtcbiAgICB9XG5cbiAgICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgICAgIGlmICghIXRoaXMuX3NlbGVjdGVkSW5kZXgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpc0lPUykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRlbXBsYXRlZEl0ZW1zVmlldy5zY3JvbGxUb0luZGV4QW5pbWF0ZWQodGhpcy5fc2VsZWN0ZWRJbmRleCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRlbXBsYXRlZEl0ZW1zVmlldy5zZWxlY3RlZEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWYsIHByaXZhdGUgX2l0ZXJhYmxlRGlmZmVyczogSXRlcmFibGVEaWZmZXJzKSB7XG4gICAgICAgIHRoaXMudGVtcGxhdGVkSXRlbXNWaWV3ID0gX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcblxuICAgICAgICB0aGlzLnRlbXBsYXRlZEl0ZW1zVmlldy5vbignaXRlbUxvYWRpbmcnLCB0aGlzLm9uSXRlbUxvYWRpbmcsIHRoaXMpO1xuICAgICAgICB0aGlzLnRlbXBsYXRlZEl0ZW1zVmlldy5vbignaXRlbURpc3Bvc2luZycsIHRoaXMub25JdGVtRGlzcG9zaW5nLCB0aGlzKTtcbiAgICB9XG5cbiAgICBuZ0FmdGVyQ29udGVudEluaXQoKSB7XG4gICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgUGFnZXJMb2coJ1RlbXBsYXRlZEl0ZW1zVmlldy5uZ0FmdGVyQ29udGVudEluaXQoKScpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc2V0SXRlbVRlbXBsYXRlcygpO1xuICAgIH1cblxuICAgIG5nT25EZXN0cm95KCkge1xuICAgICAgICB0aGlzLnRlbXBsYXRlZEl0ZW1zVmlldy5vZmYoJ2l0ZW1Mb2FkaW5nJywgdGhpcy5vbkl0ZW1Mb2FkaW5nLCB0aGlzKTtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZWRJdGVtc1ZpZXcub2ZmKCdpdGVtRGlzcG9zaW5nJywgdGhpcy5vbkl0ZW1EaXNwb3NpbmcsIHRoaXMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0SXRlbVRlbXBsYXRlcygpIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zKSByZXR1cm47XG4gICAgICAgIC8vIFRoZSBpdGVtVGVtcGxhdGVRdWVyeSBtYXkgYmUgY2hhbmdlZCBhZnRlciBsaXN0IGl0ZW1zIGFyZSBhZGRlZCB0aGF0IGNvbnRhaW4gPHRlbXBsYXRlPiBpbnNpZGUsXG4gICAgICAgIC8vIHNvIGNhY2hlIGFuZCB1c2Ugb25seSB0aGUgb3JpZ2luYWwgdGVtcGxhdGUgdG8gYXZvaWQgZXJyb3JzLlxuICAgICAgICB0aGlzLml0ZW1UZW1wbGF0ZSA9IHRoaXMuaXRlbVRlbXBsYXRlUXVlcnk7XG5cbiAgICAgICAgaWYgKHRoaXMuX3RlbXBsYXRlTWFwKSB7XG4gICAgICAgICAgICBpZiAoVHJhY2UuaXNFbmFibGVkKCkpIHtcbiAgICAgICAgICAgICAgICBQYWdlckxvZygnU2V0dGluZyB0ZW1wbGF0ZXMnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVzOiBLZXllZFRlbXBsYXRlW10gPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3RlbXBsYXRlTWFwLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVzLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlZEl0ZW1zVmlldy5pdGVtVGVtcGxhdGVzID0gdGVtcGxhdGVzO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlZ2lzdGVyVGVtcGxhdGUoa2V5OiBzdHJpbmcsIHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxJdGVtQ29udGV4dD4pIHtcbiAgICAgICAgaWYgKFRyYWNlLmlzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICBQYWdlckxvZyhgcmVnaXN0ZXJUZW1wbGF0ZSBmb3Iga2V5OiAke2tleX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5fdGVtcGxhdGVNYXApIHtcbiAgICAgICAgICAgIHRoaXMuX3RlbXBsYXRlTWFwID0gbmV3IE1hcDxzdHJpbmcsIEtleWVkVGVtcGxhdGU+KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBrZXllZFRlbXBsYXRlID0ge1xuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgY3JlYXRlVmlldzogdGhpcy5nZXRJdGVtVGVtcGxhdGVWaWV3RmFjdG9yeSh0ZW1wbGF0ZSlcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl90ZW1wbGF0ZU1hcC5zZXQoa2V5LCBrZXllZFRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICBAcHJvZmlsZVxuICAgIHB1YmxpYyBvbkl0ZW1Mb2FkaW5nKGFyZ3M6IEl0ZW1FdmVudERhdGEpIHtcbiAgICAgICAgaWYgKCFhcmdzLnZpZXcgJiYgIXRoaXMuaXRlbVRlbXBsYXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuaXRlbXMpIHJldHVybjtcblxuICAgICAgICBjb25zdCBpbmRleCA9IGFyZ3MuaW5kZXg7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gKGFyZ3Mub2JqZWN0IGFzIGFueSkuaXRlbXM7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRJdGVtID0gdHlwZW9mIGl0ZW1zLmdldEl0ZW0gPT09ICdmdW5jdGlvbicgPyBpdGVtcy5nZXRJdGVtKGluZGV4KSA6IGl0ZW1zW2luZGV4XTtcbiAgICAgICAgbGV0IHZpZXdSZWY6IEVtYmVkZGVkVmlld1JlZjxJdGVtQ29udGV4dD47XG5cbiAgICAgICAgaWYgKGFyZ3Mudmlldykge1xuICAgICAgICAgICAgaWYgKFRyYWNlLmlzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgUGFnZXJMb2coYG9uSXRlbUxvYWRpbmc6ICR7aW5kZXh9IC0gUmV1c2luZyBleGlzdGluZyB2aWV3YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZpZXdSZWYgPSBhcmdzLnZpZXdbTkdfVklFV107XG4gICAgICAgICAgICAvLyBHZXR0aW5nIGFuZ3VsYXIgdmlldyBmcm9tIG9yaWdpbmFsIGVsZW1lbnQgKGluIGNhc2VzIHdoZW4gUHJveHlWaWV3Q29udGFpbmVyXG4gICAgICAgICAgICAvLyBpcyB1c2VkIE5hdGl2ZVNjcmlwdCBpbnRlcm5hbGx5IHdyYXBzIGl0IGluIGEgU3RhY2tMYXlvdXQpXG4gICAgICAgICAgICBpZiAoIXZpZXdSZWYgJiYgYXJncy52aWV3IGluc3RhbmNlb2YgTGF5b3V0QmFzZSAmJiBhcmdzLnZpZXcuZ2V0Q2hpbGRyZW5Db3VudCgpID4gMCkge1xuICAgICAgICAgICAgICAgIHZpZXdSZWYgPSBhcmdzLnZpZXcuZ2V0Q2hpbGRBdCgwKVtOR19WSUVXXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF2aWV3UmVmICYmIFRyYWNlLmlzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgUGFnZXJFcnJvcihgVmlld1JlZmVyZW5jZSBub3QgZm91bmQgZm9yIGl0ZW0gJHtpbmRleH0uIFZpZXcgcmVjeWNsaW5nIGlzIG5vdCB3b3JraW5nYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXZpZXdSZWYpIHtcbiAgICAgICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgIFBhZ2VyTG9nKGBvbkl0ZW1Mb2FkaW5nOiAke2luZGV4fSAtIENyZWF0aW5nIHZpZXcgZnJvbSB0ZW1wbGF0ZWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2aWV3UmVmID0gdGhpcy5sb2FkZXIuY3JlYXRlRW1iZWRkZWRWaWV3KHRoaXMuaXRlbVRlbXBsYXRlLCBuZXcgSXRlbUNvbnRleHQoKSwgMCk7XG4gICAgICAgICAgICBhcmdzLnZpZXcgPSBnZXRJdGVtVmlld1Jvb3Qodmlld1JlZik7XG4gICAgICAgICAgICBhcmdzLnZpZXdbTkdfVklFV10gPSB2aWV3UmVmO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXR1cFZpZXdSZWYodmlld1JlZiwgY3VycmVudEl0ZW0sIGluZGV4KTtcblxuICAgICAgICB0aGlzLmRldGVjdENoYW5nZXNPbkNoaWxkKHZpZXdSZWYsIGluZGV4KTtcbiAgICB9XG5cbiAgICBAcHJvZmlsZVxuICAgIHB1YmxpYyBvbkl0ZW1EaXNwb3NpbmcoYXJnczogSXRlbUV2ZW50RGF0YSkge1xuICAgICAgICBpZiAoIWFyZ3Mudmlldykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCB2aWV3UmVmOiBFbWJlZGRlZFZpZXdSZWY8SXRlbUNvbnRleHQ+O1xuXG4gICAgICAgIGlmIChhcmdzLnZpZXcpIHtcbiAgICAgICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgIFBhZ2VyTG9nKGBvbkl0ZW1EaXNwb3Npbmc6ICR7YXJncy5pbmRleH0gLSBSZW1vdmluZyBhbmd1bGFyIHZpZXdgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmlld1JlZiA9IGFyZ3Mudmlld1tOR19WSUVXXTtcbiAgICAgICAgICAgIC8vIEdldHRpbmcgYW5ndWxhciB2aWV3IGZyb20gb3JpZ2luYWwgZWxlbWVudCAoaW4gY2FzZXMgd2hlbiBQcm94eVZpZXdDb250YWluZXJcbiAgICAgICAgICAgIC8vIGlzIHVzZWQgTmF0aXZlU2NyaXB0IGludGVybmFsbHkgd3JhcHMgaXQgaW4gYSBTdGFja0xheW91dClcbiAgICAgICAgICAgIGlmICghdmlld1JlZiAmJiBhcmdzLnZpZXcgaW5zdGFuY2VvZiBMYXlvdXRCYXNlICYmIGFyZ3Mudmlldy5nZXRDaGlsZHJlbkNvdW50KCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgdmlld1JlZiA9IGFyZ3Mudmlldy5nZXRDaGlsZEF0KDApW05HX1ZJRVddO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXZpZXdSZWYgJiYgVHJhY2UuaXNFbmFibGVkKCkpIHtcbiAgICAgICAgICAgICAgICBQYWdlckVycm9yKGBWaWV3UmVmZXJlbmNlIG5vdCBmb3VuZCBmb3IgaXRlbSAke2FyZ3MuaW5kZXh9LiBWaWV3IGRpc3Bvc2luZyBpcyBub3Qgd29ya2luZ2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZpZXdSZWYpIHtcbiAgICAgICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgIFBhZ2VyTG9nKGBvbkl0ZW1EaXNwb3Npbmc6ICR7YXJncy5pbmRleH0gLSBEaXNwb3NpbmcgdmlldyByZWZlcmVuY2VgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmlld1JlZi5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0dXBWaWV3UmVmKHZpZXdSZWY6IEVtYmVkZGVkVmlld1JlZjxJdGVtQ29udGV4dD4sIGRhdGE6IGFueSwgaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gdmlld1JlZi5jb250ZXh0O1xuICAgICAgICBjb250ZXh0LiRpbXBsaWNpdCA9IGRhdGE7XG4gICAgICAgIGNvbnRleHQuaXRlbSA9IGRhdGE7XG4gICAgICAgIGNvbnRleHQuaW5kZXggPSBpbmRleDtcbiAgICAgICAgY29udGV4dC5ldmVuID0gaW5kZXggJSAyID09PSAwO1xuICAgICAgICBjb250ZXh0Lm9kZCA9ICFjb250ZXh0LmV2ZW47XG5cbiAgICAgICAgdGhpcy5zZXR1cEl0ZW1WaWV3Lm5leHQoe1xuICAgICAgICAgICAgdmlldzogdmlld1JlZixcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGdldEl0ZW1UZW1wbGF0ZVZpZXdGYWN0b3J5KHRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxJdGVtQ29udGV4dD4pOiAoKSA9PiBWaWV3IHtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZpZXdSZWYgPSB0aGlzLmxvYWRlci5jcmVhdGVFbWJlZGRlZFZpZXcodGVtcGxhdGUsIG5ldyBJdGVtQ29udGV4dCgpLCAwKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdFZpZXcgPSBnZXRJdGVtVmlld1Jvb3Qodmlld1JlZik7XG4gICAgICAgICAgICByZXN1bHRWaWV3W05HX1ZJRVddID0gdmlld1JlZjtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFZpZXc7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgQHByb2ZpbGVcbiAgICBwcml2YXRlIGRldGVjdENoYW5nZXNPbkNoaWxkKHZpZXdSZWY6IEVtYmVkZGVkVmlld1JlZjxJdGVtQ29udGV4dD4sIGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgaWYgKFRyYWNlLmlzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICBQYWdlckxvZyhgTWFudWFsbHkgZGV0ZWN0IGNoYW5nZXMgaW4gY2hpbGQ6ICR7aW5kZXh9YCk7XG4gICAgICAgIH1cblxuICAgICAgICB2aWV3UmVmLm1hcmtGb3JDaGVjaygpO1xuICAgICAgICB2aWV3UmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG5cbiAgICBuZ0RvQ2hlY2soKSB7XG4gICAgICAgIGlmICh0aGlzLl9kaWZmZXIpIHtcbiAgICAgICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgIFBhZ2VyTG9nKCduZ0RvQ2hlY2soKSAtIGV4ZWN1dGUgZGlmZmVyJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNoYW5nZXMgPSB0aGlzLl9kaWZmZXIuZGlmZih0aGlzLl9pdGVtcyk7XG4gICAgICAgICAgICBpZiAoY2hhbmdlcykge1xuICAgICAgICAgICAgICAgIGlmIChUcmFjZS5pc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICBQYWdlckxvZygnbmdEb0NoZWNrKCkgLSByZWZyZXNoJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZWRJdGVtc1ZpZXcucmVmcmVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbXBvbmVudFZpZXcge1xuICAgIHJvb3ROb2RlczogYW55W107XG5cbiAgICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbmV4cG9ydCB0eXBlIFJvb3RMb2NhdG9yID0gKG5vZGVzOiBhbnlbXSwgbmVzdExldmVsOiBudW1iZXIpID0+IFZpZXc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJdGVtVmlld1Jvb3Qodmlld1JlZjogQ29tcG9uZW50Vmlldywgcm9vdExvY2F0b3I6IFJvb3RMb2NhdG9yID0gZXh0cmFjdFNpbmdsZVZpZXdSZWN1cnNpdmUgYXMgYW55KTogVmlldyB7XG4gICAgcmV0dXJuIHJvb3RMb2NhdG9yKHZpZXdSZWYucm9vdE5vZGVzLCAwKTtcbn1cblxuZXhwb3J0IGNvbnN0IFRFTVBMQVRFRF9JVEVNU19DT01QT05FTlQgPSBuZXcgSW5qZWN0aW9uVG9rZW48VGVtcGxhdGVkSXRlbXNDb21wb25lbnQ+KCdUZW1wbGF0ZWRJdGVtc0NvbXBvbmVudCcpO1xuXG5ARGlyZWN0aXZlKHtcbiAgICBzZWxlY3RvcjogJ1twYWdlckl0ZW1dJ1xufSlcbmV4cG9ydCBjbGFzcyBQYWdlckl0ZW1EaXJlY3RpdmUgaW1wbGVtZW50cyBPbkluaXQge1xuICAgIHByaXZhdGUgaXRlbTogUGFnZXJJdGVtO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPGFueT4sXG4gICAgICAgIEBJbmplY3QoVEVNUExBVEVEX0lURU1TX0NPTVBPTkVOVClcbiAgICAgICAgQEhvc3QoKVxuICAgICAgICBwcml2YXRlIG93bmVyOiBUZW1wbGF0ZWRJdGVtc0NvbXBvbmVudCxcbiAgICAgICAgcHJpdmF0ZSB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmXG4gICAgKSB7fVxuXG4gICAgcHJpdmF0ZSBlbnN1cmVJdGVtKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbSkge1xuICAgICAgICAgICAgdGhpcy5pdGVtID0gbmV3IFBhZ2VySXRlbSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhcHBseUNvbmZpZygpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVJdGVtKCk7XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIHRoaXMuYXBwbHlDb25maWcoKTtcblxuICAgICAgICBjb25zdCB2aWV3UmVmID0gdGhpcy52aWV3Q29udGFpbmVyLmNyZWF0ZUVtYmVkZGVkVmlldyh0aGlzLnRlbXBsYXRlUmVmKTtcbiAgICAgICAgLy8gRmlsdGVyIG91dCB0ZXh0IG5vZGVzIGFuZCBjb21tZW50c1xuICAgICAgICBjb25zdCByZWFsVmlld3MgPSB2aWV3UmVmLnJvb3ROb2Rlcy5maWx0ZXIoKG5vZGUpID0+ICFpc0ludmlzaWJsZU5vZGUobm9kZSkpO1xuXG4gICAgICAgIGlmIChyZWFsVmlld3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgdmlldyA9IHJlYWxWaWV3c1swXTtcbiAgICAgICAgICAgIHRoaXMuaXRlbS5hZGRDaGlsZCh2aWV3KTtcbiAgICAgICAgICAgIHRoaXMub3duZXIubmF0aXZlRWxlbWVudC5fYWRkQ2hpbGRGcm9tQnVpbGRlcignUGFnZXJJdGVtJywgdGhpcy5pdGVtKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQERpcmVjdGl2ZSh7IHNlbGVjdG9yOiAnW3BhZ2VyVGVtcGxhdGVLZXldJyB9KVxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlS2V5RGlyZWN0aXZlIHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSB0ZW1wbGF0ZVJlZjogVGVtcGxhdGVSZWY8YW55PixcbiAgICAgICAgQEluamVjdChURU1QTEFURURfSVRFTVNfQ09NUE9ORU5UKVxuICAgICAgICBASG9zdCgpXG4gICAgICAgIHByaXZhdGUgY29tcDogVGVtcGxhdGVkSXRlbXNDb21wb25lbnRcbiAgICApIHt9XG5cbiAgICBASW5wdXQoKVxuICAgIHNldCBwYWdlclRlbXBsYXRlS2V5KHZhbHVlOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMuY29tcCAmJiB0aGlzLnRlbXBsYXRlUmVmKSB7XG4gICAgICAgICAgICB0aGlzLmNvbXAucmVnaXN0ZXJUZW1wbGF0ZSh2YWx1ZSwgdGhpcy50ZW1wbGF0ZVJlZik7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=