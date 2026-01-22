import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, Users, FileText, Upload, Calendar, AlertTriangle, Workflow, Target, Check, Briefcase, Sparkles, Award, Gauge, Plus, ChevronRight, Layout, Loader, X } from 'lucide-react';
import TeacherLayout from '../components/TeacherLayout';
import { projectsAPI, classroomAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated, classroomId, teacherId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        classroom_id: classroomId,
        teacher_id: teacherId,
        stage: 'QUESTIONING', // Default starting stage
        project_type: 'team'
      };
      await projectsAPI.createProject(data);
      onProjectCreated();
      onClose();
    } catch (error) {
      console.error("Failed to create project", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">Create New Project</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Project Title <span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
              placeholder="e.g. Sustainable Energy Solutions"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 transition-all font-medium h-24 resize-none"
              placeholder="Briefly describe the project goals..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Deadline <span className="text-red-500">*</span></label>
            <input
              required
              type="date"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 transition-all font-medium"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const PBLWorkspace = () => {
  const { getUserId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    // Fetch classes first
    const fetchClasses = async () => {
      const userId = getUserId();
      if (userId) {
        try {
          const res = await classroomAPI.getTeacherClasses(userId);
          setClasses(res.data);
          if (res.data.length > 0) {
            setSelectedClassId(res.data[0].classroom_id);
          } else {
            setLoading(false);
          }
        } catch (e) {
          console.error("Error fetching classes:", e);
          setLoading(false);
        }
      }
    };
    fetchClasses();
  }, [getUserId]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.getClassroomProjects(selectedClassId);
      const fetchedProjects = res.data.projects || [];
      setProjects(fetchedProjects);

      if (fetchedProjects.length > 0) {
        // Fetch full details of the first project
        const detailRes = await projectsAPI.getProjectDetails(fetchedProjects[0].project_id);
        setProject(transformBackendData(detailRes.data));
      } else {
        setProject(null);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedClassId) return;
    fetchProjects();
  }, [selectedClassId]);

  const transformBackendData = (data) => {
    return {
      ...data,
      metrics: data.metrics || {
        completion: 0,
        quality: 0,
        efficiency: 0,
        collaboration: 0
      },
      artifacts: data.artifacts || [],
      // Ensure milestones array exists
      milestones: data.milestones || [],
      team: data.teams && data.teams.length > 0 ? data.teams[0] : { name: "No Team Selected", members: [] },
      // Ensure stages exist
      stages: Object.values(data.stage_info ? { [data.stage]: data.stage_info } : {}) // simplified fallback
    };
  };

  const getStageIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-emerald-500" size={24} />;
      case 'in_progress': return <Clock className="text-blue-500 animate-pulse" size={24} />;
      default: return <Circle className="text-gray-300" size={24} />;
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader className="animate-spin text-teal-600" size={40} />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">PBL Workspace</h1>
            <p className="text-gray-500">Centralized Project Management • 5-Stage Workflow</p>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-4 py-2 font-bold text-gray-700"
            >
              {classes.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.class_name}</option>)}
            </select>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        {!project ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <Workflow className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Projects</h3>
            <p className="text-gray-500 mb-6">Start a new Project-Based Learning module for this class.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors"
            >
              <Plus size={20} /> Create First Project
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
              {['overview', 'stages', 'team', 'milestones', 'artifacts'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-bold transition-all duration-300 whitespace-nowrap border-b-2 ${activeTab === tab
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Only showing Overview for now since dynamic data logic for other tabs needs mapping */}
            {activeTab === 'overview' && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{project.title}</h2>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">{project.description}</p>

                {/* Metrics Placeholder using real data keys if available */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-teal-600">{project.stage}</div>
                    <div className="text-xs text-gray-400 uppercase font-bold">Current Stage</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{project.metrics.completion}%</div>
                    <div className="text-xs text-gray-400 uppercase font-bold">Structure</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'overview' && (
              <div className="p-12 text-center text-gray-400">
                <p>Detailed view for {activeTab} requires populated data.</p>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateProjectModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onProjectCreated={fetchProjects}
            classroomId={selectedClassId}
            teacherId={getUserId()}
          />
        )}
      </AnimatePresence>
    </TeacherLayout>
  );
};

export default PBLWorkspace;