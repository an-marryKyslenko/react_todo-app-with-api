/* eslint-disable max-len */
/* eslint-disable jsx-a11y/label-has-associated-control */

import React, {
  useState,
  useRef,
  useEffect,
  FormEvent,
  ChangeEvent,
  KeyboardEvent,
} from 'react';
import classNames from 'classnames';
import * as todosServise from './api/todos';
import { UserWarning } from './UserWarning';
import { Todo, TodoTitleOrCompleted } from './types/Todo';
import { SelectedBy } from './types/SelectedBy';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedBy, setSelectedBy] = useState<SelectedBy>(SelectedBy.all);
  const [errorMessage, setErrorMessage] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isDisabletField, setIsDisabletField] = useState(false);
  const [title, setTilte] = useState('');
  const [isOpenInput, setIsOpenInput] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // #region loading todos
  const loadingTodos = () => {
    todosServise
      .getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage('Unable to load todos');
        setTimeout(() => setErrorMessage(''), 3000);
      });
  };

  useEffect(() => {
    loadingTodos();

    mainInputRef.current?.focus();
  }, []);

  if (!todosServise.USER_ID) {
    return <UserWarning />;
  }
  // #endregion

  const filteredTodos = todos.filter(todo =>
    selectedBy === SelectedBy.completed ? todo.completed : !todo.completed,
  );

  // #region create and delete todo
  function createTodo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Title should not be empty');
      setTimeout(() => setErrorMessage(''), 3000);

      return;
    }

    setTempTodo({
      id: 0,
      title,
      userId: todosServise.USER_ID,
      completed: false,
    });

    setIsDisabletField(true);

    todosServise
      .createTodos({
        title: title.trim(),
        userId: todosServise.USER_ID,
        completed: false,
      })
      .then(result => {
        todos.push(result);
        setTilte('');
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => {
        setIsDisabletField(false);
        setTempTodo(null);

        setTimeout(() => {
          mainInputRef.current?.focus();
        }, 0);
      });
  }

  function deleteTodo(deletedTodo: Todo) {
    setTempTodo(deletedTodo);
    setIsLoadingAll(true);

    todosServise
      .deleteTodo(deletedTodo.id)
      .then(() => {
        setTodos(prev => prev.filter(todo => todo.id !== deletedTodo.id));
        setTempTodo(null);
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => {
        setIsLoadingAll(false);

        setTimeout(() => {
          mainInputRef.current?.focus();
        }, 1);
      });
  }
  // #endregion

  // #region edit todo
  function editTodo(data: TodoTitleOrCompleted, todoId: number) {
    setIsLoadingAll(true);

    todosServise
      .editTodo(data, todoId)
      .then(result => {
        setTodos(prev =>
          prev.map(prevTodo => (prevTodo.id === result.id ? result : prevTodo)),
        );
        setTempTodo(null);
      })
      .catch(() => {
        setErrorMessage('Unable to update a todo');
        setTimeout(() => setErrorMessage(''), 3000);
      })
      .finally(() => {
        setIsLoadingAll(false);
      });
  }

  function editCheckbox(data: TodoTitleOrCompleted, todoId: number) {
    const todoIndex = todos.findIndex(todo => todo.id === todoId);

    setTempTodo(todos[todoIndex]);
    editTodo(data, todoId);
  }

  function handleDubleClick(todo: Todo) {
    setIsOpenInput(true);
    setTempTodo(todo);

    setTimeout(() => {
      editInputRef.current?.focus();
    }, 0);
  }

  function editTitle(e: FormEvent<HTMLFormElement>, todo: Todo) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const newTitle = form.get('newTitle') as string;

    if (!newTitle) {
      deleteTodo(todo);

      return;
    }

    if (newTitle === todo.title) {
      setTempTodo(null);
      setIsOpenInput(false);

      return;
    }

    editTodo({ title: newTitle.trim() }, todo.id);
  }

  function handleTitleBlur(e: ChangeEvent<HTMLInputElement>, todo: Todo) {
    const newTitle = e.target.value.trim();

    if (!newTitle) {
      deleteTodo(todo);

      return;
    }

    if (newTitle === todo.title) {
      setIsOpenInput(false);
      setTempTodo(null);
    }

    editTodo({ title: newTitle }, todo.id);
  }

  function handleKeyUp(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setIsOpenInput(false);
      setTempTodo(null);
    }
  }
  // #endregion

  // #region clear button
  const complitedTodosIds = todos.reduce((result: number[], curTodo: Todo) => {
    if (curTodo.completed) {
      result.push(curTodo.id);
    }

    return result;
  }, []);

  async function clearComplitedTodos() {
    setIsLoadingAll(true);

    const deletedTodos = todos
      .filter(todo => complitedTodosIds.includes(todo.id))
      .map(todo =>
        todosServise
          .deleteTodo(todo.id)
          .then(() => ({
            status: 'fulfilled' as const,
            id: todo.id,
          }))
          .catch(() => {
            setErrorMessage('Unable to delete a todo');
            setTimeout(() => setErrorMessage(''), 3000);
          })
          .finally(() => {
            setTimeout(() => {
              mainInputRef.current?.focus();
            }, 1);
          }),
      );

    const results = await Promise.all(deletedTodos);

    setTodos(prev =>
      prev.filter(todo => {
        const fulfilledResult = results
          .filter(item => item?.status === 'fulfilled')
          .map(item => item?.id);

        return !fulfilledResult.includes(todo.id);
      }),
    );
    setIsLoadingAll(false);
  }
  // #endregion

  // #region toggle all
  async function toggleAll() {
    setIsLoadingAll(true);

    const activeTodos = todos.filter(todo => !todo.completed);
    const todosToToggle = todos.some(todo => !todo.completed)
      ? activeTodos
      : todos;

    const allToggled = todosToToggle.map(todo => {
      return todosServise
        .editTodo({ completed: !todo.completed }, todo.id)
        .then(updatedItem => ({
          status: 'fulfilled' as const,
          value: updatedItem,
          id: todo.id,
        }))
        .catch(() => {
          setErrorMessage('Unable to update a todo');
          setTimeout(() => setErrorMessage(''), 3000);

          return {
            status: 'rejected' as const,
            reason: 'Unable to update a todo',
            id: todo.id,
          };
        });
    });

    const results = await Promise.all(allToggled);

    if (results) {
      setTodos(prevTodos =>
        prevTodos.map(item => {
          const result = results.find(res => res.id === item.id);

          if (result?.status === 'fulfilled') {
            return result.value;
          }

          return item;
        }),
      );
    }

    setIsLoadingAll(false);
  }
  // #endregion

  const activeTodosLength = todos.reduce((sum: number, currTodo: Todo) => {
    return currTodo.completed ? sum : sum + 1;
  }, 0);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {todos.length > 0 && (
            <button
              type="button"
              className={classNames('todoapp__toggle-all', {
                active: todos.every(todo => todo.completed),
              })}
              onClick={toggleAll}
              data-cy="ToggleAllButton"
            />
          )}

          <form onSubmit={createTodo}>
            <input
              data-cy="NewTodoField"
              type="text"
              ref={mainInputRef}
              value={title}
              onChange={e => setTilte(e.target.value)}
              disabled={isDisabletField}
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
            />
          </form>
        </header>

        {todos.length > 0 && (
          <>
            <section className="todoapp__main" data-cy="TodoList">
              {(selectedBy === SelectedBy.all ? todos : filteredTodos).map(
                todo => (
                  <div
                    data-cy="Todo"
                    key={todo.id}
                    className={classNames('todo', {
                      completed: todo.completed,
                    })}
                  >
                    <label className="todo__status-label">
                      <input
                        data-cy="TodoStatus"
                        type="checkbox"
                        className="todo__status"
                        checked={tempTodo?.completed || todo.completed}
                        onChange={e =>
                          editCheckbox({ completed: e.target.checked }, todo.id)
                        }
                      />
                    </label>

                    {tempTodo?.id === todo.id && isOpenInput ? (
                      <form onSubmit={e => editTitle(e, todo)}>
                        <input
                          data-cy="TodoTitleField"
                          type="text"
                          name="newTitle"
                          className="todo__title-field"
                          placeholder="Empty todo will be deleted"
                          ref={editInputRef}
                          onBlur={e => handleTitleBlur(e, todo)}
                          onKeyUp={handleKeyUp}
                          defaultValue={todo.title}
                        />
                      </form>
                    ) : (
                      <>
                        <span
                          data-cy="TodoTitle"
                          className="todo__title"
                          onDoubleClick={() => handleDubleClick(todo)}
                        >
                          {todo.title}
                        </span>
                        <button
                          type="button"
                          className="todo__remove"
                          data-cy="TodoDelete"
                          onClick={() => deleteTodo(todo)}
                        >
                          ×
                        </button>
                      </>
                    )}

                    <div
                      data-cy="TodoLoader"
                      className={classNames('modal overlay', {
                        'is-active':
                          (tempTodo?.id === todo.id && isLoadingAll) ||
                          (isLoadingAll && !tempTodo),
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
                  </div>
                ),
              )}

              {tempTodo?.id === 0 && (
                <div
                  data-cy="Todo"
                  key={tempTodo.id}
                  className={classNames('todo', {
                    completed: tempTodo.completed,
                  })}
                >
                  <label className="todo__status-label">
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
                  </button>
                  <div data-cy="TodoLoader" className="modal overlay is-active">
                    <div className="modal-background has-background-white-ter" />
                    <div className="loader" />
                  </div>
                </div>
              )}
            </section>

            <footer className="todoapp__footer" data-cy="Footer">
              <span className="todo-count" data-cy="TodosCounter">
                {activeTodosLength} items left
              </span>

              <nav className="filter" data-cy="Filter">
                {Object.values(SelectedBy).map(value => (
                  <a
                    key={value}
                    href={`#/${value}`}
                    className={classNames('filter__link', {
                      selected: selectedBy === value,
                    })}
                    onClick={() => setSelectedBy(value)}
                    data-cy={`FilterLink${value}`}
                  >
                    {value}
                  </a>
                ))}
              </nav>

              <button
                type="button"
                className="todoapp__clear-completed"
                data-cy="ClearCompletedButton"
                disabled={activeTodosLength === todos.length}
                onClick={clearComplitedTodos}
              >
                Clear completed
              </button>
            </footer>
          </>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          {
            hidden: !errorMessage,
          },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
      </div>
    </div>
  );
};
