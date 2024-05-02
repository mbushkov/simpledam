import { storeSingleton } from '@/store';
import { SortAttribute, SortOrder } from "@/store/store";
import { computed } from 'vue';
import { Action } from "./action";


export class SortByFileNameAscAction implements Action {
  readonly name = 'SortByFileNameAsc';
  readonly title = 'Sort by File Name (A→Z)';
  readonly enabled = computed(() => storeSingleton().currentList().items.length > 0);

  async perform(): Promise<void> {
    storeSingleton().sort(SortAttribute.FILE_NAME, SortOrder.ASC);
  }
}

export class SortByFileNameDescAction implements Action {
  readonly name = 'SortByFileNameDesc';
  readonly title = 'Sort by File Name (Z→A)';
  readonly enabled = computed(() => storeSingleton().currentList().items.length > 0);

  async perform(): Promise<void> {
    storeSingleton().sort(SortAttribute.FILE_NAME, SortOrder.DESC);
  }
}

export class SortByOriginTimeAscAction implements Action {
  readonly name = 'SortByOriginTimeAsc';
  readonly title = 'Sort by Origin Time (Past→Future)';
  readonly enabled = computed(() => storeSingleton().currentList().items.length > 0);

  async perform(): Promise<void> {
    storeSingleton().sort(SortAttribute.ORIGIN_TIME, SortOrder.ASC);
  }
}

export class SortByOriginTimeDescAction implements Action {
  readonly name = 'SortByOriginTimeDesc';
  readonly title = 'Sort by Origin Time (Furtue→Past)';
  readonly enabled = computed(() => storeSingleton().currentList().items.length > 0);

  async perform(): Promise<void> {
    storeSingleton().sort(SortAttribute.ORIGIN_TIME, SortOrder.DESC);
  }
}

export class SortByFileCreationTimeAscAction implements Action {
  readonly name = 'SortByFileCreationTimeAsc';
  readonly title = 'Sort by File Creation Time (Past→Future)';
  readonly enabled = computed(() => storeSingleton().currentList().items.length > 0);

  async perform(): Promise<void> {
    storeSingleton().sort(SortAttribute.FILE_CREATION_TIME, SortOrder.ASC);
  }
}

export class SortByFileCreationTimeDescAction implements Action {
  readonly name = 'SortByFileCreationTimeDesc';
  readonly title = 'Sort by File Creation Time (Future→Past)';
  readonly enabled = computed(() => storeSingleton().currentList().items.length > 0);

  async perform(): Promise<void> {
    storeSingleton().sort(SortAttribute.ORIGIN_TIME, SortOrder.DESC);
  }
}