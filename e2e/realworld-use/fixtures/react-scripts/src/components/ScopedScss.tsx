import React, { FC } from 'react';

import styles from './ScopedScss.module.scss';

export const ScopedScss: FC = () => {
  return (
    <h2 id="component-scoped-scss" className={styles.root}>
      Styling with scoped Scss
    </h2>
  );
};
