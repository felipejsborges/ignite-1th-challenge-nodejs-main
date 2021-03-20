const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers

  const existsUser = users.find(user => user.username === username)
  
  if (!existsUser) return response.status(404).json({ error: 'User not found '})

  request.username = username
  
  return next()
}

function updateTodo({ username, id, body }) {
  const userIndexToUpdateTodo = users.findIndex(user => user.username === username)

  const userToUpdateTodo = users[userIndexToUpdateTodo]

  const todoIndexToUpdate = userToUpdateTodo.todos.findIndex(todo => todo.id === id)

  if (todoIndexToUpdate < 0) return false

  const todoToUpdate = userToUpdateTodo.todos[todoIndexToUpdate]

  const updatedTodo = {
    ...todoToUpdate,
    ...body
  }

  userToUpdateTodo.todoToUpdate = updatedTodo

  return updatedTodo
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const existsUser = users.find(user => user.username === username)

  if (existsUser) return response.status(400).json({ error: 'User already exists'})

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request

  const user = users.find(u => u.username === username)

  const { todos } = user
  
  return response.status(200).json(todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { username } = request

  const indexToInsertTodo = users.findIndex(user => user.username === username)

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  const updatedUserTodos = [
    ...users[indexToInsertTodo].todos,
    newTodo
  ]

  users[indexToInsertTodo].todos = updatedUserTodos

  return response.status(201).json(newTodo)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { params, body, username } = request
  const { id } = params

  const updatedTodo = updateTodo({ username, id, body })

  if (!updatedTodo) return response.status(404).json({ error: 'Todo does not exist'})

  return response.status(200).json(updatedTodo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { params, username } = request
  const { id } = params

  const body = { done: true }

  const updatedTodo = updateTodo({ username, id, body })

  if (!updatedTodo) return response.status(404).json({ error: 'Todo does not exist'})

  return response.status(200).json(updatedTodo)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { params, username } = request
  const { id } = params

  const userIndexToDeleteTodo = users.findIndex(user => user.username === username)

  const todoIndexToDelete = users[userIndexToDeleteTodo].todos.findIndex(todo => todo.id === id)

  if (todoIndexToDelete < 0) return response.status(404).json({ error: 'Todo does not exist'})
  
  users[userIndexToDeleteTodo].todos.splice(todoIndexToDelete, 1)

  return response.status(204).send()
});

module.exports = app;