import classNames from 'classnames'
import React, { useEffect,useState } from 'react'
import { Todo } from '../types/Todo'
import * as todosServise from '../api/todos'

type Props = {
  todos: Todo[],
  setErrorMessage: (message: string) => void,
  setIsLoading: (isLoading: boolean) => void,
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>
  setTempTodo: React.Dispatch<React.SetStateAction<Todo | null>>
  mainInputRef: React.RefObject<HTMLInputElement>
}
const Header: React.FC<Props> = ({
  todos,
  setErrorMessage,
  setIsLoading,
  setTodos,
  setTempTodo,
  mainInputRef
}) => {
  const [isDisabletField, setIsDisabletField] = useState(false);
  const [title, setTitle] = useState('');


  useEffect(() => {
    mainInputRef.current?.focus();
  }, []);

    // #region create and delete todo
  function createTodo(e: React.FormEvent<HTMLFormElement>) {
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
        setTitle('');
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
    // #endregion

    // #region toggle all
    async function toggleAll() {
      setIsLoading(true);

      const activeTodos = todos.filter(todo => !todo.completed);
      const todosToToggle = todos.some(todo => !todo.completed)
        ? activeTodos
        : todos;

      const allToggled = todosToToggle.map(todo => {
        return todosServise.editTodo({ completed: !todo.completed }, todo.id)
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

      setIsLoading(false);
    }
    // #endregion
  return (
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
              onChange={e => setTitle(e.target.value)}
              disabled={isDisabletField}
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
            />
          </form>
        </header>
  )
}

export default Header
