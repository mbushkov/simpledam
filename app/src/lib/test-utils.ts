import Vue from 'vue';
import { shallowMount, Wrapper } from '@vue/test-utils';
import { Immutable } from '@/lib/type-utils';

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
