import { ChangeDetectionStrategy, Component, ElementRef, IterableDiffers, NO_ERRORS_SCHEMA, NgModule, forwardRef } from '@angular/core';
import { Pager } from '@nativescript-community/ui-pager';
import { PagerItemDirective, TEMPLATED_ITEMS_COMPONENT, TemplateKeyDirective, TemplatedItemsComponent } from './pager-items-comp';
import * as i0 from "@angular/core";
export { PagerItemDirective, TemplatedItemsComponent, TemplateKeyDirective } from './pager-items-comp';
export class PagerComponent extends TemplatedItemsComponent {
    constructor(_elementRef, _iterableDiffers) {
        super(_elementRef, _iterableDiffers);
    }
    get nativeElement() {
        return this.templatedItemsView;
    }
}
PagerComponent.ɵfac = function PagerComponent_Factory(t) { return new (t || PagerComponent)(i0.ɵɵdirectiveInject(i0.ElementRef), i0.ɵɵdirectiveInject(i0.IterableDiffers)); };
PagerComponent.ɵcmp = i0.ɵɵdefineComponent({ type: PagerComponent, selectors: [["Pager"]], features: [i0.ɵɵProvidersFeature([
            {
                provide: TEMPLATED_ITEMS_COMPONENT,
                useExisting: forwardRef(() => PagerComponent)
            }
        ]), i0.ɵɵInheritDefinitionFeature], decls: 3, vars: 0, consts: [["loader", ""]], template: function PagerComponent_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelementStart(0, "DetachedContainer");
        i0.ɵɵelement(1, "Placeholder", null, 0);
        i0.ɵɵelementEnd();
    } }, encapsulation: 2, changeDetection: 0 });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(PagerComponent, [{
        type: Component,
        args: [{
                selector: 'Pager',
                template: ` <DetachedContainer>
        <Placeholder #loader></Placeholder>
    </DetachedContainer>`,
                changeDetection: ChangeDetectionStrategy.OnPush,
                providers: [
                    {
                        provide: TEMPLATED_ITEMS_COMPONENT,
                        useExisting: forwardRef(() => PagerComponent)
                    }
                ]
            }]
    }], function () { return [{ type: i0.ElementRef }, { type: i0.IterableDiffers }]; }, null); })();
export class PagerModule {
}
PagerModule.ɵfac = function PagerModule_Factory(t) { return new (t || PagerModule)(); };
PagerModule.ɵmod = i0.ɵɵdefineNgModule({ type: PagerModule });
PagerModule.ɵinj = i0.ɵɵdefineInjector({});
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(PagerModule, [{
        type: NgModule,
        args: [{
                declarations: [PagerComponent, TemplateKeyDirective, PagerItemDirective],
                exports: [PagerComponent, TemplateKeyDirective, PagerItemDirective],
                schemas: [NO_ERRORS_SCHEMA]
            }]
    }], null, null); })();
