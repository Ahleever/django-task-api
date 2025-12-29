import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [newUserName, setNewUserName] = useState('')
  const [newUserPass, setNewUserPass] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [showPassword, setShowPassword] = useState(false) 
  const boardRef = useRef(null)

  // --- SCROLL LOGIC ---
  const scrollBoard = (direction) => {
    if (boardRef.current) {
      const container = boardRef.current;
      const scrollAmount = 350; 
      if (direction === 'left') {
          container.scrollLeft -= scrollAmount;
      } else {
          container.scrollLeft += scrollAmount;
      }
    }
  }

  // 1. HELPER: Group Tasks
  const getGroupedTasks = () => {
    const myTasks = []
    const teamGroups = {}
    const normalizedCurrentUser = currentUser ? currentUser.toLowerCase() : ""

    // Pre-fill columns for my team members
    allUsers.forEach(user => {
        if (user.manager === currentUser) {
            teamGroups[user.username] = [] 
        }
    })

    tasks.forEach(task => {
      const taskUser = task.username || 'Unknown'
      if (taskUser.toLowerCase() === normalizedCurrentUser) {
        myTasks.push(task)
      } else {
        if (!teamGroups[taskUser]) {
          teamGroups[taskUser] = []
        }
        teamGroups[taskUser].push(task)
      }
    })
    return { myTasks, teamGroups }
  }

  // 2. AUTH LOGIC
  const handleLogin = async (e, userOverride = null, passOverride = null) => {
    if (e) e.preventDefault()
    const userToUse = userOverride || username
    const passToUse = passOverride || password

    try {
      const response = await axios.post('http://127.0.0.1:8000/api-token-auth/', {
        username: userToUse,
        password: passToUse
      })
      
      setToken(response.data.token)
      setCurrentUser(userToUse)
      setIsAdmin(response.data.is_staff)
      
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('currentUser', userToUse)
      localStorage.setItem('isAdmin', response.data.is_staff)

    } catch (error) {
      console.error("Login failed", error)
      alert("Login failed! Check credentials.")
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', { username, password })
      alert("Registration successful! Logging you in...")
      handleLogin(null, username, password)
    } catch (error) {
      console.error("Registration failed", error)
      alert("Registration failed!")
    }
  }

  const handleGuestLogin = () => {
    handleLogin(null, 'Demo', 'Password123')
  }

  const logout = () => {
    setToken(null); setCurrentUser(null); setTasks([]); setIsAdmin(false); setShowAdminPanel(false);
    localStorage.removeItem('token'); localStorage.removeItem('currentUser'); localStorage.removeItem('isAdmin');
  }

  // 3. API & INIT
  const fetchTasks = () => {
    if (token) {
      axios.get('http://127.0.0.1:8000/api/tasks/', {
        headers: { 'Authorization': `Token ${token}` }
      })
      .then(res => setTasks(res.data))
      .catch(err => console.error(err))
    }
  }

  const fetchAllUsers = () => {
    axios.get('http://127.0.0.1:8000/api/users/', {
      headers: { 'Authorization': `Token ${token}` }
    })
    .then(res => setAllUsers(res.data))
    .catch(err => console.error("Not authorized to see users"))
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('currentUser')
    const savedAdmin = localStorage.getItem('isAdmin')
    if (savedToken) setToken(savedToken)
    if (savedUser) setCurrentUser(savedUser)
    if (savedAdmin === 'true') setIsAdmin(true)
  }, [])

  useEffect(() => { fetchTasks() }, [token])
  useEffect(() => { if (isAdmin) fetchAllUsers() }, [isAdmin, showAdminPanel])

  // 4. ADMIN ACTIONS
  const handleAdminCreateUser = async (e) => {
    e.preventDefault()
    try {
        await axios.post('http://127.0.0.1:8000/api/users/', 
            { username: newUserName, password: newUserPass },
            { headers: { 'Authorization': `Token ${token}` }}
        )
        alert("User created!")
        setNewUserName(''); setNewUserPass('')
        fetchAllUsers() 
    } catch (error) { alert("Failed to create user") }
  }

  const handleAssignManager = async (member, manager) => {
      try {
          await axios.post('http://127.0.0.1:8000/api/users/assign_manager/', 
            { member, manager },
            { headers: { 'Authorization': `Token ${token}` }}
          )
          fetchAllUsers() 
      } catch (error) { console.error(error) }
  }

  const handleRoleChange = async (userId, newRole) => {
      const isManager = newRole === 'Manager';
      try {
          await axios.patch(`http://127.0.0.1:8000/api/users/${userId}/`, 
            { is_staff: isManager },
            { headers: { 'Authorization': `Token ${token}` }}
          )
          fetchAllUsers() 
      } catch (error) { alert("Failed to update role.") }
  }

  // 5. TASK CRUD
  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!newTask) return
    try {
      await axios.post('http://127.0.0.1:8000/api/tasks/', 
        { title: newTask }, 
        { headers: { 'Authorization': `Token ${token}` }}
      )
      setNewTask('')
      fetchTasks()
    } catch (error) { console.error("Error creating task:", error) }
  }

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/tasks/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      })
      fetchTasks()
    } catch (error) { console.error("Error deleting task:", error) }
  }

  const handleToggleTask = async (id, currentStatus) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/tasks/${id}/`, 
        { is_complete: !currentStatus }, 
        { headers: { 'Authorization': `Token ${token}` }}
      )
      fetchTasks()
    } catch (error) { console.error("Error toggling task:", error) }
  }

  const handleMoveTask = async (id, newOwner) => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/tasks/${id}/`, 
        { assign_to: newOwner }, 
        { headers: { 'Authorization': `Token ${token}` }}
      )
      fetchTasks() 
    } catch (error) { alert("Failed to move task.") }
  }

  const startEditing = (task) => {
    setEditingTaskId(task.id); setEditingText(task.title);
  }

  const saveEdit = async () => {
    try {
      await axios.patch(`http://127.0.0.1:8000/api/tasks/${editingTaskId}/`, 
        { title: editingText }, 
        { headers: { 'Authorization': `Token ${token}` }}
      )
      setEditingTaskId(null); fetchTasks();
    } catch (error) { console.error("Error updating task:", error) }
  }

  // --- Task List ---
  const TaskList = ({ taskList }) => {
    const usersForDropdown = [currentUser, ...Object.keys(teamGroups)].filter(Boolean)
    return (
      <ul style={{marginTop: '10px'}}>
        {taskList.map(task => (
          <li key={task.id} className="task-item" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '5px'}}>   
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                {editingTaskId === task.id ? (
                    <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                        <input type="text" value={editingText} onChange={e => setEditingText(e.target.value)} autoFocus style={{padding: '5px', width: '100%'}}/>
                        <button onClick={saveEdit} style={{ background: 'var(--accent)', color: 'black', padding: '0 5px' }}>💾</button>
                    </div>
                ) : (
                    <span 
                        className="task-title" 
                        onClick={() => handleToggleTask(task.id, task.is_complete)}
                        style={{ cursor: 'pointer', textDecoration: task.is_complete ? 'line-through' : 'none', flexGrow: 1 }}
                    >
                        {task.is_complete ? "✅ " : "⬜ "} 
                        {task.title}
                    </span>
                )}
                
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => startEditing(task)} style={{ background: 'transparent', padding: '0' }} title="Edit">✏️</button>
                    <button onClick={() => handleDeleteTask(task.id)} className="btn-delete" title="Delete">✕</button>
                </div>
            </div>

            <div style={{width: '100%', display: 'flex', justifyContent: 'flex-end'}}>
                <select 
                    style={{ background: '#333', color: '#aaa', border: '1px solid #444', fontSize: '0.75rem', padding: '2px', borderRadius: '4px', cursor: 'pointer' }}
                    onChange={(e) => handleMoveTask(task.id, e.target.value)}
                    value="" 
                >
                    <option value="" disabled id="move-to-option">➥ Move to...</option>
                    {usersForDropdown.map(user => (
                        user !== task.username && (<option key={user} value={user}>{user}</option>)
                    ))}
                </select>
            </div>
          </li>
        ))}
      </ul>
    )
  }

