import { apiServiceSingleton } from "@/backend/api";
import { storeSingleton, transientStoreSingleton } from "@/store";
import * as log from "loglevel";
import {
  ComponentPublicInstance,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect
} from "vue";
import { ModalsContainer, useVfm } from 'vue-final-modal';
import { actionServiceSingleton } from "./actions";
import { backendMirrorSingleton } from "./backend/backend-mirror";
import ImageViewer from "./components/ImageViewer.vue";
import StatusBar from "./components/StatusBar.vue";
import ToolBar from "./components/ToolBar.vue";
import SideBar from "./components/sidebar/SideBar.vue";
import { electronHelperServiceSingleton } from "./lib/electron-helper-service";
import { modalHelperServiceSingleton } from "./lib/modal-helper-service";
import { initialState } from "./store/store";

export default defineComponent({
  components: {
    SideBar,
    StatusBar,
    ToolBar,
    ImageViewer,
    ModalsContainer,
  },
  setup() {
    modalHelperServiceSingleton().setVfm(useVfm());

    onMounted(() => {
      apiServiceSingleton()
        .fetchState()
        .then((s) => {
          if (s !== undefined) {
            storeSingleton().replaceState(s);
          }

          loaded.value = true;
        });

      window.addEventListener("resize", handleResize);

      (window as any).addEventListener(
        "nm-action",
        (event: CustomEvent<{ actionName: string; args: any[] }>) => {
          actionServiceSingleton().performAction(
            event.detail.actionName,
            ...event.detail.args
          );
        }
      );
      (window as any).addEventListener(
        "nm-check-for-unsaved-changes",
        async () => {
          const currentState = storeSingleton().state;
          const savedState =
            (await apiServiceSingleton().fetchState()) || initialState();
          const currentStateStr = JSON.stringify(currentState);
          const savedStateStr = JSON.stringify(savedState);
          if (currentStateStr !== savedStateStr) {
            electronHelperServiceSingleton().confirmClosingWindow();
          } else {
            electronHelperServiceSingleton().closeWindow();
          }
        }
      );
    });

    const resizeObserver = new ResizeObserver(handleResize);
    onBeforeUnmount(() => {
      resizeObserver.disconnect();
    });

    watchEffect(() => {
      document.title =
        backendMirrorSingleton().state.catalogPath || "<unnamed>";
    });

    const minSideBarSize = ref(20);
    const maxSideBarSize = ref(50);
    const sideBarSize = ref(20);
    const sideBarSizePx = ref(250);
    const loaded = ref(false);

    const leftPane = ref<ComponentPublicInstance | undefined>();
    const imageViewerRef = ref<InstanceType<typeof ImageViewer>>();

    watch(leftPane, (r, oldR) => {
      if (oldR) {
        resizeObserver.unobserve(oldR.$el);
      }
      if (r) {
        resizeObserver.observe(r.$el);
      }
    });

    function handleResize() {
      if (leftPane.value) {
        transientStoreSingleton().setLeftPaneWidth(
          leftPane.value.$el.clientWidth
        );
      }
    }

    function splitpanesReady() {
      handleResize();
    }

    function splitpanesResizing() {
      handleResize();
      log.debug("[App] Split panes are currently resizing.");
    }

    function splitpanesResized() {
      handleResize();

      if (!leftPane.value || !imageViewerRef.value) {
        return;
      }

      sideBarSizePx.value = leftPane.value.$el.clientWidth;
      log.debug(
        "[App] Split panes done resizing. Sidebar size: ",
        sideBarSizePx.value
      );
    }

    return {
      minSideBarSize,
      maxSideBarSize,
      sideBarSize,
      sideBarSizePx,
      loaded,

      leftPane,
      imageViewerRef,

      splitpanesReady,
      splitpanesResizing,
      splitpanesResized,
    };
  },
});
