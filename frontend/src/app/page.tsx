'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

export default function Home() {
  const { user, logout, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    if (user) loadTasks();
  }, [user, search, status]);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks({ search, status });
      setTasks(data.tasks);
    } catch (error) {
      toast.error('Failed to load tasks');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
        toast.success('Task updated');
      } else {
        await api.createTask(formData.title, formData.description);
        toast.success('Task created');
      }
      setFormData({ title: '', description: '' });
      setShowForm(false);
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.toggleTask(id);
      loadTasks();
    } catch (error) {
      toast.error('Failed to toggle task');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this task?')) {
      try {
        await api.deleteTask(id);
        toast.success('Task deleted');
        loadTasks();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({ title: task.title, description: task.description || '' });
    setShowForm(true);
  };

  if (loading) return <div className="container">Loading...</div>;

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Task Management</h1>
        <button onClick={logout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Tasks</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          Add Task
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingTask ? 'Edit Task' : 'New Task'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">
                {editingTask ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                  setFormData({ title: '', description: '' });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p>No tasks found</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <div>
                <h4>{task.title}</h4>
                {task.description && <p>{task.description}</p>}
              </div>
              <div className="task-actions">
                <button
                  onClick={() => handleToggle(task.id)}
                  className="btn btn-sm btn-secondary"
                >
                  {task.completed ? 'Undo' : 'Done'}
                </button>
                <button
                  onClick={() => startEdit(task)}
                  className="btn btn-sm btn-primary"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LoginForm() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      toast.success(isLogin ? 'Logged in' : 'Registered');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginLeft: '4px' }}
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}