(function () { (typeof ngJitMode === "undefined" || ngJitMode) && i0.ɵɵsetNgModuleScope(PagerModule, { declarations: [PagerComponent, TemplateKeyDirective, PagerItemDirective], exports: [PagerComponent, TemplateKeyDirective, PagerItemDirective] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvdWktcGFnZXIvYW5ndWxhci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUV4SSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFDekQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLHlCQUF5QixFQUFFLG9CQUFvQixFQUFFLHVCQUF1QixFQUFFLE1BQU0sb0JBQW9CLENBQUM7O0FBRWxJLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSx1QkFBdUIsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBZXZHLE1BQU0sT0FBTyxjQUFlLFNBQVEsdUJBQXVCO0lBT3ZELFlBQVksV0FBdUIsRUFBRSxnQkFBaUM7UUFDbEUsS0FBSyxDQUFDLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFSRCxJQUFXLGFBQWE7UUFDcEIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUM7SUFDbkMsQ0FBQzs7NEVBSFEsY0FBYzttREFBZCxjQUFjLDJEQVBaO1lBQ1A7Z0JBQ0ksT0FBTyxFQUFFLHlCQUF5QjtnQkFDbEMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUM7YUFDaEQ7U0FDSjtRQVRXLHlDQUFtQjtRQUMzQix1Q0FBbUM7UUFDdkMsaUJBQW9COzt1RkFTWCxjQUFjO2NBYjFCLFNBQVM7ZUFBQztnQkFDUCxRQUFRLEVBQUUsT0FBTztnQkFDakIsUUFBUSxFQUFFOzt5QkFFVztnQkFDckIsZUFBZSxFQUFFLHVCQUF1QixDQUFDLE1BQU07Z0JBQy9DLFNBQVMsRUFBRTtvQkFDUDt3QkFDSSxPQUFPLEVBQUUseUJBQXlCO3dCQUNsQyxXQUFXLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRSxlQUFlLENBQUM7cUJBQ2hEO2lCQUNKO2FBQ0o7O0FBa0JELE1BQU0sT0FBTyxXQUFXOztzRUFBWCxXQUFXOytDQUFYLFdBQVc7O3VGQUFYLFdBQVc7Y0FMdkIsUUFBUTtlQUFDO2dCQUNOLFlBQVksRUFBRSxDQUFDLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxrQkFBa0IsQ0FBQztnQkFDeEUsT0FBTyxFQUFFLENBQUMsY0FBYyxFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixDQUFDO2dCQUNuRSxPQUFPLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzthQUM5Qjs7d0ZBQ1ksV0FBVyxtQkFqQlgsY0FBYyxFQWFRLG9CQUFvQixFQUFFLGtCQUFrQixhQWI5RCxjQUFjLEVBY0csb0JBQW9CLEVBQUUsa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIENvbXBvbmVudCwgRWxlbWVudFJlZiwgSXRlcmFibGVEaWZmZXJzLCBOT19FUlJPUlNfU0NIRU1BLCBOZ01vZHVsZSwgZm9yd2FyZFJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQgeyBQYWdlciB9IGZyb20gJ0BuYXRpdmVzY3JpcHQtY29tbXVuaXR5L3VpLXBhZ2VyJztcbmltcG9ydCB7IFBhZ2VySXRlbURpcmVjdGl2ZSwgVEVNUExBVEVEX0lURU1TX0NPTVBPTkVOVCwgVGVtcGxhdGVLZXlEaXJlY3RpdmUsIFRlbXBsYXRlZEl0ZW1zQ29tcG9uZW50IH0gZnJvbSAnLi9wYWdlci1pdGVtcy1jb21wJztcblxuZXhwb3J0IHsgUGFnZXJJdGVtRGlyZWN0aXZlLCBUZW1wbGF0ZWRJdGVtc0NvbXBvbmVudCwgVGVtcGxhdGVLZXlEaXJlY3RpdmUgfSBmcm9tICcuL3BhZ2VyLWl0ZW1zLWNvbXAnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ1BhZ2VyJyxcbiAgICB0ZW1wbGF0ZTogYCA8RGV0YWNoZWRDb250YWluZXI+XG4gICAgICAgIDxQbGFjZWhvbGRlciAjbG9hZGVyPjwvUGxhY2Vob2xkZXI+XG4gICAgPC9EZXRhY2hlZENvbnRhaW5lcj5gLFxuICAgIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICAgIHByb3ZpZGVyczogW1xuICAgICAgICB7XG4gICAgICAgICAgICBwcm92aWRlOiBURU1QTEFURURfSVRFTVNfQ09NUE9ORU5ULFxuICAgICAgICAgICAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gUGFnZXJDb21wb25lbnQpXG4gICAgICAgIH1cbiAgICBdXG59KVxuZXhwb3J0IGNsYXNzIFBhZ2VyQ29tcG9uZW50IGV4dGVuZHMgVGVtcGxhdGVkSXRlbXNDb21wb25lbnQge1xuICAgIHB1YmxpYyBnZXQgbmF0aXZlRWxlbWVudCgpOiBQYWdlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlZEl0ZW1zVmlldztcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgdGVtcGxhdGVkSXRlbXNWaWV3OiBQYWdlcjtcblxuICAgIGNvbnN0cnVjdG9yKF9lbGVtZW50UmVmOiBFbGVtZW50UmVmLCBfaXRlcmFibGVEaWZmZXJzOiBJdGVyYWJsZURpZmZlcnMpIHtcbiAgICAgICAgc3VwZXIoX2VsZW1lbnRSZWYsIF9pdGVyYWJsZURpZmZlcnMpO1xuICAgIH1cbn1cblxuQE5nTW9kdWxlKHtcbiAgICBkZWNsYXJhdGlvbnM6IFtQYWdlckNvbXBvbmVudCwgVGVtcGxhdGVLZXlEaXJlY3RpdmUsIFBhZ2VySXRlbURpcmVjdGl2ZV0sXG4gICAgZXhwb3J0czogW1BhZ2VyQ29tcG9uZW50LCBUZW1wbGF0ZUtleURpcmVjdGl2ZSwgUGFnZXJJdGVtRGlyZWN0aXZlXSxcbiAgICBzY2hlbWFzOiBbTk9fRVJST1JTX1NDSEVNQV1cbn0pXG5leHBvcnQgY2xhc3MgUGFnZXJNb2R1bGUge31cbiJdfQ==