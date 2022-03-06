/// <reference types="react-scripts" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const nil: {};
  export default nil;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.scss' {
  const nil: {};
  export default nil;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.sass' {
  const nil: {};
  export default nil;
}

declare module '*.module.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.less' {
  const nil: {};
  export default nil;
}

declare module 'react-scripts/config/paths' {
  const values: Record<string, string>;
  export = values;
}
