export interface RegisterOptions {
  commandPath: string;
}

export interface RegisterFunction {
  (options: RegisterOptions): void;
}
