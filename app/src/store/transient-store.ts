import { type Action, type LongOperationErrorAction, type LongOperationLogAction, type LongOperationStartAction, type LongOperationStatusAction, type LongOperationSuccessAction } from '@/backend/actions';
import { type Immutable } from '@/lib/type-utils';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { reactive } from 'vue';


export enum ImageViewerTab {
  THUMBNAILS = 0,
  MEDIA = 1,
  LIST = 2,
}

export interface SingleImageViewerOptions {
  scale: number;
  autoFit: boolean;
}

export enum LongOperationState {
  IN_PROGRESS = 0,
  SUCCESS = 1,
  ERROR = 2,
}

export interface LongOperationLog {
  timestamp: number;
  kind: 'log' | 'warning' | 'error';
  message: string;
}

export interface LongOperation {
  state: LongOperationState;
  startTimestamp: number;

  status: string;
  progress: number;

  logCount: number;
  warningCount: number;
  errorCount: number;

  logs: Array<LongOperationLog>;
}

export interface TransientState {
  imageViewerTab: ImageViewerTab;
  columnCount: number;
  leftPaneWidth: number;
  infoPaneShown: boolean;

  singleImageViewerOptions: SingleImageViewerOptions;

  longOperations: { [key: string]: LongOperation };
  longOperationsArchive: { [key: string]: LongOperation };
}

type ReadonlyTransientState = Immutable<TransientState>;

export class TransientStore {
  private _state: TransientState = reactive({
    imageViewerTab: ImageViewerTab.THUMBNAILS,
    columnCount: 1,
    leftPaneWidth: 1,
    infoPaneShown: false,

    singleImageViewerOptions: {
      scale: 100,
      autoFit: true,
    },

    longOperations: {},
    longOperationsArchive: {},
  })

  constructor(private readonly actions$: Observable<Action>) { }

  get state(): ReadonlyTransientState {
    return this._state;
  }

  setImageViewerTab(tab: ImageViewerTab) {
    this._state.imageViewerTab = tab;
  }

  setColumnCount(n: number) {
    this._state.columnCount = n;
  }

  setLeftPaneWidth(n: number) {
    this._state.leftPaneWidth = n;
  }

  toggleInfoPaneShown() {
    this._state.infoPaneShown = !this._state.infoPaneShown;
  }

  setSingleImageViewerOptions(options: Partial<SingleImageViewerOptions>) {
    this._state.singleImageViewerOptions = {
      ...this._state.singleImageViewerOptions,
      ...options,
    };
  }

  readonly longOperationStart$ = this.actions$.pipe(
    filter((v): v is LongOperationStartAction => {
      return v.action === 'LONG_OPERATION_START';
    })).subscribe(v => {
      const newOp: LongOperation = {
        state: LongOperationState.IN_PROGRESS,
        startTimestamp: Date.now(),

        status: 'Starting...',
        progress: 0,

        logCount: 0,
        warningCount: 0,
        errorCount: 0,

        logs: [],
      };
      this._state.longOperations[v.loid] = newOp;
    });

  readonly longOperationStatus$ = this.actions$.pipe(
    filter((v): v is LongOperationStatusAction => {
      return v.action === 'LONG_OPERATION_STATUS';
    })
  ).subscribe(v => {
    this._state.longOperations[v.loid].status = v.status.status;
    this._state.longOperations[v.loid].progress = v.status.progress;
  });

  readonly longOperationLog$ = this.actions$.pipe(
    filter((v): v is LongOperationLogAction => {
      return (v as Action).action === 'LONG_OPERATION_LOG';
    })
  ).subscribe(v => {
    const lo = this._state.longOperations[v.loid];

    if (v.log.kind === 'error') {
      lo.errorCount += 1;
    } else if (v.log.kind === 'log') {
      lo.logCount += 1;
    } else if (v.log.kind === 'warning') {
      lo.warningCount += 1;
    } else {
      throw new Error('Unexpected log.kind value: ' + v.log.kind);
    }

    lo.logs.push({
      timestamp: Date.now(),
      kind: v.log.kind,
      message: v.log.message,
    });
  });

  readonly longOperationSuccess$ = this.actions$.pipe(
    filter((v): v is LongOperationSuccessAction => {
      return (v as Action).action === 'LONG_OPERATION_SUCCESS';
    })
  ).subscribe(v => {
    this._state.longOperations[v.loid].state = LongOperationState.SUCCESS;

    this._state.longOperationsArchive[v.loid] = this._state.longOperations[v.loid];
    delete this._state.longOperations[v.loid];

    // TODO: implement a routine to clean up the long operations archive if it gets too big.
    // Here and below.
  });

  readonly longOperationError$ = this.actions$.pipe(
    filter((v): v is LongOperationErrorAction => {
      return (v as Action).action === 'LONG_OPERATION_ERROR';
    })
  ).subscribe(v => {
    this._state.longOperations[v.loid].state = LongOperationState.ERROR;
    this._state.longOperations[v.loid].status = v.message;

    this._state.longOperationsArchive[v.loid] = this._state.longOperations[v.loid];
    delete this._state.longOperations[v.loid];
  });
}