// --- RENDER ---
  const { myTasks, teamGroups } = getGroupedTasks()

  return (
    <div className="container">
      {!token ? (
        // --- LOGIN SCREEN  ---
        <div className="login-wrapper">
            <div className="card">
            <h1>{isLoginMode ? "🔐 Login" : "📝 Sign Up"}</h1>
            <form onSubmit={isLoginMode ? (e) => handleLogin(e) : handleRegister} className="form-group">
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="submit" className="btn-primary">{isLoginMode ? "Enter Portfolio" : "Create Account"}</button>
            </form>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={handleGuestLogin} style={{ background: '#333', color: 'white', border: '1px solid #555' }}>👤 Try Guest Demo</button>
                <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                <span onClick={() => setIsLoginMode(!isLoginMode)} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                    {isLoginMode ? "Need an account? Register here" : "Have an account? Login here"}
                </span>
                </p>
            </div>
            </div>
        </div>
      ) : (
        // --- DASHBOARD ---
        <div>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                    <h1>🚀 Project Board: <span style={{color:'var(--accent)'}}>{currentUser}</span></h1>
                    {isAdmin && (
                        <button 
                            onClick={() => setShowAdminPanel(!showAdminPanel)}
                            style={{background: showAdminPanel ? 'var(--accent)' : '#444', color: showAdminPanel ? 'black' : 'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}}
                        >
                            ⚙️ Admin
                        </button>
                    )}
                </div>
                <button onClick={logout} className="btn-logout">Logout</button>
            </div>

            {/* ADMIN PANEL */}
            {showAdminPanel && (
              <div className="card" style={{marginBottom: '30px', border: '1px solid var(--accent)', maxWidth: '100%'}}>
                  <h2>⚙️ Admin Control Center</h2>
                  <div style={{display:'flex', gap:'40px', flexWrap:'wrap'}}>
                    <div style={{flex: 1, maxWidth:'200px'}}>
                        <h3>Add New User</h3>
                        <form onSubmit={handleAdminCreateUser} className="form-group">
                            <input type="text" placeholder="Username" value={newUserName} onChange={e=>setNewUserName(e.target.value)} />
                            <div className="input-group" style={{position: 'relative', marginBottom: '15px'}}>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password" 
                                    value={newUserPass} 
                                    onChange={e=>setNewUserPass(e.target.value)}
                                    style={{paddingRight: '40px'}} 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '5px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#888',
                                        cursor: 'pointer',
                                        padding: '5px',
                                        fontSize: '1.2rem'
                                    }}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                            <button type="submit" className="btn-add">Create User</button>
                          </form>
                    </div>
                    <div style={{flex: 1, minWidth:'300px'}}>
                        <h3>Team Assignments</h3>
                        <table style={{width:'100%', borderCollapse:'collapse'}}>
                            <thead>
                                <tr style={{textAlign:'left', borderBottom:'1px solid #555'}}>
                                    <th style={{padding:'5px'}}>Employee</th>
                                    <th style={{padding:'5px'}}>Role</th>
                                    <th style={{padding:'5px'}}>Current Manager</th>
                                    <th style={{padding:'5px'}}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(u => (
                                    <tr key={u.id} style={{borderBottom:'1px solid #333'}}>
                                        <td style={{padding:'8px'}}>👤 {u.username}</td>
                                        <td style={{padding:'8px'}}>
                                            <select 
                                                style={{
                                                    background: u.is_staff ? 'var(--accent)' : '#333', 
                                                    color: u.is_staff ? 'black' : 'white',
                                                    border: 'none', padding:'4px', borderRadius:'4px', fontWeight:'bold'
                                                }}
                                                value={u.is_staff ? 'Manager' : 'Employee'}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            >
                                                <option value="Employee">Employee</option>
                                                <option value="Manager">Manager</option>
                                            </select>
                                        </td>
                                        <td style={{padding:'8px', color: u.manager ? 'var(--accent)' : '#666'}}>
                                            {u.manager || "Unassigned"}
                                        </td>
                                        <td style={{padding:'8px'}}>
                                            <select 
                                                style={{background:'#222', color:'white', border:'1px solid #555', padding:'4px'}}
                                                onChange={(e) => handleAssignManager(u.username, e.target.value)}
                                                value=""
                                            >
                                                <option value="" disabled>Assign Manager...</option>
                                                {allUsers.map(m => (
                                                    m.username !== u.username && m.is_staff && (
                                                        <option key={m.id} value={m.username}>{m.username}</option>
                                                    )
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </div>
              </div>
            )}

            {/* --- DASHBOARD GRID LAYOUT --- */}
            <div className="dashboard-layout">
                
                {/* LEFT BOX: MANAGER */}
                <div className="manager-section">
                    <h2 style={{marginTop:0, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span>⚡ My Tasks</span>
                        <span style={{fontSize: '0.9rem', background: 'var(--accent)', color:'black', padding: '2px 8px', borderRadius: '10px'}}>
                            {myTasks.length}
                        </span>
                    </h2>
                    <form onSubmit={handleCreateTask} className="input-group" style={{ marginBottom: '15px' }}>
                        <input type="text" placeholder="New task..." value={newTask} onChange={e => setNewTask(e.target.value)} />
                        <button type="submit" className="btn-add">+</button>
                    </form>
                    <TaskList taskList={myTasks} />
                </div>

                {/* RIGHT BOX: TEAM CAROUSEL */}
                <div className="team-section-wrapper">
                    
                    {/* Left Arrow */}
                    {Object.keys(teamGroups).length > 0 && (
                        <button className="scroll-btn scroll-left" onClick={() => scrollBoard('left')}>◀</button>
                    )}

                    {/* SCROLL CONTAINER (Ref here) */}
                    <div className="team-scroll-container" ref={boardRef}>
                        {Object.keys(teamGroups).length === 0 ? (
                            <div style={{ padding: '20px', opacity: 0.5 }}>No active team members found.</div>
                        ) : (
                            Object.keys(teamGroups).map(user => (
                                <div key={user} className="team-card">
                                    <h3>
                                        <span>👤 {user}</span>
                                        <span style={{fontSize: '0.8rem', opacity: 0.7, background:'#333', padding:'2px 6px', borderRadius:'4px'}}>
                                            {teamGroups[user].length}
                                        </span>
                                    </h3>
                                    <TaskList taskList={teamGroups[user]} />
                                </div>
                            ))
                        )}
                    </div>

                    {/* Right Arrow */}
                    {Object.keys(teamGroups).length > 0 && (
                        <button className="scroll-btn scroll-right" onClick={() => scrollBoard('right')}>▶</button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

export default App