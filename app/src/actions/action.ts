import { Ref } from 'vue';

export interface Action {
  readonly name: string;
  readonly title: string;
  readonly enabled: Readonly<Ref<Readonly<boolean>>>;

  perform(...args: any): Promise<void>;
}