var PagerCell_1, UICollectionDelegateImpl_1, UICollectionViewDataSourceImpl_1, UICollectionViewFlowLinearLayoutImpl_1;
import { ChangeType, Color, Observable, ObservableArray, Property, ProxyViewContainer, StackLayout, Utils, View, ViewBase, profile } from '@nativescript/core';
import { layout } from '@nativescript/core/utils/utils';
import { Indicator, PagerBase, autoPlayProperty, autoplayDelayProperty, disableSwipeProperty, indicatorColorProperty, indicatorProperty, indicatorSelectedColorProperty, itemTemplatesProperty, itemsProperty, orientationProperty, selectedIndexProperty, showIndicatorProperty } from './index.common';
export * from './index.common';
export { Transformer } from './index.common';
const main_queue = dispatch_get_current_queue();
export var ContentInsetAdjustmentBehavior;
(function (ContentInsetAdjustmentBehavior) {
    ContentInsetAdjustmentBehavior[ContentInsetAdjustmentBehavior["Always"] = 3] = "Always";
    ContentInsetAdjustmentBehavior[ContentInsetAdjustmentBehavior["Automatic"] = 0] = "Automatic";
    ContentInsetAdjustmentBehavior[ContentInsetAdjustmentBehavior["Never"] = 2] = "Never";
    ContentInsetAdjustmentBehavior[ContentInsetAdjustmentBehavior["ScrollableAxes"] = 1] = "ScrollableAxes";
})(ContentInsetAdjustmentBehavior || (ContentInsetAdjustmentBehavior = {}));
function parseContentInsetAdjustmentBehavior(value) {
    if (typeof value === 'string') {
        switch (value) {
            case 'always':
                return ContentInsetAdjustmentBehavior.Always;
            case 'never':
                return ContentInsetAdjustmentBehavior.Never;
            case 'scrollableAxes':
                return ContentInsetAdjustmentBehavior.ScrollableAxes;
            default:
            case 'automatic':
                return ContentInsetAdjustmentBehavior.Automatic;
        }
    }
    else {
        return value;
    }
}
export const contentInsetAdjustmentBehaviorProperty = new Property({
    name: 'contentInsetAdjustmentBehavior',
    valueConverter: parseContentInsetAdjustmentBehavior,
    defaultValue: ContentInsetAdjustmentBehavior.Automatic
});
let UICellView = class UICellView extends UIView {
    layoutSubviews() {
        const view = this.view && this.view.get();
        if (!view) {
            return;
        }
        this.frame = this.superview.bounds;
        const size = this.bounds.size;
        View.layoutChild(null, view, 0, 0, Utils.layout.toDevicePixels(size.width), Utils.layout.toDevicePixels(size.height));
    }
};
UICellView = __decorate([
    NativeClass
], UICellView);
const PFLAG_FORCE_LAYOUT = 1;
export class Pager extends PagerBase {
    constructor() {
        super();
        this.lastEvent = 0;
        this.mDisableSwipe = false;
        this.mDisableAnimation = false;
        this.mPreparingCell = false;
        this.mIsRefreshing = false;
        this.mIsInit = false;
        this.mInnerWidth = 0;
        this.mInnerHeight = 0;
        this._observableArrayHandler = (args) => {
            if (!this.pager) {
                return;
            }
            if (this.indicatorView && this.mObservableArrayInstance && this.mObservableArrayInstance.length) {
                this.indicatorView.numberOfPages = this.mObservableArrayInstance.length;
            }
            const collectionView = this.pager;
            if (collectionView) {
                try {
                    let offset = 0;
                    collectionView.performBatchUpdatesCompletion(() => {
                        this.mIsRefreshing = true;
                        const array = [];
                        switch (args.action) {
                            case ChangeType.Add:
                                for (let i = 0; i < args.addedCount; i++) {
                                    array.push(NSIndexPath.indexPathForRowInSection(args.index + i, 0));
                                }
                                offset = collectionView.contentSize.width - collectionView.contentOffset.x;
                                collectionView.insertItemsAtIndexPaths(array);
                                break;
                            case ChangeType.Delete:
                                for (let i = 0; i < args.removed.length; i++) {
                                    array.push(NSIndexPath.indexPathForItemInSection(args.index + i, 0));
                                }
                                collectionView.deleteItemsAtIndexPaths(array);
                                break;
                            case ChangeType.Splice:
                                if (args.removed && args.removed.length > 0) {
                                    for (let i = 0; i < args.removed.length; i++) {
                                        array.push(NSIndexPath.indexPathForRowInSection(args.index + i, 0));
                                    }
                                    collectionView.deleteItemsAtIndexPaths(array);
                                }
                                else {
                                    const addedArray = [];
                                    for (let i = 0; i < args.addedCount; i++) {
                                        addedArray.push(NSIndexPath.indexPathForRowInSection(args.index + i, 0));
                                    }
                                    collectionView.insertItemsAtIndexPaths(addedArray);
                                }
                                break;
                            case ChangeType.Update:
                                collectionView.reloadItemsAtIndexPaths([NSIndexPath.indexPathForRowInSection(args.index, 0)]);
                                break;
                            default:
                                break;
                        }
                        this._initAutoPlay(this.autoPlay);
                        if (this.itemCount === 0) {
                            this.mIsInit = false;
                        }
                    }, null);
                }
                catch (err) { }
            }
        };
        this._isDataDirty = false;
        this.iosOverflowSafeAreaEnabledLayoutHackNeeded = true;
        this.mMap = new Map();
    }
    get pager() {
        return this.mPager;
    }
    get indicatorView() {
        return this.mIndicatorView;
    }
    createNativeView() {
        const nativeView = UIView.new();
        this.mLayout = UICollectionViewFlowLinearLayoutImpl.initWithOwner(new WeakRef(this));
        this.mLayout.scrollDirection = 1;
        this.mLayout.minimumInteritemSpacing = 0;
        const pager = (this.mPager = UICollectionView.alloc().initWithFrameCollectionViewLayout(CGRectZero, this.mLayout));
        pager.backgroundColor = UIColor.clearColor;
        pager.autoresizesSubviews = false;
        pager.autoresizingMask = 0;
        pager.showsHorizontalScrollIndicator = false;
        pager.showsVerticalScrollIndicator = false;
        pager.decelerationRate = UIScrollViewDecelerationRateFast;
        nativeView.addSubview(pager);
        return nativeView;
    }
    initNativeView() {
        super.initNativeView();
        const nativeView = this.pager;
        nativeView.registerClassForCellWithReuseIdentifier(PagerCell.class(), this._defaultTemplate.key);
        nativeView.backgroundColor = UIColor.clearColor;
        nativeView.autoresizesSubviews = false;
        nativeView.autoresizingMask = 0;
        nativeView.dataSource = this.mDataSource = UICollectionViewDataSourceImpl.initWithOwner(new WeakRef(this));
        nativeView.scrollEnabled = !this.disableSwipe;
        if (this.orientation === 'vertical') {
            this.mLayout.scrollDirection = 0;
            nativeView.alwaysBounceVertical = true;
            nativeView.alwaysBounceHorizontal = false;
        }
        else {
            this.mLayout.scrollDirection = 1;
            nativeView.alwaysBounceHorizontal = true;
            nativeView.alwaysBounceVertical = false;
        }
        this._setIndicator(this.indicator);
        this.mDelegate = UICollectionDelegateImpl.initWithOwner(new WeakRef(this));
        this._setNativeClipToBounds();
        this._initAutoPlay(this.autoPlay);
    }
    getChildView(index) {
        if (this._childrenViews) {
            return this._childrenViews[index].view;
        }
        let result;
        if (this.nativeViewProtected) {
            const cell = this.mPager.cellForItemAtIndexPath(NSIndexPath.indexPathForRowInSection(index, 0));
            return cell === null || cell === void 0 ? void 0 : cell.view;
        }
        return result;
    }
    _getRealWidthHeight() {
        let height = 0;
        let width = 0;
        width = (layout.toDeviceIndependentPixels(this._effectiveItemWidth) - (this.perPage * 2 * this._getSpacing() + this._getPeaking() * 2)) / this.perPage;
        height = (layout.toDeviceIndependentPixels(this._effectiveItemHeight) - (this.perPage * 2 * this._getSpacing() + this._getPeaking() * 2)) / this.perPage;
        return { height, width };
    }
    _nextIndex() {
        if (this.circularMode) {
            return 0;
        }
        else {
            const next = this.selectedIndex + 1;
            if (next > this.lastIndex) {
                return 0;
            }
            return next;
        }
    }
    _initAutoPlay(value) {
        if (!this.items || this.items.length === 0) {
            return;
        }
        if (!value) {
            if (this._autoPlayInterval) {
                clearInterval(this._autoPlayInterval);
                this._autoPlayInterval = undefined;
            }
        }
        else {
            if (this.isLayoutValid && !this._autoPlayInterval) {
                this._autoPlayInterval = setInterval(() => {
                    this.selectedIndex = this._nextIndex();
                }, this.autoPlayDelay);
            }
        }
    }
    getPosition(index) {
        let position = index;
        if (this.circularMode) {
            if (position === 0) {
                position = this.lastDummy;
            }
            else if (position === this.firstDummy) {
                position = 0;
            }
            else {
                position = position - 1;
            }
        }
        return position;
    }
    get itemCount() {
        return this._childrenCount ? this._childrenCount + (this.circularMode ? 2 : 0) : 0;
    }
    get lastIndex() {
        if (this.items && this.items.length === 0) {
            return 0;
        }
        return this.circularMode ? this.itemCount - 3 : this.itemCount - 1;
    }
    get firstDummy() {
        const count = this.itemCount;
        if (count === 0) {
            return 0;
        }
        return this.itemCount - 1;
    }
    get lastDummy() {
        return this.lastIndex;
    }
    _setIndicator(value) {
        if (this.mIndicatorView) {
            this.mIndicatorView.removeFromSuperview();
        }
        switch (value) {
            case Indicator.None:
                this.mIndicatorView = CHIPageControlAji.new();
                break;
            case Indicator.Worm:
                this.mIndicatorView = CHIPageControlAleppo.new();
                break;
            case Indicator.Fill:
                this.mIndicatorView = CHIPageControlChimayo.new();
                break;
            case Indicator.Swap:
                this.mIndicatorView = CHIPageControlPuya.new();
                break;
            case Indicator.THIN_WORM:
                this.mIndicatorView = CHIPageControlJalapeno.new();
                break;
            case Indicator.Flat:
                this.mIndicatorView = CHIPageControlJaloro.new();
                break;
            default:
                break;
        }
        this.mIndicatorView.tintColor = UIColor.whiteColor;
        this.mIndicatorView.currentPageTintColor = UIColor.whiteColor;
        switch (value) {
            case Indicator.None:
            case Indicator.Worm:
            case Indicator.Fill:
            case Indicator.Swap:
            case Indicator.THIN_WORM:
            case Indicator.Disabled:
                this.mIndicatorView.radius = 4;
                break;
            case Indicator.Flat:
                this.mIndicatorView.radius = 2;
                this.mIndicatorView.transform = CGAffineTransformScale(CGAffineTransformIdentity, 0.7, 0.5);
                break;
        }
    }
    get _childrenCount() {
        var _a, _b;
        return ((_a = this.items) === null || _a === void 0 ? void 0 : _a.length) || ((_b = this._childrenViews) === null || _b === void 0 ? void 0 : _b.length) || 0;
    }
    itemTemplateUpdated(oldData, newData) { }
    _setNativeClipToBounds() {
        this.pager.clipsToBounds = true;
    }
    [orientationProperty.setNative](value) {
        if (value === 'horizontal') {
            this.mLayout.scrollDirection = 1;
        }
        else {
            this.mLayout.scrollDirection = 0;
        }
    }
    eachChildView(callback) {
        this.mMap.forEach((view, key) => callback(view));
    }
    eachChild(callback) {
        this.mMap.forEach((view, key) => callback(view));
    }
    _updateScrollPosition() {
        const view = this.pager;
        const size = this.orientation === 'vertical' ? view.contentSize.height : view.contentSize.width;
        if (!view || size === 0) {
            return;
        }
        this.scrollToIndexAnimated(this.selectedIndex, false);
    }
    [selectedIndexProperty.setNative](value) {
        if (this.isLoaded) {
            this.scrollToIndexAnimated(value, !this.disableAnimation);
        }
    }
    [itemTemplatesProperty.getDefault]() {
        return null;
    }
    [itemTemplatesProperty.setNative](value) {
        this._itemTemplatesInternal = new Array(this._defaultTemplate);
        if (value) {
            for (let i = 0, length = value.length; i < length; i++) {
                this.pager.registerClassForCellWithReuseIdentifier(PagerCell.class(), value[i].key);
            }
            this._itemTemplatesInternal = this._itemTemplatesInternal.concat(value);
        }
    }
    [itemsProperty.setNative](value) {
        if (this.indicatorView && value && value.length) {
            this.indicatorView.numberOfPages = value.length;
        }
        if (this.mObservableArrayInstance) {
            this.mObservableArrayInstance.off(ObservableArray.changeEvent, this._observableArrayHandler);
            this.mObservableArrayInstance = null;
        }
        if (value instanceof ObservableArray) {
            this.mObservableArrayInstance = value;
            this.mObservableArrayInstance.on(ObservableArray.changeEvent, this._observableArrayHandler);
        }
        else {
            this.refresh();
        }
        if (!value) {
            this.mIsInit = false;
        }
        selectedIndexProperty.coerce(this);
    }
    [autoPlayProperty.setNative](value) {
        this._initAutoPlay(value);
    }
    [autoplayDelayProperty.setNative](value) {
        if (this._autoPlayInterval) {
            clearInterval(this._autoPlayInterval);
            this._autoPlayInterval = undefined;
            this._initAutoPlay(this.autoPlay);
        }
    }
    [showIndicatorProperty.setNative](value) {
        if (!this.indicatorView) {
            this._setIndicator(this.indicatorView);
        }
        if (!this.nativeView) {
            return;
        }
        this.indicatorView.center = CGPointMake(this.nativeView.center.x, this.nativeView.bounds.size.height - this.indicatorView.intrinsicContentSize.height);
        const hasParent = this.indicatorView.superview;
        if (value) {
            if (!hasParent) {
                this.nativeView.addSubview(this.indicatorView);
            }
        }
        else {
            if (hasParent) {
                this.indicatorView.removeFromSuperview();
            }
        }
    }
    _onItemsChanged(oldValue, newValue) { }
    scrollToIndexAnimated(index, animate) {
        if (!this.pager)
            return;
        const contentSize = this.pager.contentSize;
        const size = this.orientation === 'vertical' ? contentSize.height : contentSize.width;
        if (size === 0) {
            return;
        }
        if (this._childrenCount === 0) {
            return;
        }
        const maxMinIndex = Math.min(Math.max(0, index), this._childrenCount - 1);
        if (!this.isLoaded) {
            return selectedIndexProperty.nativeValueChange(this, maxMinIndex);
        }
        const frame = this.page && this.page.frame;
        if (this.page && frame) {
            if (frame._executingContext) {
                if (frame._executingContext.entry.resolvedPage !== this.page) {
                    return selectedIndexProperty.nativeValueChange(this, maxMinIndex);
                }
            }
            else if (frame.currentPage !== this.page) {
                return selectedIndexProperty.nativeValueChange(this, maxMinIndex);
            }
        }
        if (this.mDataSource.collectionViewNumberOfItemsInSection(this.pager, 0) > maxMinIndex) {
            this.pager.scrollToItemAtIndexPathAtScrollPositionAnimated(NSIndexPath.indexPathForItemInSection(maxMinIndex, 0), this.orientation === 'vertical' ? 2 : 16, !!animate);
        }
        selectedIndexProperty.nativeValueChange(this, maxMinIndex);
    }
    refresh() {
        if (!this.isLoaded || !this.nativeView) {
            this._isDataDirty = true;
            return;
        }
        this._isDataDirty = false;
        this.mLastLayoutKey = this.mInnerWidth + '_' + this.mInnerHeight;
        this.mMap.forEach((view, nativeView, map) => {
            if (!(view.bindingContext instanceof Observable)) {
                view.bindingContext = null;
            }
        });
        this.pager.reloadData();
        this.pager.collectionViewLayout.invalidateLayout();
        this._updateScrollPosition();
        this._initAutoPlay(this.autoPlay);
    }
    onLoaded() {
        super.onLoaded();
        if (this.showIndicator && this.indicatorView) {
            this.nativeView.addSubview(this.indicatorView);
        }
        if (this._isDataDirty && this.mInnerWidth !== undefined && this.mInnerHeight !== undefined) {
            this.refresh();
        }
        this.pager.delegate = this.mDelegate;
        if (!this.items && this._childrenCount > 0) {
            selectedIndexProperty.coerce(this);
            this._updateScrollPosition();
        }
    }
    onUnloaded() {
        if (this.pager) {
            this.pager.delegate = null;
        }
        super.onUnloaded();
    }
    disposeNativeView() {
        this.mDelegate = null;
        this.mDataSource = null;
        if (this.mPager) {
            this.mPager.delegate = null;
            this.mPager = null;
        }
        this.mIndicatorView = null;
        this.mLayout = null;
        if (this.mObservableArrayInstance) {
            this.mObservableArrayInstance.off(ObservableArray.changeEvent, this._observableArrayHandler);
            this.mObservableArrayInstance = null;
        }
        this.clearRealizedCells();
        super.disposeNativeView();
    }
    clearRealizedCells() {
        const that = new WeakRef(this);
        this.mMap.forEach(function (value, key) {
            that.get()._removeContainer(key);
            that.get()._clearCellViews(key);
        }, that);
        this.mMap.clear();
    }
    _clearCellViews(cell) {
        const view = cell.view;
        if (!view) {
            return;
        }
        if (view.parent && !(view.parent instanceof Pager)) {
            this._removeView(view.parent);
        }
        cell.owner = undefined;
        const preparing = this.mPreparingCell;
        this.mPreparingCell = true;
        if (view.parent && !(view.parent instanceof Pager)) {
            if (!(view.parent instanceof Pager)) {
                this._removeView(view.parent);
            }
            else {
                view.parent._removeView(view);
            }
        }
        this.mPreparingCell = preparing;
        this.mMap.delete(cell);
    }
    [indicatorProperty.setNative](value) {
        this._setIndicator(value);
    }
    [indicatorColorProperty.setNative](value) {
        if (this.indicatorView) {
            const color = !value || value instanceof Color ? value : new Color(value);
            this.indicatorView.tintColor = color ? color.ios : null;
        }
    }
    [indicatorSelectedColorProperty.setNative](value) {
        if (this.indicatorView) {
            const color = !value || value instanceof Color ? value : new Color(value);
            this.indicatorView.currentPageTintColor = color ? color.ios : null;
        }
    }
    [disableSwipeProperty.setNative](value) {
        this.mPager.scrollEnabled = !value;
        this.mDisableSwipe = value;
    }
    [contentInsetAdjustmentBehaviorProperty.setNative](value) {
        this.mPager.contentInsetAdjustmentBehavior = value;
    }
    get disableAnimation() {
        return this.mDisableAnimation;
    }
    set disableAnimation(value) {
        this.mDisableAnimation = value;
    }
    _removeContainer(cell, index) {
        let view = cell.view;
        const args = {
            eventName: Pager.itemDisposingEvent,
            object: this,
            index,
            android: undefined,
            ios: cell,
            view
        };
        this.notify(args);
        view = args.view;
        if (view && view.parent) {
            if (!(view.parent instanceof Pager)) {
                this._removeView(view.parent);
            }
            view.parent._removeView(view);
        }
        this.mMap.delete(cell);
    }
    onMeasure(widthMeasureSpec, heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
        this.mMap.forEach((childView, pagerCell) => {
            View.measureChild(this, childView, childView._currentWidthMeasureSpec, childView._currentHeightMeasureSpec);
        });
    }
    updateInnerSize() {
        const width = this.getMeasuredWidth();
        const height = this.getMeasuredHeight();
        this.mInnerWidth = width - this.effectivePaddingLeft - this.effectivePaddingRight;
        this.mInnerHeight = height - this.effectivePaddingTop - this.effectivePaddingBottom;
    }
    onLayout(left, top, right, bottom) {
        super.onLayout(left, top, right, bottom);
        this.updateInnerSize();
        if (!this.nativeView) {
            return;
        }
        this.pager.frame = this.nativeView.bounds;
        if (this.indicatorView && this.indicatorView.intrinsicContentSize) {
            this.indicatorView.center = CGPointMake(this.nativeView.center.x, this.nativeView.bounds.size.height - this.indicatorView.intrinsicContentSize.height);
        }
        const layoutView = this.pager.collectionViewLayout;
        if (!layoutView) {
            return;
        }
        layoutView.invalidateLayout();
        const size = this._getSize();
        this.mMap.forEach((childView, pagerCell) => {
            const width = layout.toDevicePixels(size.width);
            const height = layout.toDevicePixels(size.height);
            View.layoutChild(this, childView, 0, 0, width, height);
        });
        const layoutKey = this.mInnerWidth + '_' + this.mInnerHeight;
        if (this.mLastLayoutKey !== layoutKey) {
            this.refresh();
        }
    }
    requestLayout() {
        if (!this.mPreparingCell) {
            super.requestLayout();
        }
    }
    _prepareCell(cell, indexPath) {
        try {
            this.mPreparingCell = true;
            const index = indexPath.row;
            let view = cell.view;
            const template = this._getItemTemplate(indexPath.row);
            if (!view) {
                view = template.createView();
                if (!view && this._itemViewLoader !== undefined) {
                    view = this._itemViewLoader(this._getItemTemplateKey(indexPath.row));
                }
            }
            const bindingContext = this._getDataItem(indexPath.row);
            const args = {
                eventName: Pager.itemLoadingEvent,
                object: this,
                index,
                android: undefined,
                ios: cell,
                view,
                bindingContext
            };
            this.notify(args);
            view = args.view || this._getDefaultItemContent(indexPath.row);
            if (view instanceof ProxyViewContainer) {
                const sp = new StackLayout();
                sp.addChild(view);
                view = sp;
            }
            if (!cell.view) {
                cell.owner = new WeakRef(view);
            }
            else if (cell.view !== view) {
                this.mMap.delete(cell);
                this._removeContainer(cell, index);
                cell.owner = new WeakRef(view);
            }
            if (view) {
                view.bindingContext = bindingContext;
            }
            this.mMap.set(cell, view);
            if (view && !view.parent) {
                this._addView(view);
                if (this.iosOverflowSafeArea) {
                    const innerView = UICellView.new();
                    innerView.view = new WeakRef(view);
                    innerView.addSubview(view.nativeViewProtected);
                    cell.contentView.addSubview(innerView);
                }
                else {
                    cell.contentView.addSubview(view.nativeViewProtected);
                }
            }
            this._layoutCell(view, indexPath);
        }
        finally {
            this.mPreparingCell = false;
        }
    }
    _layoutCell(cellView, index) {
        if (cellView) {
            const size = this._getSize();
            const width = layout.toDevicePixels(size.width);
            const height = layout.toDevicePixels(size.height);
            const widthMeasureSpec = layout.makeMeasureSpec(width, layout.EXACTLY);
            const heightMeasureSpec = layout.makeMeasureSpec(height, layout.EXACTLY);
            const measured = View.measureChild(this, cellView, widthMeasureSpec, heightMeasureSpec);
        }
    }
    get horizontalOffset() {
        return this.pager ? this.pager.contentOffset.x : 0;
    }
    get verticalOffset() {
        return this.pager ? this.pager.contentOffset.y : 0;
    }
    _getSpacing() {
        return layout.toDeviceIndependentPixels(this.convertToSize(this.spacing));
    }
    _getPeaking() {
        return layout.toDeviceIndependentPixels(this.convertToSize(this.peaking));
    }
    _getSize() {
        let width = layout.toDeviceIndependentPixels(this._effectiveItemWidth);
        let height = layout.toDeviceIndependentPixels(this._effectiveItemHeight);
        if (this.orientation === 'vertical') {
            height = (height - (this._getSpacing() * 2 + this._getPeaking() * 2)) / this.perPage;
        }
        else {
            width = (width - (this._getSpacing() * 2 + this._getPeaking() * 2)) / this.perPage;
        }
        if (Number.isNaN(width)) {
            width = 0;
        }
        if (Number.isNaN(height)) {
            height = 0;
        }
        return { width, height };
    }
}
__decorate([
    profile
], Pager.prototype, "refresh", null);
let PagerCell = PagerCell_1 = class PagerCell extends UICollectionViewCell {
    get view() {
        return this.owner ? this.owner.get() : null;
    }
    static initWithEmptyBackground() {
        const cell = PagerCell_1.new();
        cell.backgroundColor = null;
        return cell;
    }
    willMoveToSuperview(newSuperview) {
        const parent = (this.view ? this.view.parent : null);
        if (parent && !newSuperview) {
            parent._removeContainer(this, this.index);
        }
    }
};
PagerCell = PagerCell_1 = __decorate([
    NativeClass
], PagerCell);
let UICollectionDelegateImpl = UICollectionDelegateImpl_1 = class UICollectionDelegateImpl extends NSObject {
    static initWithOwner(owner) {
        const delegate = UICollectionDelegateImpl_1.alloc().init();
        delegate._owner = owner;
        return delegate;
    }
    collectionViewLayoutInsetForSectionAtIndex(collectionView, collectionViewLayout, section) {
        const owner = this._owner ? this._owner.get() : null;
        if (owner) {
            const inset = owner._getSpacing() + owner._getPeaking();
            if (owner.orientation === 'vertical') {
                return new UIEdgeInsets({
                    bottom: inset,
                    left: 0,
                    right: 0,
                    top: inset
                });
            }
            return new UIEdgeInsets({
                bottom: 0,
                left: inset,
                right: inset,
                top: 0
            });
        }
        return new UIEdgeInsets({ bottom: 0, left: 0, right: 0, top: 0 });
    }
    collectionViewLayoutSizeForItemAtIndexPath(collectionView, collectionViewLayout, indexPath) {
        const owner = this._owner && this._owner.get();
        if (!owner)
            return CGSizeZero;
        const size = owner._getSize();
        return CGSizeMake(size.width, size.height);
    }
    collectionViewWillDisplayCellForItemAtIndexPath(collectionView, cell, indexPath) {
        const owner = this._owner && this._owner.get();
        if (owner) {
            if (!owner.mIsInit) {
                owner._updateScrollPosition();
                owner.mIsInit = true;
            }
            if (owner.items && indexPath.row === owner.lastIndex - owner.loadMoreCount) {
                owner.notify({
                    eventName: Pager.loadMoreItemsEvent,
                    object: owner
                });
            }
        }
        if (cell.preservesSuperviewLayoutMargins) {
            cell.preservesSuperviewLayoutMargins = false;
        }
        if (cell.layoutMargins) {
            cell.layoutMargins = UIEdgeInsetsZero;
        }
    }
    collectionViewLayoutMinimumLineSpacingForSectionAtIndex(collectionView, collectionViewLayout, section) {
        const owner = this._owner ? this._owner.get() : null;
        if (!owner)
            return 0;
        const result = owner._getSpacing();
        return result;
    }
    scrollViewWillBeginDragging(scrollView) {
        const owner = this._owner && this._owner.get();
        if (owner) {
            if (owner.lastEvent === 0) {
                owner.notify({
                    eventName: Pager.swipeStartEvent,
                    object: owner
                });
                owner.lastEvent = 1;
            }
        }
    }
    scrollViewDidEndScrollingAnimation(scrollView) {
        const owner = this._owner ? this._owner.get() : null;
        if (owner) {
            owner.notify({
                eventName: Pager.swipeEvent,
                object: owner
            });
        }
    }
    scrollViewDidScroll(scrollView) {
        const owner = this._owner.get();
        if (owner) {
            let width;
            let offset;
            const size = owner._getRealWidthHeight();
            let total;
            if (owner.orientation === 'vertical') {
                width = size.height;
                offset = scrollView.contentOffset.y;
                total = scrollView.contentSize.height - scrollView.bounds.size.height;
            }
            else {
                width = size.width;
                offset = scrollView.contentOffset.x;
                total = scrollView.contentSize.width - scrollView.bounds.size.width;
            }
            const percent = offset / total;
            const progress = percent * (owner.itemCount - 1);
            if (owner.indicatorView && owner.indicatorView.setWithProgressAnimated && !Number.isNaN(progress)) {
                owner.indicatorView.progress = progress;
            }
            const index = parseInt(progress.toFixed(0), 10);
            if (owner.selectedIndex !== index && !Number.isNaN(index)) {
            }
            owner.notify({
                object: owner,
                eventName: Pager.scrollEvent,
                selectedIndex: Math.floor(progress),
                currentPosition: progress,
                scrollX: owner.horizontalOffset,
                scrollY: owner.verticalOffset
            });
            if (owner.lastEvent === 1) {
                owner.notify({
                    eventName: Pager.swipeOverEvent,
                    object: owner
                });
                owner.lastEvent = 1;
            }
        }
    }
    scrollViewDidEndDraggingWillDecelerate(scrollView, decelerate) { }
    scrollViewWillEndDraggingWithVelocityTargetContentOffset(scrollView, velocity, targetContentOffset) {
        const owner = this._owner ? this._owner.get() : null;
        if (!owner)
            return;
        if (owner.lastEvent === 1) {
            owner.notify({
                eventName: Pager.swipeEndEvent,
                object: owner
            });
            owner.lastEvent = 0;
        }
    }
};
UICollectionDelegateImpl = UICollectionDelegateImpl_1 = __decorate([
    NativeClass,
    ObjCClass(UICollectionViewDelegate, UICollectionViewDelegateFlowLayout)
], UICollectionDelegateImpl);
let UICollectionViewDataSourceImpl = UICollectionViewDataSourceImpl_1 = class UICollectionViewDataSourceImpl extends NSObject {
    static initWithOwner(owner) {
        const delegate = UICollectionViewDataSourceImpl_1.alloc().init();
        delegate._owner = owner;
        return delegate;
    }
    collectionViewCellForItemAtIndexPath(collectionView, indexPath) {
        const owner = this._owner ? this._owner.get() : null;
        let cell;
        let count = 0;
        if (owner) {
            count = owner._childrenCount;
            if (owner.circularMode) {
                count = owner.itemCount;
                switch (indexPath.row) {
                    case 0:
                        indexPath = NSIndexPath.indexPathForRowInSection(owner.lastDummy, 0);
                        break;
                    case owner.firstDummy:
                        indexPath = NSIndexPath.indexPathForRowInSection(0, 0);
                        break;
                    default:
                        indexPath = NSIndexPath.indexPathForRowInSection(indexPath.row - 1, 0);
                        break;
                }
            }
        }
        if (owner && !owner.items && count > 0) {
            const index = indexPath.row;
            const data = owner._childrenViews[index];
            const viewType = data.type;
            owner.mPreparingCell = true;
            collectionView.registerClassForCellWithReuseIdentifier(PagerCell.class(), `static-${viewType}`);
            cell = collectionView.dequeueReusableCellWithReuseIdentifierForIndexPath(`static-${viewType}`, indexPath) || PagerCell.initWithEmptyBackground();
            cell.index = index;
            const view = data.view;
            if (!cell.view) {
                cell.owner = new WeakRef(view);
            }
            else if (cell.view !== view) {
                owner._removeView(view);
                cell.owner = new WeakRef(view);
            }
            if (view && !view.parent) {
                owner._addView(view);
                const innerView = UICellView.new();
                innerView.view = new WeakRef(view);
                innerView.addSubview(view.nativeViewProtected);
                cell.contentView.addSubview(innerView);
                owner.mMap.set(cell, view);
            }
            view.iosOverflowSafeArea = owner.iosOverflowSafeArea;
            view['iosIgnoreSafeArea'] = owner['iosIgnoreSafeArea'];
            owner._layoutCell(view, indexPath);
            const size = owner._getSize();
            const width = layout.toDevicePixels(size.width);
            const height = layout.toDevicePixels(size.height);
            if (view && view.isLayoutRequired) {
                View.layoutChild(owner, view, 0, 0, width, height);
            }
            owner.mPreparingCell = false;
            return cell;
        }
        const template = owner && owner._getItemTemplate(indexPath.row);
        cell = collectionView.dequeueReusableCellWithReuseIdentifierForIndexPath(template.key, indexPath) || PagerCell.initWithEmptyBackground();
        cell.index = indexPath;
        if (owner) {
            const size = owner._getSize();
            owner._prepareCell(cell, indexPath);
            const cellView = cell.view;
            cellView.iosOverflowSafeArea = owner.iosOverflowSafeArea;
            cellView['iosIgnoreSafeArea'] = owner['iosIgnoreSafeArea'];
            if (!owner.iosOverflowSafeAreaEnabled && cellView && cellView.isLayoutRequired) {
                View.layoutChild(owner, cellView, 0, 0, layout.toDevicePixels(size.width), layout.toDevicePixels(size.height));
            }
        }
        return cell;
    }
    collectionViewNumberOfItemsInSection(collectionView, section) {
        const owner = this._owner ? this._owner.get() : null;
        if (!owner || !owner.isLoaded)
            return 0;
        return owner.circularMode ? owner.itemCount : owner._childrenCount;
    }
    numberOfSectionsInCollectionView(collectionView) {
        return 1;
    }
};
UICollectionViewDataSourceImpl = UICollectionViewDataSourceImpl_1 = __decorate([
    NativeClass,
    ObjCClass(UICollectionViewDataSource)
], UICollectionViewDataSourceImpl);
let UICollectionViewFlowLinearLayoutImpl = UICollectionViewFlowLinearLayoutImpl_1 = class UICollectionViewFlowLinearLayoutImpl extends UICollectionViewFlowLayout {
    static initWithOwner(owner) {
        const layout = UICollectionViewFlowLinearLayoutImpl_1.new();
        layout._owner = owner;
        layout._curl = CATransition.animation();
        return layout;
    }
    layoutAttributesForElementsInRect(rect) {
        const owner = this._owner ? this._owner.get() : null;
        const originalLayoutAttribute = super.layoutAttributesForElementsInRect(rect);
        const visibleLayoutAttributes = [];
        if (owner) {
            if (owner.transformers && owner.transformers.indexOf('scale') > -1) {
                const count = originalLayoutAttribute.count;
                for (let i = 0; i < count; i++) {
                    const attributes = originalLayoutAttribute.objectAtIndex(i);
                    visibleLayoutAttributes[i] = attributes;
                    const frame = attributes.frame;
                    const width = attributes.frame.size.width * 0.75;
                    const height = attributes.frame.size.height * 0.75;
                    attributes.frame.size.width = width;
                    attributes.frame.size.height = height;
                    const spacing = owner.convertToSize(owner.spacing);
                    const distance = Math.abs(this.collectionView.contentOffset.x + this.collectionView.contentInset.left + spacing - frame.origin.x);
                    const scale = Math.min(Math.max(1 - distance / this.collectionView.bounds.size.width, 0.75), 1);
                    attributes.transform = CGAffineTransformScale(attributes.transform, 1, scale);
                }
            }
            else {
                return originalLayoutAttribute;
            }
        }
        return visibleLayoutAttributes;
    }
    shouldInvalidateLayoutForBoundsChange(newBounds) {
        return true;
    }
    initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath) {
        const attrs = super.initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath);
        attrs.alpha = 1;
        return attrs;
    }
    finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath) {
        const attrs = super.finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath);
        attrs.alpha = 1;
        return attrs;
    }
    targetContentOffsetForProposedContentOffsetWithScrollingVelocity(proposedContentOffset, velocity) {
        const owner = this._owner ? this._owner.get() : null;
        if (!this.collectionView || !owner) {
            return super.targetContentOffsetForProposedContentOffsetWithScrollingVelocity(proposedContentOffset, velocity);
        }
        const size = owner._getRealWidthHeight();
        if (this.scrollDirection === 1) {
            const pageWidth = size.width + this.minimumInteritemSpacing;
            const approximatePage = this.collectionView.contentOffset.x / pageWidth;
            const currentPage = velocity.x === 0 ? Math.round(approximatePage) : velocity.x < 0.0 ? Math.floor(approximatePage) : Math.ceil(approximatePage);
            const flickVelocity = velocity.x * 0.3;
            const flickedPages = Math.abs(Math.round(flickVelocity)) <= 1 ? 0 : Math.round(flickVelocity);
            const newPageIndex = currentPage + flickedPages;
            selectedIndexProperty.nativeValueChange(owner, Math.min(Math.max(newPageIndex, 0), owner._childrenCount - 1));
            const newHorizontalOffset = newPageIndex * pageWidth - this.collectionView.contentInset.left;
            return CGPointMake(newHorizontalOffset, proposedContentOffset.y);
        }
        else {
            const pageHeight = size.height;
            const approximatePage = Math.max(0, this.collectionView.contentOffset.y / pageHeight);
            const currentPage = velocity.y === 0 ? Math.round(approximatePage) : velocity.y < 0.0 ? Math.floor(approximatePage) : Math.ceil(approximatePage);
            const flickVelocity = velocity.y * 0.3;
            const flickedPages = Math.abs(Math.round(flickVelocity)) <= 1 ? 0 : Math.round(flickVelocity);
            const newPageIndex = currentPage + flickedPages;
            selectedIndexProperty.nativeValueChange(owner, Math.min(Math.max(newPageIndex, 0), owner._childrenCount - 1));
            const newVerticalOffset = newPageIndex * pageHeight - this.collectionView.contentInset.top;
            return CGPointMake(proposedContentOffset.x, newVerticalOffset);
        }
    }
};
UICollectionViewFlowLinearLayoutImpl = UICollectionViewFlowLinearLayoutImpl_1 = __decorate([
    NativeClass
], UICollectionViewFlowLinearLayoutImpl);
//# sourceMappingURL=index.ios.js.map