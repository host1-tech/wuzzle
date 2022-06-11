import React, { FC } from 'react';

import styles from './ScopedLess.module.less';

export const ScopedLess: FC = () => {
  return (
    <h2 id="component-scoped-less" className={styles.root}>
      Styling with scoped Less
    </h2>
  );
};
