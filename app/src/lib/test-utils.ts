import { Immutable } from '@/lib/type-utils';
import VueCompositionApi from '@vue/composition-api';
import { shallowMount, Wrapper } from '@vue/test-utils';
import Buefy from 'buefy';
import Vue from 'vue';

export interface ObservableWrapper<T> {
  readonly wrapper: Wrapper<Vue>;
  nextTick(): Promise<Immutable<T>>;
  snapshot(): Immutable<T>;
}

export function createJSONWrapper<T>(observableValue: T) {
  const c = Vue.component('Test', {
    name: 'Test',
    props: {
      value: Object,
    },
    template: '<div>{{ JSON.stringify(value) }}</div>',
  });
  const wrapper = shallowMount(c, {
    propsData: {
      value: observableValue
    }
  });

  return {
    wrapper,
    async nextTick(): Promise<Immutable<T>> {
      await wrapper.vm.$nextTick();
      return this.snapshot();
    },
    snapshot(): Immutable<T> {
      return JSON.parse(wrapper.text()) as Immutable<T>;
    }
  };
}

export function pureCopy<T>(obj: T): T {
  const replacer = (key: string, value: unknown) => value === undefined ? null : value;
  const result = JSON.parse(JSON.stringify(obj, replacer));

  function replaceNulls(obj: any) {
    for (const key in obj) {
      const val = obj[key] as unknown;
      if (val === null) {
        obj[key] = undefined;
      } else if (val instanceof Object) {
        replaceNulls(val as any);
      }
    }

    return obj;
  }

  return replaceNulls(result) as T;
}

export function setupComponentTestEnv() {
  Vue.use(VueCompositionApi);
  Vue.use(Buefy);
}

export function setupTestEnv() {
  Vue.use(VueCompositionApi);
}