import { ChangeType, Color, Device, ObservableArray, Property, Screen, StackLayout, View, ViewBase, profile } from '@nativescript/core';
import { isString } from '@nativescript/core/utils/types';
import { layout } from '@nativescript/core/utils/utils';
import { Indicator, PagerBase, Transformer, autoPlayProperty, autoplayDelayProperty, disableSwipeProperty, indicatorColorProperty, indicatorProperty, indicatorSelectedColorProperty, itemTemplatesProperty, itemsProperty, orientationProperty, peakingProperty, selectedIndexProperty, showIndicatorProperty, spacingProperty } from './index.common';
export * from './index.common';
export { Transformer } from './index.common';
function notifyForItemAtIndex(owner, nativeView, view, eventName, index) {
    const args = {
        eventName,
        object: owner,
        index,
        view,
        ios: undefined,
        android: nativeView
    };
    owner.notify(args);
    return args;
}
const PLACEHOLDER = 'PLACEHOLDER';
export class Pager extends PagerBase {
    itemTemplateUpdated(oldData, newData) { }
    constructor() {
        super();
        this._oldDisableAnimation = false;
        this._viewHolders = new Set();
        this._childrenViewsType = new Map();
        this._realizedTemplates = new Map();
        this.lastEvent = 0;
        this._lastSpacing = 0;
        this._lastPeaking = 0;
        this._selectedIndexBeforeLoad = 0;
        this._observableArrayHandler = (args) => {
            if (this.indicatorView && this.showIndicator) {
                this.indicatorView.setCount(this._childrenCount);
                this.indicatorView.setSelected(args.index);
            }
            if (this.pagerAdapter) {
                switch (args.action) {
                    case ChangeType.Add:
                        this.pagerAdapter.notifyItemRangeInserted(args.index, args.addedCount);
                        break;
                    case ChangeType.Delete:
                        this.pagerAdapter.notifyItemRangeRemoved(args.index, args.removed.length);
                        break;
                    case ChangeType.Splice:
                        if (args.removed.length > 0) {
                            this.pagerAdapter.notifyItemRangeRemoved(args.index, args.removed.length);
                        }
                        if (args.addedCount > 0) {
                            this.pagerAdapter.notifyItemRangeInserted(args.index, args.addedCount);
                        }
                        break;
                    case ChangeType.Update:
                        this.pagerAdapter.notifyItemChanged(args.index);
                        break;
                    default:
                        break;
                }
                this._initAutoPlay(this.autoPlay);
            }
        };
        this._horizontalOffset = 0;
        this._verticalOffset = 0;
        this._transformers = [];
    }
    get views() {
        return this._views;
    }
    set views(value) {
        this._views = value;
    }
    get pager() {
        return this._pager;
    }
    get indicatorView() {
        return this._indicatorView;
    }
    createNativeView() {
        const nativeView = new android.widget.RelativeLayout(this._context);
        this._pager = new androidx.viewpager2.widget.ViewPager2(this._context);
        const sdkVersion = parseInt(Device.sdkVersion, 10);
        if (sdkVersion >= 21) {
            this._pager.setNestedScrollingEnabled(true);
        }
        if (this.orientation === 'vertical') {
            this._pager.setOrientation(androidx.viewpager2.widget.ViewPager2.ORIENTATION_VERTICAL);
        }
        else {
            this._pager.setOrientation(androidx.viewpager2.widget.ViewPager2.ORIENTATION_HORIZONTAL);
        }
        initPagerRecyclerAdapter();
        this._pagerAdapter = new PagerRecyclerAdapter(new WeakRef(this));
        this.compositeTransformer = new androidx.viewpager2.widget.CompositePageTransformer();
        this.pager.setUserInputEnabled(!this.disableSwipe);
        this.on(View.layoutChangedEvent, this.onLayoutChange, this);
        const LayoutParams = android.widget.RelativeLayout.LayoutParams;
        nativeView.addView(this.pager, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
        this._indicatorView = new com.rd.PageIndicatorView2(this._context);
        const params = new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
        params.addRule(android.widget.RelativeLayout.ALIGN_PARENT_BOTTOM);
        params.addRule(android.widget.RelativeLayout.CENTER_HORIZONTAL);
        params.setMargins(0, 0, 0, 10 * Screen.mainScreen.scale);
        this._indicatorView.setLayoutParams(params);
        this._indicatorView.setDynamicCount(true);
        this._indicatorView.setInteractiveAnimation(true);
        nativeView.addView(this._indicatorView);
        return nativeView;
    }
    initNativeView() {
        super.initNativeView();
        this._oldDisableAnimation = this.disableAnimation;
        this.disableAnimation = true;
        initPagerChangeCallback();
        this._pageListener = new PageChangeCallback(new WeakRef(this));
        this.pager.registerOnPageChangeCallback(this._pageListener);
        this.pager.setAdapter(this._pagerAdapter);
        if (this._androidViewId < 0) {
            this._androidViewId = android.view.View.generateViewId();
        }
        if (this.pagesCount > 0) {
            this.pager.setOffscreenPageLimit(this.pagesCount);
        }
        else {
            this.pager.setOffscreenPageLimit(3);
        }
        this._setIndicator(this.indicator);
        this._setPeaking(this.peaking);
        this._setSpacing(this.spacing);
        this._setTransformers(this.transformers ? this.transformers : '');
        if (this.showIndicator) {
            this._indicatorView.setCount(this.items ? this.items.length : 0);
        }
        else {
            this._indicatorView.setCount(0);
        }
    }
    enumerateViewHolders(cb) {
        let result, v;
        for (let it = this._viewHolders.values(), cellItemView = null; (cellItemView = it.next().value);) {
            if (cellItemView) {
                result = cb(cellItemView);
                if (result) {
                    return result;
                }
            }
        }
        return result;
    }
    getChildView(index) {
        if (this._childrenViews) {
            return this._childrenViews[index].view;
        }
        return this.enumerateViewHolders((v) => (v.getAdapterPosition() === index ? v.view : undefined));
    }
    _removeChildView(index) {
        const type = this._childrenViews[index].type;
        this._childrenViewsType.delete(type);
        super._removeChildView(index);
    }
    _addChildView(view, type) {
        super._addChildView(view, type);
        this._childrenViewsType.set(type, view);
        this.initStaticPagerAdapter();
    }
    onLayoutChange(args) {
        this._setSpacing(args.object.spacing);
        this._setPeaking(args.object.peaking);
        this._setTransformers(this.transformers ? this.transformers : '');
        this._updateScrollPosition();
        this.disableAnimation = this._oldDisableAnimation;
    }
    _setSpacing(value) {
        const size = this.convertToSize(value);
        const newSpacing = size !== this._lastSpacing;
        if (newSpacing) {
            if (this.marginTransformer) {
                this.compositeTransformer.removeTransformer(this.marginTransformer);
            }
            this.marginTransformer = new androidx.viewpager2.widget.MarginPageTransformer(size);
            this.compositeTransformer.addTransformer(this.marginTransformer);
            this._lastSpacing = size;
        }
    }
    _setPeaking(value) {
        const size = this.convertToSize(value);
        const newPeaking = size !== this._lastPeaking;
        if (newPeaking) {
            this.pager.setClipToPadding(false);
            const left = this.orientation === 'horizontal' ? size : 0;
            const top = this.orientation === 'horizontal' ? 0 : size;
            this.pager.setPadding(left, top, left, top);
            this.pager.setClipChildren(false);
            this._lastPeaking = size;
        }
    }
    [spacingProperty.setNative](value) {
        this._setSpacing(value);
    }
    [peakingProperty.setNative](value) {
        this._setPeaking(value);
    }
    [indicatorProperty.setNative](value) {
        this._setIndicator(value);
    }
    _setIndicator(value) {
        const AnimationType = com.rd.animation.type.AnimationType;
        switch (value) {
            case Indicator.None:
                this.indicatorView.setAnimationType(AnimationType.NONE);
                break;
            case Indicator.Worm:
                this.indicatorView.setAnimationType(AnimationType.WORM);
                break;
            case Indicator.Fill:
                this.indicatorView.setAnimationType(AnimationType.FILL);
                break;
            case Indicator.Swap:
                this.indicatorView.setAnimationType(AnimationType.SWAP);
                break;
            case Indicator.THIN_WORM:
                this.indicatorView.setAnimationType(AnimationType.THIN_WORM);
                break;
            default:
                break;
        }
    }
    _setTransformers(transformers) {
        if (!isString(transformers)) {
            return;
        }
        const transformsArray = transformers.split(' ');
        this._transformers.forEach((transformer) => {
            this.compositeTransformer.removeTransformer(transformer);
        });
        for (const transformer of transformsArray) {
            if (transformer === Transformer.SCALE) {
                initZoomOutPageTransformer();
                const nativeTransformer = new ZoomOutPageTransformer();
                nativeTransformer.owner = new WeakRef(this);
                this._transformers.push(nativeTransformer);
                this.compositeTransformer.addTransformer(nativeTransformer);
            }
        }
        if (transformsArray.length === 0) {
            this._transformers.forEach((transformer) => {
                this.compositeTransformer.removeTransformer(transformer);
            });
        }
        this.pager.setPageTransformer(this.compositeTransformer);
    }
    disposeViewHolderViews() {
        this.enumerateViewHolders((v) => {
            const view = v.view;
            this._removeViewCore(view);
        });
        this._viewHolders = new Set();
    }
    disposeNativeView() {
        this.off(View.layoutChangedEvent, this.onLayoutChange, this);
        this._childrenViews = null;
        this.disposeViewHolderViews();
        this._realizedTemplates.clear();
        this._pageListener = null;
        this.pager.setAdapter(null);
        this._pagerAdapter = null;
        this._transformers = [];
        if (this._observableArrayInstance) {
            this._observableArrayInstance.off(ObservableArray.changeEvent, this._observableArrayHandler);
            this._observableArrayInstance = null;
        }
        super.disposeNativeView();
    }
    get disableAnimation() {
        return this._disableAnimation;
    }
    set disableAnimation(value) {
        this._disableAnimation = value;
    }
    get pagerAdapter() {
        return this._pagerAdapter;
    }
    get _childrenCount() {
        var _a, _b;
        return ((_a = this.items) === null || _a === void 0 ? void 0 : _a.length) || ((_b = this._childrenViews) === null || _b === void 0 ? void 0 : _b.length) || 0;
    }
    [indicatorColorProperty.setNative](value) {
        if (this.indicatorView) {
            const color = !value || value instanceof Color ? value : new Color(value);
            this.indicatorView.setUnselectedColor(color ? color.android : null);
        }
    }
    [indicatorSelectedColorProperty.setNative](value) {
        if (this.indicatorView) {
            const color = !value || value instanceof Color ? value : new Color(value);
            this.indicatorView.setSelectedColor(color ? color.android : null);
        }
    }
    [disableSwipeProperty.setNative](value) {
        if (this.pager) {
            this.pager.setUserInputEnabled(!value);
        }
    }
    [itemsProperty.getDefault]() {
        return null;
    }
    [itemsProperty.setNative](value) {
        if (value && value.length && this.showIndicator) {
            this.indicatorView.setCount(this._childrenCount);
        }
        if (this._observableArrayInstance) {
            this._observableArrayInstance.off(ObservableArray.changeEvent, this._observableArrayHandler);
            this._observableArrayInstance = null;
        }
        if (value) {
            if (value instanceof ObservableArray) {
                const adapter = this.pagerAdapter;
                if (!adapter)
                    return;
                selectedIndexProperty.coerce(this);
                this._observableArrayInstance = value;
                this._observableArrayInstance.on(ObservableArray.changeEvent, this._observableArrayHandler);
            }
            else {
                this.refresh();
                selectedIndexProperty.coerce(this);
            }
        }
    }
    _updateScrollPosition() {
        const index = this.circularMode ? this.selectedIndex + 1 : this.selectedIndex;
        if (this.pager.getCurrentItem() !== index) {
            this.indicatorView.setInteractiveAnimation(false);
            this.pager.setCurrentItem(index, false);
            this._indicatorView.setSelected(this.selectedIndex);
        }
        setTimeout(() => {
            this._initAutoPlay(this.autoPlay);
        });
    }
    initStaticPagerAdapter() {
        if (!this.items && this._childrenCount > 0) {
            initStaticPagerStateAdapter();
            if (this.pager && !(this._pagerAdapter instanceof StaticPagerStateAdapter)) {
                this._pagerAdapter = new StaticPagerStateAdapter(new WeakRef(this));
                this.pager.setAdapter(this._pagerAdapter);
                selectedIndexProperty.coerce(this);
                setTimeout(() => {
                    this.pager.setCurrentItem(this.selectedIndex, false);
                    if (this.indicatorView) {
                        this.indicatorView.setSelection(this.selectedIndex);
                    }
                }, 0);
            }
        }
    }
    onLoaded() {
        super.onLoaded();
        this.initStaticPagerAdapter();
    }
    [selectedIndexProperty.setNative](value) {
        if (this.isLoaded && this.pager) {
            const index = this.circularMode ? value + 1 : value;
            if (this.pager.getCurrentItem() !== index) {
                this.pager.setCurrentItem(index, !this.disableAnimation);
                if (this.indicatorView) {
                }
            }
        }
    }
    scrollToIndexAnimated(index, animate) {
        if (this.pager) {
            this.pager.setCurrentItem(index, animate);
            if (!animate) {
                selectedIndexProperty.nativeValueChange(this, index);
            }
        }
    }
    _onItemsChanged(oldValue, newValue) { }
    refresh() {
        if (this.pager && this._pagerAdapter) {
            this.pager.requestLayout();
            this.pager.getAdapter().notifyDataSetChanged();
        }
    }
    updatePagesCount(value) {
        if (this.pager) {
            this._pagerAdapter.notifyDataSetChanged();
            this.pager.setOffscreenPageLimit(value);
        }
    }
    onUnloaded() {
        super.onUnloaded();
    }
    eachChild(callback) {
        super.eachChild(callback);
        this.enumerateViewHolders((v) => {
            const view = v.view;
            if (view) {
                if (view.parent instanceof Pager) {
                    callback(view);
                }
                else {
                    if (view.parent) {
                        callback(view.parent);
                    }
                }
            }
        });
    }
    updateAdapter() {
        this._pagerAdapter.notifyDataSetChanged();
    }
    _selectedIndexUpdatedFromNative(newIndex) { }
    [itemTemplatesProperty.getDefault]() {
        return null;
    }
    [itemTemplatesProperty.setNative](value) {
        this._itemTemplatesInternal = new Array(this._defaultTemplate);
        if (value) {
            this._itemTemplatesInternal = this._itemTemplatesInternal.concat(value);
        }
        this._pagerAdapter = new PagerRecyclerAdapter(new WeakRef(this));
        this.pager.setAdapter(this._pagerAdapter);
        this.refresh();
    }
    [showIndicatorProperty.setNative](value) {
        if (!this.indicatorView) {
            return;
        }
        if (value) {
            this.indicatorView.setCount(this.items ? this.items.length : 0);
            this.indicatorView.setSelected(this.selectedIndex);
        }
        else {
            this.indicatorView.setCount(0);
        }
    }
    [orientationProperty.setNative](value) {
        if (value === 'vertical') {
            this._pager.setOrientation(androidx.viewpager2.widget.ViewPager2.ORIENTATION_VERTICAL);
        }
        else {
            this._pager.setOrientation(androidx.viewpager2.widget.ViewPager2.ORIENTATION_HORIZONTAL);
        }
    }
    get horizontalOffset() {
        return this._horizontalOffset / layout.getDisplayDensity();
    }
    get verticalOffset() {
        return this._verticalOffset / layout.getDisplayDensity();
    }
    static getProgress(indicator, position, positionOffset, isRtl) {
        const count = indicator.getCount();
        let selectedPosition = indicator.getSelection();
        if (isRtl) {
            position = count - 1 - position;
        }
        if (position < 0) {
            position = 0;
        }
        else if (position > count - 1) {
            position = count - 1;
        }
        const isRightOverScrolled = position > selectedPosition;
        let isLeftOverScrolled;
        if (isRtl) {
            isLeftOverScrolled = position - 1 < selectedPosition;
        }
        else {
            isLeftOverScrolled = position + 1 < selectedPosition;
        }
        if (isRightOverScrolled || isLeftOverScrolled) {
            selectedPosition = position;
            indicator.setSelection(selectedPosition);
        }
        const slideToRightSide = selectedPosition === position && positionOffset !== 0;
        let selectingPosition;
        let selectingProgress;
        if (slideToRightSide) {
            selectingPosition = isRtl ? position - 1 : position + 1;
            selectingProgress = positionOffset;
        }
        else {
            selectingPosition = position;
            selectingProgress = 1 - positionOffset;
        }
        if (selectingProgress > 1) {
            selectingProgress = 1;
        }
        else if (selectingProgress < 0) {
            selectingProgress = 0;
        }
        return [selectingPosition, selectingProgress];
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
    _nextIndex() {
        const next = this.selectedIndex + 1;
        if (next > this.lastIndex) {
            return 0;
        }
        return next;
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
    get itemCount() {
        return this._childrenCount ? this._childrenCount + (this.circularMode ? 2 : 0) : 0;
    }
    get lastIndex() {
        if (this.items && this.items.length === 0) {
            return 0;
        }
        return this.circularMode ? this.itemCount - 3 : this.itemCount - 1;
    }
}
__decorate([
    profile()
], Pager.prototype, "createNativeView", null);
export const pagesCountProperty = new Property({
    name: 'pagesCount',
    defaultValue: 0,
    valueConverter: (v) => parseInt(v, 10),
    valueChanged: (pager, oldValue, newValue) => {
        pager.updatePagesCount(pager.pagesCount);
    }
});
pagesCountProperty.register(Pager);
let PageChangeCallback;
function initPagerChangeCallback() {
    if (PageChangeCallback) {
        return PageChangeCallback;
    }
    let PageChangeCallbackImpl = class PageChangeCallbackImpl extends androidx.viewpager2.widget.ViewPager2.OnPageChangeCallback {
        constructor(owner) {
            super();
            this.owner = owner;
            return global.__native(this);
        }
        onPageSelected(position) {
            const owner = this.owner && this.owner.get();
            if (owner) {
                owner.notify({
                    eventName: Pager.swipeEvent,
                    object: owner
                });
            }
        }
        onPageScrolled(position, positionOffset, positionOffsetPixels) {
            const owner = this.owner && this.owner.get();
            if (owner && owner.isLayoutValid) {
                if (owner.circularMode) {
                    position = owner.pagerAdapter.getPosition(position);
                }
                const offset = position * positionOffsetPixels;
                if (owner.orientation === 'vertical') {
                    owner._horizontalOffset = 0;
                    owner._verticalOffset = offset;
                }
                else if (owner.orientation === 'horizontal') {
                    owner._horizontalOffset = offset;
                    owner._verticalOffset = 0;
                }
                owner.notify({
                    eventName: Pager.scrollEvent,
                    object: owner,
                    selectedIndex: position,
                    currentPosition: position + positionOffset,
                    scrollX: owner.horizontalOffset,
                    scrollY: owner.verticalOffset
                });
                if (owner.items && position === owner.pagerAdapter.lastIndex() - owner.loadMoreCount) {
                    owner.notify({ eventName: Pager.loadMoreItemsEvent, object: owner });
                }
                if (owner.showIndicator && owner.indicatorView) {
                    const progress = Pager.getProgress(owner.indicatorView, position, positionOffset, false);
                    const selectingPosition = progress[0];
                    const selectingProgress = progress[1];
                    owner.indicatorView.setInteractiveAnimation(true);
                    owner.indicatorView.setProgress(selectingPosition, selectingProgress);
                }
            }
        }
        onPageScrollStateChanged(state) {
            const owner = this.owner && this.owner.get();
            if (owner) {
                if (owner.lastEvent === 0 && state === 1) {
                    owner.notify({
                        eventName: Pager.swipeStartEvent,
                        object: owner
                    });
                    owner.lastEvent = 1;
                }
                else if (owner.lastEvent === 1 && state === 1) {
                    owner.notify({
                        eventName: Pager.swipeOverEvent,
                        object: owner
                    });
                    owner.lastEvent = 1;
                }
                else if (owner.lastEvent === 1 && state === 2) {
                    owner.notify({
                        eventName: Pager.swipeEndEvent,
                        object: owner
                    });
                    owner.lastEvent = 2;
                }
                else {
                    owner.lastEvent = 0;
                }
                if (owner.isLayoutValid && state === androidx.viewpager2.widget.ViewPager2.SCROLL_STATE_IDLE) {
                    const count = owner.pagerAdapter.getItemCount();
                    const index = owner.pager.getCurrentItem();
                    if (owner.circularMode) {
                        if (index === 0) {
                            owner.indicatorView.setInteractiveAnimation(false);
                            owner.pager.setCurrentItem(count - 2, false);
                            selectedIndexProperty.nativeValueChange(owner, count - 3);
                            owner.indicatorView.setSelected(count - 3);
                            owner.indicatorView.setInteractiveAnimation(true);
                        }
                        else if (index === count - 1) {
                            owner.indicatorView.setInteractiveAnimation(false);
                            owner.indicatorView.setSelected(0);
                            owner.pager.setCurrentItem(1, false);
                            selectedIndexProperty.nativeValueChange(owner, 0);
                            owner.indicatorView.setInteractiveAnimation(true);
                        }
                        else {
                            selectedIndexProperty.nativeValueChange(owner, index - 1);
                        }
                    }
                    else {
                        selectedIndexProperty.nativeValueChange(owner, index);
                        owner.indicatorView.setSelected(index);
                    }
                }
            }
        }
    };
    PageChangeCallbackImpl = __decorate([
        NativeClass
    ], PageChangeCallbackImpl);
    PageChangeCallback = PageChangeCallbackImpl;
}
let PagerRecyclerAdapter;
function initPagerRecyclerAdapter() {
    if (PagerRecyclerAdapter) {
        return;
    }
    let PagerRecyclerAdapterImpl = class PagerRecyclerAdapterImpl extends androidx.recyclerview.widget.RecyclerView.Adapter {
        constructor(owner) {
            super();
            this.owner = owner;
            return global.__native(this);
        }
        onCreateViewHolder(param0, type) {
            const owner = this.owner ? this.owner.get() : null;
            if (!owner) {
                return null;
            }
            const template = owner._itemTemplatesInternal[type];
            let view = template.createView();
            if (!view && owner._itemViewLoader !== undefined) {
                view = owner._itemViewLoader(template.key);
            }
            const sp = new StackLayout();
            if (view) {
                sp.addChild(view);
            }
            else {
                sp[PLACEHOLDER] = true;
            }
            owner._addView(sp);
            sp.nativeView.setLayoutParams(new android.view.ViewGroup.LayoutParams(android.view.ViewGroup.LayoutParams.MATCH_PARENT, android.view.ViewGroup.LayoutParams.MATCH_PARENT));
            initPagerViewHolder();
            const holder = new PagerViewHolder(sp, new WeakRef(owner));
            owner._viewHolders.add(holder);
            return holder;
        }
        getPosition(index) {
            const owner = this.owner && this.owner.get();
            let position = index;
            if (owner && owner.circularMode) {
                if (position === 0) {
                    position = this.lastDummy();
                }
                else if (position === this.firstDummy()) {
                    position = 0;
                }
                else {
                    position = position - 1;
                }
            }
            return position;
        }
        onBindViewHolder(holder, index) {
            const owner = this.owner ? this.owner.get() : null;
            if (owner) {
                if (owner.circularMode) {
                    if (index === 0) {
                        index = this.lastDummy();
                    }
                    else if (index === this.firstDummy()) {
                        index = 0;
                    }
                    else {
                        index = index - 1;
                    }
                }
                const bindingContext = owner._getDataItem(index);
                const args = {
                    eventName: Pager.itemLoadingEvent,
                    object: owner,
                    android: holder,
                    ios: undefined,
                    index,
                    bindingContext,
                    view: holder.view[PLACEHOLDER] ? null : holder.view.getChildAt(0)
                };
                owner.notify(args);
                if (holder.view[PLACEHOLDER]) {
                    if (args.view) {
                        holder.view.addChild(args.view);
                    }
                    else {
                        holder.view.addChild(owner._getDefaultItemContent(index));
                    }
                    holder.view[PLACEHOLDER] = false;
                }
                owner._prepareItem(holder.view, index);
            }
        }
        getItemId(i) {
            const owner = this.owner ? this.owner.get() : null;
            let id = i;
            if (owner && owner.items) {
                const item = owner.items.getItem ? owner.items.getItem(i) : owner.items[i];
                if (item) {
                    id = owner.itemIdGenerator(item, i, owner.items);
                }
            }
            return long(id);
        }
        getItemCount() {
            const owner = this.owner ? this.owner.get() : null;
            return owner && owner.items && owner.items.length ? owner.items.length + (owner.circularMode ? 2 : 0) : 0;
        }
        getItemViewType(index) {
            const owner = this.owner ? this.owner.get() : null;
            if (owner) {
                const template = owner._getItemTemplate(index);
                return owner._itemTemplatesInternal.indexOf(template);
            }
            return 0;
        }
        lastIndex() {
            const owner = this.owner && this.owner.get();
            if (owner) {
                if (owner.items.length === 0) {
                    return 0;
                }
                return owner.circularMode ? this.getItemCount() - 3 : this.getItemCount() - 1;
            }
            return 0;
        }
        firstDummy() {
            const count = this.getItemCount();
            if (count === 0) {
                return 0;
            }
            return this.getItemCount() - 1;
        }
        lastDummy() {
            return this.lastIndex();
        }
        hasStableIds() {
            return true;
        }
    };
    PagerRecyclerAdapterImpl = __decorate([
        NativeClass
    ], PagerRecyclerAdapterImpl);
    PagerRecyclerAdapter = PagerRecyclerAdapterImpl;
}
let StaticPagerStateAdapter;
function initStaticPagerStateAdapter() {
    if (StaticPagerStateAdapter) {
        return;
    }
    let StaticPagerStateAdapterImpl = class StaticPagerStateAdapterImpl extends androidx.recyclerview.widget.RecyclerView.Adapter {
        constructor(owner) {
            super();
            this.owner = owner;
            return global.__native(this);
        }
        onCreateViewHolder(param0, type) {
            const owner = this.owner ? this.owner.get() : null;
            if (!owner) {
                return null;
            }
            const view = owner._childrenViewsType.get(type);
            const sp = new StackLayout();
            if (view && !view.parent) {
                sp.addChild(view);
            }
            else {
                sp[PLACEHOLDER] = true;
            }
            owner._addView(sp);
            sp.nativeView.setLayoutParams(new android.view.ViewGroup.LayoutParams(android.view.ViewGroup.LayoutParams.MATCH_PARENT, android.view.ViewGroup.LayoutParams.MATCH_PARENT));
            initPagerViewHolder();
            const holder = new PagerViewHolder(sp, new WeakRef(owner));
            owner._viewHolders.add(holder);
            return holder;
        }
        onBindViewHolder(holder, index) {
            const owner = this.owner ? this.owner.get() : null;
            if (owner) {
                const args = {
                    eventName: Pager.itemLoadingEvent,
                    object: owner,
                    android: holder,
                    ios: undefined,
                    index,
                    view: holder.view[PLACEHOLDER] ? null : holder.view
                };
                owner.notify(args);
                if (holder.view[PLACEHOLDER]) {
                    if (args.view) {
                        holder.view.addChild(args.view);
                    }
                    holder.view[PLACEHOLDER] = false;
                }
            }
        }
        hasStableIds() {
            return true;
        }
        getItem(i) {
            const owner = this.owner ? this.owner.get() : null;
            if (owner) {
                if (owner._childrenViews) {
                    return owner._childrenViews[i].view;
                }
            }
            return null;
        }
        getItemId(i) {
            const owner = this.owner ? this.owner.get() : null;
            let id = i;
            if (owner) {
                const item = this.getItem(i);
                if (item) {
                    id = owner.itemIdGenerator(item, i, Array.from(owner._childrenViews));
                }
            }
            return long(id);
        }
        getItemCount() {
            var _a;
            const owner = this.owner ? this.owner.get() : null;
            return (owner && ((_a = owner._childrenViews) === null || _a === void 0 ? void 0 : _a.length)) || 0;
        }
        getItemViewType(index) {
            var _a;
            const owner = (_a = this.owner) === null || _a === void 0 ? void 0 : _a.get();
            if (owner && owner._childrenViews) {
                return owner._childrenViews[index].type;
            }
            return index;
        }
    };
    StaticPagerStateAdapterImpl = __decorate([
        NativeClass
    ], StaticPagerStateAdapterImpl);
    StaticPagerStateAdapter = StaticPagerStateAdapterImpl;
}
let PagerViewHolder;
function initPagerViewHolder() {
    if (PagerViewHolder) {
        return;
    }
    let PagerViewHolderImpl = class PagerViewHolderImpl extends androidx.recyclerview.widget.RecyclerView.ViewHolder {
        constructor(owner, pager) {
            super(owner.nativeViewProtected);
            this.owner = owner;
            this.pager = pager;
            return global.__native(this);
        }
        get view() {
            return this.owner;
        }
    };
    PagerViewHolderImpl = __decorate([
        NativeClass
    ], PagerViewHolderImpl);
    PagerViewHolder = PagerViewHolderImpl;
}
let ZoomOutPageTransformer;
function initZoomOutPageTransformer() {
    if (ZoomOutPageTransformer) {
        return;
    }
    let ZoomOutPageTransformerImpl = class ZoomOutPageTransformerImpl extends java.lang.Object {
        constructor() {
            super();
            return global.__native(this);
        }
        transformPage(view, position) {
            const MIN_SCALE = 0.85;
            if (position <= 1 || position >= -1) {
                const scale = Math.max(MIN_SCALE, 1 - Math.abs(position));
                view.setScaleX(scale);
                view.setScaleY(scale);
            }
            else {
                view.setScaleX(1);
                view.setScaleY(1);
            }
        }
    };
    ZoomOutPageTransformerImpl = __decorate([
        NativeClass,
        Interfaces([androidx.viewpager2.widget.ViewPager2.PageTransformer])
    ], ZoomOutPageTransformerImpl);
    ZoomOutPageTransformer = ZoomOutPageTransformerImpl;
}
let ZoomInPageTransformer;
function initZoomInPageTransformer() {
    if (ZoomInPageTransformer) {
        return;
    }
    let ZoomInPageTransformerImpl = class ZoomInPageTransformerImpl extends java.lang.Object {
        constructor() {
            super();
            return global.__native(this);
        }
        transformPage(view, position) {
            const scale = position < 0 ? position + 1.0 : Math.abs(1.0 - position);
            view.setScaleX(scale);
            view.setScaleY(scale);
            view.setPivotX(view.getWidth() * 0.5);
            view.setPivotY(view.getHeight() * 0.5);
            view.setAlpha(view < -1.0 || position > 1.0 ? 0.0 : 1.0 - (scale - 1.0));
        }
    };
    ZoomInPageTransformerImpl = __decorate([
        NativeClass,
        Interfaces([androidx.viewpager2.widget.ViewPager2.PageTransformer])
    ], ZoomInPageTransformerImpl);
    ZoomInPageTransformer = ZoomInPageTransformerImpl;
}
//# sourceMappingURL=index.android.js.map