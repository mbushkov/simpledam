import { TransientStore, ImageViewerTab } from '@/store/transient-store';
import { expect } from 'chai'
import { createJSONWrapper, setupTestEnv } from '@/lib/test-utils';

setupTestEnv();

describe('TransientStore', () => {
  let ts: TransientStore;

  beforeEach(() => {
    ts = new TransientStore();
  });


  it('reacts on image viewer tab change', async () => {
    const wrapper = createJSONWrapper(ts.state);

    ts.setImageViewerTab(ImageViewerTab.THUMBNAILS);
    expect((await wrapper.nextTick()).imageViewerTab).to.be.equal(ImageViewerTab.THUMBNAILS);

    ts.setImageViewerTab(ImageViewerTab.MEDIA);
    expect((await wrapper.nextTick()).imageViewerTab).to.be.equal(ImageViewerTab.MEDIA);
  });

  it('reacts on column count change', async () => {
    const wrapper = createJSONWrapper(ts.state);

    ts.setColumnCount(42);
    expect((await wrapper.nextTick()).columnCount).to.be.equal(42);

    ts.setColumnCount(43);
    expect((await wrapper.nextTick()).columnCount).to.be.equal(43);
  });
})
