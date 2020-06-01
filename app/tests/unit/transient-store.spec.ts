import Vue from 'vue';
import { TransientStore, ImageViewerTab } from '@/store/transient-store';
import { shallowMount } from '@vue/test-utils';
import { expect } from 'chai'

describe('TransientStore', () => {
  let ts: TransientStore;

  beforeEach(() => {
    ts = new TransientStore();
  });

  function createWrapper(template: string) {
    const c = Vue.component('Test', {
      name: 'Test',
      props: {
        ts: Object,
      },
      template,
    });
    return shallowMount(c, {
      propsData: {
        ts
      }
    });
  }

  it('reacts on image viewer tab change', async () => {
    const wrapper = createWrapper('<div>{{ ts.state.imageViewerTab }}</div>');

    ts.setImageViewerTab(ImageViewerTab.THUMBNAILS);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).to.be.eq('0');

    ts.setImageViewerTab(ImageViewerTab.MEDIA);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).to.be.eq('1');
  });

  it('reacts on column count change', async () => {
    const wrapper = createWrapper('<div>{{ ts.state.columnCount }}</div>');

    ts.setColumnCount(42);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).to.be.eq('42');

    ts.setColumnCount(43);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).to.be.eq('43');
  });
})
