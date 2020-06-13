import { Label, Rotation } from '@/store/schema';
import VueCompositionApi from '@vue/composition-api';
import { shallowMount } from '@vue/test-utils';
import Vue from 'vue';
import { ImageData, Props } from './ImageBox';
import ImageBox from './ImageBox.vue';
import { expect } from 'chai';

Vue.use(VueCompositionApi);

function imageData(width: number, height: number): ImageData {
  return Vue.observable({
    uid: 'a',
    filePath: '/foo/bar',
    previewSize: {
      width,
      height,
    },
    label: Label.NONE,
    rating: 0,
    selectionType: 0,
    adjustments: {
      rotation: Rotation.NONE,
      horizontalFlip: false,
      verticalFlip: false,
    }
  });
}

describe('ImageBox', () => {
  it('fits rectangular image correctly', () => {
    const wrapper = shallowMount(ImageBox, {
      propsData: {
        imageData: imageData(400, 200),
        shortVersion: false,
        size: 300,
      } as Props
    });
    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(0deg) scale(1)');

    // TODO: numbers should be real here.
    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.style.width).to.equal('1px');
    expect(imageWrapper.style.height).to.equal('0.5px');
  });

  it('fits rotated rectangular image correctly', () => {

  });

  it('fits square image correctly', () => {

  });
});