import { setupComponentTestEnv, shallowMount } from '@/lib/test-utils';
import { Label, Rotation, type ImageAdjustments } from '@/store/schema';
import { expect } from 'chai';
import { reactive } from 'vue';
import { type ImageData, type Props } from './ImageBox';
import ImageBox from './ImageBox.vue';

setupComponentTestEnv();

function generateImage(width: number, height: number, color: string): string {
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error('context can\'t be null');
  }
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/png');
}

function imageData(width: number, height: number, url: string, adjustments: Partial<ImageAdjustments> = {}): ImageData {
  return reactive({
    uid: 'a',
    filePath: '/foo/bar',
    previewSize: {
      width,
      height,
    },
    previewUrl: url,
    label: Label.NONE,
    rating: 0,
    selectionType: 0,
    adjustments: {
      rotation: Rotation.NONE,
      horizontalFlip: false,
      verticalFlip: false,
      ...adjustments,
    }
  });
}

async function createWrapper(imageWidth: number, imageHeight: number, adjustments: Partial<ImageAdjustments> = {}) {
  const elem = document.createElement('div')
  document.body.appendChild(elem);

  const wrapper = shallowMount(ImageBox, {
    propsData: {
      imageData: imageData(imageWidth, imageHeight, generateImage(imageWidth, imageHeight, 'green'), adjustments),
      shortVersion: false,
      size: 300,
    } as Props,
    attrs: {
      style: 'width: 300px; height: 300px',
    },
    attachTo: elem,
  });
  // This is needed to make sure the whole chain of sizes computed properties is calculated.
  await wrapper.vm.$nextTick();

  const nested = wrapper.element.querySelector('.nested') as HTMLDivElement;
  expect(nested.clientWidth).to.be.gte(290); // Take margins/paddings into account.
  expect(nested.clientHeight).to.be.gte(250); // Take margins/paddings (including the bottom one) into account.

  return { wrapper, nested, imageWidth, imageHeight };
}

describe('ImageBox', () => {
  it('fits 900x700 image correctly', async () => {
    const { wrapper, nested, imageWidth, imageHeight } = await createWrapper(900, 700);

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(0deg) scale(1)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientWidth, 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientWidth * (imageHeight / imageWidth), 1);

    wrapper.unmount();
  });

  it('fits 90 deg rotated 900x700 image correctly', async () => {
    const { wrapper, nested, imageWidth, imageHeight } = await createWrapper(900, 700, { rotation: Rotation.DEG_90 });

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(90deg) scale(1.28571) translateX(100%)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientHeight / (imageWidth / imageHeight), 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientHeight, 1);

    wrapper.unmount();
  });

  it('fits 180 deg rotated 900x700 image correctly', async () => {
    const { wrapper, nested, imageWidth, imageHeight } = await createWrapper(900, 700, { rotation: Rotation.DEG_180 });

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(180deg) scale(1)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientWidth, 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientWidth * (imageHeight / imageWidth), 1);

    wrapper.unmount();
  });

  it('fits 270 deg rotated 900x700 image correctly', async () => {
    const { wrapper, nested, imageWidth, imageHeight } = await createWrapper(900, 700, { rotation: Rotation.DEG_270 });
    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(270deg) scale(1.28571) translateY(-100%)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientHeight / (imageWidth / imageHeight), 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientHeight, 1);

    wrapper.unmount();
  });

  it('fits 700x900 image correctly', async () => {
    const { wrapper, nested, imageWidth, imageHeight } = await createWrapper(700, 900);

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(0deg) scale(1)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientHeight * (imageWidth / imageHeight), 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientHeight, 1);

    wrapper.unmount();
  });

  it('fits 90 deg rotated 700x900 image correctly', async () => {
    const { wrapper, nested, imageWidth, imageHeight } = await createWrapper(700, 900, { rotation: Rotation.DEG_90 });

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(90deg) scale(1.28571) translateX(100%)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientWidth, 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientWidth * (imageWidth / imageHeight), 1);

    wrapper.unmount();
  });

  it('fits 180 deg rotated 700x900 image correctly', async () => {
    const { wrapper, nested, imageWidth, imageHeight } = await createWrapper(700, 900, { rotation: Rotation.DEG_180 });

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(180deg) scale(1)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientHeight * (imageWidth / imageHeight), 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientHeight, 1);

    wrapper.unmount();
  });

  it('fits 270 deg rotated 700x900 image correctly', async () => {
    const { wrapper, nested, imageWidth, imageHeight } = await createWrapper(700, 900, { rotation: Rotation.DEG_270 });

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(270deg) scale(1.28571) translateY(-100%)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientWidth, 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientWidth * (imageWidth / imageHeight), 1);

    wrapper.unmount();
  });

  it('fits 900x900 image correctly', async () => {
    const { wrapper, nested } = await createWrapper(900, 900);

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(0deg) scale(1)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientHeight, 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientHeight, 1);

    wrapper.unmount();
  });

  it('fits 90 deg rotated 900x900 image correctly', async () => {
    const { wrapper, nested } = await createWrapper(900, 900, { rotation: Rotation.DEG_90 });

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(90deg) scale(1) translateX(100%)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientHeight, 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientHeight, 1);

    wrapper.unmount();
  });

  it('fits 180 deg rotated 900x900 image correctly', async () => {
    const { wrapper, nested } = await createWrapper(900, 900, { rotation: Rotation.DEG_180 });

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(180deg) scale(1)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientHeight, 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientHeight, 1);

    wrapper.unmount();
  });

  it('fits 270 deg rotated 900x900 image correctly', async () => {
    const { wrapper, nested } = await createWrapper(900, 900, { rotation: Rotation.DEG_270 });

    const img = wrapper.element.querySelector('img') as HTMLImageElement;
    expect(img.style.transform).to.equal('rotate(270deg) scale(1) translateY(-100%)');

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientHeight, 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientHeight, 1);

    wrapper.unmount();
  });

  it('fits 80x40 image correctly', async () => {
    const { wrapper } = await createWrapper(80, 40);

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.equal(80);
    expect(imageWrapper.clientHeight).to.equal(40);

    wrapper.unmount();
  });

  it('fits 90 deg rotated 80x40 image correctly', async () => {
    const { wrapper } = await createWrapper(80, 40, { rotation: Rotation.DEG_90 });

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.equal(40);
    expect(imageWrapper.clientHeight).to.equal(80);

    wrapper.unmount();
  });

  it('fits 180 deg rotated 80x40 image correctly', async () => {
    const { wrapper } = await createWrapper(80, 40, { rotation: Rotation.DEG_180 });

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.equal(80);
    expect(imageWrapper.clientHeight).to.equal(40);

    wrapper.unmount();
  });

  it('fits 270 deg rotated 80x40 image correctly', async () => {
    const { wrapper } = await createWrapper(80, 40, { rotation: Rotation.DEG_270 });

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.equal(40);
    expect(imageWrapper.clientHeight).to.equal(80);

    wrapper.unmount();
  });

  it('fits 285x285 image correctly', async () => {
    const { wrapper, nested } = await createWrapper(285, 285);

    const imageWrapper = wrapper.element.querySelector('.image-wrapper') as HTMLDivElement;
    expect(imageWrapper.clientWidth).to.be.closeTo(nested.clientHeight, 1);
    expect(imageWrapper.clientHeight).to.be.closeTo(nested.clientHeight, 1);

    wrapper.unmount();
  });
});