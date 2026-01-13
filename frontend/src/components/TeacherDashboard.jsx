console.log("Techer.");
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, TrendingUp, Users, BookOpen, Activity, CheckCircle, Clock } from 'lucide-react';


// Mock data - in production, this would come from the backend API
const generateMockData = () => ({
  classMetrics: {
    masteryRate: 78,
    adoptionRate: 92,
    confidenceScore: 94,
    engagementIndex: 87
  },
  conceptMastery: [
    { topic: 'Topic 1', mastery: 92, students: 28 },
    { topic: 'Topic 2', mastery: 80, students: 28 },
    { topic: 'Topic 3', mastery: 55, students: 28 },
    { topic: 'Topic 4', mastery: 95, students: 28 }
  ],
  engagementTrends: [
    { week: 'Week 1', engagement: 72 },
    { week: 'Week 2', engagement: 78 },
    { week: 'Week 3', engagement: 85 },
    { week: 'Week 4', engagement: 87 }
  ],
  livePolling: {
    question: "Do you understand today's concept?",
    responses: [
      { option: 'Yes', count: 20, percentage: 72 },
      { option: 'Partially', count: 6, percentage: 20 },
      { option: 'No', count: 2, percentage: 8 }
    ],
    totalResponses: 28
  },
  studentAttention: Array(30).fill(0).map((_, i) => ({
    id: `student_${i}`,
    status: i === 13 || i === 29 ? 'at-risk' : i % 5 === 0 ? 'passive' : 'engaged'
  })),
  atRiskStudents: [
    { name: 'Student A', concepts: ['Topic 3'], engagement: 45, lastActive: '2 hours ago' },
    { name: 'Student B', concepts: ['Topic 2', 'Topic 3'], engagement: 52, lastActive: '1 day ago' }
  ],
  interventionTracking: {
    topic: 'Topic 2.3',
    before: 55,
    after: 78,
    improvement: 23,
    date: 'Yesterday'
  },
  pblProjects: {
    active: 12,
    onTrack: 9,
    atRisk: 3
  }
});

