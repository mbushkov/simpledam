interface Action {
  readonly name: string;
  readonly title: string;

  perform(): Promise<void>;
}