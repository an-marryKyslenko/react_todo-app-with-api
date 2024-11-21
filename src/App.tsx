/* eslint-disable max-len */
/* eslint-disable jsx-a11y/label-has-associated-control */

import React, {
  useState,
  useRef,
  useEffect,
} from 'react';
import * as todosServise from './api/todos';
import { UserWarning } from './UserWarning';
import { Todo, TodoTitleOrCompleted } from './types/Todo';
import { SelectedBy } from './types/SelectedBy';
import Header from './components/Header';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import ErrorNotification from './components/ErrorNotification';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedBy, setSelectedBy] = useState<SelectedBy>(SelectedBy.all);
  const [errorMessage, setErrorMessage] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mainInputRef = useRef<HTMLInputElement>(null);


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
  }, []);

  if (!todosServise.USER_ID) {
    return <UserWarning />;
  }
  // #endregion

  // #region edit Todo
  function editTodo(data: TodoTitleOrCompleted, todoId: number) {
    setIsLoading(true);

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
        setIsLoading(false);
      });
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
    setIsLoading(true);

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
    setIsLoading(false);
  }
  // #endregion

  // #region delete Todo
  function deleteTodo(deletedTodo: Todo) {
    setTempTodo(deletedTodo);
    setIsLoading(true);

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
        setIsLoading(false);

        mainInputRef.current?.focus();
      });
  }
  // #endregion

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          mainInputRef={mainInputRef}
          todos={todos}
          setIsLoading={setIsLoading}
          setTodos={setTodos}
          setTempTodo={setTempTodo}
          setErrorMessage={setErrorMessage}
        />

        {todos.length > 0 && (
          <>
            <TodoList
              todos={todos}
              selectedBy={selectedBy}
              isLoading={isLoading}
              tempTodo={tempTodo}
              setTempTodo={setTempTodo}
              onDelete={deleteTodo}
              onEdit={editTodo}
            />

            <Footer
              selectedBy={selectedBy}
              setSelectedBy={setSelectedBy}
              onClear={clearComplitedTodos}
              todos={todos}
            />
          </>
        )}
      </div>

      <ErrorNotification
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
};
