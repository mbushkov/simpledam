import { COLUMN_TITLES } from '@/components/ImageList';
import { ImageViewerTab, storeSingleton, transientStoreSingleton } from '@/store';
import { type ListColumnName } from '@/store/schema';
import { SortAttribute, SortOrder } from "@/store/store";
import { computed } from 'vue';
import { type Action } from './action';

export class AddListColumn implements Action {
  readonly name = 'AddListColumn';
  readonly title = 'Add List Column';
  readonly enabled = computed(() => transientStoreSingleton().state.imageViewerTab === ImageViewerTab.LIST);

  async perform(columnIndex: number, newColumnTitle: string): Promise<void> {
    console.log(['AddListColumn', columnIndex, newColumnTitle]);
    const columns = storeSingleton().state.listSettings.columns;
    let columnName: string|undefined = undefined;
    for (const key in COLUMN_TITLES) {
      if (COLUMN_TITLES[key as ListColumnName] === newColumnTitle) {
        columnName = key;
      }
    }
    if (columnName === undefined) {
      return;
    }
    storeSingleton().addListColumn(columnIndex, columnName as ListColumnName);
  }
};

export class SortByListColumn implements Action {
  readonly name = 'SortByListColumn';
  readonly title = 'Sort By List Column';
  readonly enabled = computed(() => transientStoreSingleton().state.imageViewerTab === ImageViewerTab.LIST);

  async perform(columnIndex: number, newColumnTitle: string): Promise<void> {
    storeSingleton().sort(SortAttribute.FILE_NAME, SortOrder.DESC);
  }
}


export class DeleteListColumn implements Action {
  readonly name = 'DeleteListColumn';
  readonly title = 'Delete List Column';
  readonly enabled = computed(() => transientStoreSingleton().state.imageViewerTab === ImageViewerTab.LIST);

  async perform(columnIndex: number): Promise<void> {
    const columns = storeSingleton().state.listSettings.columns;
    if (columns.length > 1) {
      storeSingleton().removeListColumn(columnIndex);
    }
  }
};
