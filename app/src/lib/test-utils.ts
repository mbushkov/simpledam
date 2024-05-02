import { setActionServiceSingleton } from '@/actions';
import { ActionService } from '@/actions/action-service';
import { ApiService, setApiServiceSingleton } from '@/backend/api';
import { BackendMirror, setBackendMirrorSingleton } from '@/backend/backend-mirror';
import { type Immutable } from '@/lib/type-utils';
import { setStoreSingleton, setTransientStoreSingleton } from '@/store';
import { Store } from '@/store/store';
import { TransientStore } from '@/store/transient-store';
import { VueWrapper, mount as originalMount, shallowMount as originalShallowMount } from '@vue/test-utils';
import { Subject } from 'rxjs';
import sinon from 'sinon';
import { computed, defineComponent, reactive, type Component, type UnwrapNestedRefs } from 'vue';
import { DragHelperService, setDragHelperServiceSingleton } from './drag-helper-service';
import { ElectronHelperService, setElectronHelperServiceSingleton } from './electron-helper-service';

export interface ObservableWrapper<T extends object> {
  readonly value: UnwrapNestedRefs<T>;
  readonly wrapper: VueWrapper<any>;
  nextTick(): Promise<Immutable<T>>;
  snapshot(): Immutable<T>;
}

export function testAppComponent(): Component {
  return defineComponent({
    name: 'app',
    setup() {
    }
  });
}

export function mount(component: any, options?: any): VueWrapper<any> {
  return originalMount(component, {
    ...options,
    parentComponent: options?.parentComponent ?? testAppComponent(),
  });
}

export function shallowMount(component: any, options?: any): VueWrapper<any> {
  return originalShallowMount(component, {
    ...options,
    parentComponent: options?.parentComponent ?? testAppComponent(),
  });
}

/**
 * Creates a component that builds a recursive JSON representation of a given reactive object
 * using Vue template engine.
 * 
 * This is needed when testing reactive state objects. Any Vue-reactivity-related bugs, like not
 * using Vue.set/Vue.delete properly, should be caught by this.
 *
 * Note: initial implementations of this class were using JSON.stringify on the passed observableValue
 * without going through the hurdles of building a recursive JSON represntation by hand. Unfortunately,
 * such approach doesn't uncover reactivity bugs, since if a single key is changed in the state
 * object, it is marked for rerendering and then JSON.stringify is guaranteed to build a right
 * representation. To trigger potential reactivity issues we have to render using v-for - then
 * an hierarchy of components is built and this hierarchy is sensitive to Vue.set/Vue.delete-related
 * reactivity issues.
 *
 * @param observableValue Any object to observe.
 */
export function createJSONWrapper<T extends object>(observableValue: T): ObservableWrapper<T> {
  const recursiveComponent = defineComponent({
    // eslint-disable-next-line vue/multi-word-component-names
    name: 'recursive',
    template:
      '<div>' +
      '<div v-if="isList">[<span v-for="(item, index) in value"><recursive :value="item"></recursive>{{(index < value.length - 1) ? ",": ""}}</span>]</div>' +
      '<div v-if="isObject">{<span v-for="(item, key, index) in value">{{ stringify(key) }}: <recursive :value="item"></recursive>{{(index < Object.keys(value).length - 1) ? ",": ""}}</span>}</div>' +
      '<div v-if="!isList && !isObject">{{stringify(value)}}</div>' +
      '</div>',
    props: [
      'value',
    ],
    setup(props) {
      const isList = computed(() => {
        return (props.value ?? {})['splice'];
      });

      const isObject = computed(() => {
        return typeof props.value === 'object' && !(props.value ?? {})['splice'];
      });

      function stringify(v: any) {
        return JSON.stringify(v ?? null);
      }

      return {
        isList,
        isObject,
        stringify,
      };
    },
  });

  const reactiveObservableValue = reactive(observableValue);

  const wrapper = mount(recursiveComponent, {
    propsData: {
      value: reactiveObservableValue
    }
  });

  return {
    value: reactiveObservableValue,
    wrapper,
    async nextTick(): Promise<Immutable<T>> {
      await wrapper.vm.$nextTick();
      return this.snapshot();
    },
    snapshot(): Immutable<T> {
      // We use explicit undefineds, not nulls in our code, but that is not supported by JSON.
      function replaceNulls(obj: { [key: string]: any }) {
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

      return replaceNulls(JSON.parse(wrapper.text())) as Immutable<T>;
    }
  };
}


export function setupTestEnv() {
  const electronHelperService = sinon.createStubInstance(ElectronHelperService);
  setElectronHelperServiceSingleton(electronHelperService);

  const apiService = new ApiService(new Subject<unknown>());
  setApiServiceSingleton(apiService);

  const actionService = new ActionService(electronHelperService);
  setActionServiceSingleton(actionService);

  const transientStore = new TransientStore(apiService.ws);
  setTransientStoreSingleton(transientStore);

  const store = new Store(transientStore, apiService);
  setStoreSingleton(store);

  const backendMirror = new BackendMirror(apiService);
  setBackendMirrorSingleton(backendMirror);

  const dragHelperService = new DragHelperService(electronHelperService);
  setDragHelperServiceSingleton(dragHelperService);
}

export function setupComponentTestEnv() {
  setupTestEnv();
}
