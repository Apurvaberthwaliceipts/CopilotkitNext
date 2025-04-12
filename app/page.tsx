"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useEffect, useState } from "react";

// Define Todo interface to match Angular's structure
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// Add todoData to the Window interface
declare global {
  interface Window {
    todoData: Todo[];
    addTodo: (text: string) => string;
    toggleTodo: (id: string) => string;
    deleteTodo: (id: string) => string;
    listTodos: () => string;
  }
}

export default function Home() {
  const COPILOT_CLOUD_PUBLIC_API_KEY = process.env.NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY;
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    // Apply transparent background to body and html
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    
    // Initialize window.todoData
    window.todoData = [];
    
    // Send a ready message to the parent window
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'CHAT_READY' }, '*');
    }

    // Listen for messages from the parent window (Angular app)
    const handleMessage = (event: MessageEvent) => {
      // For development, we'll accept any origin
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case 'TODOS_UPDATE':
            if (event.data.todos) {
              const receivedTodos = event.data.todos;
              setTodos(receivedTodos);
              window.todoData = receivedTodos; // Update global todoData
              console.log('Received todos from Angular:', receivedTodos);
              
              // Update the hidden context div with the latest todos
              updateTodoContext(receivedTodos);
            }
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Initialize the CopilotKit functions on window
    setupFunctionsForCopilotKit();

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  // Function to set up functions for CopilotKit
  const setupFunctionsForCopilotKit = () => {
    // Add Todo function
    window.addTodo = (text: string) => {
      if (!text || typeof text !== 'string') {
        return "Please provide text for the todo item";
      }
      
      console.log("ADD TODO FUNCTION CALLED WITH:", text);
      
      if (window.parent !== window) {
        window.parent.postMessage({ 
          type: 'ADD_TODO', 
          todo: text 
        }, '*');
        return `Added "${text}" to your todo list`;
      }
      return "Failed to communicate with todo application";
    };
    
    // Toggle Todo function
    window.toggleTodo = (id: string) => {
      const numId = Number(id);
      if (isNaN(numId)) {
        return "Please provide a valid todo ID";
      }
      
      console.log("TOGGLE TODO FUNCTION CALLED WITH ID:", numId);
      
      if (window.parent !== window) {
        window.parent.postMessage({ 
          type: 'TOGGLE_TODO', 
          todoId: numId 
        }, '*');
        return `Toggled the completion status of todo #${numId}`;
      }
      return "Failed to communicate with todo application";
    };
    
    // Delete Todo function
    window.deleteTodo = (id: string) => {
      const numId = Number(id);
      if (isNaN(numId)) {
        return "Please provide a valid todo ID";
      }
      
      console.log("DELETE TODO FUNCTION CALLED WITH ID:", numId);
      
      if (window.parent !== window) {
        window.parent.postMessage({ 
          type: 'DELETE_TODO', 
          todoId: numId 
        }, '*');
        return `Deleted todo #${numId} from your list`;
      }
      return "Failed to communicate with todo application";
    };
    
    // List Todos function
    window.listTodos = () => {
      console.log("LIST TODOS FUNCTION CALLED, window.todoData =", window.todoData);
      const currentTodos = window.todoData || [];
      
      if (currentTodos.length === 0) {
        return "You don't have any todos yet. Would you like to add one?";
      }
      
      let result = "Here are your current todos:\n";
      currentTodos.forEach((todo: Todo) => {
        result += `${todo.id}. [${todo.completed ? '✓' : ' '}] ${todo.text}\n`;
      });
      return result;
    };
  };
  
  // Function to update the context div with the latest todos
  const updateTodoContext = (todos: Todo[]) => {
    const todoContextDiv = document.getElementById('todo-list-context');
    if (todoContextDiv) {
      const todosFormatted = todos.map(todo => 
        `${todo.id}. [${todo.completed ? '✓' : ' '}] ${todo.text}`
      ).join('\n');
      
      const content = `
        <h3>Todo List Status:</h3>
        <p>You have ${todos.length} total todos. ${todos.filter(t => t.completed).length} are completed.</p>
        <p>Todo list:</p>
        <pre>${todosFormatted}</pre>
        <p>To manage todos, you can:</p>
        <ul>
          <li>Add a new todo: "Add a todo called [task description]"</li>
          <li>Mark a todo as completed: "Mark todo #[id] as completed"</li>
          <li>Delete a todo: "Delete todo #[id]"</li>
          <li>List all todos: "Show me my todo list"</li>
        </ul>
      `;
      todoContextDiv.innerHTML = content;
    }
  };

  return (
    <div style={{ backgroundColor: 'transparent' }}>
      {/* CopilotKit with properly defined tools */}
      <CopilotKit publicApiKey={COPILOT_CLOUD_PUBLIC_API_KEY}>
        <div style={{ backgroundColor: 'transparent' }}>
          {/* Hidden context for CopilotKit - completely invisible to user */}
          <div id="todo-list-context" style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            padding: '10px',
            fontSize: '14px',
            maxHeight: '200px',
            overflow: 'hidden',
            opacity: 0,  // Make fully invisible
            pointerEvents: 'none',  // Prevent interaction
            zIndex: -1  // Put it behind everything
          }}>
            <h3>Todo List Status:</h3>
            <p>You have {todos.length} total todos. {todos.filter(t => t.completed).length} are completed.</p>
            <p>Todo list:</p>
            <pre>{todos.map(todo => 
              `${todo.id}. [${todo.completed ? '✓' : ' '}] ${todo.text}`
            ).join('\n')}</pre>
            <p>To manage todos, you can:</p>
            <ul>
              <li>Add a new todo: "Add a todo called [task description]"</li>
              <li>Mark a todo as completed: "Mark todo #[id] as completed"</li>
              <li>Delete a todo: "Delete todo #[id]"</li>
              <li>List all todos: "Show me my todo list"</li>
            </ul>
          </div>
          
          {/* Instructions for CopilotKit */}
          <div style={{ display: 'none' }}>
            <div id="todo-instructions">
              <p>You are a helpful assistant that can manage a todo list. Available functions:</p>
              <ul>
                <li>addTodo(text) - Add a new todo item</li>
                <li>toggleTodo(id) - Toggle completion status of a todo</li>
                <li>deleteTodo(id) - Delete a todo</li>
                <li>listTodos() - List all todos</li>
              </ul>
              <p>Example usage:</p>
              <ul>
                <li>When user says "Add a task to buy milk", call addTodo("buy milk")</li>
                <li>When user says "Mark task 2 as done", call toggleTodo("2")</li>
                <li>When user says "Remove task 3", call deleteTodo("3")</li>
                <li>When user says "Show my todos", call listTodos()</li>
              </ul>
            </div>
          </div>
          
          <CopilotPopup />
          
          {/* Define functions for CopilotKit */}
          <script dangerouslySetInnerHTML={{ __html: `
            window.addTodo = function(text) {
              if (!text || typeof text !== 'string') {
                return "Please provide text for the todo item";
              }
              
              console.log("ADD TODO FUNCTION CALLED WITH:", text);
              
              if (window.parent !== window) {
                window.parent.postMessage({ 
                  type: 'ADD_TODO', 
                  todo: text 
                }, '*');
                return "I've added '" + text + "' to your todo list!";
              }
              return "Failed to communicate with todo application";
            };
            
            window.toggleTodo = function(id) {
              const numId = Number(id);
              if (isNaN(numId)) {
                return "Please provide a valid todo ID";
              }
              
              console.log("TOGGLE TODO FUNCTION CALLED WITH ID:", numId);
              
              if (window.parent !== window) {
                window.parent.postMessage({ 
                  type: 'TOGGLE_TODO', 
                  todoId: numId 
                }, '*');
                return "I've toggled the completion status of todo #" + numId;
              }
              return "Failed to communicate with todo application";
            };
            
            window.deleteTodo = function(id) {
              const numId = Number(id);
              if (isNaN(numId)) {
                return "Please provide a valid todo ID";
              }
              
              console.log("DELETE TODO FUNCTION CALLED WITH ID:", numId);
              
              if (window.parent !== window) {
                window.parent.postMessage({ 
                  type: 'DELETE_TODO', 
                  todoId: numId 
                }, '*');
                return "I've deleted todo #" + numId + " from your list";
              }
              return "Failed to communicate with todo application";
            };
            
            window.listTodos = function() {
              console.log("LIST TODOS FUNCTION CALLED");
              const todos = window.todoData || [];
              if (todos.length === 0) return "You don't have any todos yet. Would you like to add one?";
              
              let result = "Here are your current todos:\\n";
              todos.forEach(todo => {
                result += \`\${todo.id}. [\${todo.completed ? '✓' : ' '}] \${todo.text}\\n\`;
              });
              return result;
            };
          `}} />
        </div>
      </CopilotKit>
    </div>
  );
}
