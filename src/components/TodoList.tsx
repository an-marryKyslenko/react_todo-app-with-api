import React from 'react';
import Loader from './Loader';
import { Todo, TodoTitleOrCompleted } from '../types/Todo';
import classNames from 'classnames';
import { SelectedBy } from '../types/SelectedBy';
import { TodoItem } from './TodoItem';

type Props = {
  todos: Todo[];
  selectedBy: SelectedBy;
  tempTodo: Todo | null;
  onDelete: (todo: Todo) => void;
  isLoading: boolean;
  setTempTodo: React.Dispatch<React.SetStateAction<Todo | null>>;
  onEdit: (data: TodoTitleOrCompleted, id: number) => void;
};
export const TodoList: React.FC<Props> = ({
  todos,
  selectedBy,
  isLoading,
  tempTodo,
  setTempTodo,
  onDelete,
  onEdit,
}) => {
  const filteredTodos = todos.filter(todo =>
    selectedBy === SelectedBy.completed ? todo.completed : !todo.completed,
  );

  // #region edit todo
  function editCheckbox(data: TodoTitleOrCompleted, todoId: number) {
    const todoIndex = todos.findIndex(todo => todo.id === todoId);

    setTempTodo(todos[todoIndex]);
    onEdit(data, todoId);
  }

  // #endregion
  return (
    <section className="todoapp__main" data-cy="TodoList">
      {(selectedBy === SelectedBy.all ? todos : filteredTodos).map(todo => {
        const isActiveLoader =
          (tempTodo?.id === todo.id && isLoading) || (isLoading && !tempTodo);

        return (
          <div
            data-cy="Todo"
            key={todo.id}
            className={classNames('todo', {
              completed: todo.completed,
            })}
          >
            <TodoItem
              todo={todo}
              editCheckbox={editCheckbox}
              tempTodo={tempTodo}
              setTempTodo={setTempTodo}
              deleteTodo={onDelete}
              onEdit={onEdit}
            />

            <Loader isActive={isActiveLoader} />
          </div>
        );
      })}

      {tempTodo?.id === 0 && (
        <div
          data-cy="Todo"
          key={tempTodo.id}
          className={classNames('todo', {
            completed: tempTodo.completed,
          })}
        >
          {/* <label className="todo__status-label">
            <input
              data-cy="TodoStatus"
              type="checkbox"
              className="todo__status"
              defaultChecked={tempTodo.completed}
            />
          </label>

          <span data-cy="TodoTitle" className="todo__title">
            {tempTodo.title}
          </span>
          <button
            type="button"
            className="todo__remove"
            data-cy="TodoDelete"
          >
            ×
          </button> */}
          <TodoItem todo={tempTodo} />
          <Loader />
        </div>
      )}
    </section>
  );
};