const TeacherDashboard = () => {
  const [data, setData] = useState(generateMockData());
  const [selectedView, setSelectedView] = useState('overview');

  // Simulate real-time updates (BR6: Real-time feedback)
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateMockData());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <Icon className="text-gray-400" size={20} />
      </div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold" style={{ color }}>{value}%</div>
        {trend && (
          <div className="flex items-center text-green-600 text-sm">
            <TrendingUp size={16} />
            <span className="ml-1">+{trend}%</span>
          </div>
        )}
      </div>
    </div>
  );

  const AttentionDot = ({ status }) => {
    const colors = {
      engaged: 'bg-green-500',
      passive: 'bg-yellow-500',
      'at-risk': 'bg-red-500'
    };
    return <div className={`w-3 h-3 rounded-full ${colors[status]}`} />;
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AMEP Analytics Hub</h1>
        <p className="text-gray-600">Real-time insights • Unified reporting • Actionable intelligence</p>
      </div>

      {/* BR8: Three Core Metrics - Eliminating Fragmented Tools */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Mastery Rate"
          value={data.classMetrics.masteryRate}
          icon={BookOpen}
          trend={5}
          color="#3b82f6"
        />
        <MetricCard
          title="Teacher Adoption Rate"
          value={data.classMetrics.adoptionRate}
          icon={Users}
          color="#8b5cf6"
        />
        <MetricCard
          title="Admin Confidence Score"
          value={data.classMetrics.confidenceScore}
          icon={CheckCircle}
          color="#10b981"
        />
        <MetricCard
          title="Engagement Index"
          value={data.classMetrics.engagementIndex}
          icon={Activity}
          trend={3}
          color="#f59e0b"
        />
      </div>

      {/* BR6: Live Polling & Real-Time Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Live Poll Results</h2>
          <p className="text-gray-600 mb-4">"{data.livePolling.question}"</p>
          
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.livePolling.responses}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.option}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.livePolling.responses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {data.livePolling.responses.map((response, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="font-medium">{response.option}</span>
                <div className="flex items-center">
                  <div className="w-48 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${response.percentage}%`,
                        backgroundColor: COLORS[idx]
                      }}
                    />
                  </div>
                  <span className="text-gray-600">{response.count} students</span>
                </div>
              </div>
            ))}
          </div>

          {data.livePolling.responses[2].percentage >= 8 && (
            <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ Consider re-explaining: {data.livePolling.responses[2].percentage}% need clarification
              </p>
            </div>
          )}
        </div>

        {/* BR6: Student Attention Map */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">👁️ Student Attention Map</h2>
          <p className="text-sm text-gray-600 mb-4">Implicit engagement signals from behavior analytics</p>
          
          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Engaged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Passive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>At-Risk</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {data.studentAttention.map((student, idx) => (
              <AttentionDot key={idx} status={student.status} />
            ))}
          </div>

          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
              <AlertCircle size={20} />
              <span>2 students flagged for immediate attention</span>
            </div>
            <div className="space-y-2">
              {data.atRiskStudents.map((student, idx) => (
                <div key={idx} className="text-sm text-red-700">
                  <span className="font-medium">{student.name}</span>: 
                  {student.engagement}% engagement • Last active {student.lastActive}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BR1 & BR8: Concept Mastery Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Concept Mastery Heatmap</h2>
          <p className="text-sm text-gray-600 mb-4">From Adaptive Mastery Engine (BR1)</p>
          
          <div className="space-y-3">
            {data.conceptMastery.map((concept, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{concept.topic}</span>
                  <span className={`text-sm font-bold ${
                    concept.mastery >= 85 ? 'text-green-600' :
                    concept.mastery >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {concept.mastery}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      concept.mastery >= 85 ? 'bg-green-500' :
                      concept.mastery >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${concept.mastery}%` }}
                  />
                </div>
                {concept.mastery < 60 && (
                  <p className="text-xs text-red-600 mt-1">⚠️ Needs Review</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BR6: Engagement Trends */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Engagement Trends</h2>
          <p className="text-sm text-gray-600 mb-4">From Inclusive Engagement System (BR4, BR6)</p>
          
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.engagementTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="engagement" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-sm text-green-800">
              📈 Improving: +15% since Week 1
            </p>
          </div>
        </div>
      </div>

      {/* BR6: Post-Intervention Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Post-Intervention Tracking</h2>
          <p className="text-sm text-gray-600 mb-4">Measuring impact of your teaching adjustments</p>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {data.interventionTracking.date}'s intervention on {data.interventionTracking.topic}:
              </p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Before</p>
                  <p className="text-2xl font-bold text-red-600">{data.interventionTracking.before}%</p>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">After</p>
                  <p className="text-2xl font-bold text-green-600">{data.interventionTracking.after}%</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-green-50 rounded">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Improvement: +{data.interventionTracking.improvement}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BR9: PBL Project Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 PBL Project Status</h2>
          <p className="text-sm text-gray-600 mb-4">From Project Management Hub (BR9)</p>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <p className="text-3xl font-bold text-blue-600">{data.pblProjects.active}</p>
              <p className="text-xs text-blue-800">Active Projects</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <p className="text-3xl font-bold text-green-600">{data.pblProjects.onTrack}</p>
              <p className="text-xs text-green-800">On Track</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <p className="text-3xl font-bold text-red-600">{data.pblProjects.atRisk}</p>
              <p className="text-xs text-red-800">At Risk</p>
            </div>
          </div>

          {data.pblProjects.atRisk > 0 && (
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ {data.pblProjects.atRisk} projects need attention
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BR8: Actionable Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Actionable Recommendations</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded">
            <Users className="text-blue-600 mt-1" size={20} />
            <div>
              <p className="font-medium text-blue-900">Student Support Needed</p>
              <p className="text-sm text-blue-800">{data.atRiskStudents.length} students may need 1-on-1 support</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded">
            <BookOpen className="text-yellow-600 mt-1" size={20} />
            <div>
              <p className="font-medium text-yellow-900">Topic Review Suggested</p>
              <p className="text-sm text-yellow-800">Topic 3 average mastery at 55% - consider revisiting</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded">
            <Clock className="text-purple-600 mt-1" size={20} />
            <div>
              <p className="font-medium text-purple-900">Pacing Adjustment</p>
              <p className="text-sm text-purple-800">Talk time ratio: 70% teacher / 30% student - consider more interaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* BR7, BR8: Data Collection Status */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white">
        <h3 className="text-lg font-bold mb-2">📊 Unified Data Collection (BR7, BR8)</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="opacity-80">Before AMEP:</p>
            <ul className="list-disc list-inside mt-1">
              <li>6 data drops per year</li>
              <li>Multiple entry points</li>
              <li>Fragmented reports</li>
            </ul>
          </div>
          <div>
            <p className="opacity-80">After AMEP:</p>
            <ul className="list-disc list-inside mt-1">
              <li>3 data drops (50% reduction) ✅</li>
              <li>Single entry, multiple uses ✅</li>
              <li>Unified dashboard ✅</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;