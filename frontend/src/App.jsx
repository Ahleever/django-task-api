import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(null)
  const [tasks, setTasks] = useState([])
  
  // NEW: State for the "New Task" input form
  const [newTask, setNewTask] = useState('')

  // 1. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://127.0.0.1:8000/api-token-auth/', {
        username, password
      })
      setToken(response.data.token)
    } catch (error) {
      console.error("Login failed", error)
      alert("Login failed!")
    }
  }

  // 2. FETCH TASKS
  const fetchTasks = () => {
    if (token) {
      axios.get('http://127.0.0.1:8000/api/tasks/', {
        headers: { 'Authorization': `Token ${token}` }
      })
      .then(res => setTasks(res.data))
      .catch(err => console.error(err))
    }
  }

  // Fetch automatically when token changes
  useEffect(() => {
    fetchTasks()
  }, [token])

  // 3. CREATE TASK (New Feature)
  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!newTask) return // Don't submit empty tasks

    try {
      await axios.post('http://127.0.0.1:8000/api/tasks/', 
        { title: newTask }, // Data to send
        { headers: { 'Authorization': `Token ${token}` }} // Auth Header
      )
      setNewTask('') // Clear input
      fetchTasks()   // Refresh the list instantly
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  // 4. DELETE TASK (New Feature)
  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/tasks/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      })
      fetchTasks() // Refresh the list
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  // 5. LOGOUT
  const logout = () => {
    setToken(null)
    setTasks([])
  }

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>✅ Task Manager</h1>

      {!token ? (
        // LOGIN FORM
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="text" placeholder="Username" 
            value={username} onChange={e => setUsername(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" 
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <button type="submit">Log In</button>
        </form>
      ) : (
        // DASHBOARD
        <div>
          <button onClick={logout} style={{ float: 'right', fontSize: '12px' }}>Logout</button>
          
          {/* NEW TASK INPUT */}
          <form onSubmit={handleCreateTask} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="What needs to be done?" 
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              style={{ flexGrow: 1 }}
            />
            <button type="submit">Add</button>
          </form>

          {/* TASK LIST */}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map(task => (
              <li key={task.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '10px', 
                borderBottom: '1px solid #ccc' 
              }}>
                <span>
                  {task.is_complete ? "✅ " : "⬜ "} 
                  {task.title}
                </span>
                
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App