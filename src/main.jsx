import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { TaskProvider } from './context/TaskContext';
import { FileProvider } from './context/FileContext';
import { ContactProvider } from './context/ContactContext';
import { CompanyProvider } from './context/CompanyContext';
import { CategoryProvider } from './context/CategoryContext';
import { TodoProvider } from './context/TodoContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <TaskProvider>
              <FileProvider>
                <CompanyProvider>
                  <ContactProvider>
                    <CategoryProvider>
                      <TodoProvider>
                        <App />
                      </TodoProvider>
                    </CategoryProvider>
                  </ContactProvider>
                </CompanyProvider>
              </FileProvider>
            </TaskProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
