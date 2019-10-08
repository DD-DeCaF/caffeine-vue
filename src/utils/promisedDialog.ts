// Adjusted from https://github.com/yariksav/vuetify-confirm/
function promisedDialog(Vue) {
  Vue.prototype.$promisedDialog = (component, options: {}) => {
    return new Promise(resolve => {
      const ComponentClass = Vue.extend(component);
      const instance = new ComponentClass({
        propsData: options,
        destroyed: () => {
          document.body.removeChild(instance.$el);
          resolve(instance.value);
        }
      });
      document.body.appendChild(instance.$mount().$el);
    });
  };
}

export default promisedDialog;
