import Vue from "vue";
import { ExtendedVue } from "vue/types/vue";

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

declare module "vue/types/vue" {
  // prettier-ignore
  type ExtractValue<Component> =
    Component extends ExtendedVue<Vue, { value: infer Value }, {}, {}, {}>
      ? Value
      : void;

  interface Vue {
    $promisedDialog<
      Props extends object,
      Component extends ExtendedVue<Vue, { value: any }, {}, {}, Props>
    >(
      component: Component,
      options: Props
    ): Promise<ExtractValue<Component>>;
  }
}

/*
// Test type safety
import ConfirmDialog from "@/components/ConfirmDialog.vue";
new Vue().$promisedDialog(ConfirmDialog, {
  meeeeeessage: 'c' // Typescript should detect: no such prop
}).then((a) => {
  let c: string = a; // Typescript should detect: boolean not string
});
*/
