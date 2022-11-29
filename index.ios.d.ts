import { View, ViewBase } from '@nativescript/core';
import { PagerBase } from './index.common';
export * from './index.common';
export { ItemsSource, Transformer } from './index.common';
export declare enum ContentInsetAdjustmentBehavior {
    Always = 3,
    Automatic = 0,
    Never = 2,
    ScrollableAxes = 1
}
export declare const contentInsetAdjustmentBehaviorProperty: any;
export declare class Pager extends PagerBase {
    lastEvent: number;
    private mDisableSwipe;
    private mDisableAnimation;
    mLayout: UICollectionViewFlowLinearLayoutImpl;
    mPreparingCell: boolean;
    mDelegate: UICollectionDelegateImpl;
    nativeViewProtected: UIView;
    private mDataSource;
    mMap: Map<PagerCell, View>;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    backgroundColor: any;
    mIsRefreshing: boolean;
    private mPager;
    private mIndicatorView;
    private mObservableArrayInstance;
    mIsInit: boolean;
    mInnerWidth: number;
    mInnerHeight: number;
    mLastLayoutKey: string;
    constructor();
    get pager(): UICollectionView;
    get indicatorView(): any;
    createNativeView(): UIView;
    initNativeView(): void;
    getChildView(index: number): View;
    _getRealWidthHeight(): {
        width: number;
        height: number;
    };
    _nextIndex(): number;
    _initAutoPlay(value: boolean): void;
    getPosition(index: number): number;
    get itemCount(): number;
    get lastIndex(): number;
    get firstDummy(): number;
    get lastDummy(): number;
    private _setIndicator;
    get _childrenCount(): number;
    itemTemplateUpdated(oldData: any, newData: any): void;
    _setNativeClipToBounds(): void;
    eachChildView(callback: (child: View) => boolean): void;
    eachChild(callback: (child: ViewBase) => boolean): void;
    _updateScrollPosition(): void;
    private _autoPlayInterval;
    private _observableArrayHandler;
    _onItemsChanged(oldValue: any, newValue: any): void;
    scrollToIndexAnimated(index: number, animate: boolean): void;
    refresh(): void;
    _isDataDirty: boolean;
    onLoaded(): void;
    onUnloaded(): void;
    disposeNativeView(): void;
    private clearRealizedCells;
    private _clearCellViews;
    get disableAnimation(): boolean;
    set disableAnimation(value: boolean);
    _removeContainer(cell: PagerCell, index?: number): void;
    onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void;
    iosOverflowSafeAreaEnabledLayoutHackNeeded: boolean;
    protected updateInnerSize(): void;
    onLayout(left: number, top: number, right: number, bottom: number): void;
    requestLayout(): void;
    _prepareCell(cell: PagerCell, indexPath: NSIndexPath): void;
    _layoutCell(cellView: View, index: NSIndexPath): void;
    get horizontalOffset(): number;
    get verticalOffset(): number;
    _getSpacing(): number;
    _getPeaking(): number;
    _getSize(): {
        width: number;
        height: number;
    };
}
declare class PagerCell extends UICollectionViewCell {
    owner: WeakRef<View>;
    index: number;
    get view(): View;
    static initWithEmptyBackground(): PagerCell;
    willMoveToSuperview(newSuperview: UIView): void;
}
declare class UICollectionDelegateImpl extends NSObject implements UICollectionViewDelegate, UICollectionViewDelegateFlowLayout {
    private _owner;
    static initWithOwner(owner: WeakRef<Pager>): UICollectionDelegateImpl;
    collectionViewLayoutInsetForSectionAtIndex(collectionView: UICollectionView, collectionViewLayout: UICollectionViewLayout, section: number): UIEdgeInsets;
    collectionViewLayoutSizeForItemAtIndexPath(collectionView: UICollectionView, collectionViewLayout: UICollectionViewLayout, indexPath: NSIndexPath): CGSize;
    collectionViewWillDisplayCellForItemAtIndexPath(collectionView: UICollectionView, cell: UICollectionViewCell, indexPath: NSIndexPath): void;
    collectionViewLayoutMinimumLineSpacingForSectionAtIndex(collectionView: UICollectionView, collectionViewLayout: UICollectionViewLayout, section: number): number;
    scrollViewWillBeginDragging(scrollView: UIScrollView): void;
    scrollViewDidEndScrollingAnimation(scrollView: UIScrollView): void;
    scrollViewDidScroll(scrollView: UIScrollView): void;
    scrollViewDidEndDraggingWillDecelerate(scrollView: UIScrollView, decelerate: boolean): void;
    scrollViewWillEndDraggingWithVelocityTargetContentOffset(scrollView: UIScrollView, velocity: CGPoint, targetContentOffset: interop.Pointer | interop.Reference<CGPoint>): void;
}
declare class UICollectionViewFlowLinearLayoutImpl extends UICollectionViewFlowLayout {
    _owner: WeakRef<Pager>;
    _curl: CATransition;
    static initWithOwner(owner: WeakRef<Pager>): UICollectionViewFlowLinearLayoutImpl;
    layoutAttributesForElementsInRect(rect: CGRect): any;
    shouldInvalidateLayoutForBoundsChange(newBounds: CGRect): boolean;
    initialLayoutAttributesForAppearingItemAtIndexPath(itemIndexPath: NSIndexPath): UICollectionViewLayoutAttributes;
    finalLayoutAttributesForDisappearingItemAtIndexPath(itemIndexPath: NSIndexPath): UICollectionViewLayoutAttributes;
    targetContentOffsetForProposedContentOffsetWithScrollingVelocity(proposedContentOffset: CGPoint, velocity: CGPoint): CGPoint;
}
