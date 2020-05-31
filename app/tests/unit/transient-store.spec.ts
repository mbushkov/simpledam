import Vue from 'vue';
import { TransientStore, ImageViewerTab } from '@/transient-store';
import { shallowMount } from '@vue/test-utils';
import { expect } from 'chai'

describe('TransientStore', () => {
  let ts: TransientStore;

  beforeEach(() => {
    ts = new TransientStore();
  });

  it('reacts on image viewer tab change', async () => {
    const c = Vue.component('Test', {
      name: 'Test',
      props: {
        ts: Object,
      },
      template: "<div>{{ ts.state.imageViewerTab }}</div>",
    });
    const wrapper = shallowMount(c, {
      propsData: {
        ts
      }
    });

    ts.setImageViewerTab(ImageViewerTab.THUMBNAILS);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).to.be.eq('0');

    ts.setImageViewerTab(ImageViewerTab.MEDIA);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).to.be.eq('1');
  });

  it('reacts on column count change', async () => {
    const c = Vue.component('Test', {
      name: 'Test',
      props: {
        ts: Object,
      },
      template: "<div>{{ ts.state.columnCount }}</div>",
    });
    const wrapper = shallowMount(c, {
      propsData: {
        ts
      }
    });

    ts.setColumnCount(42);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).to.be.eq('42');

    ts.setColumnCount(43);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).to.be.eq('43');
  });
})
