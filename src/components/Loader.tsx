import classNames from 'classnames';
import { FC } from 'react';

type Props = {
  isActive?: boolean;
};
const Loader: FC<Props> = ({ isActive = true }) => {
  return (
    <div
      data-cy="TodoLoader"
      className={classNames('modal overlay', {
        'is-active': isActive,
      })}
    >
      <div
        className="
      modal-background
      has-background-white-ter
    "
      />
      <div className="loader" />
    </div>
  );
};

export default Loader;
