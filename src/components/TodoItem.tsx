import React, { useRef, useState } from 'react'
import { Todo, TodoTitleOrCompleted } from '../types/Todo'

type Props = {
  todo: Todo
  tempTodo?: Todo | null,
  editCheckbox?: (data: TodoTitleOrCompleted, id: number) => void
  setTempTodo?: React.Dispatch<React.SetStateAction<Todo | null>>
  deleteTodo?: (todo: Todo) => void
  onEdit?: (data: TodoTitleOrCompleted, id: number) => void
}
export const TodoItem: React.FC<Props> = ({
  todo,
  tempTodo= null,
  editCheckbox= () => {},
  setTempTodo = () => {},
  deleteTodo= () => {},
  onEdit= () => {},
}) => {
  const [isOpenInput, setIsOpenInput] = useState(false);

  const editInputRef = useRef<HTMLInputElement>(null);

  function handleDubleClick(todo: Todo) {
    setIsOpenInput(true);
    setTempTodo(todo);

    setTimeout(() => {
      editInputRef.current?.focus();
    }, 0);
  }

  function editTitle(e: React.FormEvent<HTMLFormElement>, todo: Todo) {
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

    onEdit({ title: newTitle.trim() }, todo.id);
  }

  function handleTitleBlur(e: React.ChangeEvent<HTMLInputElement>, todo: Todo) {
    const newTitle = e.target.value.trim();

    if (!newTitle) {
      deleteTodo(todo);

      return;
    }

    if (newTitle === todo.title) {
      setIsOpenInput(false);
      setTempTodo(null);
    }

    onEdit({ title: newTitle }, todo.id);
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setIsOpenInput(false);
      setTempTodo(null);
    }
  }

  return (
    <>
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

    </>
  )
}

