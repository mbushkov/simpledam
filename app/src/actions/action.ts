import { Ref } from '@vue/composition-api';

export interface Action {
  readonly name: string;
  readonly title: string;
  readonly enabled: Readonly<Ref<Readonly<boolean>>>;

  perform(): Promise<void>;
}