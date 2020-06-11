import { testWithSpectron, Server } from 'vue-cli-plugin-electron-builder';
// eslint-disable-next-line no-undef
const spectron = __non_webpack_require__('spectron')

describe('ImageGrid', function () {
  this.timeout(60000);

  let server: Server;

  beforeEach(async () => {
    try {
      server = await testWithSpectron(spectron);
    } catch (e) {
      console.log(e);
    }
  });

  afterEach(() => {
    if (server && server.app.isRunning()) {
      server.stopServe();
    }
  });

  it('shows imported images correctly', async (done) => {
    let app = server.app;

    const wc = await app.client.getWindowCount();
    console.log(wc);

    setTimeout(done, 10000);
  });
});
