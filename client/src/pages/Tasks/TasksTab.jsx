import { useState, useEffect } from 'react';
import { PlusCircle, Check, ArrowRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import './Tasks.css';

export default function TasksTab() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState('');
    const [addingTo, setAddingTo] = useState('today');

    useEffect(() => {
        api.get('/tasks').then(res => setTasks(res.data)).catch(() => toast.error('Failed to load tasks')).finally(() => setLoading(false));
    }, []);

    const handleAdd = async () => {
        if (!newTask.trim()) return;
        try {
            const res = await api.post('/tasks', { title: newTask.trim(), column: addingTo });
            setTasks(prev => [...prev, res.data]);
            setNewTask('');
            toast.success('Task added!');
        } catch { toast.error('Failed to add task'); }
    };

    const handleToggle = async (task) => {
        try {
            const res = await api.put(`/tasks/${task._id}`, { completed: !task.completed });
            setTasks(prev => prev.map(t => t._id === task._id ? res.data : t));
        } catch { toast.error('Failed to update task'); }
    };

    const handleMove = async (task, to) => {
        try {
            const res = await api.put(`/tasks/${task._id}`, { column: to });
            setTasks(prev => prev.map(t => t._id === task._id ? res.data : t));
            toast.success(`Moved to ${to}`);
        } catch { toast.error('Failed to move task'); }
    };

    const handleDelete = async (taskId) => {
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(prev => prev.filter(t => t._id !== taskId));
        } catch { toast.error('Failed to delete task'); }
    };

    const today = tasks.filter(t => t.column === 'today');
    const tomorrow = tasks.filter(t => t.column === 'tomorrow');

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }}></div></div>;

    return (
        <div className="page">
            <h2 className="page-title neon-orange">Tasks</h2>

            {/* ADD TASK */}
            <div className="task-add-bar">
                <input className="input" placeholder="Add a new task..." value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                <select className="select" style={{ width: 120 }} value={addingTo} onChange={e => setAddingTo(e.target.value)}>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                </select>
                <button className="btn btn-orange" onClick={handleAdd}><PlusCircle size={16} /> Add</button>
            </div>

            <div className="tasks-columns">
                {/* TODAY */}
                <div className="task-column">
                    <div className="task-column-header">
                        <span className="column-dot today-dot"></span>
                        <h3>TODAY</h3>
                        <span className="task-count">{today.length}</span>
                    </div>
                    <div className="task-list">
                        {today.length === 0 && <div className="task-empty">All done! 🎉</div>}
                        {today.map(task => (
                            <div key={task._id} className={`task-item ${task.completed ? 'completed' : ''} animate-slide-in`}>
                                <button className={`task-check ${task.completed ? 'checked' : ''}`} onClick={() => handleToggle(task)}>
                                    {task.completed && <Check size={12} color="#000" strokeWidth={3} />}
                                </button>
                                <span className="task-title">{task.title}</span>
                                <div className="task-actions">
                                    <button className="icon-btn tooltip" data-tip="Move to Tomorrow" onClick={() => handleMove(task, 'tomorrow')}>
                                        <ArrowRight size={14} />
                                    </button>
                                    <button className="icon-btn tooltip" data-tip="Delete" onClick={() => handleDelete(task._id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TOMORROW */}
                <div className="task-column">
                    <div className="task-column-header">
                        <span className="column-dot tomorrow-dot"></span>
                        <h3>TOMORROW</h3>
                        <span className="task-count">{tomorrow.length}</span>
                    </div>
                    <div className="task-list">
                        {tomorrow.length === 0 && <div className="task-empty">Nothing planned yet</div>}
                        {tomorrow.map(task => (
                            <div key={task._id} className="task-item animate-slide-in">
                                <button className="task-check" onClick={() => handleToggle(task)}>
                                    {task.completed && <Check size={12} color="#000" strokeWidth={3} />}
                                </button>
                                <span className="task-title">{task.title}</span>
                                <div className="task-actions">
                                    <button className="icon-btn tooltip" data-tip="Move to Today" onClick={() => handleMove(task, 'today')}>
                                        <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
                                    </button>
                                    <button className="icon-btn tooltip" data-tip="Delete" onClick={() => handleDelete(task._id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <p className="task-note">⚠ Tasks do not affect your points score. Uncompleted tasks can be rolled over from Settings.</p>
        </div>
    );
}
