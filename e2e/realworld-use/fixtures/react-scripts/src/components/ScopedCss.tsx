import React, { FC } from 'react';

import styles from './ScopedCss.module.css';

export const ScopedCss: FC = () => {
  return (
    <h2 id="component-scoped-css" className={styles.root}>
      Styling with scoped Css
    </h2>
  );
};
