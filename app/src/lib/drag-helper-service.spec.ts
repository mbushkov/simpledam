import chai, { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';
import { DragHelperService, UidAndPath, DragResult } from "./drag-helper-service";
import { ElectronHelperService } from './electron-helper-service';

chai.use(sinonChai);

describe('DragHelperService', () => {
  let dhs: DragHelperService;
  let ehsMock: ElectronHelperService;

  beforeEach(() => {
    ehsMock = sinon.createStubInstance(ElectronHelperService);
    dhs = new DragHelperService(ehsMock);
  });

  const imageSamples: UidAndPath[] = [
    {
      uid: 'a',
      path: '/foo/a',
    },
    {
      uid: 'b',
      path: '/foo/b',
    },
    {
      uid: 'c',
      path: '/foo/c',
    },
  ];

  describe('startDrag()', () => {
    let event: any;
    beforeEach(() => {
      event = {
        dataTransfer: {
          setData: sinon.stub(),
          effectAllowed: '',
        },
        preventDefault: sinon.stub(),
      };
    });

    it('modifies DragEvent to have uids', () => {
      dhs.startDrag(event as DragEvent, imageSamples, 'url');
      expect(event.dataTransfer.setData).to.have.been.calledOnceWithExactly('nmUids', '["a","b","c"]');
    });

    it('sets drag effect via electron callback', () => {
      (ehsMock.dragStart as SinonStub).callsArg(2);

      expect(event.dataTransfer.effectAllowed).to.equal('')
      dhs.startDrag(event as DragEvent, imageSamples, 'url');
      expect(event.dataTransfer.effectAllowed).to.equal('copyMove');
    });

    it('can be called consecutively', () => {
      dhs.startDrag(event as DragEvent, imageSamples, 'url');
      expect(event.dataTransfer.setData).to.have.been.calledOnceWithExactly('nmUids', '["a","b","c"]');

      (event.dataTransfer.setData as SinonStub).resetHistory();

      dhs.startDrag(event as DragEvent, [imageSamples[0]], 'url');
      expect(event.dataTransfer.setData).to.have.been.calledOnceWithExactly('nmUids', '["a"]');
    });
  });

  describe('finishDrag()', () => {
    let event: any;
    beforeEach(() => {
      event = {
        dataTransfer: {
          setData: sinon.stub(),
          getData: sinon.stub(),
          files: {
            length: 3,
            item: sinon.stub().callsFake((i) => {
              if (i == 0) {
                return { path: '/foo/a' };
              } else if (i == 1) {
                return { path: '/foo/b' };
              } else if (i == 2) {
                return { path: '/foo/c' };
              } else {
                return undefined;
              }
            }),
          },
          dropEffect: undefined,
        },
        preventDefault: sinon.stub(),
      };
    });

    it('returns undefined if dataTransfer has no files', () => {
      event.dataTransfer.files = undefined;
      expect(dhs.finishDrag(event)).to.equal(undefined);
    });

    it('returns internal drag result if nmUids are present', () => {
      (event.dataTransfer.getData as SinonStub).returns('["a","b","c"]');
      const dragResult = dhs.finishDrag(event);

      expect(dragResult).to.eql({
        contents: {
          kind: 'internal',
          uids: ['a', 'b', 'c']
        },
        effect: 'move'
      } as DragResult);
      expect(event.dataTransfer.getData).to.have.been.calledOnceWithExactly('nmUids');
    });

    it('returns internal drag result if paths match paths from startDrag', () => {
      dhs.startDrag(event as DragEvent, imageSamples, 'url');
      const dragResult = dhs.finishDrag(event);

      expect(dragResult).to.eql({
        contents: {
          kind: 'internal',
          uids: ['a', 'b', 'c']
        },
        effect: 'move'
      } as DragResult);
    });

    it('returns external drag if paths do not match paths from startDrag', () => {
      const dragResult = dhs.finishDrag(event);

      expect(dragResult).to.eql({
        contents: {
          kind: 'external',
          paths: ['/foo/a', '/foo/b', '/foo/c']
        },
        effect: 'move'
      } as DragResult);
    });

    it('returns external drag on partial path match from startDrag', () => {
      dhs.startDrag(event as DragEvent, [imageSamples[0]], 'url');
      const dragResult = dhs.finishDrag(event);

      expect(dragResult).to.eql({
        contents: {
          kind: 'external',
          paths: ['/foo/a', '/foo/b', '/foo/c']
        },
        effect: 'move'
      } as DragResult);
    });

    it('propagates copy effect', () => {
      event.dataTransfer.dropEffect = 'copy';
      const dragResult = dhs.finishDrag(event);

      expect(dragResult?.effect).to.eql('copy');
    });
  });
});