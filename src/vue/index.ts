const Plugin = {
    install(Vue) {
        Vue.registerElement('NativePager', () => require('../').Pager);
        Vue.registerElement('PagerItem', () => require('../').PagerItem);
        Vue.component('Pager', require('./pager')(Vue));
    }
};

export default Plugin;
