export declare interface OpenWithEntry {
  readonly name: string;
  readonly icon: string;
}
export declare interface OpenWithEntries {
  readonly default: OpenWithEntry;
  readonly other: ReadonlyArray<OpenWithEntry>;
}