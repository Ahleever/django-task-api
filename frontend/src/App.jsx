import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './App.css'
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// --- 1. DND WRAPPERS ---

const DraggableTask = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });
  
  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: 1000,
    cursor: 'grab',
    touchAction: 'none', 
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

const DroppableArea = ({ id, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id || 'unassigned', 
  });

  const style = {
    backgroundColor: isOver ? 'rgba(0, 214, 125, 0.1)' : undefined, 
    border: isOver ? '2px dashed var(--accent)' : '2px solid transparent',
    borderRadius: '8px',
    transition: 'all 0.2s',
    minHeight: '100px', 
    padding: '10px'
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children}
    </div>
  );
};

// --- 2. SUB-COMPONENTS ---

const EmployeeSidebar = ({ tasks }) => {
    // Calculate Stats
    const totalTasks = tasks.length;
    const highPriority = tasks.filter(t => t.priority === 'High').length;
    
    // Calculate Upcoming Deadlines
    const dueSoon = tasks
      .filter(t => t.due_date) // Check for due_date
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date)) // Sort ascending
      .slice(0, 3); // Take top 3
  
    return (
      <div className="manager-section" style={{ height: '100%', minHeight: '300px' }}>
        <h2 style={{ marginTop: 0 }}>📊 Performance</h2>
        
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: '#333', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{totalTasks}</div>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Active Tasks</div>
          </div>
          <div style={{ background: '#333', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{highPriority}</div>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>High Priority</div>
          </div>
        </div>
  
        {/* Upcoming Deadlines */}
        <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>📅 Upcoming Deadlines</h3>
        {dueSoon.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dueSoon.map(task => (
              <div key={task.id} style={{ background: '#222', padding: '10px', borderRadius: '6px', borderLeft: '3px solid var(--accent)' }}>
                <div style={{ fontWeight: 'bold' }}>{task.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>Due: {task.due_date}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No upcoming deadlines set.</p>
        )}
        
        <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(100, 108, 255, 0.1)', borderRadius: '8px', border: '1px dashed var(--accent)' }}>
          <h4 style={{ margin: '0 0 5px 0', color: 'var(--accent)' }}>💡 Dev Note</h4>
          <p style={{ fontSize: '0.85rem', margin: 0, color: '#ccc' }}>
            This view is personalized for individual contributors. Managers see the team overview carousel here.
          </p>
        </div>
      </div>
    );
};

const TaskList = ({ taskList, ownerName, actions }) => { 
    const { startEditing, handleDeleteTask, handleToggleTask, openModal, saveEdit, editingTaskId, editingText, setEditingText } = actions;

    const getPriorityColor = (p) => {
        if (p === 'High') return '#ff4d4d';   
        if (p === 'Medium') return '#ffa500'; 
        return '#00d67d';                     
    }

    return (
      <DroppableArea id={ownerName} className="task-list-drop-zone">
        <ul style={{marginTop: 0, padding: 0, listStyle: 'none'}}>
            {taskList.map(task => (
            <DraggableTask key={task.id} id={task.id}>
                <li className="task-item" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '8px', position:'relative', marginBottom:'10px'}}>   
                    
                    {/* ROW 1: TITLE & ACTIONS */}
                    <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                        {editingTaskId === task.id ? (
                            <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                                <input type="text" value={editingText} onChange={e => setEditingText(e.target.value)} autoFocus style={{padding: '5px', width: '100%'}}/>
                                <button onClick={saveEdit} onPointerDown={(e) => e.stopPropagation()} style={{ background: 'var(--accent)', color: 'black', padding: '0 5px' }}>💾</button>
                            </div>
                        ) : (
                            <span 
                                className="task-title" 
                                onClick={() => handleToggleTask(task.id, task.is_complete)}
                                style={{ cursor: 'pointer', textDecoration: task.is_complete ? 'line-through' : 'none', flexGrow: 1, fontWeight:'500' }}
                            >
                                {task.is_complete ? "✅ " : "⬜ "} 
                                {task.title}
                            </span>
                        )}
                        
                        <div style={{ display: 'flex', gap: '5px' }} onPointerDown={(e) => e.stopPropagation()}>
                            <button onClick={() => startEditing(task)} style={{ background: 'transparent', padding: '0', opacity:0.7 }} title="Quick Rename">✏️</button>
                            <button onClick={() => handleDeleteTask(task.id)} className="btn-delete" title="Delete">✕</button>
                        </div>
                    </div>

                    {/* ROW 2: BADGES & MODAL */}
                    <div style={{display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center', fontSize:'0.8rem'}}>
                        <div style={{display:'flex', gap:'5px'}}>
                            <span style={{
                                color: getPriorityColor(task.priority), 
                                border: `1px solid ${getPriorityColor(task.priority)}`,
                                padding: '1px 6px', borderRadius:'4px', fontSize:'0.7rem'
                            }}>
                                {task.priority}
                            </span>
                            {task.due_date && (
                                <span style={{color: '#aaa', border:'1px solid #444', padding:'1px 6px', borderRadius:'4px', fontSize:'0.7rem'}}>
                                    📅 {task.due_date}
                                </span>
                            )}
                        </div>

                        <button 
                            onClick={() => openModal(task)}
                            onPointerDown={(e) => e.stopPropagation()} 
                            style={{background:'transparent', border:'none', color:'var(--accent)', cursor:'pointer', padding:'2px', textDecoration:'underline'}}
                        >
                            View Details ↗
                        </button>
                    </div>
                </li>
            </DraggableTask>
            ))}
            {taskList.length === 0 && <div style={{opacity:0.5, fontSize:'0.8rem', textAlign:'center', padding:'10px'}}>Drop tasks here</div>}
        </ul>
      </DroppableArea>
    )
}

const TaskModal = ({ selectedTask, draftDesc, setDraftDesc, draftPriority, setDraftPriority, draftDate, setDraftDate, saveModalDetails, closeModal }) => {
    if (!selectedTask) return null; 
    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #333', paddingBottom:'15px'}}>
                    <h2 style={{margin:0, color:'var(--accent)'}}>📝 Task Details</h2>
                    <button onClick={closeModal} style={{background:'transparent', fontSize:'1.5rem', color:'#666', padding:0}}>×</button>
                </div>

                <h3 style={{margin:'10px 0'}}>{selectedTask.title}</h3>

                <div>
                    <label className="modal-label">Description</label>
                    <textarea 
                        className="modal-input"
                        rows="5"
                        placeholder="What needs to be done?"
                        value={draftDesc}
                        onChange={e => setDraftDesc(e.target.value)}
                        style={{resize:'vertical'}}
                    />
                </div>

                <div style={{display:'flex', gap:'20px'}}>
                    <div style={{flex:1}}>
                        <label className="modal-label">Priority</label>
                        <select 
                            className="modal-input"
                            value={draftPriority} 
                            onChange={e => setDraftPriority(e.target.value)}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">🔥 High</option>
                        </select>
                    </div>
                    <div style={{flex:1}}>
                        <label className="modal-label">Due Date</label>
                        <input 
                            type="date" 
                            className="modal-input"
                            value={draftDate} 
                            onChange={e => setDraftDate(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                    <button onClick={saveModalDetails} className="btn-primary" style={{flex:1}}>Save Changes</button>
                    <button onClick={closeModal} style={{background:'#333', color:'white', border:'1px solid #555'}}>Cancel</button>
                </div>
            </div>
        </div>
    )
}

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- 3. MAIN APP COMPONENT ---
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
  const [draftDesc, setDraftDesc] = useState('')
  const [draftDate, setDraftDate] = useState('')
  const [draftPriority, setDraftPriority] = useState('Medium')
  const [selectedTask, setSelectedTask] = useState(null)
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
      const response = await axios.post('${API_URL}/api-token-auth/', {
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
      await axios.post('${API_URL}/api/register/', { username, password })
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
      axios.get('${API_URL}/api/tasks/', {
        headers: { 'Authorization': `Token ${token}` }
      })
      .then(res => setTasks(res.data))
      .catch(err => console.error(err))
    }
  }

  const fetchAllUsers = () => {
    axios.get('${API_URL}/api/users/', {
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
        await axios.post('${API_URL}/api/users/', 
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
          await axios.post('${API_URL}/api/users/assign_manager/', 
            { member, manager },
            { headers: { 'Authorization': `Token ${token}` }}
          )
          fetchAllUsers() 
      } catch (error) { console.error(error) }
  }

  const handleRoleChange = async (userId, newRole) => {
      const isManager = newRole === 'Manager';
      try {
          await axios.patch(`${API_URL}/api/users/${userId}/`, 
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
      await axios.post('${API_URL}/api/tasks/', 
        { title: newTask }, 
        { headers: { 'Authorization': `Token ${token}` }}
      )
      setNewTask('')
      fetchTasks()
    } catch (error) { console.error("Error creating task:", error) }
  }

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      })
      fetchTasks()
    } catch (error) { console.error("Error deleting task:", error) }
  }

  const handleToggleTask = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/api/tasks/${id}/`, 
        { is_complete: !currentStatus }, 
        { headers: { 'Authorization': `Token ${token}` }}
      )
      fetchTasks()
    } catch (error) { console.error("Error toggling task:", error) }
  }

  const handleMoveTask = async (id, newOwner) => {
    try {
      await axios.patch(`${API_URL}/api/tasks/${id}/`, 
        { assign_to: newOwner }, 
        { headers: { 'Authorization': `Token ${token}` }}
      )
      fetchTasks() 
    } catch (error) { alert("Failed to move task.") }
  }

  // --- DnD HANDLER ---
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id;
    const newOwner = over.id; 
    const task = tasks.find(t => t.id === taskId);
    if (task && task.username === newOwner) return;
    handleMoveTask(taskId, newOwner);
  }

  const openModal = (task) => {
      setSelectedTask(task)
      setDraftDesc(task.description || '')
      setDraftDate(task.due_date || '')
      setDraftPriority(task.priority || 'Medium')
  }

  const closeModal = () => {
      setSelectedTask(null)
  }

  const saveModalDetails = async () => {
      if (!selectedTask) return;
      try {
          await axios.patch(`${API_URL}/api/tasks/${selectedTask.id}/`, 
            { 
                description: draftDesc, 
                due_date: draftDate || null, 
                priority: draftPriority 
            },
            { headers: { 'Authorization': `Token ${token}` }}
          )
          fetchTasks()
          closeModal() 
      } catch (error) { 
          console.error("Failed to save details", error)
      }
  }

  const startEditing = (task) => {
    setEditingTaskId(task.id); setEditingText(task.title);
  }

  const saveEdit = async () => {
    try {
      await axios.patch(`${API_URL}/api/tasks/${editingTaskId}/`, 
        { title: editingText }, 
        { headers: { 'Authorization': `Token ${token}` }}
      )
      setEditingTaskId(null); fetchTasks();
    } catch (error) { console.error("Error updating task:", error) }
  }

  // Bundle actions to pass to TaskList easily
  const taskActions = {
      startEditing, handleDeleteTask, handleToggleTask, openModal, saveEdit, 
      editingTaskId, editingText, setEditingText
  }

  // --- RENDER ---
  const { myTasks, teamGroups } = getGroupedTasks()
  const isEmployee = !isAdmin;  

  return (
    <div className="container">
      {!token ? (
        // --- LOGIN SCREEN ---
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
        // --- DASHBOARD  ---
        <div className={isEmployee ? "centered-view" : "admin-view"}>
          <DndContext onDragEnd={handleDragEnd}>
            <div style={{ width: '100%' }}> 
              
              {/* HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <h1>🚀 Project Board: <span style={{ color: 'var(--accent)' }}>{currentUser}</span></h1>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAdminPanel(!showAdminPanel)}
                      style={{ background: showAdminPanel ? 'var(--accent)' : '#444', color: showAdminPanel ? 'black' : 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ⚙️ Admin
                    </button>
                  )}
                </div>
                <button onClick={logout} className="btn-logout">Logout</button>
              </div>

              {/* ADMIN PANEL */}
              {showAdminPanel && (
                <div className="card" style={{ marginBottom: '30px', border: '1px solid var(--accent)', maxWidth: '100%' }}>
                  <h2>⚙️ Admin Control Center</h2>
                  <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                    
                    <div style={{ flex: 1, maxWidth: '200px' }}>
                      <h3>Add New User</h3>
                      <form onSubmit={handleAdminCreateUser} className="form-group">
                          <input type="text" placeholder="Username" value={newUserName} onChange={e=>setNewUserName(e.target.value)} />
                          <div style={{position: 'relative'}}>
                             <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                value={newUserPass} 
                                onChange={e=>setNewUserPass(e.target.value)} 
                             />
                             <button type="button" onClick={() => setShowPassword(!showPassword)} style={{position:'absolute', right:'5px', top:'25%', background:'transparent', border:'none', cursor:'pointer'}}>
                                {showPassword ? "🙈" : "👁️"}
                             </button>
                          </div>
                          <button type="submit" className="btn-add">Create User</button>
                      </form>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <h3>Team Assignments</h3>
                      <table style={{width:'100%', borderCollapse:'collapse'}}>
                           <tbody>
                              {allUsers.map(u => (
                                <tr key={u.id}>
                                   <td>{u.username}</td>
                                   <td>
                                     <select value={u.is_staff ? 'Manager' : 'Employee'} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                                       <option value="Employee">Employee</option>
                                       <option value="Manager">Manager</option>
                                     </select>
                                   </td>
                                   <td>
                                     <select 
                                        onChange={(e) => handleAssignManager(u.username, e.target.value)} 
                                        value=""
                                        style={{maxWidth: '150px'}}
                                     >
                                        <option value="" disabled>Assign Manager...</option>
                                        {allUsers.map(m => m.is_staff && m.username !== u.username && (
                                            <option key={m.id} value={m.username}>{m.username}</option>
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
              <div className="dashboard-layout" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px', 
                alignItems: 'start' 
              }}>
                {/* LEFT BOX: MANAGER / MY TASKS */}
                <div className="manager-section">
                  <h2 style={{ marginTop: 0 }}>⚡ My Tasks</h2>
                  <form onSubmit={handleCreateTask} className="input-group" style={{ marginBottom: '15px' }}>
                    <input type="text" placeholder="New task..." value={newTask} onChange={e => setNewTask(e.target.value)} />
                    <button type="submit" className="btn-add">+</button>
                  </form>
                  <TaskList taskList={myTasks} ownerName={currentUser || 'unassigned'} actions={taskActions} />
                </div>

                {/* RIGHT BOX: VARIES BY ROLE */}
                <div className="team-section-wrapper" style={{ width: '100%', overflow: 'hidden' }}>
                  {isAdmin ? (
                      // --- ADMIN: SHOW TEAM CAROUSEL ---
                      <>
                        <button className="scroll-btn scroll-left" onClick={() => scrollBoard('left')}>◀</button>
                        <div className="team-scroll-container" ref={boardRef}>
                            {Object.keys(teamGroups).map(user => (
                            <div key={user} className="team-card">
                                <h3>
                                <span>👤 {user}</span>
                                <span style={{ fontSize: '0.8rem', opacity: 0.7, background: '#333', padding: '2px 6px', borderRadius: '4px' }}>
                                    {teamGroups[user].length}
                                </span>
                                </h3>
                                <TaskList taskList={teamGroups[user]} ownerName={user} actions={taskActions} />
                            </div>
                            ))}
                        </div>
                        <button className="scroll-btn scroll-right" onClick={() => scrollBoard('right')}>▶</button>
                      </>
                  ) : (
                      // --- EMPLOYEE: SHOW STATS SIDEBAR ---
                      <EmployeeSidebar tasks={myTasks} />
                  )}
                </div>
              </div>

              {/* MODAL */}
              <TaskModal
                selectedTask={selectedTask}
                draftDesc={draftDesc} setDraftDesc={setDraftDesc}
                draftPriority={draftPriority} setDraftPriority={setDraftPriority}
                draftDate={draftDate} setDraftDate={setDraftDate}
                saveModalDetails={saveModalDetails} closeModal={closeModal}
              />
            </div>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export default